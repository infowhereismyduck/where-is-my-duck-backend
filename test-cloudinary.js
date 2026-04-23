// test-cloudinary.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary connection...');
cloudinary.api.ping()
  .then(result => console.log('✅ Cloudinary connected:', result))
  .catch(error => console.error('❌ Cloudinary error:', error));