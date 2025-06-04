document.addEventListener('DOMContentLoaded', function() {
    const sidebarButtons = document.querySelectorAll('.sidebar-button');
    const sections = document.querySelectorAll('.section-content');
    
    document.querySelector('.orders-container').style.display = 'grid'; 
    
    sidebarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            
            // Hide all sections
            sections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected section with correct display type
            const targetElement = document.querySelector(`.${targetSection}-container`);
            targetElement.style.display = targetSection === 'orders' ? 'grid' : 'block';
            
            // Update active button styling
            sidebarButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
});
// Add this to your existing DOMContentLoaded event
const ingredientToggles = document.querySelectorAll('.ingredient-toggle input');
ingredientToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
        const ingredientName = this.closest('.ingredient-toggle').querySelector('span').textContent;
        const isAvailable = this.checked;
        
        // Here you would send this to your backend
        console.log(`${ingredientName} is now ${isAvailable ? 'available' : 'unavailable'}`);
        
        // You could also add visual feedback
        const statusIndicator = this.closest('.ingredient-toggle').querySelector('.status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + 
                (isAvailable ? 'status-available' : 'status-unavailable');
        }
    });
});
// Add this to your existing DOMContentLoaded event
const statusButtons = document.querySelectorAll('.status-btn');
const currentStatus = document.querySelector('.current-status');

statusButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        statusButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update status text
        currentStatus.textContent = this.textContent;
        
        // Here you would send this status to your backend
        console.log(`Status set to: ${this.textContent}`);
    });
});
