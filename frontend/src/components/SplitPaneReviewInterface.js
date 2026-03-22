import React from 'react';

const SplitPaneReviewInterface = ({ tasks, onAccept, onReject, onInlineEdit }) => {
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
        <button onClick={onAccept}>Accept</button>
        <button onClick={onReject}>Reject</button>
        <button onClick={onInlineEdit}>Inline Edit</button>
      </div>
    </div>
  );
};

export default SplitPaneReviewInterface;
