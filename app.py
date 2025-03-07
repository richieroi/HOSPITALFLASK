from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import pyodbc
from functools import wraps
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'hospital_management_secret_key'

# Database connection configuration
DB_CONFIG = {
    'Driver': '{SQL Server}',
    'Server': 'DESKTOP-170MKOG',
    'Database': 'HospitalDB186',
    'Trusted_Connection': 'yes'  # Windows authentication
}

def get_db_connection():
    conn_str = (
        f"DRIVER={DB_CONFIG['Driver']};"
        f"SERVER={DB_CONFIG['Server']};"
        f"DATABASE={DB_CONFIG['Database']};"
        f"Trusted_Connection={DB_CONFIG['Trusted_Connection']};"
    )
    return pyodbc.connect(conn_str)

# Authentication decorator
def login_required(role=None):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user_id' not in session:
                flash('Please login to access this page', 'danger')
                return redirect(url_for('login'))
            
            if role and session.get('role') != role and session.get('role') != 'Admin':
                flash('You do not have permission to access this page', 'danger')
                return redirect(url_for('dashboard'))
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Query the database for the user
            cursor.execute("SELECT UserID, Username, Password, Role, PersonID FROM Users186 WHERE Username = ? AND IsActive = 1", (username,))
            user = cursor.fetchone()
            
            client_ip = request.remote_addr
            
            # If user exists and password matches (in production, use proper password hashing)
            if user and user.Password == password:
                # Log successful login attempt
                cursor.execute("EXEC LogAuthenticationAttempt186 @Username=?, @Successful=1, @IPAddress=?", 
                              (username, client_ip))
                conn.commit()
                
                # Set session variables
                session['user_id'] = user.UserID
                session['username'] = user.Username
                session['role'] = user.Role
                session['person_id'] = user.PersonID
                
                flash(f'Welcome {username}!', 'success')
                return redirect(url_for('dashboard'))
            else:
                # Log failed login attempt
                cursor.execute("EXEC LogAuthenticationAttempt186 @Username=?, @Successful=0, @IPAddress=?", 
                              (username, client_ip))
                conn.commit()
                flash('Invalid username or password', 'danger')
                
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required()
def dashboard():
    role = session.get('role')
    return render_template('dashboard.html', role=role)

# Add this function somewhere in your file
def convert_date_strings(data):
    """Convert string date fields to datetime objects"""
    if isinstance(data, list):
        return [convert_date_strings(item) for item in data]
    elif hasattr(data, '__dict__'):
        for key in dir(data):
            if not key.startswith('_') and not callable(getattr(data, key)):
                attr = getattr(data, key)
                if isinstance(attr, str) and key.lower().endswith(('date', 'datetime')):
                    try:
                        # Try to parse the string as a date
                        setattr(data, key, datetime.strptime(attr, '%Y-%m-%d'))
                    except (ValueError, TypeError):
                        # If it fails, leave it as is
                        pass
    return data

# Routes for Patients
@app.route('/patients')
@login_required(role='Doctor')
def patients():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Patients186")
    patients = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Convert any string dates to datetime objects
    patients = convert_date_strings(patients)
    
    return render_template('patients.html', patients=patients)

