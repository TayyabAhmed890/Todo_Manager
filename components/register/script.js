// The registration page manages form state and delegates account operations to auth.js.
import {
    getAuthErrorMessage,
    logoutUser,
    registerUser,
    showToast
} from "../../auth/auth.js";

const registerForm = document.querySelector("#register-form");
const nameInput = document.querySelector("#name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const confirmPasswordInput = document.querySelector("#confirm-password");
const passwordToggleButtons = registerForm.querySelectorAll(".password-toggle");
const registerButton = registerForm.querySelector('button[type="submit"]');
const registerButtonLabel = registerButton.querySelector(".button-label");
const registerStatusText = registerForm.querySelector(".form-status");
let registrationInProgress = false;

passwordToggleButtons.forEach((toggleButton) => {
    toggleButton.addEventListener("click", () => {
        const input = document.getElementById(toggleButton.getAttribute("aria-controls"));
        if (!input) {
            throw new Error("A password visibility control is missing its input.");
        }

        const isPasswordVisible = input.type === "text";
        input.type = isPasswordVisible ? "password" : "text";
        toggleButton.setAttribute(
            "aria-label",
            `${isPasswordVisible ? "Show" : "Hide"} ${input.id === "confirm-password" ? "confirm password" : "password"}`
        );
        toggleButton.setAttribute("aria-pressed", String(!isPasswordVisible));
    });
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (registrationInProgress) return;
    if (!registerForm.reportValidity()) return;

    if (!nameInput.value.trim()) {
        nameInput.setCustomValidity("Enter your name.");
        nameInput.reportValidity();
        nameInput.addEventListener("input", () => nameInput.setCustomValidity(""), { once: true });
        return;
    }

    if (passwordInput.value !== confirmPasswordInput.value) {
        confirmPasswordInput.setCustomValidity("Passwords do not match.");
        confirmPasswordInput.reportValidity();
        confirmPasswordInput.addEventListener(
            "input",
            () => confirmPasswordInput.setCustomValidity(""),
            { once: true }
        );
        return;
    }

    registrationInProgress = true;
    registerButton.disabled = true;
    registerButton.setAttribute("aria-busy", "true");
    registerButtonLabel.textContent = "Creating account...";
    registerStatusText.textContent = "Creating your account securely. Please wait.";
    registerForm.querySelectorAll("input").forEach((input) => {
        input.disabled = true;
    });
    passwordToggleButtons.forEach((button) => {
        button.disabled = true;
    });

    try {
        const { profileUpdateError } = await registerUser({
            email: emailInput.value,
            password: passwordInput.value,
            displayName: nameInput.value.trim()
        });

        if (profileUpdateError) {
            console.error("Account created, but the profile name could not be saved.", profileUpdateError);
        }

        // Registration signs the user in; sign out so the next step is an explicit login.
        let signOutError = null;
        registerButtonLabel.textContent = "Finishing setup...";
        registerStatusText.textContent = "Account created. Finishing setup...";
        try {
            await logoutUser();
        } catch (error) {
            signOutError = error;
            console.error("Account was created, but automatic sign-out failed.", error);
        }

        // Carry partial-setup warnings through the redirect so the login page can explain them.
        const status = profileUpdateError && signOutError
            ? "registered-profile-and-signout-warning"
            : profileUpdateError
                ? "registered-profile-warning"
                : signOutError
                    ? "registered-signout-warning"
                    : "registered";

        window.location.replace(`../login/index.html?status=${status}`);
    } catch (error) {
        showToast(getAuthErrorMessage(error), "error");
        registrationInProgress = false;
        registerButton.disabled = false;
        registerButton.setAttribute("aria-busy", "false");
        registerButtonLabel.textContent = "Create account";
        registerStatusText.textContent = "";
        registerForm.querySelectorAll("input").forEach((input) => {
            input.disabled = false;
        });
        passwordToggleButtons.forEach((button) => {
            button.disabled = false;
        });
    }
});
