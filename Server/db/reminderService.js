/**
 * Service layer for plant reminder-related database operations
 */

/**
 * Get all reminders for a specific plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Array>} Array of reminder objects
 */
const getPlantReminders = async (pool, plantId, userId) => {
    // First verify the plant belongs to the user
    const [plant] = await pool.query(
        'SELECT * FROM user_plants WHERE user_plant_id = ? AND user_id = ? AND is_deleted = 0',
        [plantId, userId]
    );
    
    if (plant.length === 0) {
        return null; // Plant not found or doesn't belong to user
    }
    
    const [reminders] = await pool.query(`
        SELECT 
            reminder_id as id,
            reminder_type as type,
            start_date as startDate,
            interval_days as intervalDays,
            next_reminder as nextReminder,
            last_completed as lastCompleted,
            notes,
            is_active as isActive
        FROM plant_reminders
        WHERE user_plant_id = ? AND is_active = 1
        ORDER BY next_reminder ASC
    `, [plantId]);
    
    return reminders;
};

/**
 * Create or update a reminder for a plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Object} reminderData - Reminder data
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Created/updated reminder
 */
const saveReminder = async (pool, plantId, reminderData, userId) => {
    const { type, intervalDays, startDate, notes } = reminderData;
    
    // First verify the plant belongs to the user
    const [plant] = await pool.query(
        'SELECT * FROM user_plants WHERE user_plant_id = ? AND user_id = ? AND is_deleted = 0',
        [plantId, userId]
    );
    
    if (plant.length === 0) {
        return null; // Plant not found or doesn't belong to user
    }
    
    // Calculate next reminder date
    const nextReminder = new Date(startDate);
    nextReminder.setDate(nextReminder.getDate() + parseInt(intervalDays));
    const nextReminderStr = nextReminder.toISOString().split('T')[0];
    
    // Check if a reminder of this type already exists for this plant
    const [existingReminders] = await pool.query(
        'SELECT * FROM plant_reminders WHERE user_plant_id = ? AND reminder_type = ? AND is_active = 1',
        [plantId, type]
    );
    
    let result;
    if (existingReminders.length > 0) {
        // Update existing reminder
        const reminderId = existingReminders[0].reminder_id;
        
        await pool.query(
            `UPDATE plant_reminders 
             SET interval_days = ?, 
                 start_date = ?, 
                 next_reminder = ?,
                 notes = ?
             WHERE reminder_id = ?`,
            [intervalDays, startDate, nextReminderStr, notes || null, reminderId]
        );
        
        [result] = await pool.query(
            'SELECT * FROM plant_reminders WHERE reminder_id = ?',
            [reminderId]
        );
    } else {
        // Create new reminder
        const [insertResult] = await pool.query(
            `INSERT INTO plant_reminders 
             (user_plant_id, reminder_type, interval_days, start_date, next_reminder, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [plantId, type, intervalDays, startDate, nextReminderStr, notes || null]
        );
        
        [result] = await pool.query(
            'SELECT * FROM plant_reminders WHERE reminder_id = ?',
            [insertResult.insertId]
        );
    }
    
    if (result.length === 0) {
        return null;
    }
    
    // Format response
    const reminder = result[0];
    return {
        id: reminder.reminder_id,
        type: reminder.reminder_type,
        startDate: reminder.start_date,
        intervalDays: reminder.interval_days,
        nextReminder: reminder.next_reminder,
        lastCompleted: reminder.last_completed,
        notes: reminder.notes,
        isActive: reminder.is_active === 1
    };
};

/**
 * Mark a reminder as completed
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} reminderId - Reminder ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated reminder
 */
const completeReminder = async (pool, reminderId, userId) => {
    // First verify the reminder is for a plant that belongs to the user
    const [reminders] = await pool.query(`
        SELECT r.* 
        FROM plant_reminders r
        JOIN user_plants up ON r.user_plant_id = up.user_plant_id
        WHERE r.reminder_id = ? AND up.user_id = ? AND up.is_deleted = 0
    `, [reminderId, userId]);
    
    if (reminders.length === 0) {
        return null; // Reminder not found or not authorized
    }
    
    const reminder = reminders[0];
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate next reminder date
    const nextReminder = new Date();
    nextReminder.setDate(nextReminder.getDate() + parseInt(reminder.interval_days));
    const nextReminderStr = nextReminder.toISOString().split('T')[0];
    
    // Update the reminder
    await pool.query(
        `UPDATE plant_reminders 
         SET last_completed = ?, 
             next_reminder = ?
         WHERE reminder_id = ?`,
        [today, nextReminderStr, reminderId]
    );
    
    // Fetch updated reminder
    const [updatedResult] = await pool.query(
        'SELECT * FROM plant_reminders WHERE reminder_id = ?',
        [reminderId]
    );
    
    if (updatedResult.length === 0) {
        return null;
    }
    
    // Format response
    const updatedReminder = updatedResult[0];
    return {
        id: updatedReminder.reminder_id,
        type: updatedReminder.reminder_type,
        startDate: updatedReminder.start_date,
        intervalDays: updatedReminder.interval_days,
        nextReminder: updatedReminder.next_reminder,
        lastCompleted: updatedReminder.last_completed,
        notes: updatedReminder.notes,
        isActive: updatedReminder.is_active === 1
    };
};

/**
 * Delete a reminder
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} reminderId - Reminder ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Boolean>} True if successful, false if not found/unauthorized
 */
const deleteReminder = async (pool, reminderId, userId) => {
    // First verify the reminder is for a plant that belongs to the user
    const [reminders] = await pool.query(`
        SELECT r.* 
        FROM plant_reminders r
        JOIN user_plants up ON r.user_plant_id = up.user_plant_id
        WHERE r.reminder_id = ? AND up.user_id = ? AND up.is_deleted = 0
    `, [reminderId, userId]);
    
    if (reminders.length === 0) {
        return false; // Reminder not found or not authorized
    }
    
    // Soft delete by setting is_active to 0
    const [result] = await pool.query(
        'UPDATE plant_reminders SET is_active = 0 WHERE reminder_id = ?',
        [reminderId]
    );
    
    return result.affectedRows > 0;
};

/**
 * Get all upcoming reminders for a user
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} userId - User ID
 * @param {Number} daysAhead - Number of days to look ahead (default: 7)
 * @returns {Promise<Array>} Array of upcoming reminder objects
 */
const getUpcomingReminders = async (pool, userId, daysAhead = 7) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate the future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const [reminders] = await pool.query(`
        SELECT 
            r.reminder_id as id,
            r.reminder_type as type,
            r.next_reminder as nextReminder,
            r.interval_days as intervalDays,
            r.notes,
            up.user_plant_id as plantId,
            ap.plant_cultivar as plantName,
            ap.plant_species as plantSpecies
        FROM plant_reminders r
        JOIN user_plants up ON r.user_plant_id = up.user_plant_id
        JOIN all_plants ap ON up.plant_id = ap.plant_id
        WHERE up.user_id = ? 
          AND up.is_deleted = 0
          AND r.is_active = 1
          AND r.next_reminder BETWEEN ? AND ?
        ORDER BY r.next_reminder ASC
    `, [userId, today, futureDateStr]);
    
    return reminders;
};

module.exports = {
    getPlantReminders,
    saveReminder,
    completeReminder,
    deleteReminder,
    getUpcomingReminders
};
