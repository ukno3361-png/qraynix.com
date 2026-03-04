/**
 * client/src/main.jsx
 * React admin SPA entry point.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './admin.css';

const root = createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
