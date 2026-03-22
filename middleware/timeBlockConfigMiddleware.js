const TimeBlockConfig = require('../models/timeBlockConfig');

module.exports = async (req, res, next) => {
  try {
    const { startTime, endTime, daysOfWeek, holidays, user, bento, activeStatus } = req.body;
    const timeBlockConfig = await TimeBlockConfig.create({
      startTime,
      endTime,
      daysOfWeek,
      holidays,
      user,
      bento,
      activeStatus,
    });
    req.timeBlockConfig = timeBlockConfig;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
