// Advanced appointment scheduling functionality

$(document).ready(function() {
    // Initialize the datetime picker with enhanced options
    if ($("#appointment_date").length > 0) {
        const appointmentDatePicker = flatpickr("#appointment_date", {
            enableTime: true,
            dateFormat: "Y-m-d H:i",
            minDate: "today",
            time_24hr: true,
            minuteIncrement: 15,
            disableMobile: "true",
            onChange: function(selectedDates, dateStr) {
                // Check for doctor availability when date changes if doctor is already selected
                const doctorId = $("#doctor_id").val();
                if (doctorId) {
                    checkDoctorAvailability(doctorId, dateStr);
                }
            }
        });
        
        // Reset timeslots when doctor changes
        $("#doctor_id").change(function() {
            const doctorId = $(this).val();
            const selectedDate = $("#appointment_date").val();
            
            if (doctorId && selectedDate) {
                checkDoctorAvailability(doctorId, selectedDate);
            }
        });
        
        // Function to check doctor availability
        function checkDoctorAvailability(doctorId, dateTime) {
            const availabilityIndicator = $("#availability-indicator");
            
            // Show loading state
            availabilityIndicator.html('<i class="fas fa-spinner fa-spin"></i> Checking availability...');
            availabilityIndicator.show();
            
            // Simulate AJAX call - in a real app this would check against the database
            setTimeout(function() {
                // This is where you'd make an actual AJAX call to check availability
                // For demo purposes we'll randomly determine availability
                const isAvailable = Math.random() > 0.3;
                
                if (isAvailable) {
                    availabilityIndicator.html('<i class="fas fa-check-circle text-success"></i> This time slot is available');
                } else {
                    availabilityIndicator.html('<i class="fas fa-times-circle text-danger"></i> Doctor is not available at this time. Please select another time.');
                }
            }, 1000);
        }
    }
    
    // Create a recurring appointment
    $("#recurring-toggle").change(function() {
        if($(this).is(":checked")) {
            $("#recurring-options").slideDown();
        } else {
            $("#recurring-options").slideUp();
        }
    });
    
    // Initialize appointment calendar if it exists
    if ($("#appointment-calendar").length > 0) {
        const calendar = new FullCalendar.Calendar(document.getElementById('appointment-calendar'), {
            initialView: 'timeGridWeek',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: [
                // Sample events - in a real app these would come from the database
                {
                    title: 'Dr. Johnson - John Doe',
                    start: '2023-03-15T09:00:00',
                    end: '2023-03-15T10:00:00',
                    color: '#0072b5'
                },
                {
                    title: 'Dr. Lee - Emily Smith',
                    start: '2023-03-16T10:30:00',
                    end: '2023-03-16T11:30:00',
                    color: '#00a896'
                }
                // More events would be loaded dynamically
            ],
            slotMinTime: '08:00:00',
            slotMaxTime: '18:00:00',
            allDaySlot: false,
            slotDuration: '00:15:00',
            selectable: true,
            select: function(info) {
                // When a time slot is selected, pre-fill the appointment form
                $("#appointment_date").val(info.startStr.substring(0, 16).replace('T', ' '));
                calendar.unselect();
            }
        });
        
        calendar.render();
    }
});
