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