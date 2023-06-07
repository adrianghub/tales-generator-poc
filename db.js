const { Sequelize, DataTypes } = require('sequelize');

class Database {
  constructor() {
    if (!Database.instance) {
      this.sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: 'tasks.db',
        define: {
          timestamps: false,
        },
        logging: false, // Disable verbose output
      });

      this.Task = this.sequelize.define('Task', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        info: {
          type: DataTypes.STRING,
        },
        status: {
          type: DataTypes.STRING,
        },
        answer: {
          type: DataTypes.STRING,
        },
      }, {
        tableName: 'Task',
      });

      Database.instance = this;
    }

    return Database.instance;
  }

  async initialize() {
    try {
      await this.sequelize.sync();
      console.log('Database and tables are in sync');
    } catch (error) {
      console.error('Error synchronizing database:', error);
    }
  }

  close() {
    this.sequelize.close();
  }
}

module.exports = Database;