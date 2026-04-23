require('dotenv').config();
const express = require('express');
const cors = require('cors');
const memeRoutes = require('./routes/memes');
const authRoutes = require('./routes/auth');

const app = express();

// Configure CORS for production
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://whereismyduck.netlify.app',
  'https://whereismyduck.buzz',
  'https://www.whereismyduck.buzz'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));
app.use(express.json());

// Routes
app.use('/api/memes', memeRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});