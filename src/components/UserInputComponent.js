import React, { useState } from 'react';

const UserInputComponent = () => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  return (
    <div>
      <h2>User Input Component</h2>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter something..."
      />
      <p>You entered: {inputValue}</p>
    </div>
  );
};

export default UserInputComponent;
