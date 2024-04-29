document.getElementById('forgot-password-link').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'http://localhost/password_recovery.php';
});

function login() {
    const login = document.getElementById("login").value;
    const password = document.getElementById("password").value;

    if (login === "" || password === "") {
        alert("Пожалуйста, заполните все поля.");
        return;
    }

    const data = {
        "login": login,
        "password": password
    };

    fetch('http://127.0.0.1:8080/api/v1/users/member/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            alert('Authorization request has been successfully sent!');
            console.log(data);
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function redirectToRegistration() {
    window.location.href = 'http://localhost/registration.php';
}
