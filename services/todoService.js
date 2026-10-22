import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { db } from "../init/firebase.js";

const TODO_COLLECTION = "todos";
const MAX_BATCH_SIZE = 500;

function getUserTodosCollection(userId) {
  if (typeof userId !== "string" || !userId.trim()) {
    throw new TypeError("A signed-in user's ID is required to access todos.");
  }

  return collection(db, "users", userId, TODO_COLLECTION);
}

function getTodoDocument(userId, todoId) {
  if (typeof todoId !== "string" || !todoId.trim()) {
    throw new TypeError("A valid todo ID is required.");
  }

  return doc(getUserTodosCollection(userId), todoId);
}

/**
 * Listen only to the authenticated user's subcollection. The caller owns and
 * must invoke the returned unsubscribe function when the user changes.
 */
export function subscribeToTodos(userId, onTodos, onError) {
  if (typeof onTodos !== "function") {
    throw new TypeError("A todos callback is required.");
  }
  if (onError !== undefined && typeof onError !== "function") {
    throw new TypeError("The todos error callback must be a function.");
  }

  return onSnapshot(
    getUserTodosCollection(userId),
    (snapshot) => {
      const todos = snapshot.docs.map((todoDocument) => {
        const data = todoDocument.data();
        return {
          id: todoDocument.id,
          title: typeof data.title === "string" ? data.title : "",
          description: typeof data.description === "string" ? data.description : "",
          priority: data.priority === "High" ? "High" : "Low",
          completed: data.completed === true
        };
      });

      onTodos(todos);
    },
    onError
  );
}

export function createTodo(userId, { title, description, priority }) {
  if (typeof title !== "string" || !title.trim()) {
    throw new TypeError("A todo title is required.");
  }
  if (title.trim().length > 120) {
    throw new TypeError("Todo title must be 120 characters or fewer.");
  }
  if (typeof description !== "string" || !description.trim()) {
    throw new TypeError("A todo description is required.");
  }
  if (description.trim().length > 1000) {
    throw new TypeError("Todo description must be 1000 characters or fewer.");
  }
  if (priority !== "High" && priority !== "Low") {
    throw new TypeError("Todo priority must be High or Low.");
  }
  return addDoc(getUserTodosCollection(userId), {
    title: title.trim(),
    description: description.trim(),
    priority,
    completed: false,
    createdAt: serverTimestamp()
  });
}

export function setTodoCompleted(userId, todoId, completed) {
  if (typeof completed !== "boolean") {
    throw new TypeError("Todo completion state must be a boolean.");
  }
  return updateDoc(getTodoDocument(userId, todoId), { completed });
}

export function removeTodo(userId, todoId) {
  return deleteDoc(getTodoDocument(userId, todoId));
}

export async function clearTodos(userId, completed) {
  if (typeof completed !== "boolean") {
    throw new TypeError("Todo completion filter must be a boolean.");
  }

  const matchingTodos = await getDocs(
    query(getUserTodosCollection(userId), where("completed", "==", completed))
  );
  let deletedCount = 0;

  // Firestore batches are limited, so large clears must be committed in chunks.
  for (let start = 0; start < matchingTodos.docs.length; start += MAX_BATCH_SIZE) {
    const batch = writeBatch(db);
    const documents = matchingTodos.docs.slice(start, start + MAX_BATCH_SIZE);

    documents.forEach((todoDocument) => batch.delete(todoDocument.ref));
    await batch.commit();
    deletedCount += documents.length;
  }

  return deletedCount;
}
