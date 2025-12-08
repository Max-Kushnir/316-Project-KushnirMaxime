import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Playlists from './pages/Playlists';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div style={{ background: '#FFE4F3', minHeight: '100vh' }}>
          <Navbar />
          <div style={{ padding: '20px' }}>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/playlists" element={<Playlists />} />
              <Route path="/songs" element={<div>Songs Page (TODO)</div>} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
