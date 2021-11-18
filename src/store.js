import React, { createContext, useState } from "react";

export const StoreContext = createContext();

const initiaState = {
  isPageLoaded: false,
  auth: {
    isLoggedIn: false,
    username: "",
  },
  todos: [],
};

const reducer = async (state, action) => {
  console.log("ACTION::: ", action);
  switch (action.type) {
    case "ADD_TODO":
      return {...state, todos: state.todos.concat(action.payload)};
    case "DELETE_TODO":
      return {
        ...state,
        todos: state.todos.filter((a) => a.id !== action.payload),
      };
    case "TOGGLE_TODO":
      return {
        ...state,
        todos: (a) => ({
          ...a,
          isComplete: a.id === action.payload ? !a.isComplete : a.isComplete,
        }),
      };
    case "FETCH_ALL_TODOS": 
      const allTodoRes = await fetch("/api/todos").then(res => res.json());
      state.todos = allTodoRes;
      return state;
    case "LOGIN":
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: action.payload.username, password: action.payload.password }),
      }).then((res) => res.json())
      if (loginRes.success) {
        state.auth = { isLoggedIn: true, username: action.payload.username };
      } else {
        console.error(loginRes.error);
      }
      return state;
    case "LOGOUT":
      const logoutRes = await fetch("/api/logout").then((res) => res.json());
      if (logoutRes.success) {
        state.auth = { isLoggedIn: false, username: "" };
      } else {
        console.error(logoutRes.error);
      }
      break;
    case "GET_USER_INFO":
      console.log(state);
      if(state.isPageLoaded) return state;
      state.isPageLoaded = true;
      const userInfo = await fetch("/api/me").then((res) => res.json());
      if (userInfo.success) {
        state.auth = { isLoggedIn: true, username: userInfo.username };
      } else {
        console.error(userInfo.error);
      }
      return state;
    default:
      return state;
  }
};

const useAsyncReducer = (reducer, initialState = null) => {
  const [state, setState] = useState(initialState);

  const dispatch = async (action) => {
    const result = reducer(state, action);
    if (typeof result.then === "function") {
      try {
        const newState = await result;
        setState(newState);
      } catch (err) {
        setState({ ...state, error: err });
      }
    } else {
      setState(result);
    }
  };

  return [state, dispatch];
};

const Store = ({ children }) => {
  const [state, dispatch] = useAsyncReducer(reducer, initiaState);
  return (
    <StoreContext.Provider value={[state, dispatch]}>
      {children}
    </StoreContext.Provider>
  );
};

export default Store;
