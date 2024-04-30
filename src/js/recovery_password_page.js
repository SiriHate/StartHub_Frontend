document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;

        if (!email) {
            alert('Пожалуйста, введите ваш email адрес.');
            return;
        }

        if (!validateEmail(email)) {
            alert('Введите корректный email адрес.');
            return;
        }

        fetch(CONFIG.base_api_url + '/api/v1/users/member/password_recovery/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Success:', data);
                alert('Запрос на восстановление пароля отправлен!');
            })
            .catch((error) => {
                console.error('Error:', error);
                alert('Произошла ошибка при отправке запроса на восстановление пароля.');
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
