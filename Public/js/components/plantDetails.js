/**
 * Plant Details Component
 * Handles the display and management of plant details, including reminders and health remarks
 */
const PlantDetails = (function() {
    // Constants
    const MODAL_ID = 'plant-details-modal';
    
    /**
     * Initialize the component
     */
    const initialize = () => {
        Modal.createModal(MODAL_ID, 'Plant Details');
    };
    
    /**
     * Open the plant details modal for a specific plant
     * @param {Number} plantId - Plant ID
     */
    const openDetailsModal = async (plantId) => {
        try {
            // Fetch plant data
            const plant = await API.getPlant(plantId);
            
            // Fetch plant reminders
            const reminders = await API.getPlantReminders(plantId).catch(() => []);
            
            // Fetch latest health remark
            const healthRemark = await API.getLatestHealthRemark(plantId).catch(() => null);
            
            // Format date for input field
            const plantingDate = plant.plantingTime ? new Date(plant.plantingTime).toISOString().split('T')[0] : '';
            
            // Find reminders for specific types
            const wateringReminder = reminders.find(r => r.type === 'watering') || {};
            const fertilizingReminder = reminders.find(r => r.type === 'fertilizing') || {};
            
            // Create modal content
            const content = `
                <form id="plant-details-form">
                    <div class="form-group">
                        <label for="plant-name">Plant Name (Cultivar)</label>
                        <input type="text" id="plant-name" value="${plant.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="plant-species">Species</label>
                        <input type="text" id="plant-species" value="${plant.species}" required>
                    </div>
                    <div class="form-group">
                        <label for="planting-date">Planting Date</label>
                        <input type="date" id="planting-date" value="${plantingDate}" required>
                    </div>
                    
                    <h3>Care Schedule</h3>
                    <div class="form-group">
                        <label for="watering-days">Watering (days between)</label>
                        <input type="number" id="watering-days" min="1" max="365" value="${wateringReminder.intervalDays || ''}">
                    </div>
                    <div class="form-group">
                        <label for="fertilizing-days">Fertilizing (days between)</label>
                        <input type="number" id="fertilizing-days" min="1" max="365" value="${fertilizingReminder.intervalDays || ''}">
                    </div>
                    
                    <h3>Harvest Information</h3>
                    <div class="form-group">
                        <label for="est-cropping">Estimated Days Until Cropping</label>
                        <input type="number" id="est-cropping" min="1" value="${plant.estCropping || ''}">
                    </div>
                    
                    <h3>Plant Health</h3>
                    <div class="form-group">
                        <label for="plant-remarks">Remarks</label>
                        <textarea id="plant-remarks" rows="4">${healthRemark ? healthRemark.remarks : ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="plant-photo">Photo (optional)</label>
                        <input type="file" id="plant-photo" accept="image/jpeg, image/png, image/gif">
                    </div>
                    
                    ${plant.photoUrl ? `
                        <div class="form-group">
                            <label>Current Photo</label>
                            <div class="plant-photo-preview">
                                <img src="${plant.photoUrl}" alt="${plant.name}">
                            </div>
                        </div>
                    ` : ''}
                    
                    <input type="hidden" id="plant-id" value="${plant.id}">
                </form>
            `;
            
            // Set modal content
            Modal.setModalContent(MODAL_ID, content);
            Modal.setModalSaveHandler(MODAL_ID, savePlantDetails);
            Modal.showModal(MODAL_ID);
        } catch (error) {
            console.error('Error opening plant details:', error);
            alert('Error loading plant details. Please try again.');
        }
    };
    
    /**
     * Save plant details from the modal form
     */
    const savePlantDetails = async () => {
        try {
            Modal.clearErrors(MODAL_ID);
            
            // Get form data
            const plantId = document.getElementById('plant-id').value;
            const plantName = document.getElementById('plant-name').value;
            const plantSpecies = document.getElementById('plant-species').value;
            const plantingDate = document.getElementById('planting-date').value;
            const estCropping = document.getElementById('est-cropping').value;
            const remarks = document.getElementById('plant-remarks').value;
            const wateringDays = document.getElementById('watering-days').value;
            const fertilizingDays = document.getElementById('fertilizing-days').value;
            const photoInput = document.getElementById('plant-photo');
            
            // Validate required fields
            if (!plantName) {
                Modal.showFieldError(MODAL_ID, 'plant-name', 'Plant name is required');
                return;
            }
            
            if (!plantSpecies) {
                Modal.showFieldError(MODAL_ID, 'plant-species', 'Species is required');
                return;
            }
            
            if (!plantingDate) {
                Modal.showFieldError(MODAL_ID, 'planting-date', 'Planting date is required');
                return;
            }
            
            // Create form data for plant update
            const formData = new FormData();
            formData.append('plant_cultivar', plantName);
            formData.append('plant_species', plantSpecies);
            formData.append('planting_time', plantingDate);
            
            if (estCropping) {
                formData.append('est_cropping', estCropping);
            }
            
            // Add photo if selected
            if (photoInput.files.length > 0) {
                formData.append('photo', photoInput.files[0]);
            }
            
            // Update plant
            await API.updatePlant(plantId, formData);
            
            // Save watering reminder if specified
            if (wateringDays) {
                await API.saveReminder(plantId, {
                    type: 'watering',
                    intervalDays: parseInt(wateringDays),
                    startDate: new Date().toISOString().split('T')[0]
                });
            }
            
            // Save fertilizing reminder if specified
            if (fertilizingDays) {
                await API.saveReminder(plantId, {
                    type: 'fertilizing',
                    intervalDays: parseInt(fertilizingDays),
                    startDate: new Date().toISOString().split('T')[0]
                });
            }
            
            // Save plant remarks if provided
            if (remarks && remarks.trim()) {
                await API.addHealthRemark(plantId, remarks);
            }
            
            // Close modal and refresh plant list
            Modal.closeModal(MODAL_ID);
            
            // Refresh plant list if available
            if (typeof PlantList !== 'undefined' && PlantList.loadPlants) {
                PlantList.loadPlants();
            } else {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('Error saving plant details:', error);
            alert('Error saving plant details. Please try again.');
        }
    };
    
    /**
     * Create a new plant modal
     */
    const openNewPlantModal = () => {
        // Create modal content for new plant
        const content = `
            <form id="plant-details-form">
                <div class="form-group">
                    <label for="plant-name">Plant Name (Cultivar)</label>
                    <input type="text" id="plant-name" required>
                </div>
                <div class="form-group">
                    <label for="plant-species">Species</label>
                    <input type="text" id="plant-species" required>
                </div>
                <div class="form-group">
                    <label for="planting-date">Planting Date</label>
                    <input type="date" id="planting-date" value="${new Date().toISOString().split('T')[0]}" required>
                </div>
                
                <h3>Care Schedule</h3>
                <div class="form-group">
                    <label for="watering-days">Watering (days between)</label>
                    <input type="number" id="watering-days" min="1" max="365">
                </div>
                <div class="form-group">
                    <label for="fertilizing-days">Fertilizing (days between)</label>
                    <input type="number" id="fertilizing-days" min="1" max="365">
                </div>
                
                <h3>Harvest Information</h3>
                <div class="form-group">
                    <label for="est-cropping">Estimated Days Until Cropping</label>
                    <input type="number" id="est-cropping" min="1">
                </div>
                
                <div class="form-group">
                    <label for="plant-photo">Photo (optional)</label>
                    <input type="file" id="plant-photo" accept="image/jpeg, image/png, image/gif">
                </div>
            </form>
        `;
        
        // Update modal
        Modal.createModal(MODAL_ID, 'Add New Plant');
        Modal.setModalContent(MODAL_ID, content);
        Modal.setModalSaveHandler(MODAL_ID, saveNewPlant);
        Modal.showModal(MODAL_ID);
    };
    
    /**
     * Save a new plant from the modal form
     */
    const saveNewPlant = async () => {
        try {
            Modal.clearErrors(MODAL_ID);
            
            // Get form data
            const plantName = document.getElementById('plant-name').value;
            const plantSpecies = document.getElementById('plant-species').value;
            const plantingDate = document.getElementById('planting-date').value;
            const estCropping = document.getElementById('est-cropping').value;
            const wateringDays = document.getElementById('watering-days').value;
            const fertilizingDays = document.getElementById('fertilizing-days').value;
            const photoInput = document.getElementById('plant-photo');
            
            // Validate required fields
            if (!plantName) {
                Modal.showFieldError(MODAL_ID, 'plant-name', 'Plant name is required');
                return;
            }
            
            if (!plantSpecies) {
                Modal.showFieldError(MODAL_ID, 'plant-species', 'Species is required');
                return;
            }
            
            if (!plantingDate) {
                Modal.showFieldError(MODAL_ID, 'planting-date', 'Planting date is required');
                return;
            }
            
            // Create form data for new plant
            const formData = new FormData();
            formData.append('plant_cultivar', plantName);
            formData.append('plant_species', plantSpecies);
            formData.append('planting_time', plantingDate);
            
            if (estCropping) {
                formData.append('est_cropping', estCropping);
            }
            
            // Add photo if selected
            if (photoInput.files.length > 0) {
                formData.append('photo', photoInput.files[0]);
            }
            
            // Create plant
            const result = await API.addPlant(formData);
            const plantId = result.plant.id;
            
            // Save watering reminder if specified
            if (wateringDays) {
                await API.saveReminder(plantId, {
                    type: 'watering',
                    intervalDays: parseInt(wateringDays),
                    startDate: new Date().toISOString().split('T')[0]
                });
            }
            
            // Save fertilizing reminder if specified
            if (fertilizingDays) {
                await API.saveReminder(plantId, {
                    type: 'fertilizing',
                    intervalDays: parseInt(fertilizingDays),
                    startDate: new Date().toISOString().split('T')[0]
                });
            }
            
            // Close modal and refresh plant list
            Modal.closeModal(MODAL_ID);
            
            // Refresh plant list if available
            if (typeof PlantList !== 'undefined' && PlantList.loadPlants) {
                PlantList.loadPlants();
            } else {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('Error adding new plant:', error);
            alert('Error adding new plant. Please try again.');
        }
    };
    
    // Public API
    return {
        initialize,
        openDetailsModal,
        openNewPlantModal
    };
})();
