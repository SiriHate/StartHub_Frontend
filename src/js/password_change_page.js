document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const newPassword = document.getElementById('new-password').value;
        const confirmNewPassword = document.getElementById('confirm-new-password').value;

        if (!newPassword || !confirmNewPassword) {
            alert('Пожалуйста, заполните все поля для ввода пароля.');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('Пароли не совпадают.');
            return;
        }

        const data = {
            newPassword: newPassword
        };

        fetch(CONFIG.base_api_url + '/api/v1/users/member/password_recovery/confirm', {
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
                console.log('Success:', data);
                alert('Ваш пароль успешно изменён.');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Произошла ошибка при изменении пароля.');
            });

    });

    function redirectToAuthorization() {
        window.location.href = CONFIG.base_web_url + '/login.php';
    }

});
