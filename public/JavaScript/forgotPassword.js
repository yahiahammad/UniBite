document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const submitButton = form.querySelector('button[type="submit"]');

    
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        
        submitButton.classList.add('btn-loading');
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/users/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                
                alert('Password reset link has been sent to your email. Please check your inbox.');
                window.location.href = '/login';
            } else {
                
                alert(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        } finally {
            
            submitButton.classList.remove('btn-loading');
            submitButton.disabled = false;
        }
    });
}); 