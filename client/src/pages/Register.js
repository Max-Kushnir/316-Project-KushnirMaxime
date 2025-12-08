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

const Register = () => {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target.result
        setAvatar(base64String)
        setAvatarPreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)
    const result = await register(email, username, password, avatar)
    if (result.success) {
      navigate("/playlists")
    } else {
      setError(result.message || "Registration failed")
    }
    setLoading(false)
  }

  // Check if form is valid for enabling Create Account button
  const isFormValid =
    email.trim() !== "" &&
    username.trim() !== "" &&
    password.length >= 8 &&
    password === confirmPassword &&
    avatar !== null


  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
  }

  const formContainerStyle = {
    maxWidth: "400px",
    width: "100%",
    textAlign: "left",
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
    backgroundColor: isFormValid ? "#333333" : "#CCCCCC",
    color: isFormValid ? "white" : "#666666",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: isFormValid ? "pointer" : "not-allowed",
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

  const avatarPreviewStyle = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #9C27B0",
  }

  const placeholderAvatarStyle = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "40px",
    color: "#999",
    border: "2px solid #ddd",
  }

  const selectButtonStyle = {
    backgroundColor: "#333333",
    color: "white",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
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
          <h1 style={titleStyle}>Create Account</h1>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Avatar Image - FIRST per Section 5.2 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Avatar Image</label>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" style={avatarPreviewStyle} />
                ) : (
                  <div style={placeholderAvatarStyle}>👤</div>
                )}
                <label style={selectButtonStyle}>
                  Select
                  <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            {/* User Name - SECOND per Section 5.2 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>User Name</label>
              <InputWithClear type="text" value={username} onChange={(e) => setUsername(e.target.value)} required inputStyle={inputStyle} />
            </div>

            {/* Email - THIRD per Section 5.2 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <InputWithClear type="email" value={email} onChange={(e) => setEmail(e.target.value)} required inputStyle={inputStyle} />
            </div>

            {/* Password - FOURTH per Section 5.2 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Password</label>
              <InputWithClear
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                inputStyle={inputStyle}
              />
            </div>

            {/* Password Confirm - FIFTH per Section 5.2 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Password Confirm</label>
              <InputWithClear
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                inputStyle={inputStyle}
              />
            </div>

            <button type="submit" disabled={!isFormValid || loading} style={submitButtonStyle}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <div style={linkStyle}>
            Already have an account?{" "}
            <Link to="/login" style={linkAnchorStyle}>
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
