document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const submitButton = form.querySelector('button[type="submit"]');

    // Get token from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        alert('Invalid password reset link. Please request a new password reset link.');
        window.location.href = '/forgot-password';
        return;
    }

    // Toggle password visibility
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

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate password
        if (!passwordRegex.test(passwordInput.value)) {
            alert('Password must be at least 8 characters long and contain uppercase, lowercase, number and special character');
            return;
        }

        // Check if passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
            alert('Passwords do not match');
            return;
        }

        // Show loading state
        submitButton.classList.add('btn-loading');
        submitButton.disabled = true;

        try {
            // First verify the token
            const verifyResponse = await fetch('/api/users/verify-reset-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            if (!verifyResponse.ok) {
                throw new Error('Invalid or expired password reset token');
            }

            // Reset password
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
                // Show success message
                alert('Password has been reset successfully. Please login with your new password.');
                window.location.href = '/login';
            } else {
                // Show error message
                alert(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'An error occurred. Please try again.');
            if (error.message.includes('Invalid or expired')) {
                window.location.href = '/forgot-password';
            }
        } finally {
            // Remove loading state
            submitButton.classList.remove('btn-loading');
            submitButton.disabled = false;
        }
    });
}); 