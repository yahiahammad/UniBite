document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');

    if (signupForm) {
        // Password requirement elements
        const passwordInput = document.getElementById('password');
        const reqLength = document.getElementById('req-length');
        const reqUppercase = document.getElementById('req-uppercase');
        const reqLowercase = document.getElementById('req-lowercase');
        const reqNumber = document.getElementById('req-number');
        const reqSpecial = document.getElementById('req-special');

        // Function to update requirement icon and style
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

        // Password validation on keyup
        passwordInput.addEventListener('keyup', () => {
            const password = passwordInput.value;

            // Validate length
            updateRequirement(reqLength, password.length >= 8);

            // Validate uppercase
            updateRequirement(reqUppercase, /[A-Z]/.test(password));

            // Validate lowercase
            updateRequirement(reqLowercase, /[a-z]/.test(password));

            // Validate number
            updateRequirement(reqNumber, /\d/.test(password));

            // Validate special character
            updateRequirement(reqSpecial, /[@$!%*?&]/.test(password));
        });

        // Password validation regex
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = passwordInput.value;
            const passwordRepeat = document.getElementById('password-repeat').value;
            const phone = document.getElementById('phone').value;

            // Validate password complexity
            if (!passwordRegex.test(password)) {
                alert('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
                return;
            }

            // Check if passwords match
            if (password !== passwordRepeat) {
                alert('Passwords do not match.');
                return;
            }

            // Show loading state
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
                // Remove loading state
                submitButton.classList.remove('btn-loading');
                submitButton.disabled = false;
            }
        });
    }
});
