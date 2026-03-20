class PreCallBriefDashboard {
  constructor(prospectData, callGoals, talkTracks) {
    this.prospectData = prospectData;
    this.callGoals = callGoals;
    this.talkTracks = talkTracks;
  }

  render() {
    const dashboard = `
      <div class="pre-call-brief-dashboard">
        <h2>Pre-Call Brief Dashboard</h2>
        <div class="prospect-info">
          <h3>Prospect Information</h3>
          <p><strong>Name:</strong> ${this.prospectData.firstName} ${this.prospectData.lastName}</p>
          <p><strong>Email:</strong> ${this.prospectData.email}</p>
          <p><strong>Company:</strong> ${this.prospectData.companyName}</p>
        </div>
        <div class="call-goals">
          <h3>Call Goals</h3>
          <ul>
            ${this.callGoals.map(goal => `<li>${goal}</li>`).join('')}
          </ul>
        </div>
        <div class="talk-tracks">
          <h3>Talk Tracks</h3>
          <ul>
            ${this.talkTracks.map(track => `<li>${track}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    return dashboard;
  }
}

module.exports = PreCallBriefDashboard;
