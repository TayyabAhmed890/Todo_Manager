let title = document.getElementById("title");
let desc = document.getElementById("desc");
let btn = document.getElementById("create-todo");
let todoArea = document.getElementById("todos");
let completedArea = document.getElementById("completed");
let clearAllTodos = document.getElementById("clear-todos");
let clearCompleteTodos = document.getElementById("clear-complete-todos");
let msg = document.getElementById("active-msg");
let doneMsg = document.getElementById("done-msg");

let changeColor1 = document.querySelector(".change-color1");
let changeColor2 = document.querySelector(".change-color2");
let changeColor3 = document.querySelector(".change-color3");

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

let activeTodosContainer;
let completedTodosContainer;

function renderUI() {
  todoArea.querySelectorAll(".todo-parent").forEach((card) => card.remove());
  completedArea
    .querySelectorAll(".todo-parent")
    .forEach((card) => card.remove());

  loadfromLocalStorage();

  activeTodosContainer = document.createElement("div");
  activeTodosContainer.className = "todo-parent";

  completedTodosContainer = document.createElement("div");
  completedTodosContainer.className = "todo-parent";

  todoArea.append(activeTodosContainer);
  completedArea.append(completedTodosContainer);

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

  applySavedColor();
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

  const text = document.createElement("div");
  text.className = "todo-text";
  const TodoTitle = document.createElement("h2");
  const TodoDesc = document.createElement("p");
  const actions = document.createElement("div");
  actions.className = "todo-actions";
  const TodoDeleteBtn = document.createElement("button");

  const checkLabel = document.createElement("label");
  checkLabel.className = "check";

  const customCheckmark = document.createElement("span");
  customCheckmark.className = "checkmark";

  const Completed = document.createElement("input");
  Completed.type = "checkbox";
  Completed.checked = isCompleted;

  TodoDeleteBtn.innerText = "Delete";
  TodoDeleteBtn.className = "Delete-btn";

  checkLabel.appendChild(Completed);
  checkLabel.appendChild(customCheckmark);

  // add data
  TodoTitle.innerText = todoObj.title;
  TodoDesc.innerText = todoObj.description;

  // btn id equals to todo object id
  TodoDeleteBtn.dataset.id = todoObj.id;

  let currentSavedColor = sessionStorage.getItem("selected_theme");
  if (currentSavedColor) {
    TodoDeleteBtn.style.backgroundColor = currentSavedColor;
  }

  text.appendChild(TodoTitle);
  text.appendChild(TodoDesc);
  actions.appendChild(TodoDeleteBtn);
  actions.appendChild(checkLabel);
  wrapper.appendChild(text);
  wrapper.appendChild(actions);

  if (isCompleted) {
    TodoTitle.style.textDecoration = "line-through";
    TodoDesc.style.textDecoration = "line-through";
    completedTodosContainer.append(wrapper);
  } else {
    activeTodosContainer.append(wrapper);
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
  TodoDB = [];
  renderUI(); // 🔄 UI auto sync
});

clearCompleteTodos.addEventListener("click", () => {
  localStorage.removeItem("completed_todos");
  CompleteTodoDB = [];
  renderUI(); // 🔄 UI auto sync
});

function changeAppButtonsColor(color) {
  let AllBtns = document.querySelectorAll("button");
  AllBtns.forEach((btn) => {
    btn.style.backgroundColor = color;
  });
}

function resetActiveScale(){
  changeColor1.classList.remove('active')
  changeColor2.classList.remove('active')
  changeColor3.classList.remove('active')
}

changeColor1.addEventListener("click", () => {
  sessionStorage.setItem("selected_theme", "lightblue");
  changeAppButtonsColor("lightblue");

  resetActiveScale();
  changeColor1.classList.add('active')
});
changeColor2.addEventListener("click", () => {
  sessionStorage.setItem("selected_theme", "lightgreen");
  changeAppButtonsColor("lightgreen");

  resetActiveScale();
  changeColor2.classList.add('active')
});
changeColor3.addEventListener("click", () => {
  sessionStorage.setItem("selected_theme", "lightpink");
  changeAppButtonsColor("lightpink");

  resetActiveScale();
  changeColor3.classList.add('active')
});


function applySavedColor() {
  let savedColor = sessionStorage.getItem("selected_theme");
  if (savedColor) {
    changeAppButtonsColor(savedColor);
  }
  
  resetActiveScale()

  if(savedColor === "lightblue"){
    changeColor1.classList.add("active")
  }else if(savedColor === "lightgreen"){
    changeColor2.classList.add("active") 
  }
  else if(savedColor === "lightpink"){
    changeColor3.classList.add("active")
  }
}

renderUI();

btn.addEventListener("click", HandleAddTodo);
