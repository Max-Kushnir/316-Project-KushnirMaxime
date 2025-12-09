"use client"

import { useState, useRef, useEffect } from "react"

const EditSongModal = ({ song, onClose, onSave }) => {
  const modalOverlayRef = useRef(null)
  const [title, setTitle] = useState(song.title)
  const [artist, setArtist] = useState(song.artist)
  const [year, setYear] = useState(song.year)
  const [youtubeId, setYoutubeId] = useState(song.youtube_id)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (modalOverlayRef.current) {
      modalOverlayRef.current.focus()
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setError("")

    if (!title.trim() || !artist.trim() || !youtubeId.trim()) {
      setError("All fields are required")
      return
    }

    setLoading(true)
    await onSave(song.id, title, artist, year, youtubeId)
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
    overflowY: "auto",
  }

  const modalStyle = {
    backgroundColor: "#90EE90",
    borderRadius: "8px",
    maxWidth: "600px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    overflow: "hidden",
    margin: "20px auto",
  }

  const modalHeaderStyle = {
    backgroundColor: "#228B22",
    padding: "12px 16px",
    color: "white",
    fontWeight: "bold",
    fontSize: "18px",
  }

  const modalBodyStyle = {
    padding: "20px",
    backgroundColor: "#90EE90",
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

  const inputContainerStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  }

  const inputStyle = {
    padding: "10px",
    paddingRight: "35px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontFamily: "inherit",
    flex: 1,
  }

  const clearButtonStyle = {
    position: "absolute",
    right: "8px",
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "#999",
    padding: "0",
    lineHeight: "1",
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
    <div style={modalOverlayStyle} onClick={onClose} onKeyDown={handleKeyDown} ref={modalOverlayRef} tabIndex={-1}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>Edit Song</div>
        <div style={modalBodyStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={formGroupStyle}>
              <label style={labelStyle}>Title *</label>
              <div style={inputContainerStyle}>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
                {title && (
                  <button type="button" onClick={() => setTitle("")} style={clearButtonStyle}>
                    ⊗
                  </button>
                )}
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Artist *</label>
              <div style={inputContainerStyle}>
                <input type="text" value={artist} onChange={(e) => setArtist(e.target.value)} style={inputStyle} />
                {artist && (
                  <button type="button" onClick={() => setArtist("")} style={clearButtonStyle}>
                    ⊗
                  </button>
                )}
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>Year</label>
              <div style={inputContainerStyle}>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number.parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear()}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setYear(new Date().getFullYear())}
                  style={clearButtonStyle}
                >
                  ⊗
                </button>
              </div>
            </div>

            <div style={formGroupStyle}>
              <label style={labelStyle}>YouTube ID *</label>
              <div style={inputContainerStyle}>
                <input type="text" value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} style={inputStyle} />
                {youtubeId && (
                  <button type="button" onClick={() => setYoutubeId("")} style={clearButtonStyle}>
                    ⊗
                  </button>
                )}
              </div>
            </div>

            <div style={buttonsContainerStyle}>
              <button type="button" onClick={onClose} style={cancelButtonStyle} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading} style={submitButtonStyle}>
                {loading ? "Completing..." : "Complete"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditSongModal
