USE HospitalDB186;
GO

-- Create login accounts for different roles
CREATE LOGIN AdminLogin WITH PASSWORD = 'Admin@123';
CREATE LOGIN DoctorLogin WITH PASSWORD = 'Doctor@123';
CREATE LOGIN NurseLogin WITH PASSWORD = 'Nurse@123';
CREATE LOGIN PatientLogin WITH PASSWORD = 'Patient@123';
CREATE LOGIN GuestLogin WITH PASSWORD = 'Guest@123';
GO

-- Create database users
CREATE USER AdminUser FOR LOGIN AdminLogin;
CREATE USER DoctorUser FOR LOGIN DoctorLogin;
CREATE USER NurseUser FOR LOGIN NurseLogin;
CREATE USER PatientUser FOR LOGIN PatientLogin;
CREATE USER GuestUser FOR LOGIN GuestLogin;
GO

-- Create roles
CREATE ROLE Admin186;
CREATE ROLE Doctor186;
CREATE ROLE Nurse186;
CREATE ROLE Patient186;
CREATE ROLE Guest186;
GO

-- Assign users to roles
ALTER ROLE Admin186 ADD MEMBER AdminUser;
ALTER ROLE Doctor186 ADD MEMBER DoctorUser;
ALTER ROLE Nurse186 ADD MEMBER NurseUser;
ALTER ROLE Patient186 ADD MEMBER PatientUser;
ALTER ROLE Guest186 ADD MEMBER GuestUser;
GO

-- Grant permissions to Admin role (full access)
GRANT CONTROL ON DATABASE::HospitalDB186 TO Admin186;

-- Grant Doctor permissions
GRANT SELECT, INSERT, UPDATE ON Patients186 TO Doctor186;
GRANT SELECT, INSERT, UPDATE ON MedicalRecords186 TO Doctor186;
GRANT SELECT, INSERT, UPDATE ON Prescriptions186 TO Doctor186;
GRANT SELECT, INSERT, UPDATE ON Appointments186 TO Doctor186;
GRANT SELECT ON Medications186 TO Doctor186;

-- Grant Nurse permissions
GRANT SELECT ON Patients186 TO Nurse186;
GRANT SELECT ON Appointments186 TO Nurse186;
GRANT SELECT ON MedicalRecords186 TO Nurse186;
GRANT SELECT, UPDATE ON Appointments186 (Status, Notes) TO Nurse186;

-- Grant Patient permissions (very limited)
GRANT SELECT ON SCHEMA::dbo TO Patient186 WITH GRANT OPTION;
-- Note: In reality, we would use row-level security to limit patients to only their records

-- Grant Guest permissions (minimal read-only access)
GRANT SELECT ON Doctors186 TO Guest186;
GO

-- Demonstrate REVOKE command
REVOKE INSERT, UPDATE ON Appointments186 FROM Nurse186;
GO

-- Demonstrate removing a user from a role
ALTER ROLE Doctor186 DROP MEMBER DoctorUser;
-- Demonstrate adding a user back to the role
ALTER ROLE Doctor186 ADD MEMBER DoctorUser;
GO
