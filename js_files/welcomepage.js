
// This script registers the click on the login btn to show the form.
document.getElementById("btn-login").addEventListener("click", () => {
    document.getElementById("form-container").classList.remove("hidden");
    document.getElementById("login-form").classList.remove("hidden");
    document.getElementById("signup-form").classList.add("hidden");
});

// This script registers the click on the signup btn to show the form.
document.getElementById("btn-signup").addEventListener("click", () => {
    document.getElementById("form-container").classList.remove("hidden");
    document.getElementById("signup-form").classList.remove("hidden");
    document.getElementById("login-form").classList.add("hidden");
});

//  This script switches to signup form after clicking Join Here.
document.getElementById("switch-to-signup").addEventListener("click", () => {
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("signup-form").classList.remove("hidden");
});

// This script switches to login form after clicking.
document.getElementById("switch-to-login").addEventListener("click", () => {
    document.getElementById("signup-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");
});

// This script closes the form when clicking outside of the form.
document.getElementById("form-container").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) {
        e.currentTarget.classList.add("hidden");
    }
});

