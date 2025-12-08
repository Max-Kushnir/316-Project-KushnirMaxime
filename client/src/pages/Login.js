"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

// InputWithClear component OUTSIDE the main component to prevent re-creation on render
const InputWithClear = ({ value, onChange, type = "text", inputStyle, ...props }) => (
  <div style={{ position: "relative" }}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        ...inputStyle,
        paddingRight: value ? "35px" : "12px",
      }}
      {...props}
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange({ target: { value: "" } })}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#999",
          fontSize: "18px",
          padding: "0",
          lineHeight: "1",
        }}
        aria-label="Clear"
      >
        ⊗
      </button>
    )}
  </div>
)

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await login(email, password)
    if (result.success) {
      navigate("/playlists")
    } else {
      setError(result.message || "Login failed")
    }
    setLoading(false)
  }

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  }

  const formContainerStyle = {
    padding: "40px",
    maxWidth: "400px",
    width: "100%",
  }

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#9C27B0",
    marginBottom: "30px",
    textAlign: "center",
  }

  const formGroupStyle = {
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
  }

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "normal",
    color: "#666",
    marginBottom: "8px",
  }

  const inputStyle = {
    height: "44px",
    padding: "0 12px",
    fontSize: "14px",
    border: "1px solid #999",
    borderRadius: "4px",
    fontFamily: "inherit",
    backgroundColor: "white",
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border 0.2s",
  }

  const submitButtonStyle = {
    backgroundColor: "#333333",
    color: "white",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
    width: "100%",
  }

  const errorStyle = {
    backgroundColor: "#FFCDD2",
    color: "#C62828",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
    fontSize: "14px",
  }

  const linkStyle = {
    marginTop: "15px",
    textAlign: "center",
    fontSize: "14px",
    color: "#333",
  }

  const linkAnchorStyle = {
    color: "#9C27B0",
    textDecoration: "none",
    fontWeight: "bold",
  }

  return (
    <>
      <style>
        {`
          input:focus {
            border: 2px solid #9C27B0 !important;
          }
          input::placeholder {
            color: #999999;
            font-style: italic;
          }
        `}
      </style>
      <div style={containerStyle}>
        <div style={formContainerStyle}>
          <h1 style={titleStyle}>Login</h1>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Email</label>
            <InputWithClear type="email" value={email} onChange={(e) => setEmail(e.target.value)} required inputStyle={inputStyle} />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Password</label>
            <InputWithClear type="password" value={password} onChange={(e) => setPassword(e.target.value)} required inputStyle={inputStyle} />
          </div>

          <button type="submit" disabled={loading} style={submitButtonStyle}>
            {loading ? "Loading..." : "SIGN IN"}
          </button>
        </form>

        <div style={linkStyle}>
          Don't have an account?{" "}
          <Link to="/register" style={linkAnchorStyle}>
            Sign Up
          </Link>
        </div>
      </div>
      </div>
    </>
  )
}

export default Login
