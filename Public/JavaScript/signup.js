document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const passwordRepeat = document.getElementById('password-repeat').value;
            const phone = document.getElementById('phone').value;

            if (password !== passwordRepeat) {
                alert('Passwords do not match.');
                return;
            }

            try {
                const response = await fetch('/api/users/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(result.message);
                    window.location.href = '/login';
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                alert('An error occurred during registration.');
                console.error('Signup Error:', error);
            }
        });
    }
});
