USE HospitalDB186;
GO

-- 1. Stored Procedure to register a new patient
CREATE PROCEDURE RegisterNewPatient186
    @FirstName VARCHAR(50),
    @LastName VARCHAR(50),
    @DateOfBirth DATE,
    @Gender CHAR(1),
    @Address VARCHAR(100),
    @PhoneNumber VARCHAR(15),
    @Email VARCHAR(50),
    @InsuranceDetails VARCHAR(100),
    @EmergencyContact VARCHAR(50),
    @NewPatientID INT OUTPUT
AS
BEGIN
    BEGIN TRY
        INSERT INTO Patients186 (FirstName, LastName, DateOfBirth, Gender, Address, PhoneNumber, Email, InsuranceDetails, EmergencyContact)
        VALUES (@FirstName, @LastName, @DateOfBirth, @Gender, @Address, @PhoneNumber, @Email, @InsuranceDetails, @EmergencyContact);
        
        SET @NewPatientID = SCOPE_IDENTITY();
        
        -- Also create a user account for the patient
        DECLARE @Username VARCHAR(50) = LOWER(@FirstName + @LastName);
        DECLARE @Password VARCHAR(100) = 'Patient@123'; -- In production, generate a secure password
        
        INSERT INTO Users186 (Username, Password, Email, Role, PersonID)
        VALUES (@Username, @Password, @Email, 'Patient', @NewPatientID);
        
        RETURN 0; -- Success
    END TRY
    BEGIN CATCH
        RETURN ERROR_NUMBER(); -- Return error code
    END CATCH
END;
GO

-- 2. Stored Procedure to schedule an appointment
CREATE PROCEDURE ScheduleAppointment186
    @PatientID INT,
    @DoctorID INT,
    @AppointmentDate DATETIME,
    @Reason VARCHAR(200),
    @NewAppointmentID INT OUTPUT
AS
BEGIN
    -- Check if doctor exists
    IF NOT EXISTS (SELECT 1 FROM Doctors186 WHERE DoctorID = @DoctorID)
    BEGIN
        RAISERROR('Doctor does not exist', 16, 1);
        RETURN -1;
    END
    
    -- Check if patient exists
    IF NOT EXISTS (SELECT 1 FROM Patients186 WHERE PatientID = @PatientID)
    BEGIN
        RAISERROR('Patient does not exist', 16, 1);
        RETURN -2;
    END
    
    -- Check if appointment time is available for doctor
    IF EXISTS (
        SELECT 1 
        FROM Appointments186 
        WHERE DoctorID = @DoctorID 
          AND AppointmentDate = @AppointmentDate
          AND Status != 'Cancelled'
    )
    BEGIN
        RAISERROR('Doctor already has an appointment at this time', 16, 1);
        RETURN -3;
    END
    
    -- Schedule the appointment
    INSERT INTO Appointments186 (PatientID, DoctorID, AppointmentDate, Status, Reason)
    VALUES (@PatientID, @DoctorID, @AppointmentDate, 'Scheduled', @Reason);
    
    SET @NewAppointmentID = SCOPE_IDENTITY();
    RETURN 0; -- Success
END;
GO

-- 3. TRIGGER to log user's last login time
CREATE TRIGGER UpdateLastLogin186
ON Users186
AFTER UPDATE
AS
BEGIN
    IF UPDATE(LastLogin)
    BEGIN
        INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, OldValue, NewValue)
        SELECT 
            i.UserID,
            'Last Login Updated',
            'Users186',
            i.UserID,
            CONVERT(VARCHAR(50), d.LastLogin, 120),
            CONVERT(VARCHAR(50), i.LastLogin, 120)
        FROM 
            inserted i
            JOIN deleted d ON i.UserID = d.UserID;
    END
END;
GO

-- 4. TRIGGER to automatically update inventory when medication is prescribed
CREATE TRIGGER UpdateMedicationInventory186
ON Prescriptions186
AFTER INSERT
AS
BEGIN
    UPDATE m
    SET StockQuantity = m.StockQuantity - 1,
        m.UpdatedAt = GETDATE()
    FROM Medications186 m
    JOIN inserted i ON m.MedicationID = i.MedicationID
    WHERE m.StockQuantity > 0;
    
    -- Log low inventory medications
    INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, NewValue)
    SELECT 
        1, -- System user ID
        'Low Inventory Alert',
        'Medications186',
        m.MedicationID,
        'Current quantity: ' + CAST(m.StockQuantity AS VARCHAR(10))
    FROM Medications186 m
    JOIN inserted i ON m.MedicationID = i.MedicationID
    WHERE m.StockQuantity <= 10;
END;
GO

-- 5. FUNCTION to calculate patient age
CREATE FUNCTION CalculatePatientAge186(@PatientID INT)
RETURNS INT
AS
BEGIN
    DECLARE @Age INT;
    DECLARE @DOB DATE;
    
    SELECT @DOB = DateOfBirth FROM Patients186 WHERE PatientID = @PatientID;
    
    IF @DOB IS NULL
        RETURN NULL;
        
    SET @Age = DATEDIFF(YEAR, @DOB, GETDATE()) - 
              CASE 
                WHEN DATEADD(YEAR, DATEDIFF(YEAR, @DOB, GETDATE()), @DOB) > GETDATE() 
                THEN 1 
                ELSE 0 
              END;
              
    RETURN @Age;
END;
GO

-- 6. FUNCTION that returns a table of doctors with their appointment counts
CREATE FUNCTION GetDoctorAppointmentCounts186()
RETURNS TABLE
AS
RETURN (
    SELECT 
        d.DoctorID,
        d.FirstName + ' ' + d.LastName AS DoctorName,
        d.Specialization,
        COUNT(a.AppointmentID) AS TotalAppointments,
        SUM(CASE WHEN a.Status = 'Completed' THEN 1 ELSE 0 END) AS CompletedAppointments,
        SUM(CASE WHEN a.Status = 'Scheduled' THEN 1 ELSE 0 END) AS ScheduledAppointments,
        SUM(CASE WHEN a.Status = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledAppointments
    FROM 
        Doctors186 d
        LEFT JOIN Appointments186 a ON d.DoctorID = a.DoctorID
    GROUP BY 
        d.DoctorID, d.FirstName, d.LastName, d.Specialization
);
GO

-- 7. IF-ELSE conditional logic in a stored procedure
CREATE PROCEDURE CheckPatientEligibility186
    @PatientID INT,
    @EligibilityStatus VARCHAR(50) OUTPUT,
    @Message VARCHAR(200) OUTPUT
AS
BEGIN
    DECLARE @InsuranceDetails VARCHAR(100);
    DECLARE @Age INT;
    DECLARE @HasPendingAppointments INT;
    
    -- Get patient insurance details
    SELECT @InsuranceDetails = InsuranceDetails
    FROM Patients186 
    WHERE PatientID = @PatientID;
    
    -- Get patient age using our function
    SET @Age = dbo.CalculatePatientAge186(@PatientID);
    
    -- Check if patient has pending appointments
    SELECT @HasPendingAppointments = COUNT(*)
    FROM Appointments186
    WHERE PatientID = @PatientID AND Status = 'Scheduled';
    
    -- Decision logic
    IF @InsuranceDetails IS NULL OR @InsuranceDetails = ''
    BEGIN
        SET @EligibilityStatus = 'Ineligible';
        SET @Message = 'Patient has no insurance details on record.';
    END
    ELSE IF @Age IS NULL
    BEGIN
        SET @EligibilityStatus = 'Unknown';
        SET @Message = 'Patient age could not be determined.';
    END
    ELSE IF @HasPendingAppointments > 0
    BEGIN
        SET @EligibilityStatus = 'Eligible';
        SET @Message = 'Patient has ' + CAST(@HasPendingAppointments AS VARCHAR(5)) + ' pending appointment(s).';
    END
    ELSE
    BEGIN
        SET @EligibilityStatus = 'Eligible';
        SET @Message = 'Patient is eligible for new appointments.';
    END
    
    -- Log this eligibility check
    INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, NewValue)
    VALUES (1, 'Eligibility Check', 'Patients186', @PatientID, @EligibilityStatus + ': ' + @Message);
END;
GO
