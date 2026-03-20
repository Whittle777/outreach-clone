const Prospect = require('../models/prospect');

exports.createProspect = async (firstName, lastName, email, companyName, status) => {
  return await Prospect.create({ firstName, lastName, email, companyName, status });
};

exports.getProspectById = async (id) => {
  return await Prospect.findById(id);
};

exports.getAllProspects = async () => {
  return await Prospect.findAll();
};

exports.updateProspect = async (id, firstName, lastName, email, companyName, status) => {
  return await Prospect.update(id, { firstName, lastName, email, companyName, status });
};

exports.deleteProspect = async (id) => {
  return await Prospect.delete(id);
};

exports.getFilterChips = async () => {
  // Implement logic to fetch filter chips data
  return [];
};
