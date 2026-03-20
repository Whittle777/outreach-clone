import React, { useState } from 'react';
import './App.css';
import SplitPaneReview from './components/SplitPaneReview';

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
      <SplitPaneReview
        tasks={tasks}
        onAccept={handleAccept}
        onReject={handleReject}
        onInlineEdit={handleInlineEdit}
      />
    </div>
  );
};

export default App;
