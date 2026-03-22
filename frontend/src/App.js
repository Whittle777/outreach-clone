import React, { useState } from 'react';
import './App.css';
import SplitPaneReviewInterface from './components/SplitPaneReviewInterface';
import CallFlags from './components/CallFlags';

const App = () => {
  const [tasks] = useState(['Pending Task 1', 'Pending Task 2', 'Pending Task 3']);

  const handleAccept = () => {
    console.log('Task accepted');
  };

  const handleReject = () => {
    console.log('Task rejected');
  };

  const handleInlineEdit = () => {
    console.log('Task inline-edited');
  };

  return (
    <div className="App">
      <CallFlags />
      <SplitPaneReviewInterface
        tasks={tasks}
        onAccept={handleAccept}
        onReject={handleReject}
        onInlineEdit={handleInlineEdit}
      />
    </div>
  );
};

export default App;
