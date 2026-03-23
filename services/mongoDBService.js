const mongoose = require('mongoose');

class MongoDBService {
  constructor(connectionString) {
    this.connectionString = connectionString;
  }

  async connect() {
    await mongoose.connect(this.connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  }

  async fetchData(modelName) {
    const model = mongoose.model(modelName, new mongoose.Schema({}, { strict: false }));
    return await model.find().exec();
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

module.exports = MongoDBService;
