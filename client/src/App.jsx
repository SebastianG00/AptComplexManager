// src/App.jsx (Final Version)

import React, { useState, useEffect } from 'react';
import ApartmentLogin from './ApartmentLogin';
import ApartmentManager from './ApartmentManager';

// 1. MODIFY THIS IMPORT to include setOnAuthFailure
import apiService from '../services/apiService.js';
import { setOnAuthFailure } from '../services/apiService.js';

const App = () => {
  const [token, setToken] = useState(null);

  const handleLogout = () => {
    setToken(null);
    apiService.setToken(null);
    localStorage.removeItem('apartment-manager-token');
  };

  // When the app first loads, check for a token AND set up the auto-logout
  useEffect(() => {
    // 2. ADD THIS LINE to wire up the automatic logout
    // This tells the apiService, "If you ever get an auth error, call this function."
    setOnAuthFailure(handleLogout);

    const storedToken = localStorage.getItem('apartment-manager-token');
    if (storedToken) {
      setToken(storedToken);
      apiService.setToken(storedToken);
    }
  }, []); // The empty array [] ensures this setup runs only once

  const handleLogin = (userToken) => {
    setToken(userToken);
    apiService.setToken(userToken);
    localStorage.setItem('apartment-manager-token', userToken);
  };

  return (
    <div>
      {token === null ? (
        <ApartmentLogin onLogin={handleLogin} />
      ) : (
        <ApartmentManager token={token} onLogout={handleLogout} />
      )}
    </div>
  );
};

export default App;