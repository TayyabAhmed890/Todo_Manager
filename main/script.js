import { getAuthErrorMessage, showToast } from "../auth/auth.js";
import {
  clearTodos,
  createTodo,
  removeTodo,
  setTodoCompleted,
  subscribeToTodos
} from "../services/todoService.js";

const titleInput = document.querySelector("#title");
const descriptionInput = document.querySelector("#desc");
const priorityInput = document.querySelector("#priority");
const todoForm = document.querySelector("#todo-input");
const addTodoButton = document.querySelector("#create-todo");
const retryTodosButton = document.querySelector("#retry-todos");
const todoError = document.querySelector("#todo-error");
const todoErrorMessage = document.querySelector("#todo-error-message");
const activeTodosSection = document.querySelector("#todos");
const completedTodosSection = document.querySelector("#completed");
const clearActiveButton = document.querySelector("#clear-todos");
const clearCompletedButton = document.querySelector("#clear-complete-todos");
const activeEmptyMessage = document.querySelector("#active-msg");
const completedEmptyMessage = document.querySelector("#done-msg");
const todoLoading = document.querySelector("#todo-loading");
const themeButtons = document.querySelectorAll(".theme-swatch");
const selectedThemeName = document.querySelector("#selected-theme-name");
const themes = {
  classic: "#ffffff",
  skyblue: "skyblue",
  aquamarine: "aquamarine",
  lightsalmon: "lightsalmon"
};

// Keep display labels and color values keyed by the same persisted theme name.
const themeLabels = {
  classic: "Classic",
  skyblue: "Sky blue",
  aquamarine: "Aquamarine",
  lightsalmon: "Salmon"
};

let activeTodosContainer;
let completedTodosContainer;
let todos = [];
let currentUserId;
let unsubscribeFromTodos;
let subscriptionStarted = false;
let subscriptionGeneration = 0;
let todoCreationInProgress = false;
let todoAppReady = false;

// Prevent writes until the first listener snapshot confirms the current account is ready.
function setButtonsDisabled(disabled) {
  [
    addTodoButton,
    clearActiveButton,
    clearCompletedButton
  ].forEach((button) => {
    button.disabled = disabled;
  });
}

function getSavedTheme() {
  try {
    return sessionStorage.getItem("selected_theme");
  } catch (error) {
    console.error("Unable to read the selected theme from session storage.", error);
    return null;
  }
}

function saveTheme(theme) {
  try {
    sessionStorage.setItem("selected_theme", theme);
  } catch (error) {
    showToast("The theme could not be saved for this tab.", "error");
    console.error("Unable to save the selected theme in session storage.", error);
  }
}

function applyTheme(theme) {
  const selectedTheme = Object.prototype.hasOwnProperty.call(themes, theme)
    ? theme
    : "classic";
  const buttonColor = themes[selectedTheme];

  document.querySelectorAll(".btn, .Delete-btn").forEach((button) => {
    button.style.backgroundColor = buttonColor;
  });

  themeButtons.forEach((button) => {
    const isSelected = button.dataset.theme === selectedTheme;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
  selectedThemeName.textContent = themeLabels[selectedTheme];
}

function createTodoCard(todo) {
  const card = document.createElement("article");
  card.className = "todo-card";

  const priority = document.createElement("p");
  priority.className = "todo-priority";
  priority.textContent = todo.priority;
  priority.style.color = todo.priority === "High" ? "red" : "green";
  priority.style.backgroundColor = todo.priority === "High" ? "lightpink" : "lightgreen";

  const text = document.createElement("div");
  text.className = "todo-text";

  const todoTitle = document.createElement("h2");
  todoTitle.textContent = todo.title;
  const todoDescription = document.createElement("p");
  todoDescription.textContent = todo.description;

  if (todo.completed) {
    todoTitle.style.textDecoration = "line-through";
    todoDescription.style.textDecoration = "line-through";
  }
  text.append(todoTitle, todoDescription);

  const actions = document.createElement("div");
  actions.className = "todo-actions";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "Delete-btn";
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", async () => {
    deleteButton.disabled = true;
    try {
      await removeTodo(currentUserId, todo.id);
      showToast("Todo deleted.", "success");
    } catch (error) {
      deleteButton.disabled = false;
      showToast(getAuthErrorMessage(error), "error");
    }
  });

  const checkLabel = document.createElement("label");
  checkLabel.className = "check";
  checkLabel.setAttribute(
    "aria-label",
    `${todo.completed ? "Mark incomplete" : "Mark complete"}: ${todo.title}`
  );

  const completedCheckbox = document.createElement("input");
  completedCheckbox.type = "checkbox";
  completedCheckbox.checked = todo.completed;
  completedCheckbox.addEventListener("change", async () => {
    completedCheckbox.disabled = true;
    try {
      await setTodoCompleted(currentUserId, todo.id, completedCheckbox.checked);
    } catch (error) {
      completedCheckbox.checked = todo.completed;
      completedCheckbox.disabled = false;
      showToast(getAuthErrorMessage(error), "error");
    }
  });

  const checkmark = document.createElement("span");
  checkmark.className = "checkmark";
  checkLabel.append(completedCheckbox, checkmark);
  actions.append(deleteButton, checkLabel);
  card.append(priority, text, actions);

  return card;
}

function renderTodos() {
  activeTodosContainer.replaceChildren();
  completedTodosContainer.replaceChildren();

  const activeTodos = todos.filter((todo) => !todo.completed);
  const completedTodos = todos.filter((todo) => todo.completed);

  activeTodos.forEach((todo) => activeTodosContainer.append(createTodoCard(todo)));
  completedTodos.forEach((todo) => completedTodosContainer.append(createTodoCard(todo)));

  activeEmptyMessage.hidden = activeTodos.length > 0;
  completedEmptyMessage.hidden = completedTodos.length > 0;
  applyTheme(getSavedTheme());
}

