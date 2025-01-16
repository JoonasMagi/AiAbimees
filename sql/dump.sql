-- enable the sandbox mode */
-- MariaDB dump 10.19  Distrib 10.11.8-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: 127.0.0.1    Database:
-- ------------------------------------------------------
-- Server version	11.6.2-MariaDB-ubu2404

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `aedniku_abimees`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `aedniku_abimees` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_ai_ci */;

USE `aedniku_abimees`;

--
-- Table structure for table `ActuatorOutputs`
--

DROP TABLE IF EXISTS `ActuatorOutputs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ActuatorOutputs` (
                                   `output_id` int(11) NOT NULL AUTO_INCREMENT,
                                   `actuator_name` varchar(50) NOT NULL,
                                   `state` tinyint(1) NOT NULL,
                                   `timestamp` datetime DEFAULT current_timestamp(),
                                   `enviroment_id` int(11) NOT NULL,
                                   PRIMARY KEY (`output_id`),
                                   KEY `enviroment_id` (`enviroment_id`),
                                   CONSTRAINT `ActuatorOutputs_ibfk_1` FOREIGN KEY (`enviroment_id`) REFERENCES `GrowingEnviroments` (`enviroment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ActuatorOutputs`
--

LOCK TABLES `ActuatorOutputs` WRITE;
/*!40000 ALTER TABLE `ActuatorOutputs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ActuatorOutputs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `AllPlants`
--

DROP TABLE IF EXISTS `AllPlants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `AllPlants` (
                             `plants_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                             `plant_cultivar` varchar(191) NOT NULL,
                             `plant_spieces` varchar(191) NOT NULL,
                             PRIMARY KEY (`plants_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `AllPlants`
--

LOCK TABLES `AllPlants` WRITE;
/*!40000 ALTER TABLE `AllPlants` DISABLE KEYS */;
INSERT INTO `AllPlants` (`plants_id`, `plant_cultivar`, `plant_spieces`) VALUES (1,'Tomato','Solanum lycopersicum'),
                                                                                (2,'Basil','Ocimum basilicum');
/*!40000 ALTER TABLE `AllPlants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `GrowingEnviroments`
--

DROP TABLE IF EXISTS `GrowingEnviroments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `GrowingEnviroments` (
                                      `enviroment_id` int(11) NOT NULL AUTO_INCREMENT,
                                      `user_id` int(11) unsigned NOT NULL,
                                      `soil_id` int(11) NOT NULL,
                                      PRIMARY KEY (`enviroment_id`),
                                      KEY `user_id` (`user_id`),
                                      CONSTRAINT `GrowingEnviroments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `GrowingEnviroments`
--

LOCK TABLES `GrowingEnviroments` WRITE;
/*!40000 ALTER TABLE `GrowingEnviroments` DISABLE KEYS */;
/*!40000 ALTER TABLE `GrowingEnviroments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SensorInputs`
--

DROP TABLE IF EXISTS `SensorInputs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SensorInputs` (
                                `input_id` int(11) NOT NULL AUTO_INCREMENT,
                                `sensor_name` varchar(50) NOT NULL,
                                `sensor_type` varchar(50) DEFAULT NULL,
                                `value` decimal(10,2) DEFAULT NULL,
                                `timestamp` datetime DEFAULT current_timestamp(),
                                `enviroment_id` int(11) NOT NULL,
                                PRIMARY KEY (`input_id`),
                                KEY `enviroment_id` (`enviroment_id`),
                                CONSTRAINT `SensorInputs_ibfk_1` FOREIGN KEY (`enviroment_id`) REFERENCES `GrowingEnviroments` (`enviroment_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SensorInputs`
--

LOCK TABLES `SensorInputs` WRITE;
/*!40000 ALTER TABLE `SensorInputs` DISABLE KEYS */;
/*!40000 ALTER TABLE `SensorInputs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SoilTypes`
--

DROP TABLE IF EXISTS `SoilTypes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `SoilTypes` (
                             `soil_id` int(11) NOT NULL AUTO_INCREMENT,
                             `soil_type` varchar(50) NOT NULL,
                             `ph_range` varchar(20) DEFAULT NULL,
                             `description` text DEFAULT NULL,
                             `suitable_plants` text DEFAULT NULL,
                             PRIMARY KEY (`soil_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SoilTypes`
--

LOCK TABLES `SoilTypes` WRITE;
/*!40000 ALTER TABLE `SoilTypes` DISABLE KEYS */;
INSERT INTO `SoilTypes` (`soil_id`, `soil_type`, `ph_range`, `description`, `suitable_plants`) VALUES (2,'Loam','6.0-7.5','Tasakaalustatud muld, hea niiskuse ja toitainete säilitamine','Köögiviljad, viljapuud, marjapõõsad, lilled'),
                                                                                                      (3,'Sandy Soil','5.5-7.0','Kuivab kiiresti, kerge ja hästi kuivendatud muld','Porgandid, sibulad, ürdid, sukulendid'),
                                                                                                      (4,'Clay Soil','6.0-7.5','Raske ja toitaineterikas muld, vajab head drenaaži','Roosid, kapsad, päevalilled'),
                                                                                                      (5,'Silty Soil','6.0-7.5','Viljakas, peenosakestega muld, mis hoiab hästi niiskust','Köögiviljad, maasikad, viljapuud'),
                                                                                                      (6,'Peaty Soil','3.5-5.5','Happeline ja niiskust säilitav muld, rikas orgaanilise ainega','Rododendronid, mustikad, asalead'),
                                                                                                      (7,'Chalky Soil','7.1-8.0','Aluseline muld, sisaldab lubjakivi, vajab täiendavat toitainet','Lavendel, larkspur, rosmariin'),
                                                                                                      (8,'Loamy','6.0-7.5','Rich and balanced soil',NULL);
/*!40000 ALTER TABLE `SoilTypes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `UserPlants`
--

DROP TABLE IF EXISTS `UserPlants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `UserPlants` (
                              `user_plants_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
                              `planting_time` date NOT NULL,
                              `est_cropping` tinyint(3) unsigned DEFAULT NULL,
                              `user_id` int(11) unsigned NOT NULL,
                              `plants_id` int(10) unsigned NOT NULL,
                              PRIMARY KEY (`user_plants_id`),
                              KEY `user_id` (`user_id`),
                              KEY `plants_id` (`plants_id`),
                              CONSTRAINT `UserPlants_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE,
                              CONSTRAINT `UserPlants_ibfk_2` FOREIGN KEY (`plants_id`) REFERENCES `AllPlants` (`plants_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserPlants`
--

LOCK TABLES `UserPlants` WRITE;
/*!40000 ALTER TABLE `UserPlants` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserPlants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Users`
--

DROP TABLE IF EXISTS `Users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `Users` (
                         `user_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
                         `username` varchar(191) NOT NULL,
                         `password` varchar(191) NOT NULL,
                         `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                         `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                         `first_name` varchar(191) DEFAULT NULL,
                         `sur_name` varchar(191) DEFAULT NULL,
                         `email` varchar(100) DEFAULT NULL,
                         `phone` varchar(20) DEFAULT NULL,
                         `location` varchar(500) DEFAULT NULL,
                         PRIMARY KEY (`user_id`),
                         UNIQUE KEY `Users_pk_3` (`username`),
                         UNIQUE KEY `Users_pk` (`phone`),
                         UNIQUE KEY `Users_pk_2` (`email`),
                         CONSTRAINT `users_weather_data_weather_condition_fk` FOREIGN KEY (`user_id`) REFERENCES `Users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Users`
--

LOCK TABLES `Users` WRITE;
/*!40000 ALTER TABLE `Users` DISABLE KEYS */;
INSERT INTO `Users` (`user_id`, `username`, `password`, `created_at`, `updated_at`, `first_name`, `sur_name`, `email`, `phone`, `location`) VALUES (1,'joonas','$2b$10$H0/fwx3mnPLuNLve4k74CO44iZy8MZ8KSJbvWwchgpjqeNVBIi6Xe','2024-11-30 14:14:33','2024-11-30 14:14:33',NULL,NULL,NULL,NULL,NULL),
                                                                                                                                                   (2,'test','$2b$10$p.4iOlmdZ.muJouF0ppY.OPxJU5I23lta4eS5ESIfAqcb/k55Pqx6','2024-11-30 14:16:02','2024-11-30 14:16:02',NULL,NULL,NULL,NULL,NULL),
                                                                                                                                                   (3,'test1','$2b$10$J0GRVZHvKub0S7replc2X.CXDjtYAxfno3HAEgXrZr2dihckdACL6','2024-12-01 10:47:49','2024-12-01 10:47:49',NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `Users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `WeatherData`
--

DROP TABLE IF EXISTS `WeatherData`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `WeatherData` (
                               `weather_id` int(11) NOT NULL AUTO_INCREMENT,
                               `location` varchar(191) DEFAULT NULL,
                               `temperature` decimal(5,2) DEFAULT NULL,
                               PRIMARY KEY (`weather_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `WeatherData`
--

LOCK TABLES `WeatherData` WRITE;
/*!40000 ALTER TABLE `WeatherData` DISABLE KEYS */;
/*!40000 ALTER TABLE `WeatherData` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plants`
--

DROP TABLE IF EXISTS `plants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plants` (
                          `id` int(11) NOT NULL AUTO_INCREMENT,
                          `name` varchar(191) NOT NULL,
                          `species` varchar(191) DEFAULT NULL,
                          `created_at` timestamp NULL DEFAULT current_timestamp(),
                          `image_url` varchar(255) DEFAULT NULL,
                          `type` varchar(50) DEFAULT NULL,
                          `description` text DEFAULT NULL,
                          PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plants`
--

LOCK TABLES `plants` WRITE;
/*!40000 ALTER TABLE `plants` DISABLE KEYS */;
INSERT INTO `plants` (`id`, `name`, `species`, `created_at`, `image_url`, `type`, `description`) VALUES (1,'Aloe Vera','Succulent','2024-12-26 14:35:15','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (2,'Basil','Herb','2024-12-26 14:35:15','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (3,'Aloe Vera','Succulent','2025-01-05 09:23:17','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (4,'Basil','Herb','2025-01-05 09:23:17','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (5,'Aloe Vera','Succulent','2025-01-05 09:31:05','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (6,'Basil','Herb','2025-01-05 09:31:05','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (7,'Aloe Vera','Succulent','2025-01-05 09:31:28','https://via.placeholder.com/50',NULL,NULL),
                                                                                                        (8,'Basil','Herb','2025-01-05 09:31:28','https://via.placeholder.com/50',NULL,NULL);
/*!40000 ALTER TABLE `plants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'aedniku_abimees'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-01-08 19:23:56
ALTER TABLE `Users` DROP FOREIGN KEY `users_weather_data_weather_condition_fk`;
