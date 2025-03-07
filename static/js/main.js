/**
 * Main JavaScript file for Hospital Management System
 * Handles loading of module-specific scripts and provides shared functionality
 */

$(document).ready(function() {
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Initialize popovers
    $('[data-toggle="popover"]').popover();
    
    // Hide preloader when page is fully loaded
    $('.pre-loader').fadeOut('slow');
    
    // Determine which page we're on and load appropriate scripts
    const currentPage = $('body').data('page');
    
    switch(currentPage) {
        case 'dashboard':
            loadScript('/static/js/dashboard.js');
            break;
        case 'appointments':
            loadScript('/static/js/appointment-scheduler.js');
            break;
        case 'medical-records':
            loadScript('/static/js/patient-records.js');
            break;
        case 'medications':
            loadScript('/static/js/medication-inventory.js');
            break;
    }
    
    // Setup theme toggle
    setupThemeToggle();
    
    // Initialize mobile navigation
    initMobileNav();
    
    // Set up live date and time display
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Listen for notification events
    setupNotifications();
});

// Function to dynamically load scripts
function loadScript(url) {
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
}

// Function to set up theme toggle (light/dark mode)
function setupThemeToggle() {
    $('#theme-toggle').click(function() {
        $('body').toggleClass('dark-theme');
        
        // Save preference to local storage
        const isDarkMode = $('body').hasClass('dark-theme');
        localStorage.setItem('darkMode', isDarkMode);
        
        // Update icon
        const icon = $(this).find('i');
        if (isDarkMode) {
            icon.removeClass('fa-moon').addClass('fa-sun');
        } else {
            icon.removeClass('fa-sun').addClass('fa-moon');
        }
    });
    
    // Apply saved theme preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    if (savedDarkMode) {
        $('body').addClass('dark-theme');
        $('#theme-toggle').find('i').removeClass('fa-moon').addClass('fa-sun');
    }
}

// Function to initialize mobile navigation
function initMobileNav() {
    $('.mobile-menu-toggle').click(function() {
        $('.sidebar').toggleClass('show');
        $('.overlay').toggleClass('show');
    });
    
    $('.overlay').click(function() {
        $('.sidebar').removeClass('show');
        $(this).removeClass('show');
    });
}

// Function to update date and time display
function updateDateTime() {
    if ($('#current-time').length > 0) {
        const now = new Date();
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        $('#current-time').text(now.toLocaleDateString('en-US', options));
    }
}

// Function to set up notifications
function setupNotifications() {
    // In a real application, this might use WebSockets to receive real-time notifications
    if ($('#notification-badge').length > 0) {
        // Simulate receiving notifications periodically (for demo purposes)
        setTimeout(function() {
            const count = Math.floor(Math.random() * 5) + 1;
            $('#notification-badge').text(count).show();
            
            if (count > 0) {
                showNotification('New notifications', `You have ${count} unread notifications`);
            }
        }, 10000);
    }
}

// Function to show toast notification
function showNotification(title, message) {
    if ($('#notification-toast').length === 0) {
        $('body').append(`
            <div id="notification-toast" class="toast" role="alert" aria-live="assertive" aria-atomic="true" 
                 style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
                <div class="toast-header">
                    <i class="fas fa-bell text-primary mr-2"></i>
                    <strong class="mr-auto notification-title"></strong>
                    <small class="text-muted notification-time"></small>
                    <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="toast-body notification-message"></div>
            </div>
        `);
    }
    
    $('.notification-title').text(title);
    $('.notification-message').text(message);
    $('.notification-time').text('Just now');
    
    $('#notification-toast').toast({
        delay: 5000,
        animation: true
    }).toast('show');
}
