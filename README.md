# Todo Manager

A responsive, browser-based todo app for organizing personal tasks. Users can create
an account, manage their own todos, and keep their task list synchronized through
Firebase.

## Features

- **Account access:** Register and sign in with email and password, or sign in with
  Google. Includes password visibility controls and password-reset email flow.
- **Private todo lists:** Each signed-in user can only access their own todos.
- **Task management:** Add todos with a title, description, and High or Low priority;
  mark them complete, delete individual todos, or clear active/completed todos.
- **Live updates:** Firestore listeners keep the displayed list up to date.
- **Loading and recovery states:** Shows loading feedback and provides a retry action
  if the todo subscription fails.
- **Theme colors:** Select a color for the app's buttons. The choice is retained for
  the current browser tab.
- **Responsive interface:** Layout adapts to desktop and mobile screens.
- **Accessible feedback:** Form validation, keyboard focus indicators, and stacked
  toast notifications provide status and error messages.

## Technology stack

- **HTML5** for page structure
- **CSS3** for responsive layouts and styling
- **Vanilla JavaScript (ES modules)** for UI behavior and Firebase integration
- **Vite** for local development and production builds
- **Firebase Authentication** for email/password and Google sign-in
- **Cloud Firestore** for user-scoped todo storage, live updates, and persistent
  multi-tab local caching

## Requirements

- Node.js compatible with the Vite version in `package.json`
- A Firebase project with Authentication and Cloud Firestore enabled

## Firebase setup

1. In Firebase Console, enable **Email/Password** and **Google** under
   **Authentication → Sign-in method**.
2. Add the hostnames used by your local and deployed app under
   **Authentication → Settings → Authorized domains**.
3. Create a Cloud Firestore database.
4. Add the Firebase web app configuration values to a `.env` file in the project
   root. Use the variable names below:

   ```dotenv
   API_KEY=your_firebase_api_key
   AUTH_DOMAIN=your_project.firebaseapp.com
   PROJECT_ID=your_project_id
   STORAGE_BUCKET=your_project.appspot.com
   MESSAGING_SENDER_ID=your_sender_id
   APP_ID=your_app_id
   MEASUREMENT_ID=your_measurement_id
   ```

   `MEASUREMENT_ID` is optional. Do not commit `.env` or expose private server-side
   credentials. The Firebase web configuration is intended for client use; secure
   database access with Firestore rules.

5. Deploy [`firestore.rules`](./firestore.rules). These rules require authentication,
   restrict each user to their own todo subcollection, and validate todo fields.

## Run locally

Install dependencies and start the Vite development server:

```bash
npm install
npm run dev
```

Vite opens the login page. The main todo page is available at
`/main/index.html` after successful sign-in.

## Build for production

Create an optimized production build:

```bash
npm run build
```

The generated site is written to `dist/`. Deploy the contents of that directory to a
static web host, and ensure the deployed hostname is authorized in Firebase
Authentication.

## Data and privacy

Todos are stored at:

```text
users/{uid}/todos/{todoId}
```

Each todo contains a title (up to 120 characters), description (up to 1,000
characters), priority (`High` or `Low`), completion state, and creation timestamp.
Firestore rules enforce ownership and field validation; client-side validation is
not a replacement for deploying those rules.

The app enables Firestore's persistent local cache across tabs so previously loaded
data can render quickly. Legacy `todos_data` and `completed_todos` localStorage keys
are removed after a user signs in; they are not imported into Firestore.

## Project layout

```text
auth/                 Shared Firebase authentication and toast helpers
components/login/     Login page, styles, and form behavior
components/register/  Registration page, styles, and form behavior
init/                 Firebase app and Firestore initialization
main/                 Todo page, styles, and signed-in app behavior
services/             Firestore todo operations
firestore.rules       Firestore access and data validation rules
vite.config.mjs       Vite development and build configuration
```
