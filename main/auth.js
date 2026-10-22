import {
    getAuthErrorMessage,
    logoutUser,
    showToast,
    subscribeToAuthState
} from "../auth/auth.js";
import { startTodoApp } from "./script.js";

const logoutButton = document.querySelector("#logout-button");
const userMenu = document.querySelector("#user-menu");
const userMenuButton = document.querySelector("#user-menu-button");
const userMenuPanel = document.querySelector("#user-menu-panel");
const userMenuName = document.querySelector("#user-menu-name");
const userMenuEmail = document.querySelector("#user-menu-email");
const colorPalette = document.querySelector("#parent-change-color");
let logoutInProgress = false;

// The old todo keys were shared across accounts; discard them instead of importing them.
function discardLegacyTodos() {
    try {
        localStorage.removeItem("todos_data");
        localStorage.removeItem("completed_todos");
    } catch (error) {
        console.error("Unable to discard the legacy local todo data.", error);
        showToast("Old local todos could not be removed from this browser.", "error");
    }
}

if (!logoutButton || !userMenu || !userMenuButton || !userMenuPanel || !userMenuName || !userMenuEmail) {
    throw new Error("The account menu is missing required elements from the main page.");
}

function closeUserMenu() {
    userMenuPanel.hidden = true;
    userMenuButton.setAttribute("aria-expanded", "false");
}

// Keep the account menu closed when focus moves outside it or Escape is pressed.
userMenuButton.addEventListener("click", () => {
    const isOpening = userMenuPanel.hidden;
    userMenuPanel.hidden = !isOpening;
    userMenuButton.setAttribute("aria-expanded", String(isOpening));
});

document.addEventListener("click", (event) => {
    if (!userMenu.contains(event.target) && !colorPalette.contains(event.target)) {
        closeUserMenu();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeUserMenu();
});

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutInProgress = true;

    try {
        await logoutUser();
        window.setTimeout(() => {
            window.location.replace("../components/login/index.html?status=logged-out");
        }, 100);
    } catch (error) {
        logoutInProgress = false;
        showToast(getAuthErrorMessage(error), "error");
        logoutButton.disabled = false;
    }
});

subscribeToAuthState(
    (user, sessionState) => {
        if (user) {
            logoutButton.disabled = false;
            userMenu.hidden = false;
            userMenuName.textContent = user.displayName || "Your account";
            userMenuEmail.textContent = user.email || "";
            userMenuButton.setAttribute(
                "aria-label",
                `Open account menu for ${user.displayName || user.email || "signed-in user"}`
            );
            discardLegacyTodos();

            const status = new URLSearchParams(window.location.search).get("status");
            const messages = {
                "logged-in": ["Logged in successfully.", "success"],
                registered: ["Logged in successfully.", "success"]
            };
            const notification = Object.prototype.hasOwnProperty.call(messages, status)
                ? messages[status]
                : null;
            if (notification) {
                showToast(notification[0], notification[1]);
                window.history.replaceState({}, "", window.location.pathname);
            }
            // Wait for the live todo listener before enabling account actions.
            try {
                startTodoApp(user.uid);
            } catch (error) {
                document.body.classList.remove("auth-pending");
                showToast(getAuthErrorMessage(error), "error");
                console.error("Unable to start the signed-in user's todo app.", error);
            }
            return;
        }

        if (logoutInProgress) return;
        userMenu.hidden = true;
        closeUserMenu();
        const loginUrl = sessionState?.expired
            ? "../components/login/index.html?status=session-expired"
            : "../components/login/index.html";
        window.location.replace(loginUrl);
    },
    (error) => {
        document.body.classList.remove("auth-pending");
        logoutButton.disabled = false;
        userMenu.hidden = true;
        showToast(getAuthErrorMessage(error), "error");
        console.error("Unable to determine the current Firebase user.", error);
    }
);
