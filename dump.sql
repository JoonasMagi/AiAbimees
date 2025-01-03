-- Database Schema
CREATE TABLE plants (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        species VARCHAR(255),
                        image_url VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
INSERT INTO plants (name, species, image_url) VALUES ('Aloe Vera', 'Succulent', 'https://via.placeholder.com/50');
INSERT INTO plants (name, species, image_url) VALUES ('Basil', 'Herb', 'https://via.placeholder.com/50');
