/**
 * Reminders Component
 * Manages and displays plant care reminders
 */
const Reminders = (function() {
    // DOM element references
    let reminderContainer;
    let reminderToggle;
    let loadingIndicator;
    let noRemindersMessage;
    
    /**
     * Initialize the component
     * @param {String} containerId - ID of the container element
     * @param {String} toggleId - ID of the toggle button
     * @param {String} loadingId - ID of the loading indicator element
     * @param {String} noRemindersId - ID of the no reminders message element
     */
    const initialize = (containerId, toggleId, loadingId, noRemindersId) => {
        reminderContainer = document.getElementById(containerId);
        reminderToggle = document.getElementById(toggleId);
        loadingIndicator = document.getElementById(loadingId);
        noRemindersMessage = document.getElementById(noRemindersId);
        
        if (!reminderContainer) {
            console.error('Reminder container element not found');
            return;
        }
        
        // Set up toggle event listener
        if (reminderToggle) {
            reminderToggle.addEventListener('click', toggleReminders);
        }
        
        // Load reminders if container is visible
        if (reminderContainer.style.display !== 'none') {
            loadReminders();
        }
    };
    
    /**
     * Toggle reminder panel visibility
     */
    const toggleReminders = () => {
        if (!reminderContainer) return;
        
        const isVisible = reminderContainer.style.display !== 'none';
        
        if (isVisible) {
            reminderContainer.style.display = 'none';
            if (reminderToggle) {
                reminderToggle.textContent = 'Show Reminders';
            }
        } else {
            reminderContainer.style.display = 'block';
            if (reminderToggle) {
                reminderToggle.textContent = 'Hide Reminders';
            }
            loadReminders();
        }
    };
    
    /**
     * Load reminders from the API
     * @param {Number} days - Number of days to look ahead
     */
    const loadReminders = async (days = 7) => {
        try {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'block';
            }
            
            if (noRemindersMessage) {
                noRemindersMessage.style.display = 'none';
            }
            
            const reminders = await API.getUpcomingReminders(days);
            renderReminders(reminders);
            
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            if (noRemindersMessage && reminders.length === 0) {
                noRemindersMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading reminders:', error);
            
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            if (reminderContainer) {
                reminderContainer.innerHTML = '<div class="error-message">Error loading reminders. Please try again.</div>';
            }
        }
    };
    
    /**
     * Render reminders in the container
     * @param {Array} reminders - Array of reminder objects
     */
    const renderReminders = (reminders) => {
        if (!reminderContainer) return;
        
        // Clear container
        reminderContainer.innerHTML = '';
        
        if (reminders.length === 0) {
            if (noRemindersMessage) {
                noRemindersMessage.style.display = 'block';
            } else {
                reminderContainer.innerHTML = '<div class="no-data-message">No upcoming reminders.</div>';
            }
            return;
        }
        
        // Group reminders by date
        const groupedReminders = groupRemindersByDate(reminders);
        
        // Create reminders list
        const remindersList = document.createElement('div');
        remindersList.className = 'reminders-list';
        
        // Add each date group
        Object.keys(groupedReminders).sort().forEach(date => {
            const dateGroup = createDateGroup(date, groupedReminders[date]);
            remindersList.appendChild(dateGroup);
        });
        
        reminderContainer.appendChild(remindersList);
    };
    
    /**
     * Group reminders by date
     * @param {Array} reminders - Array of reminder objects
     * @returns {Object} Reminders grouped by date
     */
    const groupRemindersByDate = (reminders) => {
        const grouped = {};
        
        reminders.forEach(reminder => {
            const date = reminder.nextReminder;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(reminder);
        });
        
        return grouped;
    };
    
    /**
     * Create a date group element
     * @param {String} date - Date string
     * @param {Array} reminders - Reminders for this date
     * @returns {HTMLElement} Date group element
     */
    const createDateGroup = (date, reminders) => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'reminder-date-group';
        
        // Format date
        const formattedDate = formatReminderDate(date);
        
        // Check if date is today
        const isToday = new Date(date).toDateString() === new Date().toDateString();
        const dateClass = isToday ? 'reminder-date today' : 'reminder-date';
        
        // Create date header
        dateGroup.innerHTML = `<h3 class="${dateClass}">${formattedDate}</h3>`;
        
        // Create reminders for this date
        const reminderItems = document.createElement('div');
        reminderItems.className = 'reminder-items';
        
        reminders.forEach(reminder => {
            const reminderItem = createReminderItem(reminder);
            reminderItems.appendChild(reminderItem);
        });
        
        dateGroup.appendChild(reminderItems);
        return dateGroup;
    };
    
    /**
     * Create a reminder item element
     * @param {Object} reminder - Reminder object
     * @returns {HTMLElement} Reminder item element
     */
    const createReminderItem = (reminder) => {
        const reminderItem = document.createElement('div');
        reminderItem.className = 'reminder-item';
        reminderItem.dataset.reminderId = reminder.id;
        
        // Format reminder type
        const reminderType = formatReminderType(reminder.type);
        
        // Create reminder HTML
        reminderItem.innerHTML = `
            <div class="reminder-info">
                <div class="reminder-plant">${reminder.plantName} (${reminder.plantSpecies})</div>
                <div class="reminder-type ${reminder.type}">${reminderType}</div>
                ${reminder.notes ? `<div class="reminder-notes">${reminder.notes}</div>` : ''}
            </div>
            <div class="reminder-actions">
                <button class="btn btn-sm btn-success reminder-complete-btn" data-reminder-id="${reminder.id}">Mark Done</button>
            </div>
        `;
        
        // Add event listener for complete button
        const completeBtn = reminderItem.querySelector('.reminder-complete-btn');
        completeBtn.addEventListener('click', () => completeReminder(reminder.id));
        
        return reminderItem;
    };
    
    /**
     * Format reminder date
     * @param {String} dateString - Date string from API
     * @returns {String} Formatted date
     */
    const formatReminderDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            // Format as day of week + date
            const options = { weekday: 'long', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        }
    };
    
    /**
     * Format reminder type
     * @param {String} type - Reminder type
     * @returns {String} Formatted type
     */
    const formatReminderType = (type) => {
        switch (type) {
            case 'watering':
                return 'Watering';
            case 'fertilizing':
                return 'Fertilizing';
            case 'harvesting':
                return 'Harvesting';
            default:
                return type.charAt(0).toUpperCase() + type.slice(1);
        }
    };
    
    /**
     * Mark a reminder as complete
     * @param {Number} reminderId - Reminder ID
     */
    const completeReminder = async (reminderId) => {
        try {
            await API.completeReminder(reminderId);
            
            // Reload reminders
            loadReminders();
        } catch (error) {
            console.error('Error completing reminder:', error);
            alert('Error marking reminder as complete. Please try again.');
        }
    };
    
    // Public API
    return {
        initialize,
        loadReminders,
        toggleReminders
    };
})();
