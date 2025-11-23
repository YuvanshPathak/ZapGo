# ZapGo - EV Route Planner & Admin Portal

ZapGo is a web-based Electric Vehicle (EV) route planning application. It allows users to plan journeys, calculate necessary charging stops based on their vehicle's range, and book trips. The project also includes a comprehensive Admin Portal for managing users and charging stations.

**Note:** This project uses **OpenStreetMap (Leaflet.js)** for maps and routing, making it completely **free** to use without requiring a Google Cloud billing account.

## 🚀 Features

### 🚗 User Portal
* **Google Sign-In:** Secure login using Firebase Authentication.
* **Interactive Map:** Displays routes using OpenStreetMap and Leaflet.js.
* **Smart Routing:** Automatically calculates the route between two cities.
* **EV Logic:** Calculates necessary charging stops based on the car's range.
* **Booking System:** Allows users to confirm and book their planned journeys (saved to Cloud Firestore).

### 🛡️ Admin Portal
* **Secure Login:** Simulated secure admin authentication.
* **User Management:** View registered users.
* **Station Management:** Add and list EV charging stations (saved to Realtime Database).
* **Statistics:** Visual bar chart showing booking trends (using Chart.js).
* **Notifications:** Interface to simulate sending notifications to stations.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
* **Styling:** Tailwind CSS (via CDN), Custom CSS
* **Backend / Database:** Google Firebase
    * *Authentication* (Google Provider)
    * *Cloud Firestore* (User Bookings)
    * *Realtime Database* (Admin Data: Users & Stations)
* **Maps & Routing:** Leaflet.js, Leaflet Routing Machine (OSRM), OpenStreetMap Nominatim API
* **Libraries:** Chart.js (for Admin stats)

---

## ⚙️ Prerequisites

1.  A code editor (e.g., [VS Code](https://code.visualstudio.com/)).
2.  A Google Firebase account.
3.  A local server extension (e.g., **Live Server** for VS Code) is recommended to run the project correctly.

---

## 📥 Installation & Setup

### 1. Clone or Download
Download the project files to your local machine.

### 2. Firebase Setup
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (e.g., `zapgo-admin-app`).
3.  **Enable Authentication:**
    * Go to *Build > Authentication > Sign-in method*.
    * Enable **Google**.
    * Add your local domain (`127.0.0.1` or `localhost`) to *Settings > Authorized Domains*.
4.  **Enable Cloud Firestore:**
    * Go to *Build > Firestore Database*.
    * Create database in **Production mode**.
    * Update Rules to allow authenticated reads/writes.
5.  **Enable Realtime Database:**
    * Go to *Build > Realtime Database*.
    * Create database.
    * Import the following JSON structure to `Rules` or `Data` to initialize admin functionality:
    ```json
    {
      "stations": {
         "stn1": { "name": "Central Hub", "location": "New Delhi" }
      },
      "users": {
         "testUser": { "name": "Test User", "email": "test@example.com" }
      }
    }
    ```

### 3. Configure the Code
Open `index.html`, `main.html`, and `admin.js`. Replace the `firebaseConfig` object with your own credentials from the Firebase Console (*Project Settings > General > Your apps*).

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};