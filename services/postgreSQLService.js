const { Pool } = require('pg');

class PostgreSQLService {
  constructor(config) {
    this.pool = new Pool(config);
  }

  async connect() {
    await this.pool.connect();
    console.log('Connected to PostgreSQL');
  }

  async insertData(tableName, data) {
    const client = await this.pool.connect();
    try {
      const query = `INSERT INTO ${tableName} (${Object.keys(data[0]).join(', ')}) VALUES ${data.map(d => `(${Object.values(d).map(v => `'${v}'`).join(', ')})`).join(', ')}`;
      await client.query(query);
      console.log(`Inserted ${data.length} records into ${tableName}`);
    } finally {
      client.release();
    }
  }

  async disconnect() {
    await this.pool.end();
    console.log('Disconnected from PostgreSQL');
  }
}

module.exports = PostgreSQLService;
