const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const initDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    // Create table if not exists
    await connection.query(`
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
    connection.release();
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Database error:', error.message);
  }
};

initDatabase();

module.exports = pool;