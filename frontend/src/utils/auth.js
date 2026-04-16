// frontend/src/utils/auth.js
// Utility functions for JWT auth management

export const saveAuth = (token, name, email) => {
  localStorage.setItem("token", token);
  if (name)  localStorage.setItem("userName",  name);
  if (email) localStorage.setItem("userEmail", email);
};

export const getToken = () => localStorage.getItem("token");

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isLoggedIn = () => !!getToken();

export const clearAuth = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
};

export const getUserName  = () => localStorage.getItem("userName")  || "Student";
export const getUserEmail = () => localStorage.getItem("userEmail") || "";