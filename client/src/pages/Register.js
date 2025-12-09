"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { FaLock, FaUser } from "react-icons/fa"
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
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    avatar: ""
  })
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const img = new Image()
      img.onload = () => {
        if (img.width !== 200 || img.height !== 200) {
          setFieldErrors(prev => ({
            ...prev,
            avatar: "Avatar must be exactly 200x200 pixels"
          }))
          setAvatar(null)
          setAvatarPreview(null)
        } else {
          setFieldErrors(prev => ({ ...prev, avatar: "" }))
          const reader = new FileReader()
          reader.onload = (event) => {
            const base64String = event.target.result
            setAvatar(base64String)
            setAvatarPreview(base64String)
          }
          reader.readAsDataURL(file)
        }
      }
      img.src = URL.createObjectURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    // Reset field errors
    const errors = {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      avatar: ""
    }

    // Validate each field
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }

    if (!username.trim()) {
      errors.username = "Username is required"
    }

    if (!password) {
      errors.password = "Password is required"
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (!avatar) {
      errors.avatar = "Please upload an avatar image"
    }

    // Check if any errors
    const hasErrors = Object.values(errors).some(err => err !== "")
    setFieldErrors(errors)

    if (hasErrors) {
      return
    }

    // Proceed with registration
    setLoading(true)
    const result = await register(email, username, password, avatar)
    if (result.success) {
      navigate("/login")
    } else {
      // Handle backend errors (like email already in use)
      if (result.message?.toLowerCase().includes("email")) {
        setFieldErrors(prev => ({ ...prev, email: result.message }))
      } else {
        setError(result.message || "Registration failed")
      }
    }
    setLoading(false)
  }

  // Input change handlers with real-time validation
  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, email: "Email is required" }))
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setFieldErrors(prev => ({ ...prev, email: "Please enter a valid email address" }))
    } else {
      setFieldErrors(prev => ({ ...prev, email: "" }))
    }
  }

  const handleUsernameChange = (e) => {
    const value = e.target.value
    setUsername(value)
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, username: "Username is required" }))
    } else {
      setFieldErrors(prev => ({ ...prev, username: "" }))
    }
  }

  const handlePasswordChange = (e) => {
    const value = e.target.value
    setPassword(value)
    if (!value) {
      setFieldErrors(prev => ({ ...prev, password: "Password is required" }))
    } else if (value.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }))
    } else {
      setFieldErrors(prev => ({ ...prev, password: "" }))
    }
    // Also re-validate confirmPassword if it has a value
    if (confirmPassword) {
      if (confirmPassword !== value) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setFieldErrors(prev => ({ ...prev, confirmPassword: "" }))
      }
    }
  }

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value
    setConfirmPassword(value)
    if (!value) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }))
    } else if (password !== value) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "" }))
    }
  }

  // Compute whether form is valid for button state
  const isFormValid =
    email.trim() !== "" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    username.trim() !== "" &&
    password.length >= 8 &&
    confirmPassword === password &&
    avatar !== null &&
    !fieldErrors.avatar

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    textAlign: "center",
    padding: "20px",
    boxSizing: "border-box",
  }

  const contentWrapperStyle = {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  }

  const formContainerStyle = {
    maxWidth: "600px",
    width: "100%",
    textAlign: "left",
  }

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#333333",
    marginBottom: "30px",
    textAlign: "center",
  }

  const lockEmojiStyle = {
    fontSize: "32px",
    textAlign: "center",
    marginBottom: "10px",
  }

  const formRowStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "20px",
  }

  const avatarColumnStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "25px",
  }

  const inputsColumnStyle = {
    display: "flex",
    flexDirection: "column",
    maxWidth: "400px",
    width: "100%",
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
    backgroundColor: isFormValid && !loading ? "#333333" : "#CCCCCC",
    color: isFormValid && !loading ? "white" : "#666666",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: isFormValid && !loading ? "pointer" : "not-allowed",
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

  const fieldErrorStyle = {
    color: "#D32F2F",
    fontSize: "12px",
    marginTop: "4px",
    display: "block"
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
    padding: "6px 14px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
  }

  const avatarHelperStyle = {
    fontSize: "11px",
    color: "#666",
    marginTop: "6px",
    textAlign: "center",
  }

  const linkStyle = {
    marginTop: "15px",
    textAlign: "right",
    fontSize: "14px",
    color: "red",
  }

  const linkAnchorStyle = {
    color: "red",
    textDecoration: "none",
    fontWeight: "bold",
  }

  const copyrightStyle = {
    marginTop: "20px",
    textAlign: "center",
    fontSize: "12px",
    color: "black",
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
        <div style={contentWrapperStyle}>
          <div style={formContainerStyle}>
            <div style={lockEmojiStyle}><FaLock style={{ color: "black", fontSize: "32px" }} /></div>
            <h1 style={titleStyle}>Create Account</h1>

            {error && <div style={errorStyle}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={formRowStyle}>
                {/* Avatar column - positioned to left of inputs */}
                <div style={avatarColumnStyle}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" style={avatarPreviewStyle} />
                  ) : (
                    <div style={placeholderAvatarStyle}><FaUser style={{ color: "#999", fontSize: "40px" }} /></div>
                  )}
                  <label style={{ ...selectButtonStyle, marginTop: "10px" }}>
                    Select
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                  </label>
                  <div style={avatarHelperStyle}>Image must be 200x200 pixels</div>
                  {fieldErrors.avatar && <span style={{ ...fieldErrorStyle, textAlign: "center", maxWidth: "100px" }}>{fieldErrors.avatar}</span>}
                </div>

                {/* Inputs column */}
                <div style={inputsColumnStyle}>
                  {/* User Name */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>User Name</label>
                    <InputWithClear type="text" value={username} onChange={handleUsernameChange} inputStyle={inputStyle} />
                    {fieldErrors.username && <span style={fieldErrorStyle}>{fieldErrors.username}</span>}
                  </div>

                  {/* Email */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Email</label>
                    <InputWithClear type="email" value={email} onChange={handleEmailChange} inputStyle={inputStyle} />
                    {fieldErrors.email && <span style={fieldErrorStyle}>{fieldErrors.email}</span>}
                  </div>

                  {/* Password */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Password</label>
                    <InputWithClear
                      type="password"
                      value={password}
                      onChange={handlePasswordChange}
                      inputStyle={inputStyle}
                    />
                    {fieldErrors.password && <span style={fieldErrorStyle}>{fieldErrors.password}</span>}
                  </div>

                  {/* Password Confirm */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Password Confirm</label>
                    <InputWithClear
                      type="password"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      inputStyle={inputStyle}
                    />
                    {fieldErrors.confirmPassword && <span style={fieldErrorStyle}>{fieldErrors.confirmPassword}</span>}
                  </div>

                  <button type="submit" disabled={!isFormValid || loading} style={submitButtonStyle}>
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </div>
            </form>

            <div style={linkStyle}>
              Already have an account?{" "}
              <Link to="/login" style={linkAnchorStyle}>
                Sign In
              </Link>
            </div>
          </div>
        </div>
        <div style={copyrightStyle}>Copyright @ Playlister 2025</div>
      </div>
    </>
  )
}

export default Register
