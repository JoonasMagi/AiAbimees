/**
 * API Service Module
 * Handles all API calls to the backend
 */
const API = (function() {
    /**
     * Handles fetch errors and returns the response as JSON
     * @param {Response} response - Fetch response
     * @returns {Promise} JSON response or throws error
     */
    const handleResponse = async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.message || 'Network error');
            error.status = response.status;
            error.data = errorData;
            throw error;
        }
        return response.json();
    };

    /**
     * Get CSRF token from cookies
     * @returns {string} CSRF token
     */
    const getCSRFToken = () => {
        return document.cookie.split('; ')
            .find(row => row.startsWith('XSRF-TOKEN='))
            ?.split('=')[1];
    };

    /**
     * Fetch options for POST/PUT/DELETE requests
     * @param {Object} data - Request body data
     * @returns {Object} Fetch options
     */
    const getOptions = (method, data = null) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCSRFToken()
            },
            credentials: 'same-origin'
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        return options;
    };

    // Authentication methods
    
    /**
     * Sign in user with provided credentials
     * @param {Object} credentials - Username and password
     * @returns {Promise} Sign in result
     */
    const signIn = async (credentials) => {
        const response = await fetch('/signin', getOptions('POST', credentials));
        return handleResponse(response);
    };
    
    /**
     * Sign up new user
     * @param {Object} userData - Username and password
     * @returns {Promise} Sign up result
     */
    const signUp = async (userData) => {
        const response = await fetch('/signup', getOptions('POST', userData));
        return handleResponse(response);
    };
    
    /**
     * Log out current user
     * @returns {Promise} Logout result
     */
    const logOut = async () => {
        const response = await fetch('/logout', getOptions('POST'));
        return handleResponse(response);
    };

    // Plant-related methods
    
    /**
     * Get all plants for current user
     * @returns {Promise<Array>} Array of plants
     */
    const getPlants = async () => {
        const response = await fetch('/api/plants');
        return handleResponse(response);
    };
    
    /**
     * Get a specific plant by ID
     * @param {Number} plantId - Plant ID
     * @returns {Promise<Object>} Plant object
     */
    const getPlant = async (plantId) => {
        const response = await fetch(`/api/plants/${plantId}`);
        return handleResponse(response);
    };
    
    /**
     * Add a new plant
     * @param {Object} plantData - Form data with plant details
     * @returns {Promise<Object>} New plant
     */
    const addPlant = async (formData) => {
        // For file uploads, we can't use JSON
        const csrfToken = getCSRFToken();
        formData.append('_csrf', csrfToken);
        
        const options = {
            method: 'POST',
            headers: {
                'X-CSRF-Token': csrfToken
            },
            credentials: 'same-origin',
            body: formData
        };
        
        const response = await fetch('/api/plants', options);
        return handleResponse(response);
    };
    
    /**
     * Update an existing plant
     * @param {Number} plantId - Plant ID
     * @param {Object} formData - Form data with updated plant details
     * @returns {Promise<Object>} Updated plant
     */
    const updatePlant = async (plantId, formData) => {
        // For file uploads, we can't use JSON
        const csrfToken = getCSRFToken();
        formData.append('_csrf', csrfToken);
        
        const options = {
            method: 'PUT',
            headers: {
                'X-CSRF-Token': csrfToken
            },
            credentials: 'same-origin',
            body: formData
        };
        
        const response = await fetch(`/api/plants/${plantId}`, options);
        return handleResponse(response);
    };
    
    /**
     * Delete a plant
     * @param {Number} plantId - Plant ID
     * @returns {Promise} Delete result
     */
    const deletePlant = async (plantId) => {
        const response = await fetch(`/api/plants/${plantId}`, getOptions('DELETE'));
        return handleResponse(response);
    };

    // Reminder-related methods
    
    /**
     * Get all reminders for a plant
     * @param {Number} plantId - Plant ID
     * @returns {Promise<Array>} Array of reminders
     */
    const getPlantReminders = async (plantId) => {
        const response = await fetch(`/api/plants/${plantId}/reminders`);
        return handleResponse(response);
    };
    
    /**
     * Save reminder for a plant
     * @param {Number} plantId - Plant ID
     * @param {Object} reminderData - Reminder data
     * @returns {Promise<Object>} Saved reminder
     */
    const saveReminder = async (plantId, reminderData) => {
        const response = await fetch(`/api/plants/${plantId}/reminders`, 
            getOptions('POST', reminderData));
        return handleResponse(response);
    };
    
    /**
     * Mark a reminder as completed
     * @param {Number} reminderId - Reminder ID
     * @returns {Promise<Object>} Updated reminder
     */
    const completeReminder = async (reminderId) => {
        const response = await fetch(`/api/reminders/${reminderId}/complete`, 
            getOptions('PUT'));
        return handleResponse(response);
    };
    
    /**
     * Delete a reminder
     * @param {Number} reminderId - Reminder ID
     * @returns {Promise} Delete result
     */
    const deleteReminder = async (reminderId) => {
        const response = await fetch(`/api/reminders/${reminderId}`, 
            getOptions('DELETE'));
        return handleResponse(response);
    };
    
    /**
     * Get upcoming reminders
     * @param {Number} days - Number of days to look ahead
     * @returns {Promise<Array>} Array of upcoming reminders
     */
    const getUpcomingReminders = async (days = 7) => {
        const response = await fetch(`/api/reminders/upcoming?days=${days}`);
        return handleResponse(response);
    };

    // Plant health-related methods
    
    /**
     * Get health remarks for a plant
     * @param {Number} plantId - Plant ID
     * @returns {Promise<Array>} Array of health remarks
     */
    const getPlantHealthRemarks = async (plantId) => {
        const response = await fetch(`/api/plants/${plantId}/health`);
        return handleResponse(response);
    };
    
    /**
     * Add health remark for a plant
     * @param {Number} plantId - Plant ID
     * @param {String} remarks - Health remarks text
     * @returns {Promise<Object>} Added health remark
     */
    const addHealthRemark = async (plantId, remarks) => {
        const response = await fetch(`/api/plants/${plantId}/health`, 
            getOptions('POST', { remarks }));
        return handleResponse(response);
    };
    
    /**
     * Get latest health remark for a plant
     * @param {Number} plantId - Plant ID
     * @returns {Promise<Object>} Latest health remark
     */
    const getLatestHealthRemark = async (plantId) => {
        const response = await fetch(`/api/plants/${plantId}/health/latest`);
        return handleResponse(response);
    };

    // Public API
    return {
        // Auth
        signIn,
        signUp,
        logOut,
        
        // Plants
        getPlants,
        getPlant,
        addPlant,
        updatePlant,
        deletePlant,
        
        // Reminders
        getPlantReminders,
        saveReminder,
        completeReminder,
        deleteReminder,
        getUpcomingReminders,
        
        // Health
        getPlantHealthRemarks,
        addHealthRemark,
        getLatestHealthRemark
    };
})();
