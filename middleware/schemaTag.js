module.exports = (req, res, next) => {
  req.schemaTag = 'default';
  next();
};
