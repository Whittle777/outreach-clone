const isValidCountryRegion = (countryRegion) => {
  // Add your validation logic here
  // For example, you can check if the countryRegion is a string and has a valid format
  return typeof countryRegion === 'string' && /^[A-Z]{2}$/.test(countryRegion);
};

module.exports = {
  isValidCountryRegion,
};
