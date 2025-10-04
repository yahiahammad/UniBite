/**
 * Email validation utility for UniBite application
 * This file contains shared email validation logic and configuration
 *
 * IMPORTANT: This configuration is shared across multiple pages:
 * - Login (auth.js)
 * - Sign Up (signup.js)
 *
 * To change the allowed email domain, update ALLOWED_EMAIL_DOMAIN constant below.
 *
 * @usage Include this script BEFORE any other scripts that depend on it
 */

// Configuration - change email domain here
const ALLOWED_EMAIL_DOMAIN = '@miuegypt.edu.eg';

/**
 * Validates if an email address ends with the allowed domain
 * @param {string} email - The email address to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

/**
 * Gets a user-friendly error message for invalid email
 * @returns {string} - Error message
 */
function getEmailErrorMessage() {
    return `Please use your MIU email address (${ALLOWED_EMAIL_DOMAIN})`;
}

/**
 * Legacy function - validates email from a form input with id="email"
 * @deprecated Use isValidEmail() instead for better flexibility
 */
function validateEmail() {
    let email = document.getElementById("email").value;
    let regex = /^[a-zA-Z0-9._%+-]+@miuegypt\.edu\.eg$/;

    if (!regex.test(email)) {
        alert("Invalid email. Please use an @miuegypt.edu.eg email.");
        return false;
    }
    return true;
}

function continueWithGoogle() {
    alert("Google login is not implemented yet!");
}

// Make functions available globally
window.UniBiteConfig = {
    ALLOWED_EMAIL_DOMAIN,
    isValidEmail,
    getEmailErrorMessage
};
