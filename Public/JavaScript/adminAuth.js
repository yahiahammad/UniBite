document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const togglePassword = document.getElementById('togglePassword');
    const submitButton = document.getElementById('submitButton');

    
    togglePassword?.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        
        const eyeIcon = togglePassword.querySelector('.eye-icon');
        if (type === 'text') {
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        } else {
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        }
    });

    
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
        clearErrors();
        
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }

        try {
            
            submitButton.disabled = true;
            submitButton.textContent = 'Logging in...';

            
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            
            if (data.token) {
                localStorage.setItem('token', data.token);
            }

            
            window.location.href = data.redirectUrl || '/admin';
        } catch (error) {
            showError(error.message || 'Invalid email or password');
        } finally {
            
            submitButton.disabled = false;
            submitButton.textContent = 'Login to Dashboard';
        }
    });

    
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        loginForm.insertBefore(errorDiv, submitButton);
    }

    
    function clearErrors() {
        const errorMessages = loginForm.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
    }
}); 