<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Recovery</title>
    <link rel="stylesheet" type="text/css" href="password_recovery-styles.css">
</head>
<body>

<div class="container">
    <div class="form-container">
        <h2>Восстановление пароля</h2>

        <form id="password-recovery-form">
            <label for="email">Email:</label><br>
            <input type="text" id="email" name="email" placeholder="example@example.com"><br><br>
            <button type="button" onclick="recoverPassword()">Восстановить пароль</button>
        </form>

        <p class="return-link"><a href="http://localhost/login.php">Вернуться к авторизации</a></p>
    </div>
</div>

<script>
    function recoverPassword() {
        var email = document.getElementById("email").value;

        if (email === "") {
            alert("Пожалуйста, введите ваш email.");
            return;
        }

        alert("Запрос на восстановление пароля отправлен на указанный email: " + email);
    }
</script>

</body>
</html>