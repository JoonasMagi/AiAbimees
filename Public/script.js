const modal = document.getElementById('new-plant-modal');
const openButton = document.querySelector('.new-plant-btn');
const closeButton = document.querySelector('.close-button');

openButton.addEventListener('click', () => {
    modal.style.display = 'block';
});

closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

document.getElementById('plant-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    try {
        const response = await fetch('/add-plant', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            alert('Plant added successfully!');
            modal.style.display = 'none';
            event.target.reset();
            loadPlants();
        } else {
            alert('Error adding plant');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding plant');
    }
});

async function loadPlants() {
    try {
        const response = await fetch('/plants');
        const plants = await response.json();

        const plantsList = document.getElementById('plants-list');
        plantsList.innerHTML = '';

        plants.forEach(plant => {
            const plantItem = document.createElement('div');
            plantItem.className = 'plant-item';

            const plantImage = document.createElement('img');
            plantImage.src = plant.image_url || 'https://via.placeholder.com/50';
            plantImage.alt = `${plant.name} photo`;

            const plantInfo = document.createElement('div');
            plantInfo.className = 'plant-info';

            const plantName = document.createElement('div');
            plantName.className = 'plant-name';
            plantName.textContent = plant.name;

            const plantSpecies = document.createElement('div');
            plantSpecies.className = 'plant-species';
            plantSpecies.textContent = plant.species || 'Unknown species';

            plantInfo.appendChild(plantName);
            plantInfo.appendChild(plantSpecies);

            plantItem.appendChild(plantImage);
            plantItem.appendChild(plantInfo);

            plantsList.appendChild(plantItem);
        });
    } catch (error) {
        console.error('Error loading plants:', error);
    }
}

window.onload = loadPlants;
