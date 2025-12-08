"use client"

import { useState, useCallback } from "react"
import { FaCopy } from "react-icons/fa"
import api from "../../services/api"

const EditPlaylistModal = ({ playlist, onClose, onSave }) => {
  const [name, setName] = useState(playlist.name)
  const [songs, setSongs] = useState(playlist.playlist_songs || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // Transaction stack for undo/redo (Section 11.6)
  const [undoStack, setUndoStack] = useState([])
  const [redoStack, setRedoStack] = useState([])

  // Track pending changes for save on close
  const [pendingNameChange, setPendingNameChange] = useState(false)
  const [pendingReorder, setPendingReorder] = useState(false)
  const [removedSongIds, setRemovedSongIds] = useState([])
  const [copiedSongMappings, setCopiedSongMappings] = useState([]) // {originalId, newSongId, playlistSongId}

  // Push action to undo stack and clear redo stack
  const pushToUndoStack = useCallback((action) => {
    setUndoStack(prev => [...prev, action])
    setRedoStack([]) // Clear redo stack on new action
  }, [])

  // Handle name change with transaction tracking
  const handleNameChange = (newName) => {
    const previousName = name
    pushToUndoStack({
      type: 'NAME_CHANGE',
      previousState: { name: previousName },
      newState: { name: newName }
    })
    setName(newName)
    setPendingNameChange(true)
  }

  // Drag and drop handlers for song reordering
  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const previousSongs = [...songs]
    const newSongs = [...songs]
    const [draggedItem] = newSongs.splice(draggedIndex, 1)
    newSongs.splice(dropIndex, 0, draggedItem)

    // Update positions
    newSongs.forEach((s, i) => {
      s.position = i + 1
    })

    pushToUndoStack({
      type: 'REORDER',
      previousState: { songs: previousSongs },
      newState: { songs: newSongs }
    })

    setSongs(newSongs)
    setPendingReorder(true)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Handle song copy - creates deep copy owned by current user and replaces in playlist
  const handleCopySong = async (index) => {
    const playlistSong = songs[index]
    const songId = playlistSong.song.id

    try {
      setLoading(true)
      setError("")

      // Create deep copy of song via API
      const result = await api.copySong(songId)

      if (result.success) {
        const newSong = result.data
        const previousSongs = [...songs]
        const newSongs = [...songs]

        // Replace the song in this position with the copied song
        newSongs[index] = {
          ...newSongs[index],
          song: newSong,
          song_id: newSong.id
        }

        pushToUndoStack({
          type: 'COPY_SONG',
          previousState: { songs: previousSongs, index, originalSongId: songId },
          newState: { songs: newSongs, newSongId: newSong.id }
        })

        setSongs(newSongs)
        setCopiedSongMappings(prev => [...prev, {
          originalId: songId,
          newSongId: newSong.id,
          playlistSongId: playlistSong.id,
          index
        }])
        setPendingReorder(true) // Will need to update the playlist_songs
      } else {
        setError(result.message || "Failed to copy song")
      }
    } catch (err) {
      setError("Error copying song")
    } finally {
      setLoading(false)
    }
  }

  // Handle song removal
  const handleRemoveSong = (index) => {
    const playlistSong = songs[index]
    const previousSongs = [...songs]
    const newSongs = songs.filter((_, i) => i !== index)

    // Update positions
    newSongs.forEach((s, i) => {
      s.position = i + 1
    })

    pushToUndoStack({
      type: 'REMOVE_SONG',
      previousState: { songs: previousSongs, removedSong: playlistSong, index },
      newState: { songs: newSongs }
    })

    setSongs(newSongs)
    setRemovedSongIds(prev => [...prev, playlistSong.song.id])
    setPendingReorder(true)
  }

  // Undo action
  const handleUndo = () => {
    if (undoStack.length === 0) return

    const action = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [...prev, action])

    // Apply previous state
    switch (action.type) {
      case 'NAME_CHANGE':
        setName(action.previousState.name)
        break
      case 'REORDER':
      case 'COPY_SONG':
      case 'REMOVE_SONG':
        setSongs(action.previousState.songs)
        // If undoing a remove, remove from removedSongIds
        if (action.type === 'REMOVE_SONG') {
          setRemovedSongIds(prev =>
            prev.filter(id => id !== action.previousState.removedSong.song.id)
          )
        }
        break
      default:
        break
    }
  }

  // Redo action
  const handleRedo = () => {
    if (redoStack.length === 0) return

    const action = redoStack[redoStack.length - 1]
    setRedoStack(prev => prev.slice(0, -1))
    setUndoStack(prev => [...prev, action])

    // Apply new state
    switch (action.type) {
      case 'NAME_CHANGE':
        setName(action.newState.name)
        break
      case 'REORDER':
      case 'COPY_SONG':
      case 'REMOVE_SONG':
        setSongs(action.newState.songs)
        // If redoing a remove, add back to removedSongIds
        if (action.type === 'REMOVE_SONG') {
          setRemovedSongIds(prev => [...prev, action.previousState.removedSong.song.id])
        }
        break
      default:
        break
    }
  }

  // Handle close - save all changes to database
  const handleClose = async () => {
    try {
      setLoading(true)
      setError("")

      // Save name change if pending
      if (pendingNameChange && name !== playlist.name) {
        const nameResult = await api.updatePlaylist(playlist.id, name)
        if (!nameResult.success) {
          setError(nameResult.message || "Failed to update playlist name")
          setLoading(false)
          return
        }
      }

      // Remove songs that were deleted
      for (const songId of removedSongIds) {
        await api.removeSongFromPlaylist(playlist.id, songId)
      }

      // Reorder songs if needed (this handles both reordering and song replacements from copies)
      if (pendingReorder && songs.length > 0) {
        // Build the songIds array for reorder API - just the song IDs in order
        const songIds = songs.map((s) => s.song.id)
        await api.reorderPlaylistSongs(playlist.id, songIds)
      }

      // Call onSave to update parent state (API calls already done above)
      // Pass the playlist id and updated data for parent to refresh
      if (onSave) {
        onSave(playlist.id)
      }

      // Reset stacks and close
      setUndoStack([])
      setRedoStack([])
      onClose()
    } catch (err) {
      setError("Error saving changes")
      setLoading(false)
    }
  }

  // Styles per Section 6.1 and 9.1
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
    backgroundColor: "#90EE90", // Light green per Section 9.1
    borderRadius: "8px",
    maxWidth: "600px",
    width: "90%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    overflow: "hidden",
    margin: "20px auto",
  }

  const modalHeaderStyle = {
    backgroundColor: "#228B22", // Dark green per Section 9.1
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

  const songsListStyle = {
    backgroundColor: "#fff",
    borderRadius: "4px",
    padding: "10px",
    maxHeight: "300px",
    overflowY: "auto",
    marginBottom: "15px",
  }

  const getSongItemStyle = (index) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
    cursor: "grab",
    backgroundColor: draggedIndex === index ? "#E8F5E9" : dragOverIndex === index ? "#FFF9C4" : "transparent",
    opacity: draggedIndex === index ? 0.5 : 1,
    borderLeft: dragOverIndex === index ? "3px solid #9C27B0" : "3px solid transparent",
    transition: "background-color 0.15s, border-left 0.15s",
  })

  const songInfoStyle = {
    flex: 1,
    marginRight: "10px",
  }

  const songActionsStyle = {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  }

  const iconButtonStyle = {
    backgroundColor: "#9C27B0", // Purple per spec
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    minWidth: "28px",
  }

  const dragHandleStyle = {
    cursor: "grab",
    color: "#999",
    marginRight: "8px",
    fontSize: "16px",
  }

  const deleteButtonStyle = {
    backgroundColor: "#E91E63", // Red delete per Section 9.1
    color: "white",
    border: "none",
    padding: "4px 8px",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "12px",
    minWidth: "28px",
  }

  const buttonsContainerStyle = {
    display: "flex",
    gap: "10px",
    justifyContent: "space-between",
    alignItems: "center",
  }

  const undoRedoContainerStyle = {
    display: "flex",
    gap: "10px",
  }

  const undoRedoButtonStyle = {
    backgroundColor: "#9C27B0", // Purple per Section 6.1
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  }

  const undoRedoButtonDisabledStyle = {
    ...undoRedoButtonStyle,
    backgroundColor: "#CCCCCC",
    color: "#666666",
    cursor: "not-allowed",
  }

  const closeButtonStyle = {
    backgroundColor: "#4CAF50", // Green per Section 6.1
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  }

  return (
    <div style={modalOverlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>Edit Playlist</div>
        <div style={modalBodyStyle}>
          {error && (
            <div
              style={{
                backgroundColor: "#FFCDD2",
                color: "#C62828",
                padding: "8px",
                borderRadius: "4px",
                marginBottom: "15px",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}

          {/* Playlist Name */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Playlist Name</label>
            <div style={inputContainerStyle}>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                style={inputStyle}
              />
              {name && (
                <button
                  type="button"
                  onClick={() => handleNameChange("")}
                  style={clearButtonStyle}
                >
                  ⊗
                </button>
              )}
            </div>
          </div>

          {/* Songs List per Section 6.1 format */}
          <div style={formGroupStyle}>
            <label style={labelStyle}>Songs ({songs.length})</label>
            <div style={songsListStyle}>
              {songs.length === 0 ? (
                <div style={{ color: "#666", fontStyle: "italic", padding: "8px" }}>
                  No songs in playlist
                </div>
              ) : (
                songs.map((playlistSong, index) => (
                  <div
                    key={playlistSong.id || index}
                    style={getSongItemStyle(index)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                  >
                    {/* Drag handle */}
                    <span style={dragHandleStyle} title="Drag to reorder">☰</span>

                    {/* Song display: "1. Song Title by Artist (Year)" */}
                    <div style={songInfoStyle}>
                      {index + 1}. {playlistSong.song?.title || "Unknown"} by{" "}
                      {playlistSong.song?.artist || "Unknown"} (
                      {playlistSong.song?.year || "N/A"})
                    </div>

                    {/* Action buttons: [Copy icon] [X] */}
                    <div style={songActionsStyle}>
                      {/* Copy (deep copy) */}
                      <button
                        type="button"
                        onClick={() => handleCopySong(index)}
                        style={iconButtonStyle}
                        disabled={loading}
                        title="Copy Song"
                      >
                        <FaCopy />
                      </button>

                      {/* Delete (X) */}
                      <button
                        type="button"
                        onClick={() => handleRemoveSong(index)}
                        style={deleteButtonStyle}
                        disabled={loading}
                        title="Remove Song"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer buttons per Section 6.1: Undo, Redo, Close */}
          <div style={buttonsContainerStyle}>
            <div style={undoRedoContainerStyle}>
              <button
                type="button"
                onClick={handleUndo}
                style={undoStack.length === 0 ? undoRedoButtonDisabledStyle : undoRedoButtonStyle}
                disabled={undoStack.length === 0 || loading}
              >
                Undo
              </button>
              <button
                type="button"
                onClick={handleRedo}
                style={redoStack.length === 0 ? undoRedoButtonDisabledStyle : undoRedoButtonStyle}
                disabled={redoStack.length === 0 || loading}
              >
                Redo
              </button>
            </div>
            <button
              type="button"
              onClick={handleClose}
              style={closeButtonStyle}
              disabled={loading}
            >
              {loading ? "Saving..." : "Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditPlaylistModal
