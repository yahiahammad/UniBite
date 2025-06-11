document.addEventListener('DOMContentLoaded', () => {
    const verificationStatus = document.getElementById('verification-status');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        showError('Invalid verification link');
        return;
    }

    verifyEmail(token);
});

async function verifyEmail(token) {
    try {
        const response = await fetch(`/api/users/verify-email?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess(result.message);
            // Redirect to login page after 3 seconds
            setTimeout(() => {
                window.location.href = '/login';
            }, 3000);
        } else {
            showError(result.message);
        }
    } catch (error) {
        console.error('Verification error:', error);
        showError('An error occurred during verification. Please try again.');
    }
}

function showSuccess(message) {
    const verificationStatus = document.getElementById('verification-status');
    verificationStatus.innerHTML = `
        <div class="success-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
        </div>
        <p style="color: #4CAF50; margin-top: 20px;">${message}</p>
        <p style="color: #666; font-size: 14px; margin-top: 10px;">Redirecting to login page...</p>
    `;
}

function showError(message) {
    const verificationStatus = document.getElementById('verification-status');
    verificationStatus.innerHTML = `
        <div class="error-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e53935" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        <p style="color: #e53935; margin-top: 20px;">${message}</p>
        <a href="/login" style="color: #007bff; text-decoration: none; margin-top: 10px; display: inline-block;">
            Go to Login
        </a>
    `;
} 