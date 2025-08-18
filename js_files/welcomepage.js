//function to group all the code for the toggle classlist
function showForm(formId) {
    // get all the ids for the forms
    const forms = ["login-form", "signup-form", "reset-password-form"];
    document.getElementById("form-container").classList.remove("hidden");
    // loop through the forms and hide them
    forms.forEach(id => {
        const form = document.getElementById(id);
        if(form) {
            if (id === formId) {
                form.classList.remove("hidden");
            } else {
                form.classList.add("hidden");
            }
        }
    });
}

// event listener for the login button click
document.getElementById("btn-login").addEventListener("click", () => {
    showForm("login-form");
});

// event listener for the signup button click
document.getElementById("btn-signup").addEventListener("click", () => {
    showForm("signup-form");
});

// switch-forms from login to signup
document.getElementById("switch-to-signup").addEventListener("click", () => {
    showForm("signup-form");
});

// switch-forms from signup to login
document.getElementById("switch-to-login").addEventListener("click", () => {
    showForm("login-form");
});

// hide and clear the forms, with a warning
document.getElementById("form-container").addEventListener("click", (e) => {
    // Only act when clicking the backdrop (outside the forms)
    if (e.target !== e.currentTarget) return;

    const forms = ["login-form", "signup-form", "reset-password-form"]
        .map(id => document.getElementById(id)).filter(Boolean);
        // check if any input has user-entered data
        const hasEnteredData = forms.some(form =>
        Array.from(form.querySelectorAll("input")).some(input => input.value.trim() !== "")
    );

    // If there's data, confirm before closing; cancel should abort the close
    if (hasEnteredData) {
        const ok = confirm("Close the form? Any entered data will be lost.");
        if (!ok) return;
    }

    // Close the form and clear inputs
    e.currentTarget.classList.add("hidden");
    forms.forEach(form => {
        form.classList.add("hidden");
        form.querySelectorAll("input").forEach(input => {
            input.value = ""; 
        });
    });
});


// click event for password reset form
document.getElementById("password_reset").addEventListener("click", () => {
    showForm("reset-password-form");
});

// switch forms from reset password to login
document.getElementById("switch-to-login-reset").addEventListener("click", () => {
    showForm("login-form");
});