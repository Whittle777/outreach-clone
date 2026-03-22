// middleware/dataResidency.js

const logger = require('../services/logger');

module.exports = (req, res, next) => {
  const country = req.headers['x-country']; // Assuming the country is passed in the request header
  const allowedCountries = ['US', 'CA']; // Example allowed countries

  if (!country) {
    logger.error('Country header is missing', { country });
    return res.status(400).json({ error: 'Country header is missing' });
  }

  if (!allowedCountries.includes(country)) {
    logger.error('Access denied due to data residency compliance', { country });
    return res.status(403).json({ error: 'Access denied due to data residency compliance' });
  }

  next();
};
