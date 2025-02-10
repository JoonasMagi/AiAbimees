-- Drop existing database if it exists
DROP DATABASE IF EXISTS `aiabimees`;

-- Create aiabimees database
CREATE DATABASE `aiabimees` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `aiabimees`;

-- Table: Users
CREATE TABLE `users` (
                         `user_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
                         `username` VARCHAR(191) NOT NULL UNIQUE,
                         `password` VARCHAR(191) NOT NULL,
                         `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                         `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                         PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: AllPlants
CREATE TABLE `all_plants` (
                              `plant_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
                              `plant_cultivar` VARCHAR(191) NOT NULL,
                              `plant_species` VARCHAR(191) NOT NULL,
                              `is_deleted` TINYINT(1) DEFAULT 0,
                              PRIMARY KEY (`plant_id`),
                              UNIQUE (`plant_cultivar`, `plant_species`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: UserPlants
CREATE TABLE `user_plants` (
                               `user_plant_id` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
                               `user_id` INT(11) UNSIGNED NOT NULL,
                               `plant_id` INT(11) UNSIGNED NOT NULL,
                               `planting_time` DATE NOT NULL,
                               `est_cropping` TINYINT(3) UNSIGNED DEFAULT NULL,
                               `is_deleted` TINYINT(1) DEFAULT 0,
                               `photo_url` VARCHAR(255) DEFAULT NULL,
                               PRIMARY KEY (`user_plant_id`),
                               FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
                               FOREIGN KEY (`plant_id`) REFERENCES `all_plants` (`plant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: WeatherData
CREATE TABLE `weather_data` (
                                `weather_id` INT(11) NOT NULL AUTO_INCREMENT,
                                `user_id` INT(11) UNSIGNED NOT NULL,
                                `location` VARCHAR(191) DEFAULT NULL,
                                `temperature` DECIMAL(5, 2) DEFAULT NULL,
                                PRIMARY KEY (`weather_id`),
                                FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: SoilTypes
CREATE TABLE `soil_types` (
                              `soil_id` INT(11) NOT NULL AUTO_INCREMENT,
                              `soil_type` VARCHAR(50) NOT NULL,
                              `ph_range` VARCHAR(20) DEFAULT NULL,
                              `description` TEXT DEFAULT NULL,
                              `suitable_plants` TEXT DEFAULT NULL,
                              PRIMARY KEY (`soil_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: GrowingEnviroments
CREATE TABLE `growing_enviroments` (
                                       `enviroment_id` INT(11) NOT NULL AUTO_INCREMENT,
                                       `user_id` INT(11) UNSIGNED NOT NULL,
                                       `soil_id` INT(11) NOT NULL,
                                       PRIMARY KEY (`enviroment_id`),
                                       FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
                                       FOREIGN KEY (`soil_id`) REFERENCES `soil_types` (`soil_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: ActuatorOutputs
CREATE TABLE `actuator_outputs` (
                                    `output_id` INT(11) NOT NULL AUTO_INCREMENT,
                                    `actuator_name` VARCHAR(50) NOT NULL,
                                    `state` TINYINT(1) NOT NULL,
                                    `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
                                    `enviroment_id` INT(11) NOT NULL,
                                    PRIMARY KEY (`output_id`),
                                    FOREIGN KEY (`enviroment_id`) REFERENCES `growing_enviroments` (`enviroment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: SensorInputs
CREATE TABLE `sensor_inputs` (
                                 `input_id` INT(11) NOT NULL AUTO_INCREMENT,
                                 `sensor_name` VARCHAR(50) NOT NULL,
                                 `sensor_type` VARCHAR(50) DEFAULT NULL,
                                 `value` DECIMAL(10, 2) DEFAULT NULL,
                                 `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP,
                                 `enviroment_id` INT(11) NOT NULL,
                                 PRIMARY KEY (`input_id`),
                                 FOREIGN KEY (`enviroment_id`) REFERENCES `growing_enviroments` (`enviroment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Sample Data for Testing
INSERT INTO `users` (`username`, `password`) VALUES
                                                 ('joonas', '$2b$10$H0/fwx3mnPLuNLve4k74CO44iZy8MZ8KSJbvWwchgpjqeNVBIi6Xe'),
                                                 ('test', '$2b$10$p.4iOlmdZ.muJouF0ppY.OPxJU5I23lta4eS5ESIfAqcb/k55Pqx6');

INSERT INTO `all_plants` (`plant_cultivar`, `plant_species`) VALUES
                                                                 ('Tomato', 'Solanum lycopersicum'),
                                                                 ('Basil', 'Ocimum basilicum');

INSERT INTO `user_plants` (`user_id`, `plant_id`, `planting_time`, `est_cropping`, `photo_url`) VALUES
                                                                                                    (1, 1, '2025-01-01', 60, '/uploads/tomato.jpg'),
                                                                                                    (1, 2, '2025-01-05', 45, '/uploads/basil.jpg');
