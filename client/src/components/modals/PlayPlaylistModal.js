"use client"

import { useState, useEffect } from "react"
import api from "../../services/api"

const PlayPlaylistModal = ({ playlist, onClose }) => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0)
  const [repeatMode, setRepeatMode] = useState("off")

  useEffect(() => {
    api.recordPlaylistListener(playlist.id)
  }, [playlist.id])

  const songs = playlist.playlist_songs || []
  const currentSong = songs[currentSongIndex]?.song

  const handlePrevious = () => {
    if (currentSongIndex === 0) {
      if (repeatMode === "all") {
        setCurrentSongIndex(songs.length - 1)
      }
    } else {
      setCurrentSongIndex(currentSongIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentSongIndex === songs.length - 1) {
      if (repeatMode === "all") {
        setCurrentSongIndex(0)
      }
    } else {
      setCurrentSongIndex(currentSongIndex + 1)
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
    backgroundColor: "#C8E6C9",
    borderRadius: "8px",
    padding: "30px",
    maxWidth: "600px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  }

  const headerStyle = {
    fontSize: "20px",
    fontWeight: "bold",
    color: "#228B22",
    marginBottom: "20px",
    textAlign: "center",
  }

  const playerContainerStyle = {
    backgroundColor: "white",
    borderRadius: "4px",
    padding: "20px",
    marginBottom: "20px",
    textAlign: "center",
  }

  const playerPlaceholderStyle = {
    width: "100%",
    height: "250px",
    backgroundColor: "#ddd",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "15px",
    fontSize: "14px",
    color: "#666",
  }

  const controlsStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    marginBottom: "15px",
  }

  const controlButtonStyle = {
    backgroundColor: "#9C27B0",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "12px",
  }

  const repeatButtonStyle = {
    ...controlButtonStyle,
    backgroundColor: repeatMode !== "off" ? "#228B22" : "#9C27B0",
  }

  const currentSongStyle = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "10px",
  }

  const playlistSongsStyle = {
    backgroundColor: "white",
    borderRadius: "4px",
    padding: "10px",
    maxHeight: "200px",
    overflowY: "auto",
    marginBottom: "20px",
  }

  const songItemStyle = (isActive) => ({
    padding: "8px",
    borderBottom: "1px solid #eee",
    fontSize: "12px",
    backgroundColor: isActive ? "#E8F5E9" : "white",
    cursor: "pointer",
    fontWeight: isActive ? "bold" : "normal",
  })

  const closeButtonStyle = {
    backgroundColor: "#90EE90",
    color: "black",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    width: "100%",
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>{playlist.name}</div>

        <div style={playerContainerStyle}>
          <div style={playerPlaceholderStyle}>YouTube Player Coming Soon</div>
          <div style={controlsStyle}>
            <button onClick={handlePrevious} style={controlButtonStyle}>
              ⏮ Previous
            </button>
            <button onClick={handleNext} style={controlButtonStyle}>
              Next ⏭
            </button>
            <button onClick={() => setRepeatMode(repeatMode === "off" ? "all" : "off")} style={repeatButtonStyle}>
              Repeat: {repeatMode}
            </button>
          </div>
          {currentSong && (
            <div style={currentSongStyle}>
              {currentSong.title} - {currentSong.artist}
            </div>
          )}
        </div>

        <div style={playlistSongsStyle}>
          {songs.map((playlistSong, index) => (
            <div
              key={playlistSong.id}
              onClick={() => setCurrentSongIndex(index)}
              style={songItemStyle(index === currentSongIndex)}
            >
              {index + 1}. {playlistSong.song?.title} - {playlistSong.song?.artist}
            </div>
          ))}
        </div>

        <button onClick={onClose} style={closeButtonStyle}>
          Close
        </button>
      </div>
    </div>
  )
}

export default PlayPlaylistModal
