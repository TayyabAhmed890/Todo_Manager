let title = document.getElementById("title");
let desc = document.getElementById("desc");
let btn = document.getElementById("create-todo");
let todoArea = document.getElementById("todos");
let completedArea = document.getElementById("completed");
let clearAllTodos = document.getElementById("clear-todos");
let clearCompleteTodos = document.getElementById("clear-complete-todos");

const TodoDB = JSON.parse(localStorage.getItem("todos_data")) || [];
const CompleteTodoDB = JSON.parse(localStorage.getItem("completed_todos")) || [];

function saveLocalStorage() {
  localStorage.setItem("todos_data", JSON.stringify(TodoDB));
  localStorage.setItem("completed_todos", JSON.stringify(CompleteTodoDB));
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

  // push the object into the array
  TodoDB.push(newTodo);

  saveLocalStorage();

  // pass the object as a argument
  TodoUI(newTodo, false);

  // empty input fields
  title.value = "";
  desc.value = "";
}

// UI Part
function TodoUI(todoObj, isCompleted = false) {
  // create elements
  const wrapper = document.createElement("div");
  const TodoTitle = document.createElement("h2");
  const TodoDesc = document.createElement("p");
  const Completed = document.createElement("input");
  const TodoDeleteBtn = document.createElement("button");
  TodoDeleteBtn.innerText = "Delete";

  Completed.type = "checkbox";
  Completed.checked = isCompleted;

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
    const checked = TodoDB.findIndex((elem) => elem.id === todoObj.id);
    if (event.target.checked) {
      if (checked !== -1) {
        let item = TodoDB.splice(checked, 1)[0];
        CompleteTodoDB.push(item);

        completedArea.append(wrapper);

        TodoTitle.style.textDecoration = "line-through";
        TodoDesc.style.textDecoration = "line-through";

        saveLocalStorage();
      }
    } else {
      const unchecked = CompleteTodoDB.findIndex(
        (elem) => elem.id === todoObj.id,
      );
      if (unchecked !== -1) {
        let uncheckeditem = CompleteTodoDB.splice(unchecked, 1)[0];
        TodoDB.push(uncheckeditem);

        todoArea.append(wrapper);

        TodoTitle.style.textDecoration = "none";
        TodoDesc.style.textDecoration = "none";

        saveLocalStorage();
      }
    }

  });

  // delete button logic
  TodoDeleteBtn.addEventListener("click", (event) => {
    // find dataset id Convert it into number by default it string
    const datasetID = Number(event.target.dataset.id);

    // find index and match with dataset ID
    const index = TodoDB.findIndex((v) => v.id === datasetID);

    // if found delete it from array
    if (index !== -1) {
      TodoDB.splice(index, 1);
    }

    // find index and match with dataset ID in complete task db
    const compindex = CompleteTodoDB.findIndex((v) => v.id === datasetID);

    // if found delete it from array
    if (compindex !== -1) {
      CompleteTodoDB.splice(index, 1);
    }

    saveLocalStorage();
    // remove the element from ui
    // event.target.parentElement.remove();
    wrapper.remove();

    console.log(TodoDB);
  });
}

TodoDB.forEach((todo) => TodoUI(todo, false));
CompleteTodoDB.forEach((todo) => TodoUI(todo, true));

btn.addEventListener("click", HandleAddTodo);
