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

// GET all memes with pagination and random order (stable per session)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 24;
    const offset = (page - 1) * limit;
    const tag = req.query.tag;
    const search = req.query.search;
    const seed = req.query.seed || Math.floor(Math.random() * 1000000);
    
    // Build WHERE clause
    let whereClause = '';
    let params = [];
    
    if (tag && tag !== 'all') {
      whereClause = 'WHERE tag = ?';
      params.push(tag);
    }
    
    if (search && search.trim()) {
      if (whereClause) {
        whereClause += ' AND (title LIKE ? OR tag LIKE ?)';
      } else {
        whereClause = 'WHERE (title LIKE ? OR tag LIKE ?)';
      }
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM memes ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results with stable random order using seed
    // Using ORDER BY RAND(seed) gives consistent ordering per session
    const orderClause = seed ? `ORDER BY RAND(${seed})` : 'ORDER BY RAND()';
    const dataQuery = `
      SELECT * FROM memes 
      ${whereClause} 
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    
    const dataParams = [...params, limit, offset];
    const [rows] = await db.query(dataQuery, dataParams);
    
    const hasMore = offset + limit < total;
    
    res.json({
      data: rows,
      page: page,
      limit: limit,
      total: total,
      hasMore: hasMore,
      seed: seed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new meme - PROTECTED with auth middleware
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
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

    res.status(201).json({
      id: result.insertId,
      title,
      tag: tag || 'Uncategorized',
      imageUrl: imageUrl,
      date
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// DELETE meme by ID - PROTECTED with auth middleware
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
    console.error(error);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;