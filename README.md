# Aedniku Abimees (Gardener's Assistant)

Aedniku Abimees (Gardener's Assistant) is a simple web-based application designed for gardeners to keep track of their plants. The application allows users to view a list of their plants after signing in. This is a beginner-friendly project that includes both backend and frontend development, using Node.js, Express, and MariaDB.

### Features

Plant List: Displays a list of plants with names, species, and optional images.

Responsive Design: The frontend adapts to different screen sizes.

### Tech Stack

Backend: Node.js with Express.js

Database: MariaDB

Frontend: HTML, CSS, and JavaScript

### Prerequisites

Node.js (v14 or higher)
mariadb (v10.5 or higher)

Git for version control

### Steps

Install dependencies:

npm install

Create a .env file in the root directory with the following variables:

DB_HOST=localhost<br>
DB_PORT=3306<br>
DB_USER=user<br>
DB_PASSWORD=password<br>
DB_NAME=aedniku_abimees<br>
SERVER_PORT=4000<br>

Initialize the database:
If you have a dump.sql file with the database schema and initial data, you can initialize the database using the following command:

mysql -u user -p aedniku_abimees < dump.sql

Replace dump.sql with the path to your database dump file.

Replace dump.sql with the path to your database dump file.

Run the server:

node server/index.js

Open the application in your browser:

http://localhost:4000

### Usage


Navigate to the /plants page after signing in.
View your list of plants, including their names, species, and images.


### Future Features

Add user authentication and session management.

Allow users to add, edit, and delete plants.

Integrate AI features for plant care recommendations.

### Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

### License

This project is licensed under the MIT License. See the LICENSE file for details.

### Acknowledgments

Special thanks to all contributors and the open-source community for providing tools and resources to make this project possible.

