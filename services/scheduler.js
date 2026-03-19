const cron = require('node-cron');
const Migration = require('./migration');
const migration = new Migration();

class Scheduler {
  scheduleMigration(maintenanceWindow) {
    const [start, end] = maintenanceWindow.split('-').map(time => time.trim());

    cron.schedule(`0 ${start} * * *`, async () => {
      console.log('Starting migration during maintenance window...');
      await migration.migrateProspects();
      console.log('Migration completed during maintenance window.');
    });
  }
}

module.exports = Scheduler;
