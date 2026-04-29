const Prospect = require('../models/prospect');

exports.createProspect = async (prospectData) => {
  return await Prospect.create(prospectData);
};

exports.createProspectsBulk = async (prospectsArray) => {
  return await Prospect.createMany(prospectsArray);
};

exports.getProspectById = async (id) => {
  return await Prospect.findById(id);
};

exports.getAllProspects = async () => {
  return await Prospect.findAll();
};

exports.updateProspect = async (id, prospectData) => {
  return await Prospect.update(id, prospectData);
};

exports.deleteProspect = async (id) => {
  return await Prospect.delete(id);
};

exports.getFilterChips = async () => {
  // Implement logic to fetch filter chips data
  return [];
};
