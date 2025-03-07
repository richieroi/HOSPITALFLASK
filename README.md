# Hospital Management System

A comprehensive hospital management system built with Flask and SQL Server.

## Project Overview

This project is a Hospital Management System that allows for efficient management of patients, doctors, appointments, medical records, medications, and prescriptions. The system implements role-based access control (RBAC) to ensure data security and proper access privileges.

## Features

- User authentication and authorization with role-based access control
- Patient management
- Doctor management
- Appointment scheduling
- Medical records management
- Medication inventory tracking
- Prescription management
- Audit logging for security and compliance
- Database backup and restoration
- Responsive UI for all features

## Technical Stack

- **Backend**: Python with Flask framework
- **Database**: Microsoft SQL Server
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 4
- **Authentication**: Session-based authentication
- **ORM**: Direct SQL queries via pyodbc

## Setup Instructions

### Prerequisites

- Python 3.7+
- Microsoft SQL Server
- pyodbc
- Flask

### Installation

1. Clone this repository
2. Create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Set up the database:
   - Run the SQL scripts in the following order:
     - database_setup.sql
     - access_control.sql
     - advanced_sql.sql
     - security.sql

5. Run the application:
   ```
   python app.py
   ```

6. Access the application at `http://localhost:5000`

## Default Users

The system comes with the following default users:

- **Admin**: admin / admin123
- **Doctor**: drjohnson / doctor123
- **Patient**: johndoe / patient123
- **Guest**: guest / guest123

## Database Schema

The database includes the following tables:
- Patients186
- Doctors186
- Appointments186
- Medications186
- MedicalRecords186
- Prescriptions186
- Users186
- AuditLogs186
- LoginAttempts186

## License

This project is for educational purposes.
