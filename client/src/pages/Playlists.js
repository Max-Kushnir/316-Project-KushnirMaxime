import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function Playlists() {
  const { user } = useAuth();

  // Search filters
  const [filters, setFilters] = useState({
    name: '',
    username: '',
    songTitle: '',
    songArtist: '',
    songYear: ''
  });

  // Sort
  const [sortBy, setSortBy] = useState('listener_count');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Playlists data
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Expanded playlist
  const [expandedId, setExpandedId] = useState(null);

  // Modals
  const [editModal, setEditModal] = useState(null); // {playlistId, name}
  const [playModal, setPlayModal] = useState(null); // playlist object
  const [addSongModal, setAddSongModal] = useState(null); // playlistId

  // Session ID for guest listeners
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem('guestSessionId');
    if (!sid) {
      sid = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sid);
    }
    return sid;
  });

  // Load playlists
  const loadPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.name) params.append('name', filters.name);
      if (filters.username) params.append('username', filters.username);
      if (filters.songTitle) params.append('songTitle', filters.songTitle);
      if (filters.songArtist) params.append('songArtist', filters.songArtist);
      if (filters.songYear) params.append('songYear', filters.songYear);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);

      const data = await api.get(`/playlists?${params.toString()}`);
      setPlaylists(data.data.playlists || []);
    } catch (err) {
      setError(err.message || 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, [sortBy, sortOrder]);

  // Handlers
  const handleSearch = () => {
    loadPlaylists();
  };

  const handleClear = () => {
    setFilters({
      name: '',
      username: '',
      songTitle: '',
      songArtist: '',
      songYear: ''
    });
    setTimeout(() => loadPlaylists(), 0);
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    const sortMap = {
      'listeners-hi': { sortBy: 'listener_count', sortOrder: 'DESC' },
      'listeners-lo': { sortBy: 'listener_count', sortOrder: 'ASC' },
      'name-az': { sortBy: 'name', sortOrder: 'ASC' },
      'name-za': { sortBy: 'name', sortOrder: 'DESC' },
      'user-az': { sortBy: 'username', sortOrder: 'ASC' },
      'user-za': { sortBy: 'username', sortOrder: 'DESC' }
    };
    const { sortBy: newSort, sortOrder: newOrder } = sortMap[value];
    setSortBy(newSort);
    setSortOrder(newOrder);
  };

  const handleCreatePlaylist = async () => {
    if (!user) return;
    try {
      await api.post('/playlists', { name: '' }); // Empty name = auto "Untitled N"
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to create playlist');
    }
  };

  const handleEditPlaylist = (playlist) => {
    setEditModal({ playlistId: playlist.id, name: playlist.name });
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    try {
      await api.put(`/playlists/${editModal.playlistId}`, { name: editModal.name });
      setEditModal(null);
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to update playlist');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      await api.delete(`/playlists/${playlistId}`);
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to delete playlist');
    }
  };

  const handleCopyPlaylist = async (playlistId) => {
    if (!user) return;
    try {
      await api.post(`/playlists/${playlistId}/copy`);
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to copy playlist');
    }
  };

  const handlePlayPlaylist = async (playlist) => {
    try {
      // Record listener
      await api.post(`/playlists/${playlist.id}/listen`, { sessionId });

      // Get full playlist with songs
      const data = await api.get(`/playlists/${playlist.id}`);
      setPlayModal(data.data.playlist);
    } catch (err) {
      alert(err.message || 'Failed to play playlist');
    }
  };

  const handleAddSong = async (playlistId, songId) => {
    if (!user) return;
    try {
      await api.post(`/playlists/${playlistId}/songs`, { songId: parseInt(songId) });
      alert('Song added to playlist');
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to add song');
    }
  };

  const handleRemoveSong = async (playlistId, songId) => {
    if (!user) return;
    if (!window.confirm('Remove this song from playlist?')) return;
    try {
      await api.delete(`/playlists/${playlistId}/songs/${songId}`);
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to remove song');
    }
  };

  const handleReorderSongs = async (playlistId, songIds) => {
    if (!user) return;
    try {
      await api.put(`/playlists/${playlistId}/songs/reorder`, { songIds });
      loadPlaylists();
    } catch (err) {
      alert(err.message || 'Failed to reorder songs');
    }
  };

  const toggleExpand = (playlistId) => {
    setExpandedId(expandedId === playlistId ? null : playlistId);
  };

  const isOwner = (playlist) => user && playlist.owner_id === user.id;

  return (
    <div style={{
      background: '#FFE4F3',
      minHeight: 'calc(100vh - 50px)',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        gap: '20px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>

        {/* LEFT PANEL - SEARCH */}
        <div style={{
          width: '300px',
          background: '#FFFDE7',
          padding: '20px',
          borderRadius: '8px',
          height: 'fit-content'
        }}>
          <h2 style={{ marginTop: 0, fontSize: '20px', marginBottom: '20px' }}>Search Playlists</h2>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              by Playlist Name
            </label>
            <input
              type="text"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              by User Name
            </label>
            <input
              type="text"
              value={filters.username}
              onChange={(e) => setFilters({ ...filters, username: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              by Song Title
            </label>
            <input
              type="text"
              value={filters.songTitle}
              onChange={(e) => setFilters({ ...filters, songTitle: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              by Song Artist
            </label>
            <input
              type="text"
              value={filters.songArtist}
              onChange={(e) => setFilters({ ...filters, songArtist: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
              by Song Year
            </label>
            <input
              type="text"
              value={filters.songYear}
              onChange={(e) => setFilters({ ...filters, songYear: e.target.value })}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleSearch}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: '#9C27B0',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Search
            </button>
            <button
              onClick={handleClear}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: 'white',
                color: '#9C27B0',
                border: '2px solid #9C27B0',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* RIGHT PANEL - RESULTS */}
        <div style={{ flex: 1 }}>
          <div style={{
            background: '#FFFDE7',
            padding: '20px',
            borderRadius: '8px'
          }}>
            {/* Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontWeight: 'bold' }}>Sort:</label>
                <select
                  onChange={handleSortChange}
                  defaultValue="listeners-hi"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  <option value="listeners-hi">Listeners Hi-Lo</option>
                  <option value="listeners-lo">Listeners Lo-Hi</option>
                  <option value="name-az">Name A-Z</option>
                  <option value="name-za">Name Z-A</option>
                  <option value="user-az">User A-Z</option>
                  <option value="user-za">User Z-A</option>
                </select>
              </div>

              {user && (
                <button
                  onClick={handleCreatePlaylist}
                  style={{
                    padding: '8px 16px',
                    background: '#9C27B0',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  + New Playlist
                </button>
              )}
            </div>

            {/* Results count */}
            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
              {playlists.length} Playlist{playlists.length !== 1 ? 's' : ''}
            </div>

            {/* Loading/Error */}
            {loading && <div>Loading...</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}

            {/* Playlist List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {playlists.map(playlist => (
                <div
                  key={playlist.id}
                  style={{
                    background: 'white',
                    padding: '16px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: '#9C27B0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {playlist.owner_username?.[0]?.toUpperCase() || 'U'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleExpand(playlist.id)}
                      >
                        {playlist.name}
                        <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                          {expandedId === playlist.id ? '∧' : '∨'}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {playlist.owner_username}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9C27B0', marginTop: '4px' }}>
                        {playlist.listener_count} Listener{playlist.listener_count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handlePlayPlaylist(playlist)}
                        style={{
                          padding: '6px 12px',
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Play
                      </button>

                      {user && (
                        <button
                          onClick={() => handleCopyPlaylist(playlist.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#9C27B0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Copy
                        </button>
                      )}

                      {isOwner(playlist) && (
                        <>
                          <button
                            onClick={() => handleEditPlaylist(playlist)}
                            style={{
                              padding: '6px 12px',
                              background: '#9C27B0',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(playlist.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#E91E63',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded Songs List */}
                  {expandedId === playlist.id && playlist.songs && (
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #eee'
                    }}>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        Songs ({playlist.songs.length}):
                      </div>
                      {playlist.songs.length === 0 ? (
                        <div style={{ color: '#999', fontSize: '14px' }}>No songs in this playlist</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {playlist.songs.map((song, idx) => (
                            <div
                              key={song.id}
                              style={{
                                fontSize: '14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <span>
                                {idx + 1}. {song.title} by {song.artist} ({song.year})
                              </span>
                              {isOwner(playlist) && (
                                <button
                                  onClick={() => handleRemoveSong(playlist.id, song.id)}
                                  style={{
                                    padding: '2px 8px',
                                    background: '#E91E63',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '11px'
                                  }}
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Song (Owner only) */}
                      {isOwner(playlist) && (
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => setAddSongModal(playlist.id)}
                            style={{
                              padding: '6px 12px',
                              background: '#9C27B0',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            + Add Song (by ID)
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#90EE90',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              background: '#228B22',
              color: 'white',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              Edit Playlist
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Playlist Name:
              </label>
              <input
                type="text"
                value={editModal.name}
                onChange={(e) => setEditModal({ ...editModal, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button
                  onClick={handleSaveEdit}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#228B22',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditModal(null)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLAY MODAL */}
      {playModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#90EE90',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              background: '#228B22',
              color: 'white',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              Play Playlist - {playModal.name}
            </div>
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px' }}>
                <strong>Owner:</strong> {playModal.owner_username}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <strong>Songs:</strong>
              </div>
              {playModal.songs && playModal.songs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {playModal.songs.map((song, idx) => (
                    <div
                      key={song.id}
                      style={{
                        padding: '8px',
                        background: 'white',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      {idx + 1}. {song.title} by {song.artist} ({song.year})
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                        YouTube ID: {song.youtube_id}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#666' }}>No songs in this playlist</div>
              )}
              <button
                onClick={() => setPlayModal(null)}
                style={{
                  marginTop: '20px',
                  width: '100%',
                  padding: '8px 16px',
                  background: '#228B22',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SONG MODAL */}
      {addSongModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#90EE90',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              background: '#228B22',
              color: 'white',
              padding: '16px',
              borderRadius: '8px 8px 0 0',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              Add Song to Playlist
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                Song ID:
              </label>
              <input
                id="songIdInput"
                type="number"
                placeholder="Enter song ID"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                <button
                  onClick={() => {
                    const songId = document.getElementById('songIdInput').value;
                    if (songId) {
                      handleAddSong(addSongModal, songId);
                      setAddSongModal(null);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#228B22',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAddSongModal(null)}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#666',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
