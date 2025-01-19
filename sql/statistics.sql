-- Keskmine hinnanguline saagikus kasutajate lõikes
SELECT
    u.username AS user_name,
    AVG(up.est_cropping) AS average_cropping
FROM
    Users u
        JOIN
    UserPlants up ON u.user_id = up.user_id
GROUP BY
    u.user_id;

-- Summa viimase kuu sensorite väärtused
SELECT
    si.enviroment_id AS environment_id,
    SUM(si.value) AS total_sensor_value
FROM
    SensorInputs si
WHERE
    si.timestamp >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
  AND si.value > 0
GROUP BY
    si.enviroment_id;

-- Aktiivsete aktuaatorite arv kasvukeskkondade lõikes
SELECT
    ao.enviroment_id AS environment_id,
    COUNT(*) AS active_actuators
FROM
    ActuatorOutputs ao
WHERE
    NOT ao.state = 0
GROUP BY
    ao.enviroment_id;

