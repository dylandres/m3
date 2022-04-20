// Client-side JS for login.ejs
// Load event-listener
window.addEventListener("load", function() {
    // Login button event-listener
    var loginForm = document.getElementById("login");
    loginForm.addEventListener("submit", function() {
        authenticateLogin(loginForm)
    });
    // Register button event-listener
    var registerForm = document.getElementById("register");
    registerForm.addEventListener("submit", function() {
        attemptRegistration(registerForm);
    });
});

function authenticateLogin(form) {
    // Get credentials
    var email = form.email.value;
    var password = form.password.value;
    // Send an AJAX POST to /login
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/users/login", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var payload = JSON.stringify({'email': email, 'password': password})
    xhr.send(payload)
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Read JSON response
            var json = JSON.parse(xhr.responseText);
            // Logged in, redirect to home page
            if (json['error'] == false)
                window.location.assign(`http://localhost:8080/home`);
            else
                alert(json['message'])
        }
    }
}

function attemptRegistration(form) {
    // Get credentials
    var email = form.email.value;
    var username = form.name.value;
    var password = form.password.value;
    // Send an AJAX POST to /adduser
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:8080/users/signup", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    var payload = JSON.stringify({'name': username, 'email': email, 'password': password})
    xhr.send(payload)
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            // Read JSON response
            var json = JSON.parse(xhr.responseText);
            // Registration successful
            alert(json['message'])
        }
    }
}