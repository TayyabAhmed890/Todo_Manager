// The page owns form state; shared Firebase operations and error messaging live in auth.js.
import {
    getAuthErrorMessage,
    loginUser,
    loginWithGoogle,
    sendPasswordReset,
    showToast,
    subscribeToAuthState
} from "../../auth/auth.js";

const loginForm = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const passwordToggle = document.querySelector(".password-toggle");
const forgotPasswordLink = document.querySelector("#forgot-password-link");
const loginButton = loginForm.querySelector('button[type="submit"]');
const googleLoginButton = document.querySelector("#google-login-button");
const googleButtonLabel = googleLoginButton.querySelector(".google-button-label");
const loginButtonLabel = loginButton.querySelector(".button-label");
const loginStatusText = loginForm.querySelector(".form-status");
let passwordResetInProgress = false;
let loginInProgress = false;

function setLoginControlsDisabled(disabled) {
    loginButton.disabled = disabled;
    googleLoginButton.disabled = disabled;
    emailInput.disabled = disabled;
    passwordInput.disabled = disabled;
    passwordToggle.disabled = disabled;
    forgotPasswordLink.setAttribute("aria-disabled", String(disabled));
}

passwordToggle.addEventListener("click", () => {
    const isPasswordVisible = passwordInput.type === "text";
    passwordInput.type = isPasswordVisible ? "password" : "text";
    passwordToggle.setAttribute("aria-label", `${isPasswordVisible ? "Show" : "Hide"} password`);
    passwordToggle.setAttribute("aria-pressed", String(!isPasswordVisible));
});

const loginStatus = new URLSearchParams(window.location.search).get("status");
const loginStatusMessages = {
    "logged-out": ["You have been logged out.", "success"],
    "session-expired": ["Your session expired after 24 hours. Please sign in again.", "info"],
    registered: ["Your account was created successfully. Please log in.", "success"],
    "registered-profile-warning": [
        "Your account was created, but your name could not be saved. Please log in.",
        "error"
    ],
    "registered-signout-warning": [
        "Your account was created, but automatic sign-out failed. Please log in to continue.",
        "error"
    ],
    "registered-profile-and-signout-warning": [
        "Your account was created, but profile setup and sign-out were incomplete. Please check your account.",
        "error"
    ]
};
const statusMessage = Object.prototype.hasOwnProperty.call(loginStatusMessages, loginStatus)
    ? loginStatusMessages[loginStatus]
    : null;
if (statusMessage) {
    // Status parameters are one-time messages from registration and logout redirects.
    showToast(statusMessage[0], statusMessage[1]);
    window.history.replaceState({}, "", window.location.pathname);
}

subscribeToAuthState(
    (user, sessionState) => {
        if (user) {
            if (!loginInProgress) {
                window.location.replace("../../main/index.html");
            }
            return;
        }

        if (sessionState?.expired) {
            showToast("Your session expired after 24 hours. Please sign in again.", "info");
        }
    },
    (error) => {
        showToast(getAuthErrorMessage(error), "error");
        console.error("Unable to check the existing Firebase session.", error);
    }
);

forgotPasswordLink.addEventListener("click", async (event) => {
    event.preventDefault();

    if (passwordResetInProgress || loginInProgress) return;
    if (!emailInput.reportValidity()) {
        emailInput.focus();
        return;
    }

    passwordResetInProgress = true;
    forgotPasswordLink.setAttribute("aria-disabled", "true");

    try {
        await sendPasswordReset(emailInput.value);
        showToast(
            "If an account exists for this email, a password reset link has been sent.",
            "success"
        );
    } catch (error) {
        // Keep the response identical for unknown addresses to avoid account enumeration.
        if (error?.code === "auth/user-not-found") {
            showToast(
                "If an account exists for this email, a password reset link has been sent.",
                "success"
            );
        } else {
            showToast(getAuthErrorMessage(error), "error");
        }
    } finally {
        passwordResetInProgress = false;
        forgotPasswordLink.removeAttribute("aria-disabled");
    }
});

googleLoginButton.addEventListener("click", async () => {
    if (loginInProgress || passwordResetInProgress) return;

    loginInProgress = true;
    setLoginControlsDisabled(true);
    googleLoginButton.setAttribute("aria-busy", "true");
    googleButtonLabel.textContent = "Connecting to Google...";
    loginStatusText.textContent = "Signing in securely. Please wait.";

    try {
        await loginWithGoogle();
        window.location.replace("../../main/index.html?status=logged-in");
    } catch (error) {
        showToast(getAuthErrorMessage(error), "error");
        loginInProgress = false;
        setLoginControlsDisabled(false);
        googleLoginButton.setAttribute("aria-busy", "false");
        googleButtonLabel.textContent = "Continue with Google";
        loginStatusText.textContent = "";
    }
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (loginInProgress) return;
    if (!loginForm.reportValidity()) return;

    loginInProgress = true;
    // Lock the form while Firebase verifies credentials to prevent duplicate requests.
    setLoginControlsDisabled(true);
    loginButton.setAttribute("aria-busy", "true");
    loginButtonLabel.textContent = "Signing in...";
    loginStatusText.textContent = "Signing in securely. Please wait.";
    try {
        await loginUser({
            email: emailInput.value,
            password: passwordInput.value
        });

        window.setTimeout(() => {
            window.location.replace("../../main/index.html?status=logged-in");
        }, 900);
    } catch (error) {
        showToast(getAuthErrorMessage(error), "error");
        loginInProgress = false;
        setLoginControlsDisabled(false);
        loginButton.setAttribute("aria-busy", "false");
        loginButtonLabel.textContent = "Log in";
        loginStatusText.textContent = "";
    }
});
