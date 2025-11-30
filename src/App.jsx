import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Provider as JotaiProvider, useSetAtom } from 'jotai';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

// Stores & Services
import { userAtom } from './store/atoms/authAtoms';
import { themeAtom } from './store/atoms/uiAtoms';
import Storage from './services/storage';

// Components
import Toaster from './components/ui/Modal.jsx';
import Layout from './components/layout/Layout';
import BackblazeAudioTester from './components/AudioPlayer.jsx';
import LoadingOverlay from './components/ui/LoadingOverlay.jsx'; // Reuse your overlay

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

function AppRoutes({ hasOnboarded, isAuthenticated }) {
    // We pass state down from the parent hydrator
    return (
        <Routes>
            <Route path="/testing" element={<BackblazeAudioTester />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/auth" element={<AuthLanding />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot" element={<ResetPassword />} />
            <Route path="/reset" element={<NewPassword />} />
            <Route path="/onboarding/sources" element={<CustomizeSources />} />
            <Route path="/onboarding/sections" element={<CustomizeSections />} />
            <Route path="/onboarding/topics" element={<CustomizeTopics />} />

            <Route path="/app" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="preferences" element={<Preferences />} />
                <Route path="shorts" element={<ShortReads />} />
                <Route path="profile" element={<Profile />} />
                <Route path="now-playing" element={<NowPlaying />} />
            </Route>

            <Route path="/" element={
                <Navigate to={
                    !hasOnboarded ? '/welcome' :
                        (isAuthenticated ? '/app' : '/auth')
                } replace />
            } />

            <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
    );
}

function DeepLinkHandler() {
    const nav = useNavigate();
    useEffect(() => {
        let unlisten;
        async function start() {
            unlisten = await onOpenUrl((urls) => {
                for (const url of urls) {
                    if (url.includes('newspods://reset')) {
                        const token = new URL(url).searchParams.get('token');
                        if (token) nav(`/reset?token=${token}`);
                    }
                }
            });
        }
        start();
        return () => { if (unlisten) unlisten(); };
    }, [nav]);
    return null;
}

function Hydrator() {
    const [loading, setLoading] = useState(true);
    const [appState, setAppState] = useState({ onboarded: false, auth: false });

    const setUser = useSetAtom(userAtom);
    const setTheme = useSetAtom(themeAtom);

    useEffect(() => {
        async function hydrate() {
            try {
                // 1. Load Auth
                const token = await Storage.get('authToken');
                const user = await Storage.get('currentUser');

                // 2. Load Onboarding
                const onboardedStr = await Storage.get('np_hasOnboarded');

                // 3. Load Theme
                const savedTheme = await Storage.get('theme');
                if (savedTheme) setTheme(savedTheme);

                // 4. Update Atoms & Local State
                if (user) setUser(user);

                setAppState({
                    auth: !!token,
                    onboarded: onboardedStr === '1'
                });
            } catch (e) {
                console.error("Hydration failed", e);
            } finally {
                setLoading(false);
            }
        }
        hydrate();
    }, [setUser, setTheme]);

    if (loading) {
        // Return a full screen loader or nothing
        return <LoadingOverlay show={true} text="Starting up..." />;
    }

    return (
        <Router>
            <DeepLinkHandler />
            <div className="min-h-screen bg-paper transition-colors">
                <AppRoutes
                    hasOnboarded={appState.onboarded}
                    isAuthenticated={appState.auth}
                />
                <Toaster />
            </div>
        </Router>
    );
}

export default function App() {
    return (
        <JotaiProvider>
            <Hydrator />
        </JotaiProvider>
    );
}