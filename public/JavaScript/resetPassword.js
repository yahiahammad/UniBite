document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = form.querySelector('button[type="submit"]');

    
    const reqLength = document.getElementById('req-length');
    const reqUppercase = document.getElementById('req-uppercase');
    const reqLowercase = document.getElementById('req-lowercase');
    const reqNumber = document.getElementById('req-number');
    const reqSpecial = document.getElementById('req-special');

    
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Invalid password reset link. Please request a new password reset link.');
        window.location.href = '/forgot-password';
        return;
    }

    
    verifyToken();

    
    const toggleButtons = document.querySelectorAll('.password-toggle');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            button.querySelector('i').classList.toggle('fa-eye');
            button.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    
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

    
    async function verifyToken() {
        try {
            const response = await fetch('/api/users/verify-reset-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            if (!response.ok) {
                const data = await response.json();
                alert(data.message || 'Invalid or expired password reset link. Please request a new one.');
                window.location.href = '/forgot-password';
                return false;
            }
            return true;
        } catch (error) {
            console.error('Token verification error:', error);
            alert('Error verifying reset token. Please try again.');
            window.location.href = '/forgot-password';
            return false;
        }
    }

    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        
        if (!passwordRegex.test(passwordInput.value)) {
            alert('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
            return;
        }

        
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Passwords do not match');
            return;
        }

        
        submitButton.classList.add('btn-loading');
        submitButton.disabled = true;

        try {
            
            const isTokenValid = await verifyToken();
            if (!isTokenValid) {
                return;
            }

            
            const response = await fetch('/api/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token,
                    password: passwordInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                
                alert('Password has been reset successfully. Please login with your new password.');
                window.location.href = '/login';
            } else {
                
                alert(data.message || 'An error occurred. Please try again.');
                if (data.message.includes('Invalid or expired')) {
                    window.location.href = '/forgot-password';
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred. Please try again.');
            if (error.message.includes('Invalid or expired')) {
                window.location.href = '/forgot-password';
            }
        } finally {
            
            submitButton.classList.remove('btn-loading');
            submitButton.disabled = false;
        }
    });
}); 