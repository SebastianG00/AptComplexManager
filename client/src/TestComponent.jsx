// src/TestComponent.jsx

import React, { useState, useEffect } from 'react';

function TestComponent() {
  const [message, setMessage] = useState('Attempting to connect to test server...');

  useEffect(() => {
    console.log('TestComponent: Sending fetch request...');
    fetch('http://localhost:3001/api/test')
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        console.log('TestComponent: Received a response!');
        return response.json();
      })
      .then(data => {
        console.log('TestComponent: Success! Data:', data);
        setMessage(`SUCCESS! Received data from test server: ${JSON.stringify(data)}`);
      })
      .catch(error => {
        console.error('TestComponent: Fetch failed!', error);
        setMessage(`ERROR: Could not connect. ${error.message}`);
      });
  }, []);

  return <h1 style={{ padding: '20px' }}>{message}</h1>;
}

export default TestComponent;