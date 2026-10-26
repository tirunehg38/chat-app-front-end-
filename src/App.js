import { Route, Routes, Navigate } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Register from './register';
import { useEffect, createContext, useState, useCallback } from 'react';
import axiosbase from './axiosConfig';

export const AppContext = createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const usercheck = useCallback(async () => {
    setAuthError(''); setLoading(true);
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await axiosbase.get('user/check', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
    } catch (error) {
      if (error.response?.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('username'); }
      else setAuthError('Unable to check your session. Check the backend connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    usercheck();
  }, [usercheck]);

  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);

  if (authError) return <div role="alert">{authError}<button onClick={usercheck}>Retry</button></div>;
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AppContext.Provider value={{ user, setUser }}>
      <Routes>
        <Route path="/" element={user ? <Home page="home" /> : <Navigate to="/login" />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/questions" element={user ? <Home page="questions" /> : <Navigate to="/login" />} />
        <Route path="/chat" element={user ? <Home page="chat" /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/preview" element={<Home page="home" />} />
      </Routes>
    </AppContext.Provider>
  );
}

export default App;
