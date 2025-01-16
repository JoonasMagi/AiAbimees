// MODAALI HALDAMINE
const modal = document.getElementById('plant-modal');
const closeButton = document.querySelector('.close-button');
const openButton = document.querySelector('.new-plant-btn');

// Sulge modaal, kui klikitakse X-nuppu
closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Sulge modaal, kui klikitakse väljaspool seda
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Ava modaal uue taime lisamiseks
openButton.addEventListener('click', () => {
    openModalForAdd();
});

function openModalForAdd() {
    const modalTitle = document.getElementById('modal-title');
    const submitButton = document.querySelector('#plant-form button[type="submit"]');

    modal.style.display = 'block';
    modalTitle.textContent = 'Add a New Plant';

    // Tühjenda vorm
    document.getElementById('plant-id').value = '';
    document.getElementById('name').value = '';
    document.getElementById('species').value = '';
    document.getElementById('type').value = 'flower';
    document.getElementById('description').value = '';
    document.getElementById('plant-picture').value = '';

    submitButton.textContent = 'Submit';
    document.getElementById('plant-form').onsubmit = async (event) => {
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
                loadPlants(); // Laadi uuesti taimede nimekiri
            } else {
                alert('Error adding plant');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding the plant');
        }
    };
}

// MODAALI AVAMINE MUUTMISEKS
function openModalForEdit(plant) {
    const modalTitle = document.getElementById('modal-title');
    const submitButton = document.querySelector('#plant-form button[type="submit"]');

    modal.style.display = 'block';
    modalTitle.textContent = 'Edit Plant';

    // Täida vormi väljad
    document.getElementById('plant-id').value = plant.id;
    document.getElementById('name').value = plant.name;
    document.getElementById('species').value = plant.species;
    document.getElementById('type').value = plant.type;
    document.getElementById('description').value = plant.description;

    submitButton.textContent = 'Save Changes';
    document.getElementById('plant-form').onsubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData(event.target);
        const plantId = formData.get('id');

        try {
            const response = await fetch(`/plants/${plantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.get('name'),
                    species: formData.get('species'),
                    type: formData.get('type'),
                    description: formData.get('description'),
                }),
            });

            if (response.ok) {
                alert('Plant updated successfully!');
                modal.style.display = 'none';
                loadPlants(); // Laadi uuesti taimede nimekiri
            } else {
                alert('Error updating plant');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while updating the plant');
        }
    };
}

// TAIMEDE LAADIMINE
async function loadPlants() {
    console.log('Loading plants...');
    try {
        const response = await fetch('/plants');
        const plants = await response.json();
        console.log('Plants loaded:', plants);

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

            plantItem.addEventListener('click', () => openModalForEdit(plant));

            plantsList.appendChild(plantItem);
        });
    } catch (error) {
        console.error('Error loading plants:', error);
    }
}

// LAADI TAIMED LEHE AVAMISEL
window.onload = loadPlants;
