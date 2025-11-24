import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// 🔐 Simple admin "auth" check (session flag from admin-login.html)
if (sessionStorage.getItem("isAdminLoggedIn") !== "true") {
  window.location.href = "admin-login.html";
}

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB_d-uzdhnhA_MNtLRNxI_9Cq2Eq3qpdGA",
  authDomain: "zapgo-admin-app.firebaseapp.com",
  projectId: "zapgo-admin-app",
  storageBucket: "zapgo-admin-app.firebasestorage.app",
  messagingSenderId: "109873838158",
  appId: "1:109873838158:web:b7d723030c2f447628ab1f",
  measurementId: "G-WG25REDHXT",
};

// Init Firebase + Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const bookingsTable = document.getElementById("bookingsTable");


// DOM elements
const usersTable = document.getElementById("usersTable");
const stationSelect = document.getElementById("stationSelect");
const stationsList = document.getElementById("stationsList");
const addStationForm = document.getElementById("addStationForm");
const notificationForm = document.getElementById("notificationForm");
const logoutBtn = document.getElementById("logoutBtn");

// ---------- TAB LOGIC ----------
const tabs = document.querySelectorAll(".sidebar ul li");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((tc) => tc.classList.remove("active"));
    tab.classList.add("active");
    tabContents[index].classList.add("active");
  });
});

// ---------- LOGOUT ----------
logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("isAdminLoggedIn");
  window.location.href = "admin-login.html";
});

// ---------- USERS (Firestore: users collection) ----------
async function loadUsers() {
  try {
    const snap = await getDocs(collection(db, "users"));
    usersTable.innerHTML = "";

    snap.forEach((docSnap) => {
      const user = docSnap.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${docSnap.id}</td>
        <td>${user.displayName || user.name || "N/A"}</td>
        <td>${user.email || "N/A"}</td>
        <td>
          <button class="delete-btn" onclick="deleteUser('${docSnap.id}')">Delete</button>
        </td>
      `;
      usersTable.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading users:", err);
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;
  try {
    await deleteDoc(doc(db, "users", userId));
    alert("User deleted successfully!");
    // Reload users table
    loadUsers();
  } catch (err) {
    console.error("Error deleting user:", err);
  }
}

// expose deleteUser so onclick works
window.deleteUser = deleteUser;

// ---------- STATIONS (Firestore: stations collection) ----------
async function loadStations() {
  try {
    const snap = await getDocs(collection(db, "stations"));
    stationsList.innerHTML = "";
    stationSelect.innerHTML =
      '<option value="" disabled selected>Select a Charging Station</option>';

    snap.forEach((docSnap) => {
      const station = docSnap.data();

      // List item
      const li = document.createElement("li");
      li.textContent = `${station.name} - ${station.location}`;
      stationsList.appendChild(li);

      // Dropdown option
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = station.name;
      stationSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading stations:", err);
  }
}

addStationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const stationName = document.getElementById("stationName").value.trim();
  const stationLocation = document.getElementById("stationLocation").value.trim();

  if (!stationName || !stationLocation) {
    alert("Please enter station name and location.");
    return;
  }

  try {
    await addDoc(collection(db, "stations"), {
      name: stationName,
      location: stationLocation,
    });
    addStationForm.reset();
    loadStations();
  } catch (err) {
    console.error("Error adding station:", err);
  }
});


// ---------- BOOKINGS (Firestore: bookings collection) ----------
function loadBookings() {
  if (!bookingsTable) {
    console.error("bookingsTable element not found");
    return;
  }

  const bookingsRef = collection(db, "bookings");

  onSnapshot(
    bookingsRef,
    (snapshot) => {
      bookingsTable.innerHTML = "";

      if (snapshot.empty) {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td colspan="6" style="text-align:center; padding:0.75rem;">
            No bookings found.
          </td>
        `;
        bookingsTable.appendChild(row);
        return;
      }

      // Collect into array first
      const bookings = [];
      snapshot.forEach((docSnap) => {
        bookings.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      // Sort by createdAt (newest first)
      bookings.sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da; // descending
      });

      // Render rows
      bookings.forEach((data) => {
        const email = data.email || "N/A";
        const start = data.start || data.source || "-";
        const dest = data.destination || data.dest || "-";

        // distance pretty formatting
        let distance = data.distance || data.dist || "-";
        if (distance !== "-" && !isNaN(distance)) {
          distance = Number(distance).toFixed(1);
        }

        // duration: handle new (hours) + old (minutes)
        let durationDisplay = "-";
        if (typeof data.durationHours !== "undefined") {
          const dh = Number(data.durationHours);
          durationDisplay = isNaN(dh) ? data.durationHours : dh.toFixed(1) + " hrs";
        } else if (typeof data.durationMinutes !== "undefined") {
          durationDisplay = data.durationMinutes + " mins";
        } else if (typeof data.time !== "undefined") {
          durationDisplay = data.time + " mins";
        }

        // createdAt nice formatting
        let createdAt = "-";
        if (data.createdAt) {
          const d = new Date(data.createdAt);
          createdAt = isNaN(d.getTime())
            ? data.createdAt
            : d.toLocaleString();
        }

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${email}</td>
          <td>${start}</td>
          <td>${dest}</td>
          <td>${distance}</td>
          <td>${durationDisplay}</td>
          <td>${createdAt}</td>
        `;
        bookingsTable.appendChild(row);
      });
    },
    (err) => {
      console.error("Error loading bookings:", err);
      bookingsTable.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:0.75rem; color:#f97373;">
            Failed to load bookings.
          </td>
        </tr>
      `;
    }
  );
}


// ---------- NOTIFICATIONS (simulated) ----------
notificationForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const selectedStation = stationSelect.value;
  const message = document.getElementById("notificationMessage").value.trim();

  if (!selectedStation) {
    alert("Please select a charging station first.");
    return;
  }

  if (!message) {
    alert("Enter a notification message.");
    return;
  }

  alert(
    `Notification sent to station ${selectedStation} (simulated).\nMessage: ${message}`
  );
  notificationForm.reset();
});

// ---------- STATS (Firestore: bookings collection) ----------
let statsChart = null;

function initStatsChart() {
  const ctx = document.getElementById("statsChart").getContext("2d");
  statsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Bookings per day",
          data: [],
          backgroundColor: "#1fb800",
        },
      ],
    },
    options: {
      responsive: true,
    },
  });

  // Live updates from Firestore
  const bookingsCol = collection(db, "bookings");
  onSnapshot(bookingsCol, (snapshot) => {
    const dailyCounts = {}; // "YYYY-MM-DD" -> count

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.createdAt) return;

      const d = new Date(data.createdAt);
      if (isNaN(d)) return;

      const key =
        d.getFullYear() +
        "-" +
        String(d.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(d.getDate()).padStart(2, "0");

      dailyCounts[key] = (dailyCounts[key] || 0) + 1;
    });

    const labels = Object.keys(dailyCounts).sort();
    const values = labels.map((k) => dailyCounts[k]);

    statsChart.data.labels = labels;
    statsChart.data.datasets[0].data = values;
    statsChart.update();
  });
}

// ---------- INITIAL LOAD ----------
loadUsers();
loadStations();
initStatsChart();
loadBookings();
