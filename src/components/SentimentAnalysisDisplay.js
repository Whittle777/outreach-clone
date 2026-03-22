import React from 'react';

const SentimentAnalysisDisplay = ({ sentimentData }) => {
  return (
    <div>
      <h2>Sentiment Analysis Results</h2>
      {sentimentData.map((analysis, index) => (
        <div key={index}>
          <p>Prospect: {analysis.prospectId}</p>
          <p>Sentiment Score: {analysis.sentimentScore}</p>
          <p>Sentiment Label: {analysis.sentimentLabel}</p>
          <p>Metadata: {JSON.stringify(analysis.metadata)}</p>
        </div>
      ))}
    </div>
  );
};

export default SentimentAnalysisDisplay;
