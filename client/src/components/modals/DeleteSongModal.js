"use client"

import { useRef, useEffect } from "react"

const DeleteSongModal = ({ song, onClose, onDelete }) => {
  const modalOverlayRef = useRef(null)

  useEffect(() => {
    if (modalOverlayRef.current) {
      modalOverlayRef.current.focus()
    }
  }, [])

  const handleDelete = async () => {
    await onDelete(song.id)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleDelete()
    }
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
    backgroundColor: "#90EE90",
    borderRadius: "8px",
    maxWidth: "600px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    overflow: "hidden",
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

  const messageStyle = {
    fontSize: "14px",
    color: "#333",
    marginBottom: "20px",
  }

  const warningStyle = {
    fontSize: "12px",
    color: "#666",
    marginBottom: "20px",
    fontStyle: "italic",
  }

  const buttonsContainerStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
  }

  const deleteButtonStyle = {
    backgroundColor: "#E91E63",
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
    <div style={modalOverlayStyle} onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1} ref={modalOverlayRef}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>Delete Song?</div>
        <div style={modalBodyStyle}>
          <div style={messageStyle}>
            Are you sure you want to delete "{song.title}" by {song.artist}?
          </div>
          <div style={warningStyle}>This song will be removed from all playlists. This action cannot be undone.</div>
          <div style={buttonsContainerStyle}>
            <button onClick={onClose} style={cancelButtonStyle}>
              Cancel
            </button>
            <button onClick={handleDelete} style={deleteButtonStyle}>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteSongModal
