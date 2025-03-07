USE HospitalDB186;
GO

-- 1. Create a login attempt tracking table
CREATE TABLE LoginAttempts186 (
    AttemptID INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(50),
    Successful BIT,
    IPAddress VARCHAR(50),
    AttemptTime DATETIME DEFAULT GETDATE()
);
GO

-- 2. Stored procedure to log authentication attempts
CREATE PROCEDURE LogAuthenticationAttempt186
    @Username VARCHAR(50),
    @Successful BIT,
    @IPAddress VARCHAR(50)
AS
BEGIN
    INSERT INTO LoginAttempts186 (Username, Successful, IPAddress)
    VALUES (@Username, @Successful, @IPAddress);
    
    -- If login was successful, update the user's last login time
    IF @Successful = 1
    BEGIN
        UPDATE Users186
        SET LastLogin = GETDATE()
        WHERE Username = @Username;
    END
    
    -- Check for brute force attempts (5 failed attempts within 10 minutes)
    IF @Successful = 0 AND (
        SELECT COUNT(*) 
        FROM LoginAttempts186 
        WHERE Username = @Username 
          AND Successful = 0 
          AND AttemptTime > DATEADD(MINUTE, -10, GETDATE())
    ) >= 5
    BEGIN
        -- Log potential security breach
        INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, NewValue)
        VALUES (
            1, -- System user ID
            'Security Alert',
            'Users186',
            (SELECT UserID FROM Users186 WHERE Username = @Username),
            'Multiple failed login attempts detected from IP: ' + @IPAddress
        );
        
        -- In a real system, you might lock the account here
    END
END;
GO

-- 3. Database backup procedure
CREATE PROCEDURE BackupHospitalDatabase186
    @BackupPath VARCHAR(255)
AS
BEGIN
    DECLARE @BackupFileName VARCHAR(300);
    DECLARE @BackupStatement NVARCHAR(1000);
    
    -- Generate backup filename with timestamp
    SET @BackupFileName = @BackupPath + 'HospitalDB186_' + 
                         CONVERT(VARCHAR(8), GETDATE(), 112) + '_' + 
                         REPLACE(CONVERT(VARCHAR(8), GETDATE(), 108), ':', '') + '.bak';
    
    -- Create the backup statement
    SET @BackupStatement = 'BACKUP DATABASE HospitalDB186 TO DISK = ''' + @BackupFileName + 
                          ''' WITH FORMAT, MEDIANAME = ''HospitalDBBackups'', NAME = ''Full Backup of HospitalDB186''';
    
    -- Execute the backup
    EXEC sp_executesql @BackupStatement;
    
    -- Log the backup operation
    INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, NewValue)
    VALUES (1, 'Database Backup', 'System', NULL, 'Backup created at: ' + @BackupFileName);
    
    RETURN 0; -- Success
END;
GO

-- 4. Database restore procedure
CREATE PROCEDURE RestoreHospitalDatabase186
    @BackupFilePath VARCHAR(255)
AS
BEGIN
    DECLARE @RestoreStatement NVARCHAR(1000);
    
    -- First put database in single user mode to ensure no active connections
    ALTER DATABASE HospitalDB186 SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    
    -- Create the restore statement
    SET @RestoreStatement = 'RESTORE DATABASE HospitalDB186 FROM DISK = ''' + @BackupFilePath + 
                           ''' WITH REPLACE, RECOVERY';
    
    -- Execute the restore
    EXEC sp_executesql @RestoreStatement;
    
    -- Return database to multi user mode
    ALTER DATABASE HospitalDB186 SET MULTI_USER;
    
    -- Log the restore operation
    INSERT INTO AuditLogs186 (UserID, Action, TableName, RecordID, NewValue)
    VALUES (1, 'Database Restore', 'System', NULL, 'Database restored from: ' + @BackupFilePath);
    
    RETURN 0; -- Success
END;
GO
