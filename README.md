# 🚨 RESQ - Real-Time Emergency Response System

> **"Help is closer than you think."**
<img width="1536" height="1024" alt="resq-2" src="https://github.com/user-attachments/assets/e4b47f1e-bb88-4dc0-a467-e8307a31ea90" />!

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)](https://socket.io/)
[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

RESQ is a full-stack, location-based web application designed to instantly connect individuals facing an emergency with nearby volunteer responders. By leveraging real-time WebSockets and precise geolocation tracking, RESQ cuts down response times and builds a community-driven safety net.

## ✨ Key Features

- **Real-Time Global Radar:** Broadcasts emergencies instantly to all active users within a 5km radius using the Haversine formula.
- **Live GPS Tracking:** Live map interface with turn-by-turn route generation between the requester and the responder.
- **Instant Messaging:** Built-in live chat between the requester and responder for immediate coordination.
- **Smart Notifications:** Push notifications and in-app toasts alert nearby users the second an emergency is declared.
- **Secure Authentication:** JWT-based authentication with secure cross-domain cookies, paired with OTP email verification.
- **Responsive Glassmorphism UI:** A sleek, mobile-first design that works flawlessly across PC, tablet, and mobile devices.

---

## 🛠️ Tech Stack & Architecture

RESQ is built on the **MERN** stack, supercharged with modern DevOps and caching tools for speed and reliability.

### Frontend

- **React.js (Vite):** Fast, modern UI development.
- **Tailwind CSS:** For rapid, responsive, and beautiful styling, including Glassmorphism effects.
- **Redux Toolkit:** Global state management for user sessions and authentication.
- **React Leaflet:** Interactive map rendering and live marker updates.
- **Socket.io-client:** Bi-directional real-time communication with the backend.

### Backend

- **Node.js & Express.js:** Robust REST API architecture.
- **MongoDB & Mongoose:** Geospatial data storage using `Point` schemas and user management.
- **Socket.io:** Powers the real-time radar, live location streaming, and instant messaging.
- **Nodemailer:** Handles automated email delivery for OTP verification and password resets.

### Specialized Technologies & Why We Used Them

- **Redis (In-Memory Data Store):**
  - **OTP Caching:** Signup and password-reset OTPs are stored in Redis with an automatic TTL (Time-To-Live) of 5 minutes. This prevents database bloat and ensures ultra-fast validation.
  - **Session Management:** Refresh tokens are tracked in Redis, allowing us to instantly revoke sessions across all devices if an account is compromised.

- **Docker:**
  - Containerizes the Node.js backend, React frontend, and Redis server, ensuring that the application runs identically on any machine without "it works on my machine" dependency issues.

- **OSRM (Open Source Routing Machine):**
  - Used to calculate the fastest driving route and estimated arrival times between the responder and the emergency location.

---

🚨 RESQ - Real-Time Emergency Response System
🚀 Installation & Local Setup
1. Clone the Repository
git clone https://github.com/yourusername/RESQ.git
cd RESQ

2. Environment Variables Setup
You will need to create two .env files.
Backend — server/.env
PORT=8000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
REDIS_URL=your_redis_connection_string
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
NODE_ENV=development

Frontend — client/.env
VITE_BACKEND_URL=http://localhost:8000

3. Running Locally (Without Docker)
Start the Backend
cd server
npm install
npm run dev

Start the Frontend
cd client
npm install
npm run dev

Your app should now be running on:
http://localhost:5173

🐳 Running with Docker
If you prefer an isolated environment, you can spin up the entire stack using Docker Compose. This will automatically build the client, server, and a local Redis container.
Ensure your .env files are configured.

Run the following command in the root directory:

docker-compose up --build

The services will be available at:
Backend:  Port 8000
Frontend: Port 5173
Redis:    Port 6379

To stop the containers, run:
docker-compose down

📱 How to Use
Sign Up / Login: Create an account. An OTP will be sent to your email for verification.
Allow Location: When prompted, allow the browser to access your GPS location.
Request Help: Click the "Create Emergency" button, select the emergency type, and broadcast your location.
Respond to Emergencies: If you are within 5km of an active emergency, it will appear on your radar. Click "Accept" to become the responder.
Live Tracking: Once matched, both users are taken to a live map showing real-time location updates, estimated arrival times, and a live chat interface to coordinate the rescue.
🌍 Deployment
Frontend: Deployed on Netlify
Backend: Deployed on Render with configured IPv4 DNS flags to allow Nodemailer SMTP connections.
Database: Hosted on MongoDB Atlas
Caching: Hosted on Redis Cloud
👨‍💻 Author
Developed by Shakti Shrey
⭐ Support
If you like this project, please consider giving it a ⭐ on GitHub!
RESQ — Help is closer than you think.
