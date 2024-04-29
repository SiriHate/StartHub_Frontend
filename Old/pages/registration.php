<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Регистрация</title>
    <link rel="stylesheet" type="text/css" href="registration-form-styles.css">
</head>
<body>

<div class="container">
    <div class="form-container">
        <h2>Регистрация</h2>
        <form id="registration-form">
            <label for="email">Email:</label><br>
            <input type="text" id="email" name="email"><br>
            <label for="phone">Телефон:</label><br>
            <input type="text" id="phone" name="phone"><br>
            <label for="password">Пароль:</label><br>
            <input type="password" id="password" name="password"><br>
            <label for="confirmPassword">Повторите пароль:</label><br>
            <input type="password" id="confirmPassword" name="confirmPassword"><br>
            <label for="name">Полное имя:</label><br>
            <input type="text" id="name" name="name"><br>
            <label for="birthDay">Дата рождения:</label><br>
            <input type="date" id="birthDay" name="birthDay"><br><br>
            <button type="button" onclick="registration()">Зарегистрироваться</button>
            <p class="return-link"><a href="http://localhost/login.php">Вернуться к авторизации</a></p>
        </form>
    </div>
</div>

</body>
</html>
