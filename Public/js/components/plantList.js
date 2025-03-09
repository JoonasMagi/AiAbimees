/**
 * Plant List Component
 * Manages the listing and display of plants
 */
const PlantList = (function() {
    // DOM element references
    let plantContainer;
    let loadingIndicator;
    let noPlantMessage;
    
    /**
     * Initialize the component
     * @param {String} containerId - ID of the container element
     * @param {String} loadingId - ID of the loading indicator element
     * @param {String} noPlantMessageId - ID of the no plant message element
     */
    const initialize = (containerId, loadingId, noPlantMessageId) => {
        plantContainer = document.getElementById(containerId);
        loadingIndicator = document.getElementById(loadingId);
        noPlantMessage = document.getElementById(noPlantMessageId);
        
        if (!plantContainer) {
            console.error('Plant container element not found');
            return;
        }
        
        // Load plants
        loadPlants();
        
        // Initialize plant details modal
        if (typeof PlantDetails !== 'undefined') {
            PlantDetails.initialize();
        }
    };
    
    /**
     * Load plants from the API
     */
    const loadPlants = async () => {
        try {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            if (noPlantMessage) {
                noPlantMessage.style.display = 'none';
            }
            
            const plants = await API.getPlants();
            renderPlants(plants);
            
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            if (noPlantMessage && plants.length === 0) {
                noPlantMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading plants:', error);
            
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            alert('Error loading plants. Please try again or refresh the page.');
        }
    };
    
    /**
     * Render plants in the container
     * @param {Array} plants - Array of plant objects
     */
    const renderPlants = (plants) => {
        if (!plantContainer) return;
        
        // Clear container
        plantContainer.innerHTML = '';
        
        // Render each plant
        plants.forEach(plant => {
            const plantElement = createPlantElement(plant);
            plantContainer.appendChild(plantElement);
        });
    };
    
    /**
     * Create a plant element
     * @param {Object} plant - Plant object
     * @returns {HTMLElement} Plant element
     */
    const createPlantElement = (plant) => {
        const plantElement = document.createElement('div');
        plantElement.className = 'plant-card';
        plantElement.dataset.plantId = plant.id;
        
        // Format date
        const plantingDate = new Date(plant.plantingTime).toLocaleDateString();
        
        // Calculate days since planting
        const daysSincePlanting = Math.floor((new Date() - new Date(plant.plantingTime)) / (1000 * 60 * 60 * 24));
        
        // Calculate estimated cropping date if provided
        let croppingInfo = '';
        if (plant.estCropping) {
            const daysRemaining = plant.estCropping - daysSincePlanting;
            if (daysRemaining > 0) {
                croppingInfo = `<div class="plant-cropping">Estimated days until cropping: <span class="highlight">${daysRemaining}</span></div>`;
            } else if (daysRemaining === 0) {
                croppingInfo = `<div class="plant-cropping highlight">Ready for harvest today!</div>`;
            } else {
                croppingInfo = `<div class="plant-cropping">Ready for harvest since <span class="highlight">${-daysRemaining}</span> days</div>`;
            }
        }
        
        // Create plant HTML
        plantElement.innerHTML = `
            <div class="plant-header">
                <h3 class="plant-name">${plant.name}</h3>
                <div class="plant-species">${plant.species}</div>
            </div>
            <div class="plant-details">
                <div class="plant-planting-time">Planted: ${plantingDate} (${daysSincePlanting} days ago)</div>
                ${croppingInfo}
            </div>
            ${plant.photoUrl ? `
                <div class="plant-photo">
                    <img src="${plant.photoUrl}" alt="${plant.name}">
                </div>
            ` : ''}
            <div class="plant-actions">
                <button class="btn btn-primary plant-details-btn" data-plant-id="${plant.id}">Plant details</button>
                <button class="btn btn-danger plant-delete-btn" data-plant-id="${plant.id}">Delete my plant</button>
            </div>
        `;
        
        // Add event listeners
        const detailsBtn = plantElement.querySelector('.plant-details-btn');
        detailsBtn.addEventListener('click', () => {
            if (typeof PlantDetails !== 'undefined') {
                PlantDetails.openDetailsModal(plant.id);
            }
        });
        
        const deleteBtn = plantElement.querySelector('.plant-delete-btn');
        deleteBtn.addEventListener('click', () => confirmDeletePlant(plant.id, plant.name));
        
        return plantElement;
    };
    
    /**
     * Confirm and handle plant deletion
     * @param {Number} plantId - Plant ID
     * @param {String} plantName - Plant name for confirmation message
     */
    const confirmDeletePlant = (plantId, plantName) => {
        if (confirm(`Are you sure you want to delete ${plantName}? This action cannot be undone.`)) {
            deletePlant(plantId);
        }
    };
    
    /**
     * Delete a plant
     * @param {Number} plantId - Plant ID
     */
    const deletePlant = async (plantId) => {
        try {
            await API.deletePlant(plantId);
            
            // Reload plants
            loadPlants();
        } catch (error) {
            console.error('Error deleting plant:', error);
            alert('Error deleting plant. Please try again.');
        }
    };
    
    /**
     * Set up event listeners for global buttons
     * @param {String} addBtnId - ID of the add plant button
     */
    const setupEventListeners = (addBtnId) => {
        const addBtn = document.getElementById(addBtnId);
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (typeof PlantDetails !== 'undefined') {
                    PlantDetails.openNewPlantModal();
                }
            });
        }
    };
    
    // Public API
    return {
        initialize,
        loadPlants,
        setupEventListeners
    };
})();
