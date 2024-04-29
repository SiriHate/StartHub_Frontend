<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link rel="stylesheet" type="text/css" href="login-form-styles.css">
</head>
<body>

<div class="container">
    <div class="form-container">
        <h2>Авторизация</h2>

        <form id="json-form">
            <div class="input-container">
                <label for="login">Логин:</label>
                <input type="text" id="login" name="login">
            </div>
            <div class="input-container">
                <label for="password">Пароль:</label>
                <input type="password" id="password" name="password">
            </div>
            <div class="button-container">
                <button type="button" onclick="login()">Авторизация</button>
                <button type="button" onclick="redirectToRegistration()">Регистрация</button>
            </div>
        </form>

        <p class="forgot-password"><a href="http://localhost/password_recovery.php">Забыли пароль?</a></p>
    </div>
</div>

<script>
    function login() {
        var login = document.getElementById("login").value;
        var password = document.getElementById("password").value;

        // Проверка на заполненность полей
        if (login === "" || password === "") {
            alert("Пожалуйста, заполните все поля.");
            return;
        }

        var data = {
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

</script>

</body>
</html>
