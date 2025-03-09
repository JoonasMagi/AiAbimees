/**
 * Main Application Entry Point
 * Initializes all components and sets up event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize authentication
    if (typeof Auth !== 'undefined') {
        Auth.initialize('login-btn', 'logout-btn', 'username-label');
    }
    
    // Check if we're on the plants page
    const isPlantPage = window.location.pathname === '/plants';
    
    if (isPlantPage) {
        // Initialize plant components if we're on the plants page
        if (typeof PlantList !== 'undefined') {
            PlantList.initialize('plant-container', 'loading-indicator', 'no-plants-message');
            PlantList.setupEventListeners('add-plant-btn');
        }
        
        if (typeof Reminders !== 'undefined') {
            Reminders.initialize('reminders-container', 'reminders-toggle', 'reminders-loading', 'no-reminders-message');
        }
    }
    
    // Initialize modals - they're used across pages
    if (typeof Modal !== 'undefined' && typeof PlantDetails !== 'undefined') {
        PlantDetails.initialize();
    }
    
    console.log('Aedniku Abimees (Gardener\'s Assistant) Initialized');
});
