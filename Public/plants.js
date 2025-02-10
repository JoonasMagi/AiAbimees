document.addEventListener('DOMContentLoaded', () => {
    window.plantManager = new PlantManager();
});

class PlantManager {
    constructor() {
        // Initialize DOM elements
        this.plantsList = document.getElementById('plants-list');
        this.modal = document.getElementById('universal-modal');
        this.modalForm = document.getElementById('modal-form');
        this.modalTitle = document.getElementById('modal-title');
        this.modalClose = document.getElementById('modal-close');
        this.submitButton = document.getElementById('modal-submit');
        this.loadingState = document.getElementById('loading-state');
        this.emptyState = document.getElementById('empty-state');
        this.errorMessage = document.getElementById('error-message');

        // Keep track of current plant being edited
        this.currentPlantId = null;

        // Bind methods to this
        this.handlePlantClick = this.handlePlantClick.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);

        // Initialize event listeners and load plants
        this.setupEventListeners();
        this.loadPlants().catch(error => {
            console.error('Error during initial plant load:', error);
            this.showError('Failed to load plants. Please refresh the page.');
        });
    }

    setupEventListeners() {
        const newPlantBtn = document.getElementById('new-plant-btn');
        const logoutBtn = document.getElementById('logout-btn');

        if (newPlantBtn) {
            newPlantBtn.addEventListener('click', () => this.openModal('addPlant'));
        }
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
        if (this.modalForm) {
            this.modalForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        if (this.modalClose) {
            this.modalClose.addEventListener('click', () => this.closeModal());
        }

        // Add escape key listener for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.closeModal();
            }
        });
    }

    handlePlantClick(event) {
        const plantItem = event.currentTarget;
        if (!plantItem) return;

        const plantId = plantItem.dataset.id;
        if (plantId) {
            this.openModal('editPlant', plantId);
        }
    }

    openModal(action, plantId = null) {
        if (!this.modal || !this.modalForm) return;

        this.modal.classList.remove('hidden');
        const formFields = document.getElementById('form-fields');
        if (!formFields) return;

        this.currentPlantId = plantId;
        const isEdit = action === 'editPlant';

        this.modalTitle.textContent = isEdit ? 'Edit Plant' : 'Add New Plant';
        this.submitButton.textContent = isEdit ? 'Save Changes' : 'Add Plant';

        const today = new Date().toISOString().split('T')[0];
        formFields.innerHTML = `
            <div class="form-group">
                <label for="plant-name">Plant Name (Cultivar)</label>
                <input type="text" id="plant-name" name="plant_cultivar" 
                       required maxlength="191" class="form-input">
            </div>
            <div class="form-group">
                <label for="plant-species">Species</label>
                <input type="text" id="plant-species" name="plant_species" 
                       required maxlength="191" class="form-input">
            </div>
            <div class="form-group">
                <label for="planting-time">Planting Time</label>
                <input type="date" id="planting-time" name="planting_time" 
                       required max="${today}" class="form-input">
            </div>
            <div class="form-group">
                <label for="est-cropping">Estimated Days Until Cropping</label>
                <input type="number" id="est-cropping" name="est_cropping" 
                       min="1" max="255" class="form-input">
            </div>
            <div class="form-group">
                <label for="photo">Plant Photo (Max 5MB)</label>
                <input type="file" id="photo" name="photo" accept="image/*" class="form-input">
            </div>
            ${isEdit ? `
            <div class="form-group delete-section">
                <button type="button" id="delete-plant-btn" class="delete-btn">Delete Plant</button>
            </div>
            ` : ''}
        `;

        // Add delete button event listener if in edit mode
        if (isEdit) {
            const deleteBtn = document.getElementById('delete-plant-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', this.handleDeleteClick);
            }
            this.loadPlantData(plantId);
        }
    }

    async loadPlantData(plantId) {
        try {
            const plants = document.querySelectorAll('.plant-item');
            const plant = Array.from(plants).find(p => p.dataset.id === plantId);

            if (!plant) return;

            const name = plant.querySelector('.plant-name').textContent;
            const species = plant.querySelector('.plant-species').textContent;
            const plantingTime = plant.querySelector('.plant-date').textContent.replace('Planted: ', '');
            const estCropping = plant.querySelector('.plant-harvest')?.textContent.match(/\d+/)?.[0];

            document.getElementById('plant-name').value = name;
            document.getElementById('plant-species').value = species;
            document.getElementById('planting-time').value = new Date(plantingTime).toISOString().split('T')[0];
            if (estCropping) {
                document.getElementById('est-cropping').value = estCropping;
            }
        } catch (error) {
            console.error('Error loading plant data:', error);
            this.showError('Error loading plant data');
        }
    }

    closeModal() {
        if (this.modal) {
            this.modal.classList.add('hidden');
        }
        if (this.modalForm) {
            this.modalForm.reset();
        }
        this.currentPlantId = null;
        this.clearError();
    }

    clearError() {
        if (this.errorMessage) {
            this.errorMessage.textContent = '';
            this.errorMessage.style.display = 'none';
        }
    }

    showError(message) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    showLoading() {
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.plantsList) this.plantsList.classList.add('hidden');
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.plantsList) this.plantsList.classList.remove('hidden');
    }

    async loadPlants() {
        this.showLoading();
        try {
            const token = this.getCsrfToken();
            if (!token) {
                throw new Error('Security token not found. Please refresh the page.');
            }

            const response = await fetch('/api/plants', {
                headers: {
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const plants = await response.json();
            this.renderPlants(plants);
        } catch (error) {
            console.error('Error loading plants:', error);
            this.showError('Failed to load plants. Please refresh the page.');
        } finally {
            this.hideLoading();
        }
    }

    renderPlants(plants) {
        if (!this.plantsList) return;

        if (!plants.length) {
            if (this.emptyState) this.emptyState.classList.remove('hidden');
            this.plantsList.innerHTML = '';
            return;
        }

        if (this.emptyState) this.emptyState.classList.add('hidden');
        this.plantsList.innerHTML = plants.map(plant => `
            <div class="plant-item" data-id="${plant.id}">
                <img src="${plant.photoUrl || '/images/placeholder-plant.jpg'}" 
                     alt="${this.escapeHtml(plant.name)}" 
                     class="plant-image"
                     onerror="this.src='/images/placeholder-plant.jpg'">
                <div class="plant-info">
                    <h3 class="plant-name">${this.escapeHtml(plant.name)}</h3>
                    <p class="plant-species">${this.escapeHtml(plant.species)}</p>
                    <p class="plant-date">Planted: ${new Date(plant.plantingTime).toLocaleDateString()}</p>
                    ${plant.estCropping ?
            `<p class="plant-harvest">Expected harvest in: ${plant.estCropping} days</p>`
            : ''}
                </div>
            </div>
        `).join('');

        // Add click event listeners to plant items
        const plantItems = this.plantsList.querySelectorAll('.plant-item');
        plantItems.forEach(item => {
            item.addEventListener('click', this.handlePlantClick);
        });
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        if (!this.modalForm) return;

        const formData = new FormData(this.modalForm);

        // Validate file size
        const photoFile = formData.get('photo');
        if (photoFile && photoFile.size > 5 * 1024 * 1024) {
            this.showError('Photo size must be less than 5MB');
            return;
        }

        if (this.submitButton) this.submitButton.disabled = true;

        try {
            const token = this.getCsrfToken();
            if (!token) {
                throw new Error('Security token not found. Please refresh the page.');
            }

            const isEdit = this.currentPlantId !== null;
            const url = isEdit ? `/api/plants/${this.currentPlantId}` : '/api/plants';
            const method = isEdit ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                this.closeModal();
                await this.loadPlants();
            } else {
                throw new Error(data.message || `Failed to ${isEdit ? 'update' : 'add'} plant`);
            }
        } catch (error) {
            console.error('Error handling plant:', error);
            this.showError(error.message || 'Failed to save plant. Please try again.');
        } finally {
            if (this.submitButton) this.submitButton.disabled = false;
        }
    }

    async handleDeleteClick() {
        if (!this.currentPlantId) return;

        const plantName = document.getElementById('plant-name')?.value || 'this plant';

        if (!confirm(`Are you sure you want to delete ${plantName}?`)) return;

        try {
            const token = this.getCsrfToken();
            if (!token) {
                throw new Error('Security token not found. Please refresh the page.');
            }

            const response = await fetch(`/api/plants/${this.currentPlantId}`, {
                method: 'DELETE',
                headers: {
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Failed to delete plant');
            }

            this.closeModal();
            await this.loadPlants();
        } catch (error) {
            console.error('Error deleting plant:', error);
            this.showError(error.message || 'Failed to delete plant. Please try again.');
        }
    }

    async handleLogout() {
        try {
            const token = this.getCsrfToken();
            if (!token) {
                throw new Error('Security token not found. Please refresh the page.');
            }

            const response = await fetch('/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin'
            });

            if (response.ok) {
                window.location.href = '/';
            } else {
                const data = await response.json();
                throw new Error(data.message || 'Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showError(error.message || 'Failed to log out. Please try again.');
        }
    }

    getCsrfToken() {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='));

        if (token) {
            return decodeURIComponent(token.split('=')[1]);
        }

        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) {
            return metaToken.getAttribute('content');
        }

        console.error('CSRF token not found in cookies or meta tags');
        return null;
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}