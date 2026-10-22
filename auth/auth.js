import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import app from "../init/firebase.js";

export const auth = getAuth(app);

class AuthValidationError extends Error {}

function normalizeEmail(email) {
  if (typeof email !== "string" || !email.trim()) {
    throw new AuthValidationError("Enter your email address.");
  }

  const normalizedEmail = email.trim();
  if (normalizedEmail.length > 254) {
    throw new AuthValidationError("Your email address must be 254 characters or fewer.");
  }
  return normalizedEmail;
}

function validatePassword(password, minimumLength = 1) {
  if (typeof password !== "string" || password.length < minimumLength) {
    throw new AuthValidationError(
      minimumLength > 1
        ? `Your password must be at least ${minimumLength} characters.`
        : "Enter your password."
    );
  }
}

/** Create an account; report profile-name failure separately from account creation. */
export async function registerUser(options = {}) {
  if (!options || typeof options !== "object") {
    throw new AuthValidationError("Enter your account details.");
  }

  const { email, password, displayName = "" } = options;
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password, 6);
  if (password.length > 4096) {
    throw new AuthValidationError("Your password must be 4096 characters or fewer.");
  }
  if (typeof displayName !== "string" || displayName.trim().length > 100) {
    throw new AuthValidationError("Your name must be 100 characters or fewer.");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  const normalizedName = displayName.trim();
  if (!normalizedName) {
    return { user: credential.user, profileUpdateError: null };
  }

  // Account creation already succeeded; keep it successful if this optional update fails.
  try {
    await updateProfile(credential.user, { displayName: normalizedName });
    return { user: credential.user, profileUpdateError: null };
  } catch (profileUpdateError) {
    return { user: credential.user, profileUpdateError };
  }
}

/** Validate credentials before passing them to Firebase. */
export async function loginUser(options = {}) {
  if (!options || typeof options !== "object") {
    throw new AuthValidationError("Enter your email and password.");
  }

  const { email, password } = options;
  const normalizedEmail = normalizeEmail(email);
  validatePassword(password);
  if (password.length > 4096) {
    throw new AuthValidationError("Your password must be 4096 characters or fewer.");
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );

  return credential.user;
}

/** Sign in with a Google account through Firebase Authentication. */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  return credential.user;
}

/** Ask Firebase to send a password-reset email for a validated address. */
export async function sendPasswordReset(email) {
  const normalizedEmail = normalizeEmail(email);
  await sendPasswordResetEmail(auth, normalizedEmail);
}

export async function logoutUser() {
  await signOut(auth);
}

/** Observe auth changes and return Firebase's unsubscribe callback. */
export function subscribeToAuthState(onChange, onError) {
  if (typeof onChange !== "function") {
    throw new TypeError("An auth state callback is required.");
  }
  if (onError !== undefined && typeof onError !== "function") {
    throw new TypeError("The auth error callback must be a function.");
  }

  return onAuthStateChanged(auth, onChange, onError);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function isUserLoggedIn() {
  return getCurrentUser() !== null;
}

/** Map known Firebase/Firestore errors to user-facing messages. */
export function getAuthErrorMessage(error) {
  if (error instanceof AuthValidationError) {
    return error.message;
  }

  const messages = {
    "auth/email-already-in-use": "An account already exists with this email.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Choose a stronger password with at least 6 characters.",
    "auth/operation-not-allowed": "This sign-in method is not enabled in Firebase.",
    "auth/popup-blocked": "Allow popups for this site, then try Google sign-in again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/cancelled-popup-request": "Another sign-in window is already open.",
    "auth/unauthorized-domain": "This website domain is not authorized for Firebase sign-in.",
    "auth/account-exists-with-different-credential": "An account already exists with this email. Sign in using your original method.",
    "auth/user-disabled": "This account has been disabled. Contact support.",
    "auth/user-not-found": "No account was found with those credentials.",
    "auth/wrong-password": "The email or password is incorrect.",
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/invalid-login-credentials": "The email or password is incorrect.",
    "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/requires-recent-login": "Please log in again before performing this action.",
    "auth/invalid-continue-uri": "The password reset redirect URL is invalid.",
    "auth/unauthorized-continue-uri": "The password reset redirect domain is not authorized.",
    "permission-denied": "You do not have permission to access these todos. Check the Firestore security rules.",
    "unavailable": "Firestore is temporarily unavailable. Check your connection and try again.",
    "failed-precondition": "Firestore is not ready for this request. Check the Firebase project configuration.",
    "resource-exhausted": "Firestore is receiving too many requests. Please wait and try again."
  };

  return Object.prototype.hasOwnProperty.call(messages, error?.code)
    ? messages[error.code]
    : "Something went wrong. Please try again.";
}

const toastTimers = new WeakMap();

// The exit transition needs to finish before the toast is removed from the stack.
function dismissToast(toast) {
  const timers = toastTimers.get(toast);
  if (!timers) return;

  window.clearTimeout(timers.dismiss);
  window.clearTimeout(timers.remove);
  toast.classList.remove("show");
  timers.remove = window.setTimeout(() => {
    toast.remove();
    toastTimers.delete(toast);
  }, 350);
}

// Reuse one shared stack so simultaneous notifications remain ordered.
function createToastContainer() {
  let container = document.querySelector("#notification-container");
  if (container) return container;

  container = document.createElement("div");
  container.id = "notification-container";
  container.className = "notification-container";
  container.setAttribute("aria-label", "Notifications");
  document.body.append(container);
  return container;
}

/** Add an accessible notification that dismisses itself after a short delay. */
export function showToast(message, type = "info") {
  if (typeof message !== "string" || !message.trim()) {
    throw new TypeError("Toast message must be a non-empty string.");
  }
  if (!["success", "error", "info"].includes(type)) {
    throw new TypeError("Toast type must be success, error, or info.");
  }

  if (!document.body) {
    throw new Error("Cannot display a notification before the document body is ready.");
  }

  const toast = document.createElement("div");
  toast.className = `notification notification-${type}`;
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
  const text = document.createElement("span");
  text.className = "notification-message";
  text.textContent = message;
  toast.append(text);
  createToastContainer().append(toast);

  requestAnimationFrame(() => toast.classList.add("show"));

  const duration = type === "error" ? 6000 : 4000;
  toastTimers.set(toast, {
    dismiss: window.setTimeout(() => dismissToast(toast), duration),
    remove: null
  });

  return toast;
}