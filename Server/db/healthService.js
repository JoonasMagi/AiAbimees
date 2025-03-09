/**
 * Service layer for plant health-related database operations
 */

/**
 * Get all health remarks for a specific plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Array>} Array of health remark objects
 */
const getPlantHealthRemarks = async (pool, plantId, userId) => {
    // First verify the plant belongs to the user
    const [plant] = await pool.query(
        'SELECT * FROM user_plants WHERE user_plant_id = ? AND user_id = ? AND is_deleted = 0',
        [plantId, userId]
    );
    
    if (plant.length === 0) {
        return null; // Plant not found or doesn't belong to user
    }
    
    const [remarks] = await pool.query(`
        SELECT 
            health_id as id,
            remarks,
            created_at as createdAt
        FROM plant_health
        WHERE user_plant_id = ?
        ORDER BY created_at DESC
    `, [plantId]);
    
    return remarks;
};

/**
 * Add a health remark for a plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {String} remarks - Health remarks text
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Created health remark
 */
const addHealthRemark = async (pool, plantId, remarks, userId) => {
    // First verify the plant belongs to the user
    const [plant] = await pool.query(
        'SELECT * FROM user_plants WHERE user_plant_id = ? AND user_id = ? AND is_deleted = 0',
        [plantId, userId]
    );
    
    if (plant.length === 0) {
        return null; // Plant not found or doesn't belong to user
    }
    
    const [insertResult] = await pool.query(
        'INSERT INTO plant_health (user_plant_id, remarks) VALUES (?, ?)',
        [plantId, remarks]
    );
    
    const [result] = await pool.query(
        'SELECT health_id as id, remarks, created_at as createdAt FROM plant_health WHERE health_id = ?',
        [insertResult.insertId]
    );
    
    return result.length > 0 ? result[0] : null;
};

/**
 * Update a health remark
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} remarkId - Health remark ID
 * @param {String} remarks - Updated health remarks text
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated health remark or null if not found/unauthorized
 */
const updateHealthRemark = async (pool, remarkId, remarks, userId) => {
    // First verify the health remark is for a plant that belongs to the user
    const [healthRemarks] = await pool.query(`
        SELECT h.*
        FROM plant_health h
        JOIN user_plants up ON h.user_plant_id = up.user_plant_id
        WHERE h.health_id = ? AND up.user_id = ? AND up.is_deleted = 0
    `, [remarkId, userId]);
    
    if (healthRemarks.length === 0) {
        return null; // Health remark not found or not authorized
    }
    
    // Update the remark
    await pool.query(
        'UPDATE plant_health SET remarks = ? WHERE health_id = ?',
        [remarks, remarkId]
    );
    
    // Fetch the updated remark
    const [result] = await pool.query(
        'SELECT health_id as id, remarks, created_at as createdAt FROM plant_health WHERE health_id = ?',
        [remarkId]
    );
    
    return result.length > 0 ? result[0] : null;
};

/**
 * Delete a health remark
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} remarkId - Health remark ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Boolean>} True if successful, false if not found/unauthorized
 */
const deleteHealthRemark = async (pool, remarkId, userId) => {
    // First verify the health remark is for a plant that belongs to the user
    const [healthRemarks] = await pool.query(`
        SELECT h.*
        FROM plant_health h
        JOIN user_plants up ON h.user_plant_id = up.user_plant_id
        WHERE h.health_id = ? AND up.user_id = ? AND up.is_deleted = 0
    `, [remarkId, userId]);
    
    if (healthRemarks.length === 0) {
        return false; // Health remark not found or not authorized
    }
    
    // Delete the remark
    const [result] = await pool.query(
        'DELETE FROM plant_health WHERE health_id = ?',
        [remarkId]
    );
    
    return result.affectedRows > 0;
};

/**
 * Get the latest health remark for a plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Number} userId - User ID (for authorization)
 * @returns {Promise<Object>} Latest health remark or null if none exists
 */
const getLatestHealthRemark = async (pool, plantId, userId) => {
    // First verify the plant belongs to the user
    const [plant] = await pool.query(
        'SELECT * FROM user_plants WHERE user_plant_id = ? AND user_id = ? AND is_deleted = 0',
        [plantId, userId]
    );
    
    if (plant.length === 0) {
        return null; // Plant not found or doesn't belong to user
    }
    
    const [remarks] = await pool.query(`
        SELECT 
            health_id as id,
            remarks,
            created_at as createdAt
        FROM plant_health
        WHERE user_plant_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    `, [plantId]);
    
    return remarks.length > 0 ? remarks[0] : null;
};

module.exports = {
    getPlantHealthRemarks,
    addHealthRemark,
    updateHealthRemark,
    deleteHealthRemark,
    getLatestHealthRemark
};
