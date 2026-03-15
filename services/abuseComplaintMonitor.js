const { getAbuseComplaintCount } = require('../models/AbuseComplaint');
const { updateAbuseComplaintRate } = require('../models/AbuseComplaint');

async function monitorAbuseComplaints() {
  // This function should be called periodically (e.g., every hour) to update abuse complaint rates
  const bento = 'default'; // Assuming a default bento for simplicity
  const abuseComplaintCount = await getAbuseComplaintCount(bento);
  const abuseComplaintRate = abuseComplaintCount / 100; // Example calculation: rate per 100 emails

  await updateAbuseComplaintRate(bento, abuseComplaintRate);
}

module.exports = {
  monitorAbuseComplaints,
};
