import React from 'react';
import './SplitPaneReview.css';

const SplitPaneReview = () => {
  const handleTTSConversion = () => {
    // Trigger TTS conversion logic here
    console.log('TTS Conversion Triggered');
  };

  return (
    <div className="split-pane">
      <div className="left-pane">
        <h2>Review Queue</h2>
        <ul>
          <li>Pending Task 1</li>
          <li>Pending Task 2</li>
          <li>Pending Task 3</li>
        </ul>
      </div>
      <div className="right-pane">
        <h2>Agentic Action Panel</h2>
        <p>AI Summary: Drafted email</p>
        <button onClick={handleTTSConversion}>Trigger TTS Conversion</button>
        <button>Accept</button>
        <button>Reject</button>
        <button>Inline-Edit</button>
      </div>
    </div>
  );
};

export default SplitPaneReview;
