// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import TestComponent from './TestComponent.jsx' // <--- IMPORT THE NEW COMPONENT
import App from './App.jsx' // <--- Import App
import ApartmentManager from './ApartmentManager.jsx';
import './index.css'; // Tailwind or global styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
