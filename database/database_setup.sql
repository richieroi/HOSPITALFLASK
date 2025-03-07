-- Create the Hospital Management System Database
CREATE DATABASE HospitalDB186;
GO

USE HospitalDB186;
GO

-- Create Patients table
CREATE TABLE Patients186 (
    PatientID INT PRIMARY KEY IDENTITY(1,1),
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    DateOfBirth DATE NOT NULL,
    Gender CHAR(1) CHECK (Gender IN ('M', 'F', 'O')),
    Address VARCHAR(100),
    PhoneNumber VARCHAR(15),
    Email VARCHAR(50),
    InsuranceDetails VARCHAR(100),
    EmergencyContact VARCHAR(50),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create Doctors table
CREATE TABLE Doctors186 (
    DoctorID INT PRIMARY KEY IDENTITY(1,1),
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Specialization VARCHAR(50) NOT NULL,
    PhoneNumber VARCHAR(15),
    Email VARCHAR(50),
    LicenseNumber VARCHAR(20) UNIQUE,
    HireDate DATE NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create Appointments table
CREATE TABLE Appointments186 (
    AppointmentID INT PRIMARY KEY IDENTITY(1,1),
    PatientID INT FOREIGN KEY REFERENCES Patients186(PatientID),
    DoctorID INT FOREIGN KEY REFERENCES Doctors186(DoctorID),
    AppointmentDate DATETIME NOT NULL,
    Status VARCHAR(20) CHECK (Status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled')),
    Reason VARCHAR(200),
    Notes TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create Medications table
CREATE TABLE Medications186 (
    MedicationID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Description TEXT,
    DosageForm VARCHAR(50),
    Manufacturer VARCHAR(100),
    UnitPrice DECIMAL(10,2),
    StockQuantity INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create MedicalRecords table
CREATE TABLE MedicalRecords186 (
    RecordID INT PRIMARY KEY IDENTITY(1,1),
    PatientID INT FOREIGN KEY REFERENCES Patients186(PatientID),
    DoctorID INT FOREIGN KEY REFERENCES Doctors186(DoctorID),
    Diagnosis TEXT,
    Treatment TEXT,
    Notes TEXT,
    RecordDate DATE DEFAULT GETDATE(),
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create Prescriptions table
CREATE TABLE Prescriptions186 (
    PrescriptionID INT PRIMARY KEY IDENTITY(1,1),
    RecordID INT FOREIGN KEY REFERENCES MedicalRecords186(RecordID),
    MedicationID INT FOREIGN KEY REFERENCES Medications186(MedicationID),
    Dosage VARCHAR(50),
    Frequency VARCHAR(50),
    StartDate DATE,
    EndDate DATE,
    Instructions TEXT,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create Users table for authentication
CREATE TABLE Users186 (
    UserID INT PRIMARY KEY IDENTITY(1,1),
    Username VARCHAR(50) UNIQUE NOT NULL,
    Password VARCHAR(100) NOT NULL, -- In production, store hashed passwords
    Email VARCHAR(50) UNIQUE NOT NULL,
    Role VARCHAR(20) CHECK (Role IN ('Admin', 'Doctor', 'Nurse', 'Patient', 'Guest')),
    PersonID INT, -- Can reference either DoctorID or PatientID based on role
    LastLogin DATETIME,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);

-- Create AuditLog table
CREATE TABLE AuditLogs186 (
    LogID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT FOREIGN KEY REFERENCES Users186(UserID),
    Action VARCHAR(50) NOT NULL,
    TableName VARCHAR(50),
    RecordID INT,
    OldValue TEXT,
    NewValue TEXT,
    IPAddress VARCHAR(50),
    Timestamp DATETIME DEFAULT GETDATE()
);
GO

-- Insert sample data into Patients186
INSERT INTO Patients186 (FirstName, LastName, DateOfBirth, Gender, Address, PhoneNumber, Email, InsuranceDetails, EmergencyContact)
VALUES 
('John', 'Doe', '1985-05-10', 'M', '123 Main St, Anytown', '555-123-4567', 'john.doe@email.com', 'Aetna #12345', 'Jane Doe 555-987-6543'),
('Emily', 'Smith', '1990-08-15', 'F', '456 Oak Ave, Somewhere', '555-234-5678', 'emily.smith@email.com', 'Cigna #67890', 'Michael Smith 555-876-5432'),
('Michael', 'Johnson', '1978-12-03', 'M', '789 Pine Rd, Nowhere', '555-345-6789', 'mike.j@email.com', 'BlueCross #54321', 'Sarah Johnson 555-765-4321'),
('Sarah', 'Williams', '1995-03-22', 'F', '101 Cedar Ln, Everywhere', '555-456-7890', 'sarah.w@email.com', 'UnitedHealth #09876', 'Robert Williams 555-654-3210'),
('David', 'Brown', '1982-11-30', 'M', '202 Maple Dr, Anywhere', '555-567-8901', 'david.b@email.com', 'Kaiser #13579', 'Lisa Brown 555-543-2109');

-- Insert sample data into Doctors186
INSERT INTO Doctors186 (FirstName, LastName, Specialization, PhoneNumber, Email, LicenseNumber, HireDate)
VALUES 
('Robert', 'Johnson', 'Cardiology', '555-111-2222', 'dr.johnson@hospital.com', 'MD12345', '2015-06-15'),
('Jennifer', 'Lee', 'Pediatrics', '555-222-3333', 'dr.lee@hospital.com', 'MD23456', '2018-03-10'),
('William', 'Smith', 'Neurology', '555-333-4444', 'dr.smith@hospital.com', 'MD34567', '2010-09-22'),
('Elizabeth', 'Garcia', 'Orthopedics', '555-444-5555', 'dr.garcia@hospital.com', 'MD45678', '2016-11-05'),
('James', 'Wang', 'Oncology', '555-555-6666', 'dr.wang@hospital.com', 'MD56789', '2019-02-18');

-- Insert sample data into Appointments186
INSERT INTO Appointments186 (PatientID, DoctorID, AppointmentDate, Status, Reason)
VALUES 
(1, 2, '2023-03-15 09:00:00', 'Completed', 'Regular checkup'),
(2, 1, '2023-03-16 10:30:00', 'Scheduled', 'Heart palpitations'),
(3, 4, '2023-03-17 14:00:00', 'Scheduled', 'Knee pain'),
(4, 3, '2023-03-15 11:00:00', 'Cancelled', 'Migraine symptoms'),
(5, 5, '2023-03-18 15:30:00', 'Scheduled', 'Follow-up consultation');

-- Insert sample data into Medications186
INSERT INTO Medications186 (Name, Description, DosageForm, Manufacturer, UnitPrice, StockQuantity)
VALUES 
('Amoxicillin', 'Antibiotic for bacterial infections', 'Tablet', 'PharmaCorp', 10.50, 500),
('Lisinopril', 'ACE inhibitor for high blood pressure', 'Capsule', 'MediPharm', 15.75, 300),
('Metformin', 'For type 2 diabetes management', 'Tablet', 'HealthMeds', 8.25, 650),
('Albuterol', 'Bronchodilator for asthma', 'Inhaler', 'RespiCare', 45.00, 200),
('Simvastatin', 'Statin for cholesterol management', 'Tablet', 'CardioPharm', 12.30, 400);

-- Insert sample data into MedicalRecords186
INSERT INTO MedicalRecords186 (PatientID, DoctorID, Diagnosis, Treatment, Notes, RecordDate)
VALUES 
(1, 2, 'Common cold', 'Rest, fluids, and over-the-counter medicine', 'Patient shows good recovery', '2023-02-10'),
(2, 1, 'Hypertension', 'Prescribed Lisinopril and lifestyle changes', 'Follow-up in 3 months', '2023-01-05'),
(3, 4, 'Knee osteoarthritis', 'Physical therapy and pain management', 'May need surgical intervention if no improvement', '2023-01-22'),
(4, 3, 'Chronic migraine', 'Prescribed preventive medication and triggers avoidance', 'Referred to neurologist for further evaluation', '2023-02-18'),
(5, 5, 'Early stage lymphoma', 'Chemotherapy treatment plan initiated', 'Prognosis is good with treatment', '2023-03-01');

-- Insert sample data into Prescriptions186
INSERT INTO Prescriptions186 (RecordID, MedicationID, Dosage, Frequency, StartDate, EndDate, Instructions)
VALUES 
(1, 1, '500mg', 'Twice daily', '2023-02-10', '2023-02-17', 'Take with food'),
(2, 2, '10mg', 'Once daily', '2023-01-05', '2023-07-05', 'Take in the morning'),
(3, 4, '90mcg', 'As needed', '2023-01-22', '2023-04-22', 'Use when experiencing pain'),
(4, 3, '500mg', 'Twice daily', '2023-02-18', '2023-08-18', 'Take with meals'),
(5, 5, '20mg', 'Once daily', '2023-03-01', '2023-09-01', 'Take in the evening');

-- Insert sample data into Users186
INSERT INTO Users186 (Username, Password, Email, Role, PersonID)
VALUES 
('admin', 'admin123', 'admin@hospital.com', 'Admin', NULL),
('drjohnson', 'doctor123', 'dr.johnson@hospital.com', 'Doctor', 1),
('drlee', 'doctor123', 'dr.lee@hospital.com', 'Doctor', 2),
('nurse1', 'nurse123', 'nurse1@hospital.com', 'Nurse', NULL),
('johndoe', 'patient123', 'john.doe@email.com', 'Patient', 1),
('guest', 'guest123', 'guest@example.com', 'Guest', NULL);
GO
