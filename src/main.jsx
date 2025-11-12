import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import {LoadingProvider} from "./hooks/LoadingProvider.jsx";
createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LoadingProvider>
            <App />
        </LoadingProvider>
    </React.StrictMode>
);