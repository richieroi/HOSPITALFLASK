/**
 * Medication Inventory Management
 * Provides interactive features for tracking and managing medication inventory
 */

$(document).ready(function() {
    // Initialize inventory datatable if exists
    if ($('#medication-inventory-table').length > 0) {
        $('#medication-inventory-table').DataTable({
            responsive: true,
            order: [[6, 'asc']], // Sort by stock quantity ascending to show low stock first
            columnDefs: [
                { 
                    targets: 7, // Status column
                    render: function(data, type, row) {
                        // Apply color coding based on stock status
                        if (data === 'Low Stock') {
                            return '<span class="badge badge-danger">Low Stock</span>';
                        } else if (data === 'Medium Stock') {
                            return '<span class="badge badge-warning">Medium Stock</span>';
                        } else {
                            return '<span class="badge badge-success">Good Stock</span>';
                        }
                    }
                }
            ]
        });
    }
    
    // Initialize stock level visualization
    if ($('#stock-level-chart').length > 0) {
        const ctx = document.getElementById('stock-level-chart').getContext('2d');
        
        // Collect medication data
        const medicationNames = [];
        const stockLevels = [];
        const backgroundColors = [];
        
        $('.medication-item').each(function() {
            medicationNames.push($(this).data('name'));
            stockLevels.push($(this).data('stock'));
            
            // Set color based on stock level
            const stock = $(this).data('stock');
            if (stock <= 10) {
                backgroundColors.push('#dc3545'); // Danger/red
            } else if (stock <= 50) {
                backgroundColors.push('#ffc107'); // Warning/yellow
            } else {
                backgroundColors.push('#28a745'); // Success/green
            }
        });
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: medicationNames,
                datasets: [{
                    label: 'Current Stock',
                    data: stockLevels,
                    backgroundColor: backgroundColors
                }]
            },
            options: {
                indexAxis: 'y', // Horizontal bar chart
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units in Stock'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `Stock: ${context.raw} units`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Add threshold indicators
    $('.stock-indicator').each(function() {
        const stock = parseInt($(this).data('stock'));
        const max = parseInt($(this).data('max'));
        const percentage = (stock / max) * 100;
        
        $(this).css('width', percentage + '%');
        
        if (percentage <= 20) {
            $(this).addClass('bg-danger');
        } else if (percentage <= 50) {
            $(this).addClass('bg-warning');
        } else {
            $(this).addClass('bg-success');
        }
    });
    
    // Medication expiry warning system
    checkMedicationExpiry();
    
    // Filter medications by category
    $('.medication-filter').click(function() {
        const category = $(this).data('category');
        
        $('.medication-filter').removeClass('active');
        $(this).addClass('active');
        
        if (category === 'all') {
            $('.medication-item').show();
        } else {
            $('.medication-item').hide();
            $(`.medication-item[data-category="${category}"]`).show();
        }
    });
    
    // Initialize batch tracking system
    if ($('#add-batch-form').length > 0) {
        initializeBatchTracking();
    }
    
    // Initialize inventory alerts
    setUpInventoryAlerts();
    
    // Real-time inventory update simulation
    if ($('.update-inventory-btn').length > 0) {
        setUpInventoryUpdates();
    }
    
    // Initialize barcode scanner simulation
    if ($('#barcode-input').length > 0) {
        initializeBarcodeScanner();
    }
});

// Function to check medication expiry
function checkMedicationExpiry() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    $('.medication-expiry').each(function() {
        const expiryDate = new Date($(this).data('expiry'));
        
        if (expiryDate < today) {
            // Expired
            $(this).html(`<span class="badge badge-danger">
                <i class="fas fa-exclamation-circle"></i> Expired
            </span>`);
            $(this).closest('.medication-item').addClass('expired-medication');
        } else if (expiryDate < thirtyDaysFromNow) {
            // Expiring soon
            const daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            $(this).html(`<span class="badge badge-warning">
                <i class="fas fa-exclamation-triangle"></i> Expires in ${daysRemaining} days
            </span>`);
        } else {
            // Good for now
            $(this).html(`<span class="badge badge-success">
                <i class="fas fa-check-circle"></i> Valid
            </span>`);
        }
    });
    
    // Display expiry summary
    const expiredCount = $('.expired-medication').length;
    if (expiredCount > 0) {
        $('#expiry-alert').html(`
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Warning:</strong> ${expiredCount} medication(s) have expired and should be removed from inventory.
            </div>
        `).show();
    }
}

// Function to initialize batch tracking
function initializeBatchTracking() {
    // Generate batch ID
    function generateBatchID() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `BATCH-${year}${month}${day}-${random}`;
    }
    
    // Pre-fill batch ID when form loads
    $('#batch-id').val(generateBatchID());
    
    // Regenerate batch ID button
    $('#generate-batch-id').click(function() {
        $('#batch-id').val(generateBatchID());
    });
    
    // Calculate batch value on quantity change
    $('#batch-quantity, #unit-price').on('input', function() {
        const quantity = parseFloat($('#batch-quantity').val()) || 0;
        const unitPrice = parseFloat($('#unit-price').val()) || 0;
        const totalValue = (quantity * unitPrice).toFixed(2);
        
        $('#batch-value').val(totalValue);
    });
}

