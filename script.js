let title = document.getElementById("title");
let desc = document.getElementById("desc");
let btn = document.getElementById("create-todo");
let todoArea = document.getElementById("todos");
let completedArea = document.getElementById("completed");
let clearAllTodos = document.getElementById("clear-todos");
let clearCompleteTodos = document.getElementById("clear-complete-todos");
let msg = document.getElementById("active-msg");
let doneMsg = document.getElementById("done-msg");

let TodoDB = [];
let CompleteTodoDB = [];

function loadfromLocalStorage() {
  TodoDB = JSON.parse(localStorage.getItem("todos_data")) || [];
  CompleteTodoDB = JSON.parse(localStorage.getItem("completed_todos")) || [];
}

function saveLocalStorage() {
  localStorage.setItem("todos_data", JSON.stringify(TodoDB));
  localStorage.setItem("completed_todos", JSON.stringify(CompleteTodoDB));
}

function renderUI() {
  todoArea.querySelectorAll(".todo-card").forEach((card) => card.remove());
  completedArea.querySelectorAll(".todo-card").forEach((card) => card.remove());

  loadfromLocalStorage();

  TodoDB.forEach((todo) => createTodoDOM(todo, false));
  CompleteTodoDB.forEach((todo) => createTodoDOM(todo, true));

  if (TodoDB.length === 0) {
    msg.style.display = "block";
  } else {
    msg.style.display = "none";
  }

  if (CompleteTodoDB.length === 0) {
    doneMsg.style.display = "block";
  } else {
    doneMsg.style.display = "none";
  }
}

function HandleAddTodo() {
  // some validations
  if (title.value.trim() === "" || desc.value.trim() === "") return;

  // create object assign values
  const newTodo = {
    id: Math.floor(Math.random() * 100000),
    title: title.value,
    description: desc.value,
  };

  loadfromLocalStorage();

  // push the object into the array
  TodoDB.push(newTodo);

  saveLocalStorage();

  renderUI();

  // empty input fields
  title.value = "";
  desc.value = "";
}

// UI Part
function createTodoDOM(todoObj, isCompleted) {
  // create elements
  const wrapper = document.createElement("div");
  wrapper.className = "todo-card";

  const TodoTitle = document.createElement("h2");
  const TodoDesc = document.createElement("p");
  const Completed = document.createElement("input");
  const TodoDeleteBtn = document.createElement("button");

  Completed.type = "checkbox";
  Completed.checked = isCompleted;
  TodoDeleteBtn.innerText = "Delete";

  // add data
  TodoTitle.innerText = todoObj.title;
  TodoDesc.innerText = todoObj.description;

  // btn id equals to todo object id
  TodoDeleteBtn.dataset.id = todoObj.id;

  wrapper.appendChild(TodoTitle);
  wrapper.appendChild(TodoDesc);
  wrapper.appendChild(Completed);
  wrapper.appendChild(TodoDeleteBtn);
  todoArea.append(wrapper);

  if (isCompleted) {
    TodoTitle.style.textDecoration = "line-through";
    TodoDesc.style.textDecoration = "line-through";
    completedArea.append(wrapper);
  } else {
    todoArea.append(wrapper);
  }

  // complete task logic
  Completed.addEventListener("change", (event) => {
    loadfromLocalStorage();

    if (event.target.checked) {
      const idx = TodoDB.findIndex((elem) => elem.id === todoObj.id);

      if (idx !== -1) {
        let item = TodoDB.splice(idx, 1)[0];
        CompleteTodoDB.push(item);
      }
    } else {
      const idx = CompleteTodoDB.findIndex((elem) => elem.id === todoObj.id);
      if (idx !== -1) {
        let uncheckeditem = CompleteTodoDB.splice(idx, 1)[0];
        TodoDB.push(uncheckeditem);
      }
    }

    saveLocalStorage();
    renderUI();
  });

  // delete button logic
  TodoDeleteBtn.addEventListener("click", (event) => {
    loadfromLocalStorage();

    const activeIdx = TodoDB.findIndex((v) => v.id === todoObj.id);
    if (activeIdx !== -1) TodoDB.splice(activeIdx, 1);

    const compIdx = CompleteTodoDB.findIndex((v) => v.id === todoObj.id);
    if (compIdx !== -1) CompleteTodoDB.splice(compIdx, 1);

    saveLocalStorage();
    renderUI();
  });
}

// --- CLEAR BUTTONS LOGIC ---
clearAllTodos.addEventListener("click", () => {
  localStorage.removeItem("todos_data");
  renderUI(); // 🔄 UI auto sync
});

clearCompleteTodos.addEventListener("click", () => {
  localStorage.removeItem("completed_todos");
  renderUI(); // 🔄 UI auto sync
});

renderUI();

btn.addEventListener("click", HandleAddTodo);
