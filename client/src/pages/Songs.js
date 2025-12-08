"use client"

import { useState, useEffect, useRef } from "react"
import ReactDOM from "react-dom"
import { FaSearch, FaArrowRight } from "react-icons/fa"
import { useAuth } from "../context/AuthContext"
import api from "../services/api"
import CreateSongModal from "../components/modals/CreateSongModal"
import EditSongModal from "../components/modals/EditSongModal"
import DeleteSongModal from "../components/modals/DeleteSongModal"

const Songs = () => {
  const { user } = useAuth()
  const [songs, setSongs] = useState([])
  const [filteredSongs, setFilteredSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)

  // Search filters - 3 separate fields (input state)
  const [searchTitle, setSearchTitle] = useState("")
  const [searchArtist, setSearchArtist] = useState("")
  const [searchYear, setSearchYear] = useState("")

  // Applied filters - only update on search button/Enter (per UC 2.12)
  const [appliedSearchTitle, setAppliedSearchTitle] = useState("")
  const [appliedSearchArtist, setAppliedSearchArtist] = useState("")
  const [appliedSearchYear, setAppliedSearchYear] = useState("")

  const [sortBy, setSortBy] = useState("title-asc")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // YouTube preview and menu state
  const [selectedSongForPreview, setSelectedSongForPreview] = useState(null)
  const [menuOpen, setMenuOpen] = useState(null) // ID of song with open menu
  const [submenuOpen, setSubmenuOpen] = useState(false)

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState(null) // For modals

  const menuRef = useRef(null)
  const addToPlaylistRef = useRef(null)
  const submenuRef = useRef(null)
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    fetchSongs()
    if (user) fetchPlaylists()
  }, [user])

  useEffect(() => {
    filterAndSortSongs()
  }, [songs, appliedSearchTitle, appliedSearchArtist, appliedSearchYear, sortBy])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideMenu = menuRef.current && menuRef.current.contains(event.target)
      const isInsideSubmenu = submenuRef.current && submenuRef.current.contains(event.target)
      if (!isInsideMenu && !isInsideSubmenu) {
        setMenuOpen(null)
        setSubmenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchSongs = async () => {
    try {
      setLoading(true)
      setError("")
      const result = await api.getSongs()
      if (result.success) {
        // Handle both {data: [...]} and {data: {songs: [...]}} response formats
        const songsData = Array.isArray(result.data) ? result.data : (result.data?.songs || [])
        setSongs(songsData)
      } else {
        setError("Failed to load songs")
      }
    } catch (err) {
      setError("Error loading songs")
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylists = async () => {
    try {
      const result = await api.getPlaylists()
      if (result.success) {
        // Handle both {data: [...]} and {data: {playlists: [...]}} response formats
        const playlistsData = Array.isArray(result.data) ? result.data : (result.data?.playlists || [])
        setPlaylists(playlistsData.filter((p) => p.owner_id === user.id))
      }
    } catch (err) {
      console.error("Error fetching playlists:", err)
    }
  }

  const filterAndSortSongs = () => {
    if (!Array.isArray(songs)) {
      setFilteredSongs([])
      return
    }
    let filtered = [...songs]

    // Apply all filters (AND logic) - using applied filters per UC 2.12
    if (appliedSearchTitle.trim()) {
      filtered = filtered.filter((song) => song.title.toLowerCase().includes(appliedSearchTitle.toLowerCase()))
    }

    if (appliedSearchArtist.trim()) {
      filtered = filtered.filter((song) => song.artist.toLowerCase().includes(appliedSearchArtist.toLowerCase()))
    }

    if (appliedSearchYear.trim()) {
      filtered = filtered.filter((song) => song.year.toString().includes(appliedSearchYear.trim()))
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0
      const [sortKey, sortOrder] = sortBy.split("-")

      switch (sortKey) {
        case "title":
          compareValue = a.title.localeCompare(b.title)
          break
        case "artist":
          compareValue = a.artist.localeCompare(b.artist)
          break
        case "year":
          compareValue = a.year - b.year
          break
        case "listens":
          compareValue = (b.listen_count || 0) - (a.listen_count || 0)
          break
        case "playlists":
          const aPlaylistCount = a.playlist_songs?.length || 0
          const bPlaylistCount = b.playlist_songs?.length || 0
          compareValue = bPlaylistCount - aPlaylistCount
          break
        default:
          compareValue = 0
      }

      return sortOrder === "desc" ? -compareValue : compareValue
    })

    setFilteredSongs(filtered)
  }

  const handleSearch = () => {
    // Copy input values to applied values (per UC 2.12 - search on button/Enter only)
    setAppliedSearchTitle(searchTitle)
    setAppliedSearchArtist(searchArtist)
    setAppliedSearchYear(searchYear)
  }

  const handleClear = () => {
    // Clear both input and applied filters
    setSearchTitle("")
    setSearchArtist("")
    setSearchYear("")
    setAppliedSearchTitle("")
    setAppliedSearchArtist("")
    setAppliedSearchYear("")
  }

  const handleCreateSong = async (title, artist, year, youtubeId) => {
    try {
      const result = await api.createSong(title, artist, year, youtubeId)
      if (result.success) {
        setSongs([...songs, result.data.song])
        setShowCreateModal(false)
        setSuccess("Song created successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.message || "Failed to create song")
      }
    } catch (err) {
      setError("Error creating song")
    }
  }

  const handleEditSong = async (id, title, artist, year, youtubeId) => {
    try {
      const result = await api.updateSong(id, title, artist, year, youtubeId)
      if (result.success) {
        setSongs(songs.map((s) => (s.id === id ? result.data.song : s)))
        setShowEditModal(false)
        setSelectedSong(null)
        setSuccess("Song updated successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.message || "Failed to update song")
      }
    } catch (err) {
      setError("Error updating song")
    }
  }

  const handleDeleteSong = async (id) => {
    try {
      const result = await api.deleteSong(id)
      if (result.success) {
        setSongs(songs.filter((s) => s.id !== id))
        setShowDeleteModal(false)
        setSelectedSong(null)
        setSuccess("Song deleted successfully!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.message || "Failed to delete song")
      }
    } catch (err) {
      setError("Error deleting song")
    }
  }

  const handleAddToPlaylist = async (playlistId, songId) => {
    try {
      const result = await api.addSongToPlaylist(playlistId, songId)
      if (result.success) {
        setMenuOpen(null)
        setSubmenuOpen(false)
        setSuccess("Song added to playlist!")
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.message || "Failed to add song to playlist")
      }
    } catch (err) {
      setError("Error adding song to playlist")
    }
  }

  const handleSongCardClick = (song) => {
    setSelectedSongForPreview(song)
  }

  const handleEllipsisClick = (e, songId) => {
    e.stopPropagation()
    setMenuOpen(menuOpen === songId ? null : songId)
    setSubmenuOpen(false)
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

  const resultsListStyle = {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }

  const panelTitleStyle = {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#9C27B0",
    marginBottom: "10px",
  }

  const inputContainerStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
  }

  const inputFieldStyle = {
    height: "44px",
    width: "100%",
    padding: "10px 40px 10px 12px",
    fontSize: "14px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    outline: "none",
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

  const buttonRowStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
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

  const youtubePlayerContainerStyle = {
    marginTop: "20px",
    width: "100%",
    height: "200px",
    backgroundColor: "#333",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#999",
    fontSize: "14px",
    overflow: "hidden",
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

  const resultsInfoStyle = {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  }

  const resultsCountStyle = {
    fontSize: "16px",
    color: "#666",
    fontWeight: "500",
  }

  const newSongButtonStyle = {
    backgroundColor: "#9C27B0",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  }


  const getSongCardStyle = (song) => {
    const isOwned = user?.id === song.owner_id
    const isSelected = selectedSongForPreview?.id === song.id

    return {
      backgroundColor: isOwned ? "#FFF9C4" : "white",
      border: isSelected ? "2px solid #FF6B00" : "1px solid #ddd",
      borderRadius: "8px",
      padding: "12px 16px",
      cursor: "pointer",
      position: "relative",
    }
  }

  const songCardHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  }

  const songTitleLineStyle = {
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  }

  const ellipsisButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "20px",
    color: "#666",
    padding: "0 8px",
    lineHeight: "1",
  }

  const songMetaRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "14px",
    color: "#666",
  }

  const ellipsisMenuStyle = {
    position: "absolute",
    top: "40px",
    right: "10px",
    backgroundColor: "#FFFFFF",
    border: "1px solid #9C27B0",
    borderRadius: "4px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    zIndex: 1000,
    minWidth: "180px",
  }

  const menuItemStyle = {
    padding: "12px 16px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #CE93D8",
    position: "relative",
  }

  const menuItemHoverStyle = {
    backgroundColor: "#CE93D8",
  }

  const submenuStyle = {
    position: "fixed",
    top: submenuPosition.top,
    left: submenuPosition.left,
    backgroundColor: "#FFCDD2",
    border: "1px solid #E91E63",
    borderRadius: "4px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
    minWidth: "160px",
    maxHeight: "120px",
    overflowY: "auto",
    zIndex: 1001,
  }

  const submenuItemStyle = {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
    borderBottom: "1px solid #F8BBD0",
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

  const successStyle = {
    backgroundColor: "#C8E6C9",
    color: "#2E7D32",
    padding: "12px",
    borderRadius: "4px",
    marginBottom: "20px",
    fontSize: "14px",
  }

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: "40px", textAlign: "center" }}>
          <p>Loading songs...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .playlist-submenu::-webkit-scrollbar {
          width: 8px;
        }
        .playlist-submenu::-webkit-scrollbar-track {
          background: #2196F3;
          border-radius: 4px;
        }
        .playlist-submenu::-webkit-scrollbar-thumb {
          background: #000000;
          border-radius: 4px;
        }
        .playlist-submenu::-webkit-scrollbar-thumb:hover {
          background: #333333;
        }
      `}</style>
      <div style={containerStyle}>
      <div style={twoColumnLayoutStyle}>
        {/* Left Panel - Search Filters + YouTube Player */}
        <div style={leftPanelStyle}>
          <h2 style={panelTitleStyle}>Songs</h2>

          {/* 3 Search Input Fields */}
          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Title"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {searchTitle && (
              <button style={clearButtonStyle} onClick={() => setSearchTitle("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Artist"
              value={searchArtist}
              onChange={(e) => setSearchArtist(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {searchArtist && (
              <button style={clearButtonStyle} onClick={() => setSearchArtist("")}>
                ⊗
              </button>
            )}
          </div>

          <div style={inputContainerStyle}>
            <input
              type="text"
              placeholder="by Year"
              value={searchYear}
              onChange={(e) => setSearchYear(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              style={inputFieldStyle}
            />
            {searchYear && (
              <button style={clearButtonStyle} onClick={() => setSearchYear("")}>
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

          {/* YouTube Preview Player */}
          <div style={youtubePlayerContainerStyle}>
            {selectedSongForPreview ? (
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedSongForPreview.youtube_id}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${selectedSongForPreview.title} by ${selectedSongForPreview.artist}`}
              />
            ) : (
              <div>Select a song to preview</div>
            )}
          </div>
        </div>

        {/* Vertical Divider */}
        <div style={{ padding: "20px 0", alignSelf: "stretch" }}>
          <div style={{ width: "1px", height: "100%", backgroundColor: "black" }} />
        </div>

        {/* Right Panel - Results */}
        <div style={rightPanelStyle}>
          {error && <div style={errorStyle}>{error}</div>}
          {success && <div style={successStyle}>{success}</div>}

          {/* Header Row */}
          <div style={headerRowStyle}>
            <div style={sortContainerStyle}>
              <span style={sortLabelStyle}>Sort:</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={sortSelectStyle}>
                <option value="listens-desc">Listens (Hi-Lo)</option>
                <option value="listens-asc">Listens (Lo-Hi)</option>
                <option value="playlists-desc">Playlists (Hi-Lo)</option>
                <option value="playlists-asc">Playlists (Lo-Hi)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
                <option value="artist-asc">Artist (A-Z)</option>
                <option value="artist-desc">Artist (Z-A)</option>
                <option value="year-desc">Year (Hi-Lo)</option>
                <option value="year-asc">Year (Lo-Hi)</option>
              </select>
            </div>

            <div style={resultsInfoStyle}>
              <span style={resultsCountStyle}>
                {filteredSongs.length} {filteredSongs.length === 1 ? "Song" : "Songs"}
              </span>
              {user && (
                <button onClick={() => setShowCreateModal(true)} style={newSongButtonStyle}>
                  New Song
                </button>
              )}
            </div>
          </div>

          {/* Songs List */}
          {filteredSongs.length === 0 ? (
            <div style={emptyStateStyle}>
              <p>No songs found. {user ? "Add your first song!" : "Login to add songs."}</p>
            </div>
          ) : (
            <div style={resultsListStyle}>
              {filteredSongs.map((song) => {
                const isMenuOpen = menuOpen === song.id

                return (
                  <div
                    key={song.id}
                    style={getSongCardStyle(song)}
                    onClick={() => handleSongCardClick(song)}
                  >
                    <div style={songCardHeaderStyle}>
                      <div style={songTitleLineStyle}>
                        {song.title} by {song.artist} ({song.year})
                      </div>
                      <button
                        style={ellipsisButtonStyle}
                        onClick={(e) => handleEllipsisClick(e, song.id)}
                      >
                        ⋮
                      </button>
                    </div>

                    <div style={songMetaRowStyle}>
                      <span>Listens: {(song.listen_count || 0).toLocaleString()}</span>
                      <span>Playlists: {song.playlist_songs?.length || 0}</span>
                    </div>

                    {/* Ellipsis Menu */}
                    {isMenuOpen && (
                      <div ref={menuRef} style={ellipsisMenuStyle}>
                        {/* Add to Playlist */}
                        {user && (
                          <div
                            key="add-to-playlist"
                            ref={addToPlaylistRef}
                            style={menuItemStyle}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor
                              if (addToPlaylistRef.current) {
                                const rect = addToPlaylistRef.current.getBoundingClientRect()
                                setSubmenuPosition({
                                  top: rect.top,
                                  left: rect.right + 2
                                })
                              }
                              setSubmenuOpen(true)
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ""
                            }}
                          >
                            Add to Playlist <FaArrowRight style={{ marginLeft: "5px" }} />

                            {submenuOpen && ReactDOM.createPortal(
                              <div ref={submenuRef} className="playlist-submenu" style={submenuStyle}>
                                {playlists.length === 0 ? (
                                  <div style={{ ...submenuItemStyle, cursor: "default" }}>
                                    No playlists available
                                  </div>
                                ) : (
                                  playlists.map((playlist) => (
                                    <div
                                      key={playlist.id}
                                      style={submenuItemStyle}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddToPlaylist(playlist.id, song.id)
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = "#F8BBD0"
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = ""
                                      }}
                                    >
                                      {playlist.name}
                                    </div>
                                  ))
                                )}
                              </div>,
                              document.body
                            )}
                          </div>
                        )}

                        {/* Edit Song - Owner Only */}
                        {user?.id === song.owner_id && (
                          <div
                            key="edit-song"
                            style={menuItemStyle}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSong(song)
                              setShowEditModal(true)
                              setMenuOpen(null)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ""
                            }}
                          >
                            Edit Song
                          </div>
                        )}

                        {/* Remove from Catalog - Owner Only */}
                        {user?.id === song.owner_id && (
                          <div
                            key="remove-from-catalog"
                            style={{ ...menuItemStyle, borderBottom: "none" }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSong(song)
                              setShowDeleteModal(true)
                              setMenuOpen(null)
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = menuItemHoverStyle.backgroundColor
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = ""
                            }}
                          >
                            Remove from Catalog
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && <CreateSongModal onClose={() => setShowCreateModal(false)} onCreate={handleCreateSong} />}
      {showEditModal && selectedSong && (
        <EditSongModal
          song={selectedSong}
          onClose={() => {
            setShowEditModal(false)
            setSelectedSong(null)
          }}
          onSave={handleEditSong}
        />
      )}
      {showDeleteModal && selectedSong && (
        <DeleteSongModal
          song={selectedSong}
          onClose={() => {
            setShowDeleteModal(false)
            setSelectedSong(null)
          }}
          onDelete={handleDeleteSong}
        />
      )}
    </div>
    </>
  )
}

export default Songs
