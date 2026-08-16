const express = require('express');
const multer = require('multer');
const path = require('path');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { addTreeData, getAllTreeData } = require('../controllers/treeController');

const router = express.Router();

// ─── Multer Storage Configuration ────────────────────────────────────────────
// Images are stored in the /uploads folder (relative to the backend root)
// Each file gets a unique name based on the timestamp to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `tree-${uniqueSuffix}${ext}`);
  },
});

// Only allow image file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const isValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max per image
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST /api/tree/data  — Protected: Pi must send X-Secret-Key header
// Accepts multipart/form-data with fields: treeId, tofMeasurement, image (file)
router.post('/data', apiKeyAuth, upload.single('image'), addTreeData);

// GET  /api/tree/data  — Public: Frontend fetches all records
router.get('/data', getAllTreeData);

module.exports = router;
