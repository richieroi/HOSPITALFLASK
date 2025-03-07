// Dashboard JavaScripts for Hospital Management System

$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Initialize popovers
    $('[data-toggle="popover"]').popover();

    // Page preloader
    $(window).on('load', function() {
        $('.pre-loader').fadeOut('slow');
    });
    
    // Counter animation for statistics
    function animateCounters() {
        $('.counter').each(function () {
            $(this).prop('Counter', 0).animate({
                Counter: $(this).text()
            }, {
                duration: 1500,
                easing: 'swing',
                step: function (now) {
                    $(this).text(Math.ceil(now));
                }
            });
        });
    }
    
    // Call counter animation when in viewport
    if($('.counter').length > 0) {
        let counted = false;
        $(window).scroll(function() {
            const windowBottom = $(this).scrollTop() + $(this).innerHeight();
            const counterPosition = $('.counter').offset().top;
            
            if (counterPosition < windowBottom && !counted) {
                animateCounters();
                counted = true;
            }
        });
        
        // Initial check in case counters are visible on page load
        if($('.counter').offset().top < $(window).height()) {
            animateCounters();
            counted = true;
        }
    }
    
    // Initialize any charts if they exist
    if($('#appointmentsChart').length > 0) {
        let appointmentCtx = document.getElementById('appointmentsChart').getContext('2d');
        new Chart(appointmentCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                datasets: [{
                    label: 'Appointments',
                    data: [65, 59, 80, 81, 56, 55, 73],
                    fill: false,
                    borderColor: '#0072b5',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    if($('#patientsDemographics').length > 0) {
        let demographicsCtx = document.getElementById('patientsDemographics').getContext('2d');
        new Chart(demographicsCtx, {
            type: 'pie',
            data: {
                labels: ['0-18', '19-35', '36-50', '51-65', '65+'],
                datasets: [{
                    label: 'Patient Demographics',
                    data: [15, 25, 20, 25, 15],
                    backgroundColor: [
                        '#3949AB', '#1E88E5', '#43A047', '#E53935', '#7B1FA2'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Search functionality
    $('#searchInput').on('keyup', function() {
        let value = $(this).val().toLowerCase();
        $('.searchable tr').filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
        });
    });
    
    // Patient eligibility check with improved UI
    $('.check-eligibility').click(function() {
        const patientId = $(this).data('patient-id');
        const button = $(this);
        
        button.html('<i class="fas fa-spinner fa-spin"></i> Checking...');
        button.prop('disabled', true);
        
        $.ajax({
            url: '/check_eligibility',
            type: 'POST',
            data: {
                'patient_id': patientId
            },
            success: function(response) {
                button.html('<i class="fas fa-check-circle"></i> Check Eligibility');
                button.prop('disabled', false);
                
                let statusClass = 'text-success';
                let statusIcon = 'fa-check-circle';
                
                if (response.status === 'Ineligible') {
                    statusClass = 'text-danger';
                    statusIcon = 'fa-times-circle';
                } else if (response.status === 'Unknown') {
                    statusClass = 'text-warning';
                    statusIcon = 'fa-question-circle';
                }
                
                $('#eligibilityResult').html(`
                    <div class="text-center">
                        <i class="fas ${statusIcon} ${statusClass} fa-3x mb-3"></i>
                        <h4 class="${statusClass}">${response.status}</h4>
                        <p class="mb-0">${response.message}</p>
                    </div>
                `);
                
                $('#eligibilityModal').modal('show');
            },
            error: function(error) {
                button.html('<i class="fas fa-check-circle"></i> Check Eligibility');
                button.prop('disabled', false);
                
                $('#eligibilityResult').html(`
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Error checking eligibility. Please try again.
                    </div>
                `);
                $('#eligibilityModal').modal('show');
            }
        });
    });
    
    // Print functionality
    $('.btn-print').click(function() {
        window.print();
        return false;
    });
});
