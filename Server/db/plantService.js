/**
 * Service layer for plant-related database operations
 * Centralizes and optimizes database queries
 */

/**
 * Get all plants for a specific user
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} userId - User ID
 * @returns {Promise<Array>} Array of plant objects
 */
const getUserPlants = async (pool, userId) => {
    const [plants] = await pool.query(`
        SELECT 
            up.user_plant_id as id,
            ap.plant_cultivar as name,
            ap.plant_species as species,
            up.planting_time as plantingTime,
            up.est_cropping as estCropping,
            up.photo_url as photoUrl
        FROM user_plants up
        JOIN all_plants ap ON up.plant_id = ap.plant_id
        WHERE up.user_id = ? AND up.is_deleted = 0
        ORDER BY up.planting_time DESC
    `, [userId]);
    
    return plants;
};

/**
 * Get a single plant by ID for a specific user
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Number} userId - User ID
 * @returns {Promise<Object|null>} Plant object or null if not found
 */
const getPlantById = async (pool, plantId, userId) => {
    const [plants] = await pool.query(`
        SELECT 
            up.user_plant_id as id,
            ap.plant_cultivar as name,
            ap.plant_species as species,
            up.planting_time as plantingTime,
            up.est_cropping as estCropping,
            up.photo_url as photoUrl
        FROM user_plants up
        JOIN all_plants ap ON up.plant_id = ap.plant_id
        WHERE up.user_plant_id = ? AND up.user_id = ? AND up.is_deleted = 0
    `, [plantId, userId]);
    
    return plants.length > 0 ? plants[0] : null;
};

/**
 * Create a new plant or find existing plant type
 * 
 * @param {Object} connection - Database connection
 * @param {String} cultivar - Plant cultivar
 * @param {String} species - Plant species
 * @returns {Promise<Number>} Plant type ID
 */
const findOrCreatePlantType = async (connection, cultivar, species) => {
    // Look for an existing plant type
    const [existingPlants] = await connection.query(
        'SELECT plant_id FROM all_plants WHERE plant_cultivar = ? AND plant_species = ? AND is_deleted = 0',
        [cultivar, species]
    );

    if (existingPlants.length > 0) {
        return existingPlants[0].plant_id;
    }

    // Create a new plant type if none exists
    const [newPlantResult] = await connection.query(
        'INSERT INTO all_plants (plant_cultivar, plant_species) VALUES (?, ?)',
        [cultivar, species]
    );
    
    return newPlantResult.insertId;
};

/**
 * Add a new plant for a user
 * 
 * @param {Object} pool - Database connection pool
 * @param {Object} plantData - Plant data
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Newly created plant
 */
const addPlant = async (pool, plantData, userId) => {
    const { cultivar, species, plantingTime, estCropping, photoUrl } = plantData;
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // Find or create plant type
        const plantTypeId = await findOrCreatePlantType(connection, cultivar, species);

        // Add user's plant
        const [userPlantResult] = await connection.query(
            'INSERT INTO user_plants (user_id, plant_id, planting_time, est_cropping, photo_url) VALUES (?, ?, ?, ?, ?)',
            [userId, plantTypeId, plantingTime, estCropping || null, photoUrl]
        );

        await connection.commit();

        // Get the newly created plant
        const [newPlant] = await connection.query(`
            SELECT
                up.user_plant_id as id,
                ap.plant_cultivar as name,
                ap.plant_species as species,
                up.planting_time as plantingTime,
                up.est_cropping as estCropping,
                up.photo_url as photoUrl
            FROM user_plants up
            JOIN all_plants ap ON up.plant_id = ap.plant_id
            WHERE up.user_plant_id = ?
        `, [userPlantResult.insertId]);

        return newPlant[0];
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Update an existing plant
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Object} plantData - Plant data
 * @param {Number} userId - User ID
 * @returns {Promise<Object>} Updated plant
 */
const updatePlant = async (pool, plantId, plantData, userId) => {
    const { cultivar, species, plantingTime, estCropping, photoUrl } = plantData;
    
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // First verify the plant belongs to the user
        const [existingPlant] = await connection.query(
            'SELECT up.* FROM user_plants up WHERE up.user_plant_id = ? AND up.user_id = ? AND up.is_deleted = 0',
            [plantId, userId]
        );

        if (existingPlant.length === 0) {
            await connection.rollback();
            return null;
        }

        // Find or create plant type
        const plantTypeId = await findOrCreatePlantType(connection, cultivar, species);

        // Update the user_plants record
        const updateData = {
            plant_id: plantTypeId,
            planting_time: plantingTime,
            est_cropping: estCropping || null,
        };
        
        // Only update photo_url if a new photo was uploaded
        if (photoUrl) {
            updateData.photo_url = photoUrl;
        }

        const updateFields = Object.entries(updateData)
            .map(([key]) => `${key} = ?`)
            .join(', ');
        const updateValues = [...Object.values(updateData), plantId, userId];

        await connection.query(
            `UPDATE user_plants SET ${updateFields} WHERE user_plant_id = ? AND user_id = ?`,
            updateValues
        );

        await connection.commit();

        // Fetch the updated plant data
        const [updatedPlant] = await connection.query(`
            SELECT
                up.user_plant_id as id,
                ap.plant_cultivar as name,
                ap.plant_species as species,
                up.planting_time as plantingTime,
                up.est_cropping as estCropping,
                up.photo_url as photoUrl
            FROM user_plants up
            JOIN all_plants ap ON up.plant_id = ap.plant_id
            WHERE up.user_plant_id = ?
        `, [plantId]);

        return updatedPlant[0];
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

/**
 * Delete a plant (soft delete)
 * 
 * @param {Object} pool - Database connection pool
 * @param {Number} plantId - Plant ID
 * @param {Number} userId - User ID
 * @returns {Promise<Boolean>} True if successful, false if plant not found
 */
const deletePlant = async (pool, plantId, userId) => {
    const [result] = await pool.query(
        'UPDATE user_plants SET is_deleted = 1 WHERE user_plant_id = ? AND user_id = ?',
        [plantId, userId]
    );

    return result.affectedRows > 0;
};

module.exports = {
    getUserPlants,
    getPlantById,
    addPlant,
    updatePlant,
    deletePlant
};
