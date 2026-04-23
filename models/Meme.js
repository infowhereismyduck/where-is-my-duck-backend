const express = require('express');
const router = express.Router();
const Meme = require('../models/Meme');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'memes',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
  try {
    const memes = await Meme.find();
    for (let i = memes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [memes[i], memes[j]] = [memes[j], memes[i]];
    }
    res.json(memes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });
    const { title, tag } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const newMeme = new Meme({
      title,
      tag: tag || 'Uncategorized',
      imageUrl: req.file.path,
      publicId: req.file.filename,
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    });
    await newMeme.save();
    res.status(201).json(newMeme);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const meme = await Meme.findById(req.params.id);
    if (!meme) return res.status(404).json({ error: 'Not found' });
    await cloudinary.uploader.destroy(meme.publicId);
    await Meme.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;