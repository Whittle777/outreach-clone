const config = require('./config/index').getConfig();
const MongoDBService = require('./services/mongoDBService');
const PostgreSQLService = require('./services/postgreSQLService');

async function migrateData() {
  const mongoDBService = new MongoDBService(config.azureAcsConnectionString);
  const postgreSQLService = new PostgreSQLService({
    user: config.awsAccessKeyId,
    host: config.awsSqsUrl,
    database: 'your_database_name',
    password: config.awsSecretAccessKey,
    port: 5432,
  });

  try {
    await mongoDBService.connect();
    await postgreSQLService.connect();

    const data = await mongoDBService.fetchData('your_collection_name');
    await postgreSQLService.insertData('your_table_name', data);

  } finally {
    await mongoDBService.disconnect();
    await postgreSQLService.disconnect();
  }
}

migrateData().catch(console.error);
