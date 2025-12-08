"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import CreatePlaylistModal from "../components/modals/CreatePlaylistModal"
import EditPlaylistModal from "../components/modals/EditPlaylistModal"
import PlayPlaylistModal from "../components/modals/PlayPlaylistModal"
import DeletePlaylistModal from "../components/modals/DeletePlaylistModal"

const Playlists = () => {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState([])
  const [filteredPlaylists, setFilteredPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState("name")
  const [sortBy, setSortBy] = useState("name-asc")
  const [error, setError] = useState("")

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPlayModal, setShowPlayModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  useEffect(() => {
    filterAndSortPlaylists()
  }, [playlists, searchQuery, searchType, sortBy])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError("")
      const result = await api.getPlaylists()
      if (result.success) {
        setPlaylists(result.data.playlists || [])
      } else {
        setError("Failed to load playlists")
      }
    } catch (err) {
      setError("Error loading playlists")
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPlaylists = () => {
    let filtered = [...playlists]

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((p) => {
        const query = searchQuery.toLowerCase()
        switch (searchType) {
          case "name":
            return p.name.toLowerCase().includes(query)
          case "owner":
            return p.owner?.username?.toLowerCase().includes(query)
          case "song":
            return p.playlist_songs?.some((ps) => ps.song?.title?.toLowerCase().includes(query))
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0
      const [sortKey, sortOrder] = sortBy.split("-")

      switch (sortKey) {
        case "name":
          compareValue = a.name.localeCompare(b.name)
          break
        case "listeners":
          compareValue = (b.listener_count || 0) - (a.listener_count || 0)
          break
        case "owner":
          compareValue = (a.owner?.username || "").localeCompare(b.owner?.username || "")
          break
        default:
          compareValue = 0
      }

      return sortOrder === "desc" ? -compareValue : compareValue
    })

    setFilteredPlaylists(filtered)
  }

  const handleCreatePlaylist = async (name) => {
    try {
      const result = await api.createPlaylist(name)
      if (result.success) {
        setPlaylists([...playlists, result.data])
        setShowCreateModal(false)
      } else {
        setError(result.message || "Failed to create playlist")
      }
    } catch (err) {
      setError("Error creating playlist")
    }
  }

  const handleEditPlaylist = async (id, name) => {
    try {
      const result = await api.updatePlaylist(id, name)
      if (result.success) {
        setPlaylists(playlists.map((p) => (p.id === id ? result.data : p)))
        setShowEditModal(false)
        setSelectedPlaylist(null)
      } else {
        setError(result.message || "Failed to update playlist")
      }
    } catch (err) {
      setError("Error updating playlist")
    }
  }

  const handleDeletePlaylist = async (id) => {
    try {
      const result = await api.deletePlaylist(id)
      if (result.success) {
        setPlaylists(playlists.filter((p) => p.id !== id))
        setShowDeleteModal(false)
        setSelectedPlaylist(null)
      } else {
        setError(result.message || "Failed to delete playlist")
      }
    } catch (err) {
      setError("Error deleting playlist")
    }
  }

  const handleCopyPlaylist = async (id) => {
    try {
      const result = await api.copyPlaylist(id)
      if (result.success) {
        setPlaylists([...playlists, result.data])
      } else {
        setError(result.message || "Failed to copy playlist")
      }
    } catch (err) {
      setError("Error copying playlist")
    }
  }

  const containerStyle = {
    minHeight: "calc(100vh - 50px)",
    backgroundColor: "#FFE4F3",
    padding: "20px",
  }

  const contentStyle = {
    maxWidth: "1200px",
    margin: "0 auto",
  }

  const titleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#9C27B0",
    marginBottom: "20px",
  }

  const searchContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  }

  const inputStyle = {
    flex: 1,
    minWidth: "200px",
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
  }

  const selectStyle = {
    padding: "10px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
  }

  const createButtonStyle = {
    backgroundColor: "#228B22",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  }

  const playlistsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  }

  const playlistCardStyle = {
    backgroundColor: "#FFFDE7",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.2s",
  }

  const playlistNameStyle = {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#9C27B0",
    marginBottom: "10px",
  }

  const playlistMetaStyle = {
    fontSize: "12px",
    color: "#666",
    marginBottom: "5px",
  }

  const actionButtonsStyle = {
    display: "flex",
    gap: "8px",
    marginTop: "15px",
    flexWrap: "wrap",
  }

  const smallButtonStyle = {
    flex: 1,
    minWidth: "70px",
    padding: "6px 10px",
    fontSize: "12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  }

  const playButtonStyle = {
    ...smallButtonStyle,
    backgroundColor: "#9C27B0",
    color: "white",
  }

  const editButtonStyle = {
    ...smallButtonStyle,
    backgroundColor: "#7B1FA2",
    color: "white",
  }

  const copyButtonStyle = {
    ...smallButtonStyle,
    backgroundColor: "#228B22",
    color: "white",
  }

  const deleteButtonStyle = {
    ...smallButtonStyle,
    backgroundColor: "#C62828",
    color: "white",
  }

  const emptyStateStyle = {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "#FFFDE7",
    borderRadius: "8px",
    color: "#666",
  }

  const errorStyle = {
    backgroundColor: "#FFCDD2",
    color: "#C62828",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
    fontSize: "14px",
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={contentStyle}>
          <p>Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Playlists</h1>

        {error && <div style={errorStyle}>{error}</div>}

        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder={`Search by ${searchType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inputStyle}
          />
          <select value={searchType} onChange={(e) => setSearchType(e.target.value)} style={selectStyle}>
            <option value="name">By Name</option>
            <option value="owner">By Owner</option>
            <option value="song">By Song</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="listeners-desc">Most Listeners</option>
            <option value="listeners-asc">Least Listeners</option>
            <option value="owner-asc">Owner A-Z</option>
            <option value="owner-desc">Owner Z-A</option>
          </select>
          {user && (
            <button onClick={() => setShowCreateModal(true)} style={createButtonStyle}>
              + Create
            </button>
          )}
        </div>

        {filteredPlaylists.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>No playlists found. {user ? "Create your first playlist!" : "Login to create playlists."}</p>
          </div>
        ) : (
          <div style={playlistsGridStyle}>
            {filteredPlaylists.map((playlist) => (
              <div key={playlist.id} style={playlistCardStyle}>
                <h3 style={playlistNameStyle}>{playlist.name}</h3>
                <p style={playlistMetaStyle}>Owner: {playlist.owner?.username || "Unknown"}</p>
                <p style={playlistMetaStyle}>Listeners: {playlist.listener_count || 0}</p>
                <p style={playlistMetaStyle}>Songs: {playlist.playlist_songs?.length || 0}</p>
                <div style={actionButtonsStyle}>
                  <button
                    onClick={() => {
                      setSelectedPlaylist(playlist)
                      setShowPlayModal(true)
                    }}
                    style={playButtonStyle}
                  >
                    Play
                  </button>
                  {user?.id === playlist.owner_id && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setShowEditModal(true)
                        }}
                        style={editButtonStyle}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPlaylist(playlist)
                          setShowDeleteModal(true)
                        }}
                        style={deleteButtonStyle}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {user && user?.id !== playlist.owner_id && (
                    <button onClick={() => handleCopyPlaylist(playlist.id)} style={copyButtonStyle}>
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreatePlaylistModal onClose={() => setShowCreateModal(false)} onCreate={handleCreatePlaylist} />
      )}
      {showEditModal && selectedPlaylist && (
        <EditPlaylistModal
          playlist={selectedPlaylist}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPlaylist(null)
          }}
          onSave={handleEditPlaylist}
        />
      )}
      {showPlayModal && selectedPlaylist && (
        <PlayPlaylistModal
          playlist={selectedPlaylist}
          onClose={() => {
            setShowPlayModal(false)
            setSelectedPlaylist(null)
          }}
        />
      )}
      {showDeleteModal && selectedPlaylist && (
        <DeletePlaylistModal
          playlist={selectedPlaylist}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedPlaylist(null)
          }}
          onDelete={handleDeletePlaylist}
        />
      )}
    </div>
  )
}

export default Playlists
