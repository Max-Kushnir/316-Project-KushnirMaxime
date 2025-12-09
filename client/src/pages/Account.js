"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { FaLock, FaUser } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"

// InputWithClear component OUTSIDE the main component to prevent re-creation on render
const InputWithClear = ({ value, onChange, type = "text", disabled = false, inputStyle, ...props }) => (
  <div style={{ position: "relative" }}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        ...inputStyle,
        paddingRight: value && !disabled ? "35px" : "12px",
        backgroundColor: disabled ? "#e0e0e0" : "white",
        cursor: disabled ? "not-allowed" : "text",
      }}
      {...props}
    />
    {value && !disabled && (
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

const Account = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = location.state?.from || "/playlists"
  const [username, setUsername] = useState(user?.username || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    avatar: ""
  })

  // Computed value for form validity
  const isFormValid =
    username.trim() !== "" &&
    !fieldErrors.username &&
    !fieldErrors.password &&
    !fieldErrors.confirmPassword &&
    !fieldErrors.avatar

  // Real-time validation handlers
  const handleUsernameChange = (value) => {
    setUsername(value)
    if (!value.trim()) {
      setFieldErrors(prev => ({ ...prev, username: "Username is required" }))
    } else {
      setFieldErrors(prev => ({ ...prev, username: "" }))
    }
  }

  const handlePasswordChange = (value) => {
    setPassword(value)
    if (value && value.length < 8) {
      setFieldErrors(prev => ({ ...prev, password: "Password must be at least 8 characters" }))
    } else {
      setFieldErrors(prev => ({ ...prev, password: "" }))
    }
    // Also re-validate confirmPassword if it has a value
    if (confirmPassword && value !== confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else if (confirmPassword) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "" }))
    }
  }

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value)
    if (password && value !== password) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }))
    } else if (password && !value) {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "Please confirm your password" }))
    } else {
      setFieldErrors(prev => ({ ...prev, confirmPassword: "" }))
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Keep existing 5MB check
      if (file.size > 5 * 1024 * 1024) {
        setFieldErrors(prev => ({ ...prev, avatar: "Image must be less than 5MB" }))
        return
      }

      // Add dimension validation
      const img = new Image()
      img.onload = () => {
        if (img.width !== 200 || img.height !== 200) {
          setFieldErrors(prev => ({ ...prev, avatar: "Avatar must be exactly 200x200 pixels" }))
          setAvatar(null)
          setAvatarPreview(user?.avatar || null)
        } else {
          setFieldErrors(prev => ({ ...prev, avatar: "" }))
          const reader = new FileReader()
          reader.onload = (event) => {
            setAvatar(event.target.result)
            setAvatarPreview(event.target.result)
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
    setSuccess("")

    if (!username.trim()) {
      setError("Username cannot be empty")
      return
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password && password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)
    const result = await updateProfile(username, password || undefined, avatar)
    if (result.success) {
      setSuccess("Profile updated successfully!")
      setPassword("")
      setConfirmPassword("")
      setAvatar(null)
      setTimeout(() => navigate(returnPath), 2000)
    } else {
      setError(result.message || "Update failed")
    }
    setLoading(false)
  }


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
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
    transition: "border 0.2s",
  }

  const completeButtonStyle = {
    backgroundColor: isFormValid && !loading ? "#333333" : "#CCCCCC",
    color: isFormValid && !loading ? "white" : "#666666",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: isFormValid && !loading ? "pointer" : "not-allowed",
    flex: 1,
  }

  const cancelButtonStyle = {
    backgroundColor: "white",
    color: "#9C27B0",
    border: "2px solid #9C27B0",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
    flex: 1,
  }

  const errorStyle = {
    backgroundColor: "#FFCDD2",
    color: "#C62828",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
    fontSize: "14px",
  }

  const successStyle = {
    backgroundColor: "#C8E6C9",
    color: "#2E7D32",
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
    padding: "6px 14px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: "pointer",
  }

  const helperTextStyle = {
    fontSize: "12px",
    color: "#666",
    marginTop: "4px",
  }

  const fieldErrorStyle = {
    color: "#D32F2F",
    fontSize: "12px",
    marginTop: "4px",
    display: "block",
  }

  const copyrightStyle = {
    fontSize: "12px",
    color: "black",
    textAlign: "center",
    marginTop: "20px",
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
            <h1 style={titleStyle}>Edit Account</h1>

            {error && <div style={errorStyle}>{error}</div>}
            {success && <div style={successStyle}>{success}</div>}

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
                  <div style={{ ...helperTextStyle, textAlign: "center", marginTop: "8px" }}>Image must be 200x200 pixels</div>
                  {fieldErrors.avatar && <span style={{ ...fieldErrorStyle, textAlign: "center" }}>{fieldErrors.avatar}</span>}
                </div>

                {/* Inputs column */}
                <div style={inputsColumnStyle}>
                  {/* User Name */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>User Name</label>
                    <InputWithClear type="text" value={username} onChange={(e) => handleUsernameChange(e.target.value)} required inputStyle={inputStyle} />
                    {fieldErrors.username && <span style={fieldErrorStyle}>{fieldErrors.username}</span>}
                  </div>

                  {/* Email (read-only/disabled) */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Email</label>
                    <InputWithClear
                      type="email"
                      value={user?.email || ""}
                      onChange={() => {}}
                      disabled={true}
                      inputStyle={inputStyle}
                    />
                    <div style={helperTextStyle}>(email cannot be changed)</div>
                  </div>

                  {/* New Password (optional) */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>New Password</label>
                    <InputWithClear
                      type="password"
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      inputStyle={inputStyle}
                    />
                    <div style={helperTextStyle}>(optional)</div>
                    {fieldErrors.password && <span style={fieldErrorStyle}>{fieldErrors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div style={formGroupStyle}>
                    <label style={labelStyle}>Confirm Password</label>
                    <InputWithClear
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      inputStyle={inputStyle}
                    />
                    {fieldErrors.confirmPassword && <span style={fieldErrorStyle}>{fieldErrors.confirmPassword}</span>}
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button type="button" onClick={() => navigate(returnPath)} style={cancelButtonStyle}>
                      Cancel
                    </button>
                    <button type="submit" disabled={!isFormValid || loading} style={completeButtonStyle}>
                      {loading ? "Saving..." : "Complete"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        <div style={copyrightStyle}>Copyright @ Playlister 2025</div>
      </div>
    </>
  )
}

export default Account
