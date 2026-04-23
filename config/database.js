const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

// Create tables if they don't exist
const initDatabase = async () => {
  try {
    await promisePool.execute(`
      CREATE TABLE IF NOT EXISTS memes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tag VARCHAR(100) DEFAULT 'Uncategorized',
        image_url TEXT NOT NULL,
        public_id VARCHAR(255) NOT NULL,
        date VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ MySQL database ready');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

initDatabase();

module.exports = promisePool;