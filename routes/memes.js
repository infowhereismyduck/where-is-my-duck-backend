const express = require('express');
const router = express.Router();
const db = require('../config/database');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'memes',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const upload = multer({ storage });

// GET all memes (SIMPLE VERSION - returns array directly)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching memes...');
    const [rows] = await db.query('SELECT * FROM memes ORDER BY id DESC');
    console.log(`Found ${rows.length} memes`);
    // Send array directly (not wrapped in {data: []})
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error', details: error.message });
  }
});

// POST new meme - PROTECTED
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      return res.status(400).json({ error: 'Image required' });
    }
    
    const { title, tag } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title required' });
    }

    const date = new Date().toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    const [result] = await db.query(
      'INSERT INTO memes (title, tag, image_url, public_id, date) VALUES (?, ?, ?, ?, ?)',
      [title, tag || 'Uncategorized', imageUrl, publicId, date]
    );

    console.log('Meme saved with ID:', result.insertId);
    
    res.status(201).json({
      id: result.insertId,
      title,
      tag: tag || 'Uncategorized',
      image_url: imageUrl,
      date
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// DELETE meme - PROTECTED
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT public_id FROM memes WHERE id = ?', [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Meme not found' });
    }

    if (rows[0].public_id) {
      try {
        await cloudinary.uploader.destroy(rows[0].public_id);
      } catch (cloudinaryError) {
        console.error('Cloudinary delete error:', cloudinaryError);
      }
    }
    
    await db.query('DELETE FROM memes WHERE id = ?', [req.params.id]);
    
    res.json({ message: 'Meme deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;