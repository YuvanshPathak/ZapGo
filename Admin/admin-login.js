// // admin.js (Add this at the very top of the file)
// if (sessionStorage.getItem('isAdminLoggedIn') !== 'true') {
//     window.location.href = 'admin-login.html'; 
// }


// document.getElementById('adminLoginForm').addEventListener('submit', function (e) {
//     e.preventDefault(); // Prevent form submission

//     const username = document.getElementById('username').value;
//     const password = document.getElementById('password').value;
//     const errorMessage = document.getElementById('errorMessage');

//     // Simulate login validation
//     if (username === 'admin' && password === 'password123') {
//         // Successful login
//         alert('Login successful!');
//         window.location.href = 'admin.html'; // Redirect to admin dashboard
//     } else {
//         // Display error message
//         errorMessage.textContent = 'Invalid username or password!';
//         errorMessage.classList.remove('hidden');
//     }
// });


// // Logout functionality (REPLACE existing two listeners)
// document.getElementById("logoutBtn").addEventListener("click", () => {
//     sessionStorage.removeItem('isAdminLoggedIn'); // Clear the session flag
//     window.location.href = 'admin-login.html'; // Redirect to admin login page
// });
// // document.getElementById("loginButton").addEventListener("click", () => {
// //     window.location.href = 'admin.html'; // Redirect to admin-login page
// // });

// admin-login.js (FULL CORRECTED CODE)

document.getElementById('adminLoginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Prevent form submission

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');

    // Simulate login validation (replace with Firebase Auth in a real app)
    if (username === 'admin' && password === 'password123') {
        sessionStorage.setItem('isAdminLoggedIn', 'true'); // **SET SECURITY FLAG**
        alert('Login successful!');
        window.location.href = 'admin.html'; // **CORRECT REDIRECTION**
    } else {
        // Display error message
        errorMessage.textContent = 'Invalid username or password!';
        errorMessage.classList.remove('hidden');
    }
});

// Remove the redundant and conflicting document.getElementById("loginButton").addEventListener("click", ...)