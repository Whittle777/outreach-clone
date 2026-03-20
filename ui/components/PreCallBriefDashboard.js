import React, { useState, useEffect } from 'react';
import VoiceAgentIntegration from '../../voiceAgentIntegration';

const PreCallBriefDashboard = ({ prospectId, apiKey, apiUrl }) => {
  const [prospectInfo, setProspectInfo] = useState(null);
  const [callGoal, setCallGoal] = useState(null);
  const [talkTrack, setTalkTrack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const voiceAgentIntegration = new VoiceAgentIntegration(apiKey, apiUrl);

  useEffect(() => {
    const fetchProspectInfo = async () => {
      try {
        const info = await voiceAgentIntegration.fetchProspectInfo(prospectId);
        setProspectInfo(info);

        const { callGoal, talkTrack } = await voiceAgentIntegration.generateCallGoalAndTalkTrack(info);
        setCallGoal(callGoal);
        setTalkTrack(talkTrack);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProspectInfo();
  }, [prospectId, apiKey, apiUrl]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="pre-call-brief-dashboard">
      <h1>30-Second Pre-Call Brief Dashboard</h1>
      <div className="dashboard-content">
        <h2>Prospect Information</h2>
        <p><strong>Name:</strong> {prospectInfo.firstName} {prospectInfo.lastName}</p>
        <p><strong>Email:</strong> {prospectInfo.email}</p>
        <p><strong>Phone:</strong> {prospectInfo.phoneNumber}</p>
        <p><strong>Company:</strong> {prospectInfo.companyName}</p>
        <p><strong>Status:</strong> {prospectInfo.status}</p>
      </div>
      <div className="dashboard-content">
        <h2>AI-Generated Call Goal</h2>
        <p>{callGoal}</p>
      </div>
      <div className="dashboard-content">
        <h2>AI-Generated Talk Track</h2>
        <p>{talkTrack}</p>
      </div>
    </div>
  );
};

export default PreCallBriefDashboard;
