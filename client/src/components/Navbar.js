"use client"

import { useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"

const Navbar = ({ hideNavButtons = false }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/")
    setShowMenu(false)
  }

  const navbarStyle = {
    backgroundColor: "#FF00FF",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    borderBottom: "1px solid black",
    zIndex: 500,
  }

  const navLeftStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }

  const homeButtonStyle = {
    backgroundColor: "white",
    border: "2px solid #FF00FF",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  }

  const navButtonStyle = {
    backgroundColor: "#7B1FA2",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "opacity 0.2s",
  }

  const centerTitleStyle = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    margin: 0,
  }

  const accountMenuStyle = {
    position: "relative",
    display: "inline-block",
  }

  const accountButtonStyle = {
    backgroundColor: "white",
    border: "2px solid #FF00FF",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
    overflow: "hidden",
  }

  const avatarImageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }

  const dropdownStyle = {
    position: "absolute",
    top: "50px",
    right: "0",
    backgroundColor: "#E1BEE7",
    border: "2px dashed #9C27B0",
    borderRadius: "4px",
    minWidth: "150px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    zIndex: 1000,
  }

  const menuItemStyle = {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    border: "none",
    backgroundColor: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background-color 0.2s",
  }

  const handleHomeClick = () => {
    if (user) {
      navigate("/playlists")
    } else {
      navigate("/")
    }
  }

  return (
    <nav style={navbarStyle}>
      <div style={navLeftStyle}>
        <button
          onClick={handleHomeClick}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          style={homeButtonStyle}
        >
          🏠
        </button>
        {!hideNavButtons && (
          <>
            <button
              onClick={() => navigate("/playlists")}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              style={navButtonStyle}
            >
              Playlists
            </button>
            <button
              onClick={() => navigate("/songs")}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              style={navButtonStyle}
            >
              Song Catalog
            </button>
          </>
        )}
      </div>

      {user && <div style={centerTitleStyle}>The Playlister</div>}

      <div style={accountMenuStyle}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          style={accountButtonStyle}
        >
          {user && user.avatar_image ? (
            <img src={user.avatar_image} alt="Avatar" style={avatarImageStyle} />
          ) : (
            <span>{user && user.username ? user.username.charAt(0).toUpperCase() : "👤"}</span>
          )}
        </button>
        {showMenu && (
          <div style={dropdownStyle}>
            {user ? (
              <>
                <button
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#CE93D8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => {
                    navigate("/account")
                    setShowMenu(false)
                  }}
                  style={menuItemStyle}
                >
                  Edit Account
                </button>
                <button
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#CE93D8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={handleLogout}
                  style={menuItemStyle}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#CE93D8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => {
                    navigate("/login")
                    setShowMenu(false)
                  }}
                  style={menuItemStyle}
                >
                  Login
                </button>
                <button
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#CE93D8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  onClick={() => {
                    navigate("/register")
                    setShowMenu(false)
                  }}
                  style={menuItemStyle}
                >
                  Create Account
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
