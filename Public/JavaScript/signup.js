document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        
        const passwordInput = document.getElementById('password');
        const reqLength = document.getElementById('req-length');
        const reqUppercase = document.getElementById('req-uppercase');
        const reqLowercase = document.getElementById('req-lowercase');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');

        
        function updateRequirement(element, isValid) {
            const icon = element.querySelector('i');
            if (isValid) {
                icon.classList.remove('fa-times-circle', 'error');
                icon.classList.add('fa-check-circle', 'success');
            } else {
                icon.classList.remove('fa-check-circle', 'success');
                icon.classList.add('fa-times-circle', 'error');
            }
        }

        
        passwordInput.addEventListener('keyup', () => {
            const password = passwordInput.value;

            
            updateRequirement(reqLength, password.length >= 8);

            
            updateRequirement(reqUppercase, /[A-Z]/.test(password));

            
            updateRequirement(reqLowercase, /[a-z]/.test(password));

            
            updateRequirement(reqNumber, /\d/.test(password));

            
            updateRequirement(reqSpecial, /[@$!%*?&]/.test(password));
        });

        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            const passwordRepeat = document.getElementById('password-repeat').value;
            const phone = document.getElementById('phone').value;

            
            if (!passwordRegex.test(password)) {
                alert('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
                return;
            }

            
            if (password !== passwordRepeat) {
                alert('Passwords do not match.');
                return;
            }

            
            const submitButton = signupForm.querySelector('button[type="submit"]');
            submitButton.classList.add('btn-loading');
            submitButton.disabled = true;

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
            } finally {
                
                submitButton.classList.remove('btn-loading');
                submitButton.disabled = false;
            }
        });
    }
});
