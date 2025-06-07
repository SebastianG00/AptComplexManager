// src/App.jsx

import React, { useState, useEffect } from 'react';
import ApartmentLogin from './ApartmentLogin'; // Adjust path if needed
import ApartmentManager from './ApartmentManager'; // Adjust path if needed
import apiService from '../services/apiService.js'; // Adjust the path '../' as needed
const App = () => {
  const [token, setToken] = useState(null);

  // When the app first loads, check if a token is already in storage
  useEffect(() => {
    const storedToken = localStorage.getItem('apartment-manager-token');
    if (storedToken) {
      setToken(storedToken);
      apiService.setToken(storedToken); // Set the token for all future API calls
    }
  }, []);

  const handleLogin = (userToken) => {
    setToken(userToken);
    apiService.setToken(userToken);
    localStorage.setItem('apartment-manager-token', userToken);
  };

  const handleLogout = () => {
    setToken(null);
    apiService.setToken(null);
    localStorage.removeItem('apartment-manager-token');
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