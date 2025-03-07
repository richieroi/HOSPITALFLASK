/**
 * Patient Records Management Script
 * Enhances the functionality of medical records and patient history views
 */

$(document).ready(function() {
    // Timeline visualization for patient medical history
    if ($('#patient-timeline').length > 0) {
        initializePatientTimeline();
    }
    
    // Medical record search and filtering
    $('#record-search').on('input', function() {
        const searchTerm = $(this).val().toLowerCase();
        $('.medical-record-item').each(function() {
            const recordText = $(this).text().toLowerCase();
            $(this).toggle(recordText.indexOf(searchTerm) > -1);
        });
        
        // Show message when no results found
        const visibleRecords = $('.medical-record-item:visible').length;
        if (visibleRecords === 0 && searchTerm !== '') {
            $('#no-records-message').show();
        } else {
            $('#no-records-message').hide();
        }
    });
    
    // Medical record category filtering
    $('.record-filter-btn').click(function() {
        const filterCategory = $(this).data('filter');
        
        // Toggle active state of filter buttons
        $('.record-filter-btn').removeClass('active');
        $(this).addClass('active');
        
        if (filterCategory === 'all') {
            $('.medical-record-item').show();
        } else {
            $('.medical-record-item').hide();
            $(`.medical-record-item[data-category="${filterCategory}"]`).show();
        }
        
        // Show message when no results found
        const visibleRecords = $('.medical-record-item:visible').length;
        if (visibleRecords === 0) {
            $('#no-records-message').show();
        } else {
            $('#no-records-message').hide();
        }
    });
    
    // Toggle patient details sections
    $('.toggle-patient-section').click(function() {
        const targetSection = $(this).data('target');
        $(targetSection).slideToggle();
        
        // Toggle icon
        const icon = $(this).find('i.fa-chevron-down, i.fa-chevron-up');
        icon.toggleClass('fa-chevron-down fa-chevron-up');
    });
    
    // Vital signs chart initialization
    if ($('#vitals-chart').length > 0) {
        const ctx = document.getElementById('vitals-chart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Blood Pressure (Systolic)',
                        data: [120, 118, 125, 123, 126, 130],
                        borderColor: '#ff6384',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Blood Pressure (Diastolic)',
                        data: [80, 78, 82, 79, 85, 84],
                        borderColor: '#36a2eb',
                        fill: false,
                        tension: 0.1
                    },
                    {
                        label: 'Heart Rate',
                        data: [72, 74, 71, 73, 75, 78],
                        borderColor: '#4bc0c0',
                        fill: false,
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 50,
                        max: 150
                    }
                }
            }
        });
    }
    
    // Add diagnosis with auto-complete
    if ($('#diagnosis-input').length > 0) {
        const availableDiagnoses = [
            "Common Cold", "Hypertension", "Type 2 Diabetes", "Influenza", 
            "Migraine", "Bronchitis", "Pneumonia", "Urinary Tract Infection",
            "Gastroenteritis", "Asthma", "Arthritis", "Allergic Rhinitis",
            "Sinusitis", "Acid Reflux", "Conjunctivitis", "Dermatitis"
        ];
        
        $('#diagnosis-input').autocomplete({
            source: availableDiagnoses,
            minLength: 2
        });
    }
    
    // Print medical record
    $('.print-record-btn').click(function() {
        const recordId = $(this).data('record-id');
        printMedicalRecord(recordId);
    });
    
    // Export medical record to PDF
    $('.export-record-btn').click(function() {
        const recordId = $(this).data('record-id');
        exportMedicalRecord(recordId);
    });
    
    // Initialize Prescription Management
    initializePrescriptionManagement();
});

