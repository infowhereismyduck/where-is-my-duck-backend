require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
  } else {
    console.log('✅ MySQL connected successfully!');
    connection.query('SELECT 1 + 1 AS solution', (err, results) => {
      console.log('Test query result:', results[0].solution === 2 ? '✅ Working!' : '❌ Failed');
      connection.end();
    });
  }
});