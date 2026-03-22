const { TimeBlockConfig } = require('../models/TimeBlockConfig');

exports.create = async (req, res) => {
  try {
    const { startTime, endTime, daysOfWeek, holidayExclusions, userOrTeamAssociation, bento, activeStatus } = req.body;

    const timeBlockConfig = await TimeBlockConfig.create({
      startTime,
      endTime,
      daysOfWeek,
      holidayExclusions,
      userOrTeamAssociation,
      bento,
      activeStatus,
    });

    res.status(201).json(timeBlockConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const timeBlockConfigs = await TimeBlockConfig.findMany();
    res.json(timeBlockConfigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const timeBlockConfig = await TimeBlockConfig.findUnique({ where: { id: parseInt(id) } });

    if (!timeBlockConfig) {
      return res.status(404).json({ error: 'TimeBlockConfig not found' });
    }

    res.json(timeBlockConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { startTime, endTime, daysOfWeek, holidayExclusions, userOrTeamAssociation, bento, activeStatus } = req.body;

    const updatedTimeBlockConfig = await TimeBlockConfig.update(
      { where: { id: parseInt(id) } },
      {
        startTime,
        endTime,
        daysOfWeek,
        holidayExclusions,
        userOrTeamAssociation,
        bento,
        activeStatus,
      }
    );

    res.json(updatedTimeBlockConfig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await TimeBlockConfig.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