// Function to initialize patient medical timeline
function initializePatientTimeline() {
    // Create data visualization for patient's medical history
    const timelineData = [];
    
    // Collect data from HTML elements
    $('.timeline-item').each(function() {
        timelineData.push({
            date: $(this).data('date'),
            eventType: $(this).data('type'),
            title: $(this).find('.timeline-title').text(),
            description: $(this).find('.timeline-description').text()
        });
    });
    
    // Sort timeline items by date
    timelineData.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Apply color coding based on event type
    $('.timeline-item').each(function(index) {
        const eventType = $(this).data('type');
        let iconClass;
        let colorClass;
        
        switch(eventType) {
            case 'appointment':
                iconClass = 'fa-calendar-check';
                colorClass = 'timeline-appointment';
                break;
            case 'diagnosis':
                iconClass = 'fa-stethoscope';
                colorClass = 'timeline-diagnosis';
                break;
            case 'medication':
                iconClass = 'fa-pills';
                colorClass = 'timeline-medication';
                break;
            case 'procedure':
                iconClass = 'fa-procedures';
                colorClass = 'timeline-procedure';
                break;
            case 'lab':
                iconClass = 'fa-flask';
                colorClass = 'timeline-lab';
                break;
            default:
                iconClass = 'fa-notes-medical';
                colorClass = 'timeline-default';
        }
        
        $(this).addClass(colorClass);
        $(this).find('.timeline-icon i').addClass(iconClass);
    });
}

// Function to print medical record
function printMedicalRecord(recordId) {
    const printContents = document.getElementById(`record-detail-${recordId}`).innerHTML;
    const originalContents = document.body.innerHTML;
    
    // Add hospital header and styling for print
    const printHead = `
        <div class="print-header">
            <h2>Hospital Management System</h2>
            <h3>Medical Record - #${recordId}</h3>
            <p>Printed on: ${new Date().toLocaleString()}</p>
        </div>
    `;
    
    document.body.innerHTML = printHead + printContents;
    window.print();
    document.body.innerHTML = originalContents;
    
    // Reinitialize scripts after printing
    location.reload();
}

// Function to export medical record as PDF
function exportMedicalRecord(recordId) {
    // In a real implementation, this would use a library like jsPDF
    // For now, we'll just simulate export with an alert
    alert('Exporting medical record #' + recordId + ' as PDF...');
    // In real implementation: generate PDF and trigger download
}

// Function to initialize prescription management
function initializePrescriptionManagement() {
    // Add autocomplete for medication selection
    if ($('#medication-input').length > 0) {
        const availableMedications = [
            "Amoxicillin", "Lisinopril", "Metformin", "Atorvastatin", 
            "Albuterol", "Omeprazole", "Levothyroxine", "Ibuprofen",
            "Acetaminophen", "Losartan", "Gabapentin", "Hydrochlorothiazide"
        ];
        
        $('#medication-input').autocomplete({
            source: availableMedications,
            minLength: 2
        });
    }
    
    // Duration calculator
    $('.calc-duration').on('change', function() {
        const startDate = new Date($('#start-date').val());
        const endDate = new Date($('#end-date').val());
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            $('#duration-days').text(diffDays);
            $('#duration-container').show();
        } else {
            $('#duration-container').hide();
        }
    });
    
    // Add dosage frequency presets
    $('.frequency-preset').click(function() {
        const frequency = $(this).data('frequency');
        $('#frequency-input').val(frequency);
    });
    
    // Drug interaction checker
    $('#check-interactions-btn').click(function() {
        const medication = $('#medication-input').val();
        if (medication) {
            // In a real app, this would check against a database of known interactions
            checkDrugInteractions(medication);
        }
    });
}

// Function to check drug interactions
function checkDrugInteractions(medication) {
    // Simulate API call for drug interactions
    console.log(`Checking interactions for: ${medication}`);
    
    // Simulated response - in a real app, this would come from an API
    const hasInteractions = Math.random() > 0.7;
    
    if (hasInteractions) {
        $('#interaction-results').html(`
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Potential interaction detected!</strong> ${medication} may interact with medications 
                the patient is currently taking. Please review current medications before prescribing.
            </div>
        `);
    } else {
        $('#interaction-results').html(`
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <strong>No interactions found.</strong> No known interactions between ${medication} 
                and the patient's current medications.
            </div>
        `);
    }
    
    $('#interaction-results').show();
}
