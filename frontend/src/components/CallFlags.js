import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CallFlags = () => {
  const [callFlags, setCallFlags] = useState([]);

  useEffect(() => {
    const fetchCallFlags = async () => {
      try {
        const response = await api.get('/call-flags');
        setCallFlags(response.data);
      } catch (error) {
        console.error('Error fetching call flags:', error);
      }
    };

    fetchCallFlags();
  }, []);

  return (
    <div className="call-flags">
      <h2>Call Flags</h2>
      <ul>
        {callFlags.map((flag, index) => (
          <li key={index}>{flag}</li>
        ))}
      </ul>
    </div>
  );
};

export default CallFlags;
