import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,        
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";


// admin "auth" check
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
// delegate delete clicks to the table
usersTable.addEventListener("click", (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;

  const userId = btn.dataset.userId;
  if (!userId) return;

  deleteUser(userId);
});

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
            <button class="delete-btn" data-user-id="${docSnap.id}">Delete</button>
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
    loadUsers(); // reload table
  } catch (err) {
    console.error("Error deleting user:", err);
    alert("Failed to delete user: " + err.message);
  }
}


// ---------- STATIONS (Firestore: stations collection) ----------
async function loadStations() {
  try {
    const snap = await getDocs(collection(db, "stations"));
    stationsList.innerHTML = "";
    stationSelect.innerHTML =
      '<option value="" disabled selected>Select a Charging Station</option>';

    snap.forEach((docSnap) => {
      const station = docSnap.data();
      const id = docSnap.id;

      // List item with Edit + Delete buttons
      const li = document.createElement("li");
      li.className = "station-row";
      li.dataset.id = id;
      li.dataset.name = station.name || "";
      li.dataset.location = station.location || "";

      li.innerHTML = `
        <div class="station-info">
          <span class="station-name">${station.name || "Unnamed"}</span>
          <span class="station-location"> - ${station.location || "-"}</span>
        </div>
        <div class="station-actions">
          <button class="edit-station-btn" data-id="${id}">Edit</button>
          <button class="delete-station-btn" data-id="${id}">Delete</button>
        </div>
      `;
      stationsList.appendChild(li);

      // Populate dropdown as before
      const option = document.createElement("option");
      option.value = id;
      option.textContent = station.name || "Station";
      stationSelect.appendChild(option);
    });
  } catch (err) {
    console.error("Error loading stations:", err);
  }
}
// handle "Add Station" form submit
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

    alert("Station added successfully!");
    addStationForm.reset();
    await loadStations(); // refresh list + dropdown
  } catch (err) {
    console.error("Error adding station:", err);
    alert("Failed to add station: " + err.message);
  }
});


// handle edit/delete clicks on stations list
stationsList.addEventListener("click", (e) => {
  const deleteBtn = e.target.closest(".delete-station-btn");
  const editBtn = e.target.closest(".edit-station-btn");

  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (id) deleteStation(id);
    return;
  }

  if (editBtn) {
    const id = editBtn.dataset.id;
    if (id) editStation(id, editBtn);
  }
});

async function deleteStation(stationId) {
  if (!confirm("Are you sure you want to delete this station?")) return;

  try {
    await deleteDoc(doc(db, "stations", stationId));
    alert("Station deleted successfully!");
    loadStations(); // refresh UI
  } catch (err) {
    console.error("Error deleting station:", err);
    alert("Failed to delete station: " + err.message);
  }
}

async function editStation(stationId, btnElement) {
  // try to get old values from DOM
  const li = btnElement.closest("li");
  const prevName = li?.dataset.name || "";
  const prevLocation = li?.dataset.location || "";

  const newName = prompt("Edit station name:", prevName);
  if (newName === null) return; // cancelled

  const newLocation = prompt("Edit station location:", prevLocation);
  if (newLocation === null) return; // cancelled

  try {
    await updateDoc(doc(db, "stations", stationId), {
      name: newName.trim(),
      location: newLocation.trim(),
    });
    alert("Station updated successfully!");
    loadStations(); // refresh UI
  } catch (err) {
    console.error("Error updating station:", err);
    alert("Failed to update station: " + err.message);
  }
}



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
