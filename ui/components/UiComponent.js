import React, { useState, useEffect } from 'react';
import NLP from '../../services/nlp';

const UiComponent = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const nlp = new NLP({ openaiApiKey: 'your-openai-api-key' });

  useEffect(() => {
    const handleInputChange = async (event) => {
      setInput(event.target.value);
      try {
        const parsedData = await nlp.parsePrompt(event.target.value);
        setOutput(parsedData);
      } catch (error) {
        console.error('Error parsing prompt', error);
      }
    };

    const inputElement = document.getElementById('input');
    inputElement.addEventListener('input', handleInputChange);

    return () => {
      inputElement.removeEventListener('input', handleInputChange);
    };
  }, [nlp]);

  return (
    <div>
      <input id="input" type="text" value={input} onChange={(e) => setInput(e.target.value)} />
      <div>{output}</div>
    </div>
  );
};

export default UiComponent;
