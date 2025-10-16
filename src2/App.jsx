// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
// swapped react-hot-toast Toaster with a tiny local no-op to avoid dependency
import Toaster from './components/ui/Toast';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Preferences from './pages/Preferences';
import Library from './pages/Library';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AudioPlayer from "./components/AudioPlayer.jsx";

function App() {
  return (
    <JotaiProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
          <Routes>
            {/* Public Routes */}
            <Route path="/testing" element={<AudioPlayer/>} />
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/app" element={
              // <ProtectedRoute>
                <Layout />
              // </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="preferences" element={<Preferences />} />
              <Route path="library" element={<Library />} />
              <Route path="subscription" element={<Subscription />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Routes>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100',
            }}
          />
        </div>
      </Router>
    </JotaiProvider>
  );
}

export default App;
