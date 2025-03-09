/**
 * Modal Component
 * Provides reusable modal functionality for the application
 */
const Modal = (function() {
    /**
     * Create a new modal
     * @param {String} id - Modal ID
     * @param {String} title - Modal title
     * @returns {HTMLElement} Modal element
     */
    const createModal = (id, title) => {
        // Check if modal already exists
        let modal = document.getElementById(id);
        if (modal) {
            return modal;
        }
        
        // Create modal HTML
        const modalHtml = `
            <div id="${id}" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${title}</h2>
                        <span class="close">&times;</span>
                    </div>
                    <div class="modal-body"></div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                        <button class="btn btn-primary" data-action="save">Save</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to the DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        modal = document.getElementById(id);
        
        // Set up event handlers
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => closeModal(id));
        
        const cancelBtn = modal.querySelector('[data-action="cancel"]');
        cancelBtn.addEventListener('click', () => closeModal(id));
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(id);
            }
        });
        
        return modal;
    };
    
    /**
     * Open a modal
     * @param {String} id - Modal ID
     */
    const showModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'block';
        }
    };
    
    /**
     * Close a modal
     * @param {String} id - Modal ID
     */
    const closeModal = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            
            // Clear any form validation errors
            const formElements = modal.querySelectorAll('.error');
            formElements.forEach(el => {
                el.classList.remove('error');
            });
            
            const errorMessages = modal.querySelectorAll('.error-message');
            errorMessages.forEach(el => {
                el.remove();
            });
        }
    };
    
    /**
     * Set modal content
     * @param {String} id - Modal ID
     * @param {String} content - HTML content for modal body
     */
    const setModalContent = (id, content) => {
        const modal = document.getElementById(id);
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = content;
        }
    };
    
    /**
     * Set save button handler
     * @param {String} id - Modal ID
     * @param {Function} handler - Click event handler
     */
    const setModalSaveHandler = (id, handler) => {
        const modal = document.getElementById(id);
        if (modal) {
            const saveBtn = modal.querySelector('[data-action="save"]');
            
            // Remove existing event listeners
            const newSaveBtn = saveBtn.cloneNode(true);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            
            // Add new event listener
            newSaveBtn.addEventListener('click', handler);
        }
    };
    
    /**
     * Show validation error for a form field
     * @param {String} id - Modal ID
     * @param {String} fieldId - Field ID
     * @param {String} message - Error message
     */
    const showFieldError = (id, fieldId, message) => {
        const modal = document.getElementById(id);
        if (modal) {
            const field = modal.querySelector(`#${fieldId}`);
            if (field) {
                field.classList.add('error');
                
                // Remove any existing error message
                const existingError = field.parentNode.querySelector('.error-message');
                if (existingError) {
                    existingError.remove();
                }
                
                // Add error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = message;
                field.parentNode.insertBefore(errorDiv, field.nextSibling);
            }
        }
    };
    
    /**
     * Clear all validation errors
     * @param {String} id - Modal ID
     */
    const clearErrors = (id) => {
        const modal = document.getElementById(id);
        if (modal) {
            const formElements = modal.querySelectorAll('.error');
            formElements.forEach(el => {
                el.classList.remove('error');
            });
            
            const errorMessages = modal.querySelectorAll('.error-message');
            errorMessages.forEach(el => {
                el.remove();
            });
        }
    };
    
    // Public API
    return {
        createModal,
        showModal,
        closeModal,
        setModalContent,
        setModalSaveHandler,
        showFieldError,
        clearErrors
    };
})();
