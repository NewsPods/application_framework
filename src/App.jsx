import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import Toaster from './components/ui/Modal.jsx'; // tiny no-op; using Modal export to avoid extra dep

// Layout
import Layout from './components/layout/Layout';

// Keep the Backblaze tester route and file UNCHANGED
import BackblazeAudioTester from './components/AudioPlayer.jsx';

// Pages
import Welcome from './pages/Welcome';
import AuthLanding from './pages/AuthLanding';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ResetPassword from './pages/auth/ResetPassword';
import NewPassword from './pages/auth/NewPassword';

import Home from './pages/Home';
import Preferences from './pages/Preferences';
import ShortReads from './pages/ShortReads';
import Profile from './pages/Profile';
import NowPlaying from './pages/NowPlaying';

import CustomizeSources from './pages/onboarding/CustomizeSources';
import CustomizeSections from './pages/onboarding/CustomizeSections';
import CustomizeTopics from './pages/onboarding/CustomizeTopics';

function AppRoutes() {
    const hasOnboarded = localStorage.getItem('np_hasOnboarded') === '1';

    return (
        <Routes>
            {/* Tester (leave as-is) */}
            <Route path="/testing" element={<BackblazeAudioTester />} />

            {/* First-time welcome */}
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<AuthLanding />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ResetPassword />} />
            <Route path="/reset" element={<NewPassword />} />

            {/* Onboarding */}
            <Route path="/onboarding/sources" element={<CustomizeSources />} />
            <Route path="/onboarding/sections" element={<CustomizeSections />} />
            <Route path="/onboarding/topics" element={<CustomizeTopics />} />

            {/* App shell */}
            <Route path="/app" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="preferences" element={<Preferences />} />
                <Route path="shorts" element={<ShortReads />} />
                <Route path="profile" element={<Profile />} />
                <Route path="now-playing" element={<NowPlaying />} />
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to={hasOnboarded ? '/auth' : '/welcome'} replace />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <JotaiProvider>
            <Router>
                <div className="min-h-screen bg-paper transition-colors">
                    <AppRoutes />
                    {/* No-op Toaster placeholder to keep structure similar */}
                    <Toaster />
                </div>
            </Router>
        </JotaiProvider>
    );
}