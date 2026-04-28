require('dotenv').config();
const express = require('express');
const cors = require('cors');
const memeRoutes = require('./routes/memes');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/memes', memeRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});