@app.route('/patient/<int:patient_id>')
@login_required(role='Doctor')
def patient_detail(patient_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get patient details
    cursor.execute("SELECT * FROM Patients186 WHERE PatientID = ?", (patient_id,))
    patient = cursor.fetchone()
    
    # Get patient's medical records
    cursor.execute("""
        SELECT mr.*, d.FirstName + ' ' + d.LastName AS DoctorName 
        FROM MedicalRecords186 mr
        JOIN Doctors186 d ON mr.DoctorID = d.DoctorID
        WHERE mr.PatientID = ?
    """, (patient_id,))
    medical_records = cursor.fetchall()
    
    # Get patient's appointments
    cursor.execute("""
        SELECT a.*, d.FirstName + ' ' + d.LastName AS DoctorName 
        FROM Appointments186 a
        JOIN Doctors186 d ON a.DoctorID = d.DoctorID
        WHERE a.PatientID = ?
    """, (patient_id,))
    appointments = cursor.fetchall()
    
    # Calculate patient age using SQL function
    cursor.execute("SELECT dbo.CalculatePatientAge186(?)", (patient_id,))
    age = cursor.fetchval()
    
    cursor.close()
    conn.close()
    
    return render_template('patient_detail.html', 
                           patient=patient, 
                           medical_records=medical_records, 
                           appointments=appointments, 
                           age=age)

@app.route('/add_patient', methods=['GET', 'POST'])
@login_required(role='Doctor')
def add_patient():
    if request.method == 'POST':
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        dob = request.form['dob']
        gender = request.form['gender']
        address = request.form['address']
        phone = request.form['phone']
        email = request.form['email']
        insurance = request.form['insurance']
        emergency_contact = request.form['emergency_contact']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Use the stored procedure to register a new patient
            cursor.execute("""
                DECLARE @NewPatientID INT
                EXEC RegisterNewPatient186 
                    @FirstName=?, 
                    @LastName=?, 
                    @DateOfBirth=?, 
                    @Gender=?,
                    @Address=?,
                    @PhoneNumber=?,
                    @Email=?,
                    @InsuranceDetails=?,
                    @EmergencyContact=?,
                    @NewPatientID=@NewPatientID OUTPUT
                SELECT @NewPatientID AS NewPatientID
            """, (first_name, last_name, dob, gender, address, phone, email, insurance, emergency_contact))
            
            new_patient_id = cursor.fetchval()
            conn.commit()
            
            flash(f'Patient {first_name} {last_name} added successfully!', 'success')
            return redirect(url_for('patient_detail', patient_id=new_patient_id))
            
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
            
    return render_template('add_patient.html')

# Routes for Doctors
@app.route('/doctors')
@login_required()
def doctors():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Use our table-valued function to get doctors with appointment counts
    cursor.execute("SELECT * FROM dbo.GetDoctorAppointmentCounts186()")
    doctors = cursor.fetchall()
    
    cursor.close()
    conn.close()
    return render_template('doctors.html', doctors=doctors)

# Routes for Appointments
@app.route('/appointments')
@login_required()
def appointments():
    role = session.get('role')
    person_id = session.get('person_id')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Different queries based on role
    if role == 'Admin':
        cursor.execute("""
            SELECT a.*, p.FirstName + ' ' + p.LastName AS PatientName, 
                   d.FirstName + ' ' + d.LastName AS DoctorName
            FROM Appointments186 a
            JOIN Patients186 p ON a.PatientID = p.PatientID
            JOIN Doctors186 d ON a.DoctorID = d.DoctorID
            ORDER BY a.AppointmentDate DESC
        """)
    elif role == 'Doctor':
        cursor.execute("""
            SELECT a.*, p.FirstName + ' ' + p.LastName AS PatientName, 
                   d.FirstName + ' ' + d.LastName AS DoctorName
            FROM Appointments186 a
            JOIN Patients186 p ON a.PatientID = p.PatientID
            JOIN Doctors186 d ON a.DoctorID = d.DoctorID
            WHERE a.DoctorID = ?
            ORDER BY a.AppointmentDate DESC
        """, (person_id,))
    elif role == 'Patient':
        cursor.execute("""
            SELECT a.*, p.FirstName + ' ' + p.LastName AS PatientName, 
                   d.FirstName + ' ' + d.LastName AS DoctorName
            FROM Appointments186 a
            JOIN Patients186 p ON a.PatientID = p.PatientID
            JOIN Doctors186 d ON a.DoctorID = d.DoctorID
            WHERE a.PatientID = ?
            ORDER BY a.AppointmentDate DESC
        """, (person_id,))
    else:
        cursor.execute("""
            SELECT a.AppointmentID, a.AppointmentDate, a.Status,
                   d.FirstName + ' ' + d.LastName AS DoctorName
            FROM Appointments186 a
            JOIN Doctors186 d ON a.DoctorID = d.DoctorID
            ORDER BY a.AppointmentDate DESC
        """)
    
    appointments = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return render_template('appointments.html', appointments=appointments, role=role)

@app.route('/schedule_appointment', methods=['GET', 'POST'])
@login_required()
def schedule_appointment():
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        doctor_id = request.form['doctor_id']
        appointment_date = request.form['appointment_date']
        reason = request.form['reason']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Use stored procedure to schedule appointment
            cursor.execute("""
                DECLARE @NewAppointmentID INT, @Result INT
                EXEC @Result = ScheduleAppointment186 
                    @PatientID=?, 
                    @DoctorID=?, 
                    @AppointmentDate=?, 
                    @Reason=?,
                    @NewAppointmentID=@NewAppointmentID OUTPUT
                
                SELECT @Result AS Result, @NewAppointmentID AS NewAppointmentID
            """, (patient_id, doctor_id, appointment_date, reason))
            
            row = cursor.fetchone()
            result = row.Result
            new_appointment_id = row.NewAppointmentID
            
            conn.commit()
            
            if result == 0:
                flash('Appointment scheduled successfully!', 'success')
                return redirect(url_for('appointments'))
            else:
                error_messages = {
                    -1: "Doctor does not exist",
                    -2: "Patient does not exist",
                    -3: "Doctor already has an appointment at this time"
                }
                flash(f'Error: {error_messages.get(result, "Unknown error")}', 'danger')
                
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    # Get list of doctors and patients for the form
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT DoctorID, FirstName + ' ' + LastName AS Name FROM Doctors186")
    doctors = cursor.fetchall()
    
    cursor.execute("SELECT PatientID, FirstName + ' ' + LastName AS Name FROM Patients186")
    patients = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('schedule_appointment.html', doctors=doctors, patients=patients)

# Routes for Medical Records
@app.route('/medical_records/<int:patient_id>')
@login_required(role='Doctor')
def medical_records(patient_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get patient details
    cursor.execute("SELECT * FROM Patients186 WHERE PatientID = ?", (patient_id,))
    patient = cursor.fetchone()
    
    # Get patient's medical records with doctor information
    cursor.execute("""
        SELECT mr.*, d.FirstName + ' ' + d.LastName AS DoctorName 
        FROM MedicalRecords186 mr
        JOIN Doctors186 d ON mr.DoctorID = d.DoctorID
        WHERE mr.PatientID = ?
        ORDER BY mr.RecordDate DESC
    """, (patient_id,))
    records = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('medical_records.html', patient=patient, records=records)

@app.route('/add_medical_record', methods=['GET', 'POST'])
@login_required(role='Doctor')
def add_medical_record():
    if request.method == 'POST':
        patient_id = request.form['patient_id']
        doctor_id = session.get('person_id')
        diagnosis = request.form['diagnosis']
        treatment = request.form['treatment']
        notes = request.form['notes']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO MedicalRecords186 (PatientID, DoctorID, Diagnosis, Treatment, Notes)
                VALUES (?, ?, ?, ?, ?);
                SELECT SCOPE_IDENTITY() AS RecordID;
            """, (patient_id, doctor_id, diagnosis, treatment, notes))
            
            record_id = cursor.fetchval()
            conn.commit()
            
            flash('Medical record added successfully!', 'success')
            return redirect(url_for('medical_records', patient_id=patient_id))
            
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    # Get list of patients for the form
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT PatientID, FirstName + ' ' + LastName AS Name FROM Patients186")
    patients = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return render_template('add_medical_record.html', patients=patients)

# Routes for Medications and Prescriptions
@app.route('/medications')
@login_required()
def medications():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Medications186")
    medications = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('medications.html', medications=medications)

@app.route('/add_prescription', methods=['GET', 'POST'])
@login_required(role='Doctor')
def add_prescription():
    if request.method == 'POST':
        record_id = request.form['record_id']
        medication_id = request.form['medication_id']
        dosage = request.form['dosage']
        frequency = request.form['frequency']
        start_date = request.form['start_date']
        end_date = request.form['end_date']
        instructions = request.form['instructions']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO Prescriptions186 
                (RecordID, MedicationID, Dosage, Frequency, StartDate, EndDate, Instructions)
                VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (record_id, medication_id, dosage, frequency, start_date, end_date, instructions))
            
            conn.commit()
            
            # The UpdateMedicationInventory186 trigger will automatically update medication inventory
            
            flash('Prescription added successfully!', 'success')
            
            # Get the patient ID from the medical record to redirect
            cursor.execute("SELECT PatientID FROM MedicalRecords186 WHERE RecordID = ?", (record_id,))
            patient_id = cursor.fetchval()
            
            return redirect(url_for('medical_records', patient_id=patient_id))
            
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    # Get data needed for the form
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get medical records
    cursor.execute("""
        SELECT mr.RecordID, p.FirstName + ' ' + p.LastName + ' - ' + CONVERT(VARCHAR(10), mr.RecordDate, 120) AS RecordInfo
        FROM MedicalRecords186 mr
        JOIN Patients186 p ON mr.PatientID = p.PatientID
        ORDER BY mr.RecordDate DESC
    """)
    records = cursor.fetchall()
    
    # Get medications
    cursor.execute("SELECT MedicationID, Name FROM Medications186")
    medications = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return render_template('add_prescription.html', records=records, medications=medications)

# Admin routes for managing users
@app.route('/users')
@login_required(role='Admin')
def users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users186")
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('users.html', users=users)

@app.route('/add_user', methods=['GET', 'POST'])
@login_required(role='Admin')
def add_user():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        person_id = request.form['person_id']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Users186 (Username, Password, Role, PersonID)
                VALUES (?, ?, ?, ?)
            """, (username, password, role, person_id))
            conn.commit()
            flash('User added successfully!', 'success')
            return redirect(url_for('users'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    return render_template('add_user.html')

@app.route('/edit_user/<int:user_id>', methods=['GET', 'POST'])
@login_required(role='Admin')
def edit_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Users186 WHERE UserID = ?", (user_id,))
    user = cursor.fetchone()
    
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']
        person_id = request.form['person_id']
        
        try:
            cursor.execute("""
                UPDATE Users186
                SET Username = ?, Password = ?, Role = ?, PersonID = ?
                WHERE UserID = ?
            """, (username, password, role, person_id, user_id))
            conn.commit()
            flash('User updated successfully!', 'success')
            return redirect(url_for('users'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    
    cursor.close()
    conn.close()
    return render_template('edit_user.html', user=user)

@app.route('/delete_user/<int:user_id>', methods=['POST'])
@login_required(role='Admin')
def delete_user(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Users186 WHERE UserID = ?", (user_id,))
        conn.commit()
        flash('User deleted successfully!', 'success')
    except Exception as e:
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
        conn.close()
    return redirect(url_for('users'))

@app.route('/add_medication', methods=['GET', 'POST'])
@login_required(role='Admin')
def add_medication():
    if request.method == 'POST':
        name = request.form['name']
        description = request.form['description']
        dosage_form = request.form['dosage_form']
        manufacturer = request.form['manufacturer']
        unit_price = request.form['unit_price']
        stock_quantity = request.form['stock_quantity']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Medications186 (Name, Description, DosageForm, Manufacturer, UnitPrice, StockQuantity)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (name, description, dosage_form, manufacturer, unit_price, stock_quantity))
            conn.commit()
            flash('Medication added successfully!', 'success')
            return redirect(url_for('medications'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    return render_template('add_medication.html')

@app.route('/add_doctor', methods=['GET', 'POST'])
@login_required(role='Admin')
def add_doctor():
    if request.method == 'POST':
        first_name = request.form['first_name']
        last_name = request.form['last_name']
        specialization = request.form['specialization']
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO Doctors186 (FirstName, LastName, Specialization)
                VALUES (?, ?, ?)
            """, (first_name, last_name, specialization))
            conn.commit()
            flash('Doctor added successfully!', 'success')
            return redirect(url_for('doctors'))
        except Exception as e:
            flash(f'Error: {str(e)}', 'danger')
        finally:
            cursor.close()
            conn.close()
    return render_template('add_doctor.html')

@app.route('/audit_logs')
@login_required(role='Admin')
def audit_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT al.*, u.Username 
        FROM AuditLogs186 al
        LEFT JOIN Users186 u ON al.UserID = u.UserID
        ORDER BY al.Timestamp DESC
    """)
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template('audit_logs.html', logs=logs)

@app.route('/backup_database', methods=['POST'])
@login_required(role='Admin')
def backup_database():
    backup_path = 'C:\\Users\\donko\\Music\\HOSPITALFLASK\\backups\\'
    
    # Ensure backup directory exists
    os.makedirs(backup_path, exist_ok=True)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("EXEC BackupHospitalDatabase186 @BackupPath=?", (backup_path,))
        conn.commit()
        
        flash('Database backed up successfully!', 'success')
    except Exception as e:
        flash(f'Error backing up database: {str(e)}', 'danger')
    finally:
        cursor.close()
        conn.close()
        
    return redirect(url_for('dashboard'))

@app.route('/check_eligibility', methods=['POST'])
@login_required(role='Doctor')
def check_eligibility():
    patient_id = request.form['patient_id']
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DECLARE @EligibilityStatus VARCHAR(50), @Message VARCHAR(200)
            EXEC CheckPatientEligibility186 
                @PatientID=?, 
                @EligibilityStatus=@EligibilityStatus OUTPUT, 
                @Message=@Message OUTPUT
            
            SELECT @EligibilityStatus AS Status, @Message AS Message
        """, (patient_id,))
        
        result = cursor.fetchone()
        status = result.Status
        message = result.Message
        
        return jsonify({
            'status': status,
            'message': message
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# Unauthorized access simulation route for testing
@app.route('/test_unauthorized')
def test_unauthorized():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Attempt to perform an operation that should be restricted
        if 'role' in session and session['role'] == 'Patient':
            # Patient trying to access all patients' data
            cursor.execute("SELECT * FROM Patients186")
            patients = cursor.fetchall()
            return jsonify({'result': 'Security breach! Patients should not see all patients', 'count': len(patients)})
        elif 'role' in session and session['role'] == 'Guest':
            # Guest trying to modify data
            cursor.execute("INSERT INTO Patients186 (FirstName) VALUES ('Test')")
            return jsonify({'result': 'Security breach! Guests should not modify data'})
        else:
            return jsonify({'result': 'Login with a restricted role to test access controls'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 403
    finally:
        cursor.close()
        conn.close()

@app.route('/add_sample_data')
@login_required(role='Admin')
def add_sample_data():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Insert sample users
        cursor.execute("""
            INSERT INTO Users186 (Username, Password, Role, PersonID)
            VALUES 
            ('admin1', 'password1', 'Admin', 1),
            ('doctor1', 'password2', 'Doctor', 2),
            ('patient1', 'password3', 'Patient', 3)
        """)
        
        # Insert sample medications
        cursor.execute("""
            INSERT INTO Medications186 (Name, Description, DosageForm, Manufacturer, UnitPrice, StockQuantity)
            VALUES 
            ('Aspirin', 'Pain reliever', 'Tablet', 'Pharma Inc.', 5.00, 100),
            ('Ibuprofen', 'Anti-inflammatory', 'Capsule', 'Health Corp.', 8.00, 200)
        """)
        
        # Insert sample doctors
        cursor.execute("""
            INSERT INTO Doctors186 (FirstName, LastName, Specialization)
            VALUES 
            ('John', 'Doe', 'Cardiology'),
            ('Jane', 'Smith', 'Neurology')
        """)
        
        # Insert sample patients
        cursor.execute("""
            INSERT INTO Patients186 (FirstName, LastName, DateOfBirth, Gender, Address, PhoneNumber, Email, InsuranceDetails, EmergencyContact)
            VALUES 
            ('Alice', 'Johnson', '1980-01-01', 'Female', '123 Main St', '123-456-7890', 'alice@example.com', 'Insurance A', 'Bob Johnson'),
            ('Bob', 'Williams', '1975-05-15', 'Male', '456 Elm St', '987-654-3210', 'bob@example.com', 'Insurance B', 'Alice Williams')
        """)
        
        # Insert sample appointments
        cursor.execute("""
            INSERT INTO Appointments186 (PatientID, DoctorID, AppointmentDate, Reason, Status)
            VALUES 
            (1, 1, '2023-12-01 10:00:00', 'Routine Checkup', 'Scheduled'),
            (2, 2, '2023-12-02 11:00:00', 'Consultation', 'Scheduled')
        """)
        
        conn.commit()
        flash('Sample data added successfully!', 'success')
    except Exception as e:
        flash(f'Error: {str(e)}', 'danger')
    finally:
        cursor.close()
        conn.close()
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)
