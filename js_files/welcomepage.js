//function to show specific form all the code for the toggle classlist
function showForm(formId) {
    const forms = document.querySelectorAll(".form-box");
    forms.forEach(form => {
        form.classList.toggle("hidden", form.id !== formId);
    });
}

//event listener to the page loading
document.addEventListener("DOMContentLoaded", () => {
    // dom elements
    const btnLogin = document.getElementById("btn-login");
    const btnSignup = document.getElementById("btn-signup");
    const formContainer = document.getElementById("form-container");
    const passwordReset = document.getElementById("password_reset");
    const switchToSignup = document.getElementById("switch-to-signup");
    const switchToLogin = document.getElementById("switch-to-login");
    const switchToLoginReset = document.getElementById("switch-to-login-reset");
    const signupMsg = document.getElementById("signup-message");

    // show the login form
    btnLogin.addEventListener("click", () => {
        showForm("login-form");
        formContainer.classList.remove("hidden");
    });

    // show the signup form
    btnSignup.addEventListener("click", () => {
        showForm("signup-form");
        formContainer.classList.remove("hidden");
    });
 
    // switch to signup from login
    switchToSignup.addEventListener("click", () => {
        showForm("signup-form");
    });

    // switch to login from signup
    switchToLogin.addEventListener("click", () => {
        showForm("login-form");
    });

    // switch to login from reset password
    switchToLoginReset.addEventListener("click", () => {
        showForm("login-form");
    });

    // show reset password form
    passwordReset.addEventListener("click", () => {
        showForm("reset-password-form");
    });

    // hide & clear forms when clicking outside
    formContainer.addEventListener("click", (e) => {
        if (e.target !== formContainer) return; // proceed if the container itself is clicked

        const forms = Array.from(document.querySelectorAll(".form-box"));
        const hasEnteredData = forms.some(form => 
            Array.from(form.querySelectorAll("input")).some(input => input.value.trim() !== "")
        );

        // hide only if no data has been entered
        if (hasEnteredData) {
            const ok = confirm("Close the form? Unsaved data will be lost.");
            if (!ok) return; // if user cancels, do nothing
        }

        // hide all forms and clear inputs
        formContainer.classList.add("hidden");
        forms.forEach(form => {
            form.classList.add("hidden");
            form.querySelectorAll("input").forEach(input => input.value = "");
        });
    });

    // handles signup messages from URL parameters
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "success") {
        signupMsg.textContent = "Signup successful! You can now login.";
        signupMsg.style.color = "green";
        formContainer.classList.remove("hidden");
        showForm("login-form");

    } else if (params.get("error") === "userexists") {
        signupMsg.textContent = "Username already exists. Please choose another.";
        signupMsg.style.color = "red";
        formContainer.classList.remove("hidden");
        showForm("signup-form");
    }
});

