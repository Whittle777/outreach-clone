import React from 'react';
import './SplitPaneReview.css';

const SplitPaneReview = ({ tasks, onAccept, onReject, onInlineEdit }) => {
  const handleTTSConversion = () => {
    // Trigger TTS conversion logic here
    console.log('TTS Conversion Triggered');
  };

  return (
    <div className="split-pane">
      <div className="left-pane">
        <h2>Review Queue</h2>
        <ul>
          {tasks.map((task, index) => (
            <li key={index}>{task}</li>
          ))}
        </ul>
      </div>
      <div className="right-pane">
        <h2>Agentic Action Panel</h2>
        <p>AI Summary: Drafted email</p>
        <button onClick={handleTTSConversion}>Trigger TTS Conversion</button>
        <button onClick={onAccept}>Accept</button>
        <button onClick={onReject}>Reject</button>
        <button onClick={onInlineEdit}>Inline-Edit</button>
      </div>
    </div>
  );
};

export default SplitPaneReview;
