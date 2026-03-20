import React from 'react';

const CallStatus = ({ callStatus, transcript, sentiment }) => {
  return (
    <div className="call-status">
      <h2>Call Status</h2>
      <p>Status: {callStatus}</p>
      <h3>Transcript</h3>
      <pre>{transcript}</pre>
      <h3>Sentiment Analysis</h3>
      <p>Sentiment: {sentiment}</p>
    </div>
  );
};

export default CallStatus;