function renderTodoContainers() {
  activeTodosSection.querySelectorAll(".todo-parent").forEach((element) => element.remove());
  completedTodosSection.querySelectorAll(".todo-parent").forEach((element) => element.remove());

  activeTodosContainer = document.createElement("div");
  activeTodosContainer.className = "todo-parent";
  completedTodosContainer = document.createElement("div");
  completedTodosContainer.className = "todo-parent";
  activeTodosSection.append(activeTodosContainer);
  completedTodosSection.append(completedTodosContainer);
}

async function handleCreateTodo(event) {
  event.preventDefault();
  if (todoCreationInProgress || !todoForm.reportValidity()) return;
  if (!titleInput.value.trim()) {
    titleInput.setCustomValidity("Enter a title.");
    titleInput.reportValidity();
    titleInput.addEventListener("input", () => titleInput.setCustomValidity(""), { once: true });
    return;
  }
  if (!descriptionInput.value.trim()) {
    descriptionInput.setCustomValidity("Enter a description.");
    descriptionInput.reportValidity();
    descriptionInput.addEventListener(
      "input",
      () => descriptionInput.setCustomValidity(""),
      { once: true }
    );
    return;
  }
  if (!todoAppReady || !currentUserId) {
    showToast("Your account is not ready. Refresh the page and try again.", "error");
    return;
  }

  const todoInput = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    priority: priorityInput.value
  };

  todoCreationInProgress = true;
  titleInput.value = "";
  descriptionInput.value = "";
  priorityInput.value = "";
  addTodoButton.disabled = true;
  showToast("Saving your todo...", "info");

  try {
    await createTodo(currentUserId, todoInput);
    showToast("Todo added successfully.", "success");
  } catch (error) {
    // Preserve the failed submission without overwriting any new input the user entered.
    if (
      !titleInput.value
      && !descriptionInput.value
      && !priorityInput.value
    ) {
      titleInput.value = todoInput.title;
      descriptionInput.value = todoInput.description;
      priorityInput.value = todoInput.priority;
    }
    showToast(getAuthErrorMessage(error), "error");
  } finally {
    todoCreationInProgress = false;
    addTodoButton.disabled = !todoAppReady;
  }
}

async function handleClearTodos(completed) {
  if (!todoAppReady || !currentUserId) return;
  const button = completed ? clearCompletedButton : clearActiveButton;
  button.disabled = true;

  try {
    const deletedCount = await clearTodos(currentUserId, completed);
    showToast(
      deletedCount
        ? `${deletedCount} ${completed ? "completed" : "active"} todo${deletedCount === 1 ? "" : "s"} deleted.`
        : `There are no ${completed ? "completed" : "active"} todos to clear.`,
      deletedCount ? "success" : "info"
    );
  } catch (error) {
    showToast(getAuthErrorMessage(error), "error");
  } finally {
    button.disabled = !todoAppReady;
  }
}

function handleTodoSubscriptionError(error) {
  subscriptionGeneration += 1;
  subscriptionStarted = false;
  todoAppReady = false;
  unsubscribeFromTodos?.();
  unsubscribeFromTodos = undefined;
  todoLoading.hidden = true;
  todoErrorMessage.textContent = getAuthErrorMessage(error);
  todoError.hidden = false;
  document.body.classList.remove("auth-pending");
  setButtonsDisabled(true);
  showToast(getAuthErrorMessage(error), "error");
  console.error("Unable to load this user's todos from Firestore.", error);
}

/**
 * Start the live, user-scoped Firestore subscription after Firebase confirms auth.
 * Calling this again for the same session is safe; a changed UID replaces the listener.
 */
export function startTodoApp(userId) {
  if (!userId) {
    throw new TypeError("A signed-in user's ID is required to start the todo app.");
  }
  if (subscriptionStarted && userId === currentUserId) return;

  unsubscribeFromTodos?.();
  currentUserId = userId;
  subscriptionStarted = false;
  todoAppReady = false;
  // Ignore callbacks from older listeners if auth changes or the user retries.
  const generation = ++subscriptionGeneration;
  todos = [];
  todoLoading.hidden = false;
  todoError.hidden = true;
  document.body.classList.add("auth-pending");
  setButtonsDisabled(true);
  renderTodoContainers();

  try {
    unsubscribeFromTodos = subscribeToTodos(
      userId,
      (userTodos) => {
        if (generation !== subscriptionGeneration) return;
        todos = userTodos;
        renderTodos();
        todoAppReady = true;
        setButtonsDisabled(false);
        todoLoading.hidden = true;
        document.body.classList.remove("auth-pending");
      },
      (error) => {
        if (generation === subscriptionGeneration) {
          handleTodoSubscriptionError(error);
        }
      }
    );
    subscriptionStarted = true;
  } catch (error) {
    if (generation === subscriptionGeneration) {
      handleTodoSubscriptionError(error);
    }
  }
}

todoForm.addEventListener("submit", handleCreateTodo);
retryTodosButton.addEventListener("click", () => {
  if (currentUserId) startTodoApp(currentUserId);
});
clearActiveButton.addEventListener("click", () => handleClearTodos(false));
clearCompletedButton.addEventListener("click", () => handleClearTodos(true));

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTheme = button.dataset.theme;
    if (!Object.prototype.hasOwnProperty.call(themes, selectedTheme)) return;

    saveTheme(selectedTheme);
    applyTheme(selectedTheme);
  });
});

applyTheme(getSavedTheme() || "classic");
