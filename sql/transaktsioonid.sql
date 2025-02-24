-- Alustame transaktsiooni
START TRANSACTION;

-- 1) Lisa uus kasutaja
INSERT INTO `users` (username, password, email)
VALUES ('evelin', 'salajaneparool123', 'evelin@example.com');

-- MySQL/MariaDB-s saame just sisestatud user_id kätte funktsiooniga LAST_INSERT_ID()
-- 2) Lisa sama kasutaja alla uus "UserPlant"
INSERT INTO `user_plants` (user_id, plant_id, planting_time, est_cropping, photo_url)
VALUES (LAST_INSERT_ID(), 1, '2025-03-01', 60, '/uploads/evelin-tomato.jpg');

-- Kui kõik on korras, kinnitame
COMMIT;

/*
   Selles näites:
   - Luuakse uus kasutaja 'evelin'.
   - Talle lisatakse viide plant_id = 1 (näiteks Tomato).
   - Kuna transaktsioon õnnestus, on mõlemad read nüüd andmebaasis olemas.
*/


--------------------------------------------------------------
-- Alustame transaktsiooni
START TRANSACTION;

-- 1) Proovime lisada user_plants rida viitega user_id = 9999
-- Oletame, et andmebaasis pole sellise ID-ga kasutajat
INSERT INTO `user_plants` (user_id, plant_id, planting_time, est_cropping, photo_url)
VALUES (9999, 1, '2025-03-05', 45, '/uploads/non-existent-user-plant.jpg');

-- Kuna user_id=9999 ei eksisteeri ja user_id-l on ON DELETE CASCADE
-- (ning tegu on välisvõtmega), tekib veateade "Cannot add or update a child row: a foreign key constraint fails"
-- Selle tõttu läheb transaktsioon "nurjunud" olekusse.
--
-- NB! Sõltuvalt MySQL konfiguratsioonist võib transaktsioon automaatselt ROLLBACK-ida
-- või jääb ootama, et me käsitsi rollback teeks.
-- Näitame käsitsi ROLLBACK-i:

ROLLBACK;

/*
   Kuna sisestus ebaõnnestus, siis ükski rida andmebaasis ei muudetud.
   ROLLBACK tühistas kõik transaktsiooni jooksul tehtud käsud.
*/
