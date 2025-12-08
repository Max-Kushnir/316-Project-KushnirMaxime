"use client"

import { useState } from "react"

const CreateSongModal = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState("")
  const [artist, setArtist] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  const [youtubeId, setYoutubeId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!title.trim() || !artist.trim() || !youtubeId.trim()) {
      setError("All fields are required")
      return
    }

    setLoading(true)
    await onCreate(title, artist, year, youtubeId)
    setLoading(false)
    setTitle("")
    setArtist("")
    setYear(new Date().getFullYear())
    setYoutubeId("")
  }

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    overflowY: "auto",
  }

  const modalStyle = {
    backgroundColor: "#C8E6C9",
    borderRadius: "8px",
    padding: "30px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    margin: "20px auto",
  }

  const headerStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#228B22",
    marginBottom: "20px",
  }

  const formGroupStyle = {
    marginBottom: "15px",
    display: "flex",
    flexDirection: "column",
  }

  const labelStyle = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "6px",
  }

  const inputStyle = {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontFamily: "inherit",
  }

  const errorStyle = {
    backgroundColor: "#FFCDD2",
    color: "#C62828",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "15px",
    fontSize: "12px",
  }

  const buttonsContainerStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "20px",
  }

  const submitButtonStyle = {
    backgroundColor: "#228B22",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  }

  const cancelButtonStyle = {
    backgroundColor: "#90EE90",
    color: "black",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>Create New Song</div>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              autoFocus
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Artist *</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number.parseInt(e.target.value))}
              min="1900"
              max={new Date().getFullYear()}
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>YouTube ID *</label>
            <input
              type="text"
              value={youtubeId}
              onChange={(e) => setYoutubeId(e.target.value)}
              placeholder="e.g., dQw4w9WgXcQ"
              style={inputStyle}
            />
          </div>

          <div style={buttonsContainerStyle}>
            <button type="button" onClick={onClose} style={cancelButtonStyle} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={submitButtonStyle}>
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateSongModal
