"use client"

import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Navbar from "./components/Navbar"
import Welcome from "./pages/Welcome"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Account from "./pages/Account"
import Playlists from "./pages/Playlists"
import Songs from "./pages/Songs"
import { useAuth } from "./context/AuthContext"

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
  return children
}

const AppLayout = () => {
  const location = useLocation()

  // Hide nav buttons on these routes
  const hideNavButtonsRoutes = ["/", "/login", "/register", "/account"]
  const hideNavButtons = hideNavButtonsRoutes.includes(location.pathname)

  const outerContainerStyle = {
    backgroundColor: "#FFE4F3",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    boxSizing: "border-box",
  }

  const innerContainerStyle = {
    backgroundColor: "#FFFDE7",
    width: "75%",
    height: "75vh",
    border: "1px solid black",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }

  const contentStyle = {
    flex: 1,
    overflow: "auto",
  }

  return (
    <div style={outerContainerStyle}>
      <div style={innerContainerStyle}>
        <Navbar hideNavButtons={hideNavButtons} />
        <div style={contentStyle}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/songs" element={<Songs />} />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  )
}

export default App
