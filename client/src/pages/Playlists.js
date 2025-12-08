"use client"

import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { FaSearch } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import EditPlaylistModal from "../components/modals/EditPlaylistModal"
import PlayPlaylistModal from "../components/modals/PlayPlaylistModal"
import DeletePlaylistModal from "../components/modals/DeletePlaylistModal"

const Playlists = () => {
  const { user } = useAuth()
  const location = useLocation()
  const [playlists, setPlaylists] = useState([])
  const [filteredPlaylists, setFilteredPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Search filters - 5 separate fields (input state)
  const [playlistNameFilter, setPlaylistNameFilter] = useState("")
  const [userNameFilter, setUserNameFilter] = useState("")
  const [songTitleFilter, setSongTitleFilter] = useState("")
  const [songArtistFilter, setSongArtistFilter] = useState("")
  const [songYearFilter, setSongYearFilter] = useState("")

  // Applied filters - only update on search button/Enter (per UC 2.12)
  const [appliedPlaylistNameFilter, setAppliedPlaylistNameFilter] = useState("")
  const [appliedUserNameFilter, setAppliedUserNameFilter] = useState("")
  const [appliedSongTitleFilter, setAppliedSongTitleFilter] = useState("")
  const [appliedSongArtistFilter, setAppliedSongArtistFilter] = useState("")
  const [appliedSongYearFilter, setAppliedSongYearFilter] = useState("")

  // Sort
  const [sortBy, setSortBy] = useState("name-asc")

  // Expanded playlists
  const [expandedPlaylistIds, setExpandedPlaylistIds] = useState(new Set())

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPlayModal, setShowPlayModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)

  useEffect(() => {
    fetchPlaylists()
  }, [location.key])

  useEffect(() => {
    filterAndSortPlaylists()
  }, [playlists, appliedPlaylistNameFilter, appliedUserNameFilter, appliedSongTitleFilter, appliedSongArtistFilter, appliedSongYearFilter, sortBy])

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

    // Apply all filters (AND logic) - using applied filters per UC 2.12
    if (appliedPlaylistNameFilter.trim()) {
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(appliedPlaylistNameFilter.toLowerCase()))
    }

    if (appliedUserNameFilter.trim()) {
      filtered = filtered.filter((p) =>
        p.owner?.username?.toLowerCase().includes(appliedUserNameFilter.toLowerCase())
      )
    }

    if (appliedSongTitleFilter.trim()) {
      filtered = filtered.filter((p) =>
        p.playlist_songs?.some((ps) => ps.song?.title?.toLowerCase().includes(appliedSongTitleFilter.toLowerCase()))
      )
    }

    if (appliedSongArtistFilter.trim()) {
      filtered = filtered.filter((p) =>
        p.playlist_songs?.some((ps) => ps.song?.artist?.toLowerCase().includes(appliedSongArtistFilter.toLowerCase()))
      )
    }

    if (appliedSongYearFilter.trim()) {
      filtered = filtered.filter((p) =>
        p.playlist_songs?.some((ps) => ps.song?.year?.toString().includes(appliedSongYearFilter.trim()))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "listeners-hi-lo":
          return (b.listener_count || 0) - (a.listener_count || 0)
        case "listeners-lo-hi":
          return (a.listener_count || 0) - (b.listener_count || 0)
        case "name-asc":
          return (a.name || '').localeCompare(b.name || '')
        case "name-desc":
          return (b.name || '').localeCompare(a.name || '')
        case "owner-asc":
          return (a.owner?.username || "").localeCompare(b.owner?.username || "")
        case "owner-desc":
          return (b.owner?.username || "").localeCompare(a.owner?.username || "")
        default:
          return 0
      }
    })

    setFilteredPlaylists(filtered)
  }

  const handleSearch = () => {
    // Copy input values to applied values (per UC 2.12 - search on button/Enter only)
    setAppliedPlaylistNameFilter(playlistNameFilter)
    setAppliedUserNameFilter(userNameFilter)
    setAppliedSongTitleFilter(songTitleFilter)
    setAppliedSongArtistFilter(songArtistFilter)
    setAppliedSongYearFilter(songYearFilter)
  }

  const handleClear = () => {
    // Clear both input and applied filters
    setPlaylistNameFilter("")
    setUserNameFilter("")
    setSongTitleFilter("")
    setSongArtistFilter("")
    setSongYearFilter("")
    setAppliedPlaylistNameFilter("")
    setAppliedUserNameFilter("")
    setAppliedSongTitleFilter("")
    setAppliedSongArtistFilter("")
    setAppliedSongYearFilter("")
  }

  const togglePlaylistExpanded = (playlistId) => {
    const newExpanded = new Set(expandedPlaylistIds)
    if (newExpanded.has(playlistId)) {
      newExpanded.delete(playlistId)
    } else {
      newExpanded.add(playlistId)
    }
    setExpandedPlaylistIds(newExpanded)
  }

  const handleCreatePlaylist = async () => {
    try {
      const result = await api.createPlaylist()
      if (result.success) {
        const newPlaylist = result.data.playlist
        setPlaylists([...playlists, newPlaylist])
        setSelectedPlaylist(newPlaylist)
        setShowEditModal(true)
      } else {
        setError(result.message || "Failed to create playlist")
      }
    } catch (err) {
      setError("Error creating playlist")
    }
  }

  const handleEditPlaylist = async (playlistId) => {
    // EditPlaylistModal already handles all API calls, just refresh the playlist data
    try {
      const result = await api.getPlaylist(playlistId)
      if (result.success) {
        setPlaylists(playlists.map((p) => (p.id === playlistId ? result.data.playlist : p)))
      }
      setShowEditModal(false)
      setSelectedPlaylist(null)
    } catch (err) {
      setError("Error refreshing playlist")
      setShowEditModal(false)
      setSelectedPlaylist(null)
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
        setPlaylists([...playlists, result.data.playlist])
      } else {
        setError(result.message || "Failed to copy playlist")
      }
    } catch (err) {
      setError("Error copying playlist")
    }
  }

  // Styles
  const containerStyle = {
    height: "100%",
    backgroundColor: "#FFFDE7",
    padding: "0",
    overflow: "hidden",
  }

  const twoColumnLayoutStyle = {
    display: "flex",
    height: "100%",
    gap: "0",
  }

  const leftPanelStyle = {
    width: "40%",
    backgroundColor: "#FFFDE7",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    overflow: "hidden",
  }

  const rightPanelStyle = {
    width: "60%",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }

  const panelTitleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#9C27B0",
    marginBottom: "10px",
  }

  const inputFieldStyle = {
    height: "44px",
    padding: "10px 40px 10px 12px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    outline: "none",
    position: "relative",
  }

  const inputContainerStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  }

  const clearButtonStyle = {
    position: "absolute",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    color: "#999",
    padding: "0",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const searchButtonStyle = {
    backgroundColor: "#9C27B0",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    height: "40px",
    flex: 1,
  }

  const clearFiltersButtonStyle = {
    backgroundColor: "white",
    color: "#9C27B0",
    border: "2px solid #9C27B0",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    height: "40px",
    flex: 1,
  }

  const buttonRowStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  }

  const headerRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  }

  const sortContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  }

  const sortLabelStyle = {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
  }

  const sortSelectStyle = {
    padding: "8px 12px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: "pointer",
    minWidth: "200px",
  }

  const resultsCountStyle = {
    fontSize: "16px",
    color: "#666",
    fontWeight: "500",
  }

  const newPlaylistButtonStyle = {
    backgroundColor: "#9C27B0",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  }

  const playlistsListStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    flex: 1,
    overflowY: "auto",
  }

  const resultsListStyle = {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }

  const playlistCardStyle = {
    backgroundColor: "white",
    border: "1px solid #ddd",
    borderRadius: "8px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  }

  const cardHeaderStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  }

  const avatarStyle = {
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#9C27B0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: "20px",
    flexShrink: 0,
  }

  const cardInfoStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  }

  const playlistNameStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#9C27B0",
    margin: 0,
  }

  const ownerNameStyle = {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  }

  const listenerCountStyle = {
    fontSize: "14px",
    color: "#9C27B0",
    margin: 0,
  }

  const actionButtonsContainerStyle = {
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
    flexShrink: 0,
  }

  const actionButtonStyle = {
    width: "60px",
    height: "28px",
    fontSize: "12px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    color: "white",
  }

  const deleteButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: "#E91E63",
  }

  const editButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: "#9C27B0",
  }

  const copyButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: "#9C27B0",
  }

  const playButtonStyle = {
    ...actionButtonStyle,
    backgroundColor: "#4CAF50",
  }

  const expandButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    color: "#666",
    padding: "4px",
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const songListStyle = {
    marginTop: "8px",
    paddingLeft: "60px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  }

  const songItemStyle = {
    fontSize: "14px",
    color: "#333",
    padding: "4px 0",
  }

  const emptyStateStyle = {
    textAlign: "center",
    padding: "40px",
    backgroundColor: "white",
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
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Loading playlists...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <div style={twoColumnLayoutStyle}>
        {/* Left Panel - Search Filters */}
        <div style={leftPanelStyle}>
          <h2 style={panelTitleStyle}>Playlists</h2>

          {/* 5 Search Input Fields */}
          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Playlist Name"
              value={playlistNameFilter}
              onChange={(e) => setPlaylistNameFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {playlistNameFilter && (
              <button style={clearButtonStyle} onClick={() => setPlaylistNameFilter("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by User Name"
              value={userNameFilter}
              onChange={(e) => setUserNameFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {userNameFilter && (
              <button style={clearButtonStyle} onClick={() => setUserNameFilter("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Song Title"
              value={songTitleFilter}
              onChange={(e) => setSongTitleFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {songTitleFilter && (
              <button style={clearButtonStyle} onClick={() => setSongTitleFilter("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Song Artist"
              value={songArtistFilter}
              onChange={(e) => setSongArtistFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {songArtistFilter && (
              <button style={clearButtonStyle} onClick={() => setSongArtistFilter("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Song Year"
              value={songYearFilter}
              onChange={(e) => setSongYearFilter(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {songYearFilter && (
              <button style={clearButtonStyle} onClick={() => setSongYearFilter("")}>
                ⊗
              </button>
            )}
          </div>

          {/* Search and Clear Buttons */}
          <div style={buttonRowStyle}>
            <button onClick={handleSearch} style={searchButtonStyle}>
              <FaSearch style={{ marginRight: "6px" }} /> Search
            </button>
            <button onClick={handleClear} style={clearFiltersButtonStyle}>
              Clear
            </button>
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ padding: "20px 0", alignSelf: "stretch" }}>
          <div style={{ width: "1px", height: "100%", backgroundColor: "black" }} />
        </div>

        {/* Right Panel - Results */}
        <div style={rightPanelStyle}>
          {error && <div style={errorStyle}>{error}</div>}

          {/* Header Row */}
          <div style={headerRowStyle}>
            <div style={sortContainerStyle}>
              <span style={sortLabelStyle}>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={sortSelectStyle}>
                <option value="listeners-hi-lo">Listeners (Hi-Lo)</option>
                <option value="listeners-lo-hi">Listeners (Lo-Hi)</option>
                <option value="name-asc">Playlist Name (A-Z)</option>
                <option value="name-desc">Playlist Name (Z-A)</option>
                <option value="owner-asc">User Name (A-Z)</option>
                <option value="owner-desc">User Name (Z-A)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <span style={resultsCountStyle}>
                {filteredPlaylists.length} {filteredPlaylists.length === 1 ? "Playlist" : "Playlists"}
              </span>
              {user && (
                <button onClick={handleCreatePlaylist} style={newPlaylistButtonStyle}>
                  New Playlist
                </button>
              )}
            </div>
          </div>

          {/* Playlists List - Scrollable Container */}
          <div style={resultsListStyle}>
            {filteredPlaylists.length === 0 ? (
              <div style={emptyStateStyle}>
                <p>No playlists found. {user ? "Create your first playlist!" : "Login to create playlists."}</p>
              </div>
            ) : (
              filteredPlaylists.map((playlist) => {
                const isOwner = user?.id === playlist.owner_id
                const isExpanded = expandedPlaylistIds.has(playlist.id)
                const songs = playlist.playlist_songs || []

                return (
                  <div key={playlist.id} style={playlistCardStyle}>
                    <div style={cardHeaderStyle}>
                      {/* Avatar */}
                      <div style={avatarStyle}>
                        {playlist.owner?.username?.[0]?.toUpperCase() || "?"}
                      </div>

                      {/* Playlist Info */}
                      <div style={cardInfoStyle}>
                        <h3 style={playlistNameStyle}>{playlist.name}</h3>
                        <p style={ownerNameStyle}>{playlist.owner?.username || "Unknown"}</p>
                      </div>

                      {/* Action Buttons */}
                      <div style={actionButtonsContainerStyle}>
                        {isOwner && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedPlaylist(playlist)
                                setShowDeleteModal(true)
                              }}
                              style={deleteButtonStyle}
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPlaylist(playlist)
                                setShowEditModal(true)
                              }}
                              style={editButtonStyle}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {user && !isOwner && (
                          <button onClick={() => handleCopyPlaylist(playlist.id)} style={copyButtonStyle}>
                            Copy
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPlaylist(playlist)
                            setShowPlayModal(true)
                          }}
                          style={playButtonStyle}
                        >
                          Play
                        </button>
                        <button onClick={() => togglePlaylistExpanded(playlist.id)} style={expandButtonStyle}>
                          {isExpanded ? "∧" : "∨"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Song List */}
                    {isExpanded && songs.length > 0 && (
                      <div style={songListStyle}>
                        {songs
                          .sort((a, b) => a.position - b.position)
                          .map((ps, index) => (
                            <div key={ps.id} style={songItemStyle}>
                              {index + 1}. {ps.song?.title || "Unknown"} by {ps.song?.artist || "Unknown"} (
                              {ps.song?.year || "N/A"})
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Listener Count */}
                    <p style={listenerCountStyle}>{playlist.listener_count || 0} Listeners</p>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
