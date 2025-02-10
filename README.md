# Aedniku Abimees (Gardener's Assistant)

Aedniku Abimees (Gardener's Assistant) is a web application designed for gardeners to manage their plant collection. Users can create accounts, add plants, track planting dates, and manage their garden inventory with images and growing information.
## Features

### User Management

User registration and authentication<br>
Secure login/logout functionality<br>
Session management<br>
CSRF protection for enhanced security<br>

### Plant Management

View a comprehensive list of your plants
Add new plants with detailed information:

Plant name (cultivar)<br>
Species<br>
Planting date<br>
Estimated days until cropping<br>
Plant photos (up to 5MB)<br>


Delete plants from your collection
Responsive design for all screen sizes

### Security Features

Password hashing using bcrypt<br>
CSRF protection<br>
Rate limiting for login attempts<br>
Secure session management<br>
File upload validation<br>
SQL injection protection<br>
XSS protection<br>

## Tech Stack

### Backend

Node.js<br>
Express.js<br>
MariaDB/MySQ<br>
Express Session<br>
Bcrypt for password hashing<br>
Express Validator<br>
Express Rate Limit<br>
Helmet for security headers<br>

### Frontend

Vanilla JavaScript<br>
HTML5<br>
CSS3<br>
Responsive Design<br>

## Prerequisites

Node.js (v14 or higher)<br>
MariaDB (v10.5 or higher)<br>
Git for version control<br>
## Steps

### Install dependencies:

npm install

Create a .env file in the root directory with the following variables:

DB_HOST=localhost<br>
DB_PORT=3306<br>
DB_USER=your_username<br>
DB_PASSWORD=your_password<br>
DB_NAME=aedniku_abimees<br>
PORT=4000<br>
SESSION_SECRET=your_session_secret<br>
NODE_ENV=development<br>

### Initialize the database:

If you have a dump.sql file with the database schema and initial data, you can initialize the database using the following command:
mysql -u user -p aedniku_abimees < dump.sql
Replace dump.sql with the path to your database dump file.
Replace dump.sql with the path to your database dump file.

### Create required directories:

mkdir -p public/uploads
mkdir tmp

### Run the server:

node server/app.js
Open the application in your browser:
http://localhost:4000

## Usage

Register a new account or sign in to an existing one
Navigate to the plants page to view your collection
Use the "Add New Plant" button to add plants to your collection
Fill in the plant details:

Plant name (cultivar)
Species
Planting date
Estimated days until cropping (optional)
Upload a photo (optional, max 5MB)

View your plants in the responsive grid layout
Delete plants using the delete button when needed

## Security Considerations

All passwords are hashed using bcrypt
CSRF tokens protect against cross-site request forgery
Rate limiting prevents brute force attacks
Input validation prevents SQL injection
Helmet middleware sets security headers
File upload validation prevents malicious files

## Future Features

Plant care reminders and notifications
Plant growth tracking and statistics
Plant care recommendations
Plant sharing between users
Mobile application
Weather integration for plant care advice

## Contributing

Contributions are welcome! Feel free to fork the repository and submit pull requests.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Node.js and Express.js communities
MariaDB/MySQL communities
All contributors and users of the application
