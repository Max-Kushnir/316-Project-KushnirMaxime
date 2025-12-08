// API service for all backend calls
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api"

const api = {
  // Auth endpoints
  register: (email, username, password, avatarImage) =>
    fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, avatar_image: avatarImage }),
      credentials: "include",
    }).then((res) => res.json()),

  login: (email, password) =>
    fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    }).then((res) => res.json()),

  logout: () =>
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).then((res) => res.json()),

  getCurrentUser: () => fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" }).then((res) => res.json()),

  // Playlists
  getPlaylists: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${API_BASE_URL}/playlists${query ? "?" + query : ""}`, {
      credentials: "include",
    }).then((res) => res.json())
  },

  getPlaylist: (id) => fetch(`${API_BASE_URL}/playlists/${id}`, { credentials: "include" }).then((res) => res.json()),

  createPlaylist: (name) =>
    fetch(`${API_BASE_URL}/playlists`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      credentials: "include",
    }).then((res) => res.json()),

  updatePlaylist: (id, name) =>
    fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
      credentials: "include",
    }).then((res) => res.json()),

  deletePlaylist: (id) =>
    fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => res.json()),

  copyPlaylist: (id) =>
    fetch(`${API_BASE_URL}/playlists/${id}/copy`, {
      method: "POST",
      credentials: "include",
    }).then((res) => res.json()),

  addSongToPlaylist: (playlistId, songId) =>
    fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: songId }),
      credentials: "include",
    }).then((res) => res.json()),

  removeSongFromPlaylist: (playlistId, songId) =>
    fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => res.json()),

  reorderPlaylistSongs: (playlistId, songs) =>
    fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/reorder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs }),
      credentials: "include",
    }).then((res) => res.json()),

  recordPlaylistListener: (playlistId) =>
    fetch(`${API_BASE_URL}/playlists/${playlistId}/listener`, {
      method: "POST",
      credentials: "include",
    }).then((res) => res.json()),

  // Songs
  getSongs: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return fetch(`${API_BASE_URL}/songs${query ? "?" + query : ""}`, {
      credentials: "include",
    }).then((res) => res.json())
  },

  createSong: (title, artist, year, youtubeId) =>
    fetch(`${API_BASE_URL}/songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, year, youtube_id: youtubeId }),
      credentials: "include",
    }).then((res) => res.json()),

  updateSong: (id, title, artist, year, youtubeId) =>
    fetch(`${API_BASE_URL}/songs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, artist, year, youtube_id: youtubeId }),
      credentials: "include",
    }).then((res) => res.json()),

  deleteSong: (id) =>
    fetch(`${API_BASE_URL}/songs/${id}`, {
      method: "DELETE",
      credentials: "include",
    }).then((res) => res.json()),

  // Users
  getUserProfile: (id) => fetch(`${API_BASE_URL}/users/${id}`, { credentials: "include" }).then((res) => res.json()),

  updateUserProfile: (username, password, avatarImage) =>
    fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, avatar_image: avatarImage }),
      credentials: "include",
    }).then((res) => res.json()),
}

export default api
