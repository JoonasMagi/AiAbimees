-- Loome logitabeli auditeerimiseks Users jaoks
CREATE TABLE IF NOT EXISTS users_log
(
    log_id     INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    old_email  VARCHAR(100),
    new_email  VARCHAR(100),
    old_phone  VARCHAR(20),
    new_phone  VARCHAR(20),
    changed_by VARCHAR(100),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loome logitabeli auditeerimiseks UserPlants jaoks
CREATE TABLE IF NOT EXISTS user_plants_log
(
    log_id            INT AUTO_INCREMENT PRIMARY KEY,
    user_plants_id    INT NOT NULL,
    old_planting_time DATE,
    new_planting_time DATE,
    old_est_cropping  TINYINT UNSIGNED,
    new_est_cropping  TINYINT UNSIGNED,
    changed_by        VARCHAR(100),
    changed_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auditeerimise trigger Users jaoks
DELIMITER $$

CREATE TRIGGER after_users_update
    AFTER UPDATE
    ON Users
    FOR EACH ROW
BEGIN
    INSERT INTO users_log (user_id, old_email, new_email, old_phone, new_phone, changed_by, changed_at)
    VALUES (OLD.user_id,
            OLD.email,
            NEW.email,
            OLD.phone,
            NEW.phone,
            USER(),
            NOW());
END $$

DELIMITER ;

-- Auditeerimise trigger UserPlants jaoks
DELIMITER $$

CREATE TRIGGER after_user_plants_update
    AFTER UPDATE
    ON UserPlants
    FOR EACH ROW
BEGIN
    INSERT INTO user_plants_log (user_plants_id,
                                 old_planting_time, new_planting_time,
                                 old_est_cropping, new_est_cropping,
                                 changed_by, changed_at)
    VALUES (OLD.user_plants_id,
            OLD.planting_time, NEW.planting_time,
            OLD.est_cropping, NEW.est_cropping,
            USER(),
            NOW());
END $$

DELIMITER ;

-- Terviklikkuse tagamise trigger Users jaoks
DELIMITER $$

CREATE TRIGGER before_users_insert
    BEFORE INSERT
    ON Users
    FOR EACH ROW
BEGIN
    IF NEW.phone NOT REGEXP '^[0-9]{10}$' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phone number must be exactly 10 digits';
    END IF;

    IF NEW.email NOT LIKE '%@%' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Email address must be valid';
    END IF;
END $$

DELIMITER ;

-- Terviklikkuse tagamise trigger UserPlants jaoks
DELIMITER $$

CREATE TRIGGER before_user_plants_insert
    BEFORE INSERT
    ON UserPlants
    FOR EACH ROW
BEGIN
    IF NEW.planting_time > CURDATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Planting time cannot be in the future';
    END IF;

    IF NEW.est_cropping <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Estimated cropping must be a positive value';
    END IF;
END $$

DELIMITER ;
