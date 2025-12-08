"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

const Account = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState(user?.username || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB")
        return
      }

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
      setTimeout(() => navigate("/playlists"), 2000)
    } else {
      setError(result.message || "Update failed")
    }
    setLoading(false)
  }

  // InputWithClear component for fields with clear button
  const InputWithClear = ({ value, onChange, type = "text", disabled = false, ...props }) => (
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

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 50px)",
    backgroundColor: "#FFE4F3",
    padding: "20px",
  }

  const formContainerStyle = {
    backgroundColor: "#FFFDE7",
    padding: "40px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#9C27B0",
    color: "white",
    border: "none",
    height: "40px",
    padding: "0 20px",
    fontSize: "14px",
    fontWeight: "500",
    borderRadius: "4px",
    cursor: loading ? "not-allowed" : "pointer",
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
    height: "40px",
    padding: "0 20px",
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
          <h1 style={titleStyle}>Edit Account</h1>

          {error && <div style={errorStyle}>{error}</div>}
          {success && <div style={successStyle}>{success}</div>}

          <form onSubmit={handleSubmit}>
            {/* Avatar Image - FIRST per Section 5.3 */}
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

            {/* User Name - SECOND per Section 5.3 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>User Name</label>
              <InputWithClear type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            {/* Email - THIRD per Section 5.3 (read-only/disabled) */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Email</label>
              <InputWithClear
                type="email"
                value={user?.email || ""}
                onChange={() => {}}
                disabled={true}
              />
              <div style={helperTextStyle}>(email cannot be changed)</div>
            </div>

            {/* New Password - FOURTH per Section 5.3 (optional) */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>New Password</label>
              <InputWithClear
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
              <div style={helperTextStyle}>(optional)</div>
            </div>

            {/* Confirm Password - FIFTH per Section 5.3 */}
            <div style={formGroupStyle}>
              <label style={labelStyle}>Confirm Password</label>
              <InputWithClear
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="button" onClick={() => navigate("/playlists")} style={cancelButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={completeButtonStyle}>
                {loading ? "Saving..." : "Complete"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default Account
