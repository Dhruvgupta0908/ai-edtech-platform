import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-edtech-backend-r2y7.onrender.com/api/auth"
});

export const signup = (data) => API.post("/signup", data);

export const login = (data) => API.post("/login", data);
