import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BASE_URL from "../api";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login({ onLogin }) {
  const navigate = useNavigate();

  const [data, setData] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);    // ✅ loading state
  const [error, setError] = useState("");           // ✅ inline error instead of alert
  const [successMsg, setSuccessMsg] = useState(""); // ✅ inline success for signup

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    setError("");       // clear error on typing
    setSuccessMsg("");
  };

  // 🔹 LOGIN
  const login = () => {
    if (!data.email || !data.password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    axios
      .post(`${BASE_URL}/users/login`, data)
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        onLogin?.();          // ✅ notify App → Navbar re-renders immediately
        navigate("/products");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Invalid credentials");
        setLoading(false);
      });
  };

  // 🔹 SIGNUP
  const signup = () => {
    if (!data.name || !data.email || !data.password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    axios
      .post(`${BASE_URL}/users/signup`, data)
      .then((res) => {
        setSuccessMsg(res.data.message || "Account created! Please login.");
        setData({ name: "", email: "", password: "" });
        setIsSignup(false);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Signup failed");
        setLoading(false);
      });
  };

  // ✅ Submit on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      isSignup ? signup() : login();
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignup ? "Signup" : "Login"}</h2>

      {/* ✅ INLINE ERROR */}
      {error && (
        <p style={{ color: "red", fontSize: "14px", marginBottom: "8px" }}>
          {error}
        </p>
      )}

      {/* ✅ INLINE SUCCESS */}
      {successMsg && (
        <p style={{ color: "green", fontSize: "14px", marginBottom: "8px" }}>
          {successMsg}
        </p>
      )}

      {/* NAME */}
      {isSignup && (
        <input
          name="name"
          placeholder="Name"
          value={data.name}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
        />
      )}

      {/* EMAIL */}
      <input
        name="email"
        placeholder="Email"
        value={data.email}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />

      {/* PASSWORD */}
      <div style={{ position: "relative", width: "100%" }}>
        <input
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          value={data.password}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          style={{
            paddingRight: "40px",
            width: "100%",
            margin: "10px 0",
            boxSizing: "border-box",
          }}
        />

        <span
          onClick={() => setShowPassword(!showPassword)}
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            cursor: "pointer",
          }}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </span>
      </div>

      {/* BUTTON — disabled + label during loading */}
      <button
        onClick={isSignup ? signup : login}
        disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Please wait..." : isSignup ? "Signup" : "Login"}
      </button>

      {/* SWITCH */}
      <p>
        {isSignup ? "Already have an account?" : "Don't have an account?"}
        <span
          onClick={() => {
            setIsSignup(!isSignup);
            setData({ name: "", email: "", password: "" });
            setError("");
            setSuccessMsg("");
          }}
          style={{ color: "blue", cursor: "pointer" }}
        >
          {isSignup ? " Login" : " Signup"}
        </span>
      </p>
    </div>
  );
}

export default Login;