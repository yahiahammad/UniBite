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

            
                                    // Validate MIU email using shared configuration
            if (
                !window.UniBiteConfig ||
                typeof window.UniBiteConfig.isValidEmail !== 'function' ||
                typeof window.UniBiteConfig.getEmailErrorMessage !== 'function'
            ) {
                alert('Email validation configuration is missing. Please try again later.');
                return;
            }
            if (!window.UniBiteConfig.isValidEmail(email)) {
                alert(window.UniBiteConfig.getEmailErrorMessage());
                return;
            }

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

                let result;
                const ct = response.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    result = await response.json();
                } else {
                    const text = await response.text();
                    result = { message: text.slice(0, 200) || 'Unexpected response' };
                }

                if (response.ok) {
                    alert(result.message || 'Registered successfully! Please verify your email.');
                    window.location.href = '/login';
                } else {
                    const msg = result && result.message ? result.message : `Registration failed (HTTP ${response.status})`;
                    alert(`Error: ${msg}`);
                }
            } catch (error) {
                console.error('Signup Error (network or parse):', error);
                alert('An error occurred during registration. Please try again.');
            } finally {
                
                submitButton.classList.remove('btn-loading');
                submitButton.disabled = false;
            }
        });
    }
});