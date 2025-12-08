"use client"

import { useState } from "react"

const AddToPlaylistModal = ({ song, playlists, onClose, onAdd }) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedPlaylistId) {
      setError("Please select a playlist")
      return
    }

    setLoading(true)
    await onAdd(Number.parseInt(selectedPlaylistId))
    setLoading(false)
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
  }

  const modalStyle = {
    backgroundColor: "#C8E6C9",
    borderRadius: "8px",
    padding: "30px",
    maxWidth: "400px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  }

  const headerStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#228B22",
    marginBottom: "20px",
  }

  const songInfoStyle = {
    backgroundColor: "white",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
    fontSize: "13px",
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

  const selectStyle = {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
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
        <div style={headerStyle}>Add to Playlist</div>

        <div style={songInfoStyle}>
          <strong>{song.title}</strong> by {song.artist}
        </div>

        {error && <div style={errorStyle}>{error}</div>}

        {playlists.length === 0 ? (
          <div
            style={{
              backgroundColor: "#FFECB3",
              padding: "10px",
              borderRadius: "4px",
              marginBottom: "20px",
              fontSize: "12px",
              color: "#333",
            }}
          >
            You don't have any playlists yet. Create one first!
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Select Playlist *</label>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                style={selectStyle}
              >
                <option value="">-- Choose a playlist --</option>
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={buttonsContainerStyle}>
              <button type="button" onClick={onClose} style={cancelButtonStyle} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading || !selectedPlaylistId} style={submitButtonStyle}>
                {loading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddToPlaylistModal
