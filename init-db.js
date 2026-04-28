require('dotenv').config();
const mysql = require('mysql2');

console.log('Connecting to TiDB Cloud...');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database will be created:', process.env.DB_NAME);

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 4000,
  ssl: {
    rejectUnauthorized: true
  },
  multipleStatements: true
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to TiDB Cloud');

  const sql = `
    CREATE DATABASE IF NOT EXISTS meme_db;
    USE meme_db;
    CREATE TABLE IF NOT EXISTS memes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      tag VARCHAR(100) DEFAULT 'Uncategorized',
      image_url TEXT NOT NULL,
      public_id VARCHAR(255) NOT NULL,
      date VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    SELECT 'SUCCESS' AS result;
  `;

  connection.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Error creating database/table:', err.message);
    } else {
      console.log('✅ Database "meme_db" created successfully!');
      console.log('✅ Table "memes" created successfully!');
    }
    connection.end();
  });
});