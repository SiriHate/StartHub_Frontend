document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const dateOfBirth = document.getElementById('date-of-birth').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!name || !email || !phone || !dateOfBirth || !username || !password || !confirmPassword) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Введите корректный email адрес.');
            return;
        }

        if (password.length < 8) {
            alert('Пароль должен содержать 8 или более символов.');
            return;
        }

        if (password !== confirmPassword) {
            alert('Пароли не совпадают.');
            return;
        }

        const data = {
            name: name,
            email: email,
            phone: phone,
            birthDay: dateOfBirth,
            username: username,
            password: password
        };

        fetch(CONFIG.base_api_url + '/api/v1/users/member/registration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                alert('Регистрация успешна!');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Произошла ошибка при регистрации.');
            });
    });

    function validateEmail(email) {
        const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return re.test(String(email).toLowerCase());
    }

    function redirectToAuthorization() {
        window.location.href = CONFIG.base_web_url + '/login.php';
    }

});
