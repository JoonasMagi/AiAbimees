SELECT
    u.username,
    ap.plant_cultivar,
    ap.plant_species,
    up.planting_time,
    up.est_cropping
FROM user_plants AS up
         INNER JOIN users AS u
                    ON up.user_id = u.user_id
         INNER JOIN all_plants AS ap
                    ON up.plant_id = ap.plant_id
WHERE u.username = 'joonas'
ORDER BY up.planting_time DESC;
