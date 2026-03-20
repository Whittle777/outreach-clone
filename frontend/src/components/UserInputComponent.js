import React, { useState } from 'react';

const UserInputComponent = () => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleTTSConversion = () => {
    // Trigger TTS conversion logic here
    console.log('TTS Conversion Triggered');
  };

  return (
    <div>
      <h2>User Input Component</h2>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter text here"
      />
      <button onClick={handleTTSConversion}>Trigger TTS Conversion</button>
    </div>
  );
};

export default UserInputComponent;
