// frontend/src/pages/Login.jsx
// FIXED — uses saveAuth() to save token + name + email correctly

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { saveAuth } from "../utils/auth";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", formData);
      const { token, name, email } = response.data;

      // Save token + name + email so getUserName() works everywhere
      saveAuth(token, name, email);

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <h2 style={{ margin: "0 0 4px", color: "var(--text-primary)" }}>Welcome back</h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)" }}>Sign in to continue learning</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          {error && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#991b1b" }}>
              {error}
            </div>
          )}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")}>Sign up</span>
        </p>

      </div>
    </div>
  );
}

export default Login;