// Function to set up inventory alerts
function setUpInventoryAlerts() {
    // Count low stock items
    const lowStockCount = $('.badge-danger:contains("Low Stock")').length;
    
    // Display alert if there are low stock items
    if (lowStockCount > 0) {
        $('#inventory-alerts').html(`
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="fas fa-exclamation-triangle"></i>
                <strong>Low Stock Alert:</strong> ${lowStockCount} medication(s) are running low and need to be restocked.
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `).show();
    }
}

// Function to set up real-time inventory updates
function setUpInventoryUpdates() {
    $('.update-inventory-btn').click(function() {
        const medicationId = $(this).data('id');
        const currentStock = parseInt($(`#stock-${medicationId}`).text());
        
        // Show update modal
        $('#update-inventory-modal').modal('show');
        $('#modal-medication-id').val(medicationId);
        $('#modal-current-stock').text(currentStock);
        $('#modal-new-quantity').val('');
        
        // Reset form state
        $('#modal-operation').val('add');
        $('#modal-reason').val('');
    });
    
    // Handle form submission for inventory update
    $('#update-inventory-form').submit(function(e) {
        e.preventDefault();
        
        const medicationId = $('#modal-medication-id').val();
        const currentStock = parseInt($(`#stock-${medicationId}`).text());
        const updateQuantity = parseInt($('#modal-new-quantity').val());
        const operation = $('#modal-operation').val();
        
        if (isNaN(updateQuantity) || updateQuantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        
        let newStock;
        if (operation === 'add') {
            newStock = currentStock + updateQuantity;
        } else {
            newStock = currentStock - updateQuantity;
            
            // Prevent negative stock
            if (newStock < 0) {
                alert('Cannot remove more than current stock');
                return;
            }
        }
        
        // Update display (in a real app, this would update the database first)
        $(`#stock-${medicationId}`).text(newStock);
        
        // Update stock status
        let newStatus;
        let statusClass;
        
        if (newStock <= 10) {
            newStatus = 'Low Stock';
            statusClass = 'badge-danger';
        } else if (newStock <= 50) {
            newStatus = 'Medium Stock';
            statusClass = 'badge-warning';
        } else {
            newStatus = 'Good Stock';
            statusClass = 'badge-success';
        }
        
        $(`#status-${medicationId}`)
            .text(newStatus)
            .removeClass('badge-danger badge-warning badge-success')
            .addClass(statusClass);
        
        // Show success message
        $('#inventory-update-alert').html(`
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <i class="fas fa-check-circle"></i>
                Inventory successfully updated!
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `).show();
        
        // Close modal
        $('#update-inventory-modal').modal('hide');
        
        // Log the update (in a real app, this would be stored in the database)
        console.log(`Medication ID: ${medicationId}, Operation: ${operation}, Quantity: ${updateQuantity}, New Stock: ${newStock}, Reason: ${$('#modal-reason').val()}`);
    });
}

// Function to initialize barcode scanner simulation
function initializeBarcodeScanner() {
    $('#scan-barcode-btn').click(function() {
        // Simulate scanning process
        $(this).prop('disabled', true);
        $(this).html('<i class="fas fa-spinner fa-spin"></i> Scanning...');
        
        setTimeout(function() {
            // Generate random barcode
            const randomBarcode = 'MED' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
            $('#barcode-input').val(randomBarcode);
            
            // Re-enable button
            $('#scan-barcode-btn').prop('disabled', false);
            $('#scan-barcode-btn').html('<i class="fas fa-barcode"></i> Scan Barcode');
            
            // Look up medication by barcode (in a real app)
            lookupMedicationByBarcode(randomBarcode);
        }, 1500);
    });
}

// Function to lookup medication by barcode
function lookupMedicationByBarcode(barcode) {
    // Simulate API call to look up medication
    console.log(`Looking up medication with barcode: ${barcode}`);
    
    // In a real app, this would query the database
    // For demo, we'll randomly select an existing medication
    const medications = [
        { id: 1, name: "Amoxicillin", form: "Tablet", strength: "500mg" },
        { id: 2, name: "Lisinopril", form: "Capsule", strength: "10mg" },
        { id: 3, name: "Metformin", form: "Tablet", strength: "500mg" },
        { id: 4, name: "Albuterol", form: "Inhaler", strength: "90mcg" },
        { id: 5, name: "Simvastatin", form: "Tablet", strength: "20mg" }
    ];
    
    const randomIndex = Math.floor(Math.random() * medications.length);
    const medication = medications[randomIndex];
    
    // Display result
    $('#barcode-result').html(`
        <div class="alert alert-info">
            <h5><i class="fas fa-pills"></i> ${medication.name}</h5>
            <p><strong>Form:</strong> ${medication.form} | <strong>Strength:</strong> ${medication.strength}</p>
            <p><strong>Barcode:</strong> ${barcode}</p>
            <button class="btn btn-sm btn-primary" onclick="selectMedication(${medication.id})">
                <i class="fas fa-check"></i> Select This Medication
            </button>
        </div>
    `).show();
}

// Global function to select medication from barcode scan
function selectMedication(id) {
    // In a real app, this would populate form fields with medication details
    console.log(`Selected medication ID: ${id}`);
    
    // Simulate form population
    $('#medication-id').val(id);
    
    $('#barcode-result').append(`
        <div class="alert alert-success mt-2">
            <i class="fas fa-check-circle"></i> Medication selected successfully!
        </div>
    `);
}
