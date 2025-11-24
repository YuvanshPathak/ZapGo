const form = document.getElementById("adminLoginForm");
const errorMessage = document.getElementById("errorMessage");
const loginButton = document.getElementById("loginButton");

if (!form) {
  console.error("adminLoginForm not found. Check your HTML id.");
}

form.addEventListener("submit", function (e) {
  e.preventDefault(); // Prevent form submission

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  console.log("Admin login attempt:", username); // debug

  // Simulated credentials
  if (username === "admin" && password === "password123"||username === "YuvanshPathak" && password === "12345678"||username === "VipinMittal" && password === "12345678") {
    sessionStorage.setItem("isAdminLoggedIn", "true"); // security flag
    alert("Login successful!");
    window.location.href = "admin.html";
  } else {
    errorMessage.textContent = "Invalid username or password!";
    errorMessage.classList.remove("hidden");
  }
});