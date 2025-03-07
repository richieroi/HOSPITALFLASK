# Hospital Management System

This is a Hospital Management System built with Flask and SQL Server. It allows administrators, doctors, and patients to manage various aspects of hospital operations.

## Features

- User authentication and role-based access control
- Manage patients, doctors, medications, and appointments
- View and add medical records
- Backup and restore the database
- View audit logs
- Add sample data for testing

## Technical Stack

- **Backend**: Python with Flask framework
- **Database**: Microsoft SQL Server
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 4
- **Authentication**: Session-based authentication
- **ORM**: Direct SQL queries via pyodbc

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/hospital-management-system.git
    cd hospital-management-system
    ```

2. Create a virtual environment and activate it:
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. Install the required packages:
    ```sh
    pip install -r requirements.txt
    ```

4. Configure the database connection in `app.py`:
    ```python
    DB_CONFIG = {
        'Driver': '{SQL Server}',
        'Server': 'YOUR_SERVER_NAME',
        'Database': 'HospitalDB186',
        'Trusted_Connection': 'yes'  # Windows authentication
    }
    ```

5. Run the application:
    ```sh
    flask run
    ```

## Usage

### User Roles

- **Admin**: Can manage users, doctors, medications, and view audit logs.
- **Doctor**: Can manage patients, appointments, and medical records.
- **Patient**: Can view their own appointments and doctors.

### Adding Sample Data

Admins can add sample data for testing purposes. To add sample data, log in as an admin and click the "Add Sample Data" button on the dashboard.

### Managing Users

Admins can add, edit, and delete users. To manage users, log in as an admin and navigate to the "Manage Users" section from the dashboard or sidebar.

### Managing Medications

Admins can add, edit, and delete medications. To manage medications, log in as an admin and navigate to the "Manage Medications" section from the dashboard or sidebar.

### Managing Doctors

Admins can add, edit, and delete doctors. To manage doctors, log in as an admin and navigate to the "Manage Doctors" section from the dashboard or sidebar.

### Managing Patients

Doctors can add, edit, and view patients. To manage patients, log in as a doctor and navigate to the "Patients" section from the dashboard or sidebar.

### Managing Appointments

Doctors and patients can view and manage appointments. To manage appointments, log in as a doctor or patient and navigate to the "Appointments" section from the dashboard or sidebar.

### Viewing Medical Records

Doctors can view and add medical records for patients. To view medical records, log in as a doctor and navigate to the "Medical Records" section from the patient's detail page.

### Backup and Restore Database

Admins can backup and restore the database. To backup the database, log in as an admin and click the "Backup Database" button on the dashboard.

### Viewing Audit Logs

Admins can view audit logs to track system activity. To view audit logs, log in as an admin and navigate to the "Audit Logs" section from the dashboard or sidebar.

## Default Users

The system comes with the following default users:

- **Admin**: admin / admin123
- **Doctor**: drjohnson / doctor123
- **Patient**: johndoe / patient123
- **Guest**: guest / guest123
- **Nurse**: nurse1 / nurse123



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

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
