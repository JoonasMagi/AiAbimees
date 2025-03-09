-- Table: PlantReminders
CREATE TABLE IF NOT EXISTS `plant_reminders` (
    `reminder_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_plant_id` INT(11) UNSIGNED NOT NULL,
    `reminder_type` ENUM('watering', 'fertilizing', 'harvesting', 'other') NOT NULL,
    `start_date` DATE NOT NULL,
    `interval_days` INT(11) NOT NULL,
    `next_reminder` DATE NOT NULL,
    `last_completed` DATE DEFAULT NULL,
    `notes` TEXT DEFAULT NULL,
    `is_active` TINYINT(1) DEFAULT 1,
    PRIMARY KEY (`reminder_id`),
    INDEX idx_user_plant_id (`user_plant_id`),
    INDEX idx_reminder_type (`reminder_type`),
    INDEX idx_next_reminder (`next_reminder`),
    FOREIGN KEY (`user_plant_id`) REFERENCES `user_plants` (`user_plant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: PlantHealth
CREATE TABLE IF NOT EXISTS `plant_health` (
    `health_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_plant_id` INT(11) UNSIGNED NOT NULL,
    `remarks` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`health_id`),
    INDEX idx_user_plant_id (`user_plant_id`),
    INDEX idx_created_at (`created_at`),
    FOREIGN KEY (`user_plant_id`) REFERENCES `user_plants` (`user_plant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add indexes to existing tables for better query performance
ALTER TABLE `user_plants` ADD INDEX idx_user_deleted (`user_id`, `is_deleted`);
ALTER TABLE `user_plants` ADD INDEX idx_plant_id (`plant_id`);
ALTER TABLE `all_plants` ADD INDEX idx_plant_name (`plant_cultivar`, `plant_species`);
