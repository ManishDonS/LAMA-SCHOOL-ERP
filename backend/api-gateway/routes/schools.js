const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'school-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, svg)'));
    }
  }
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'school_erp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to database (schools route):', err.stack);
  } else {
    console.log('✓ Schools route database connected successfully');
    release();
  }
});

// Upload logo endpoint
router.post('/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return the URL of the uploaded file
    const fileUrl = `http://localhost:${process.env.GATEWAY_PORT || 8080}/uploads/${req.file.filename}`;
    res.json({
      message: 'Logo uploaded successfully',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// Get all schools
router.get('/', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const result = await pool.query(
      'SELECT * FROM schools ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Get single school
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM schools WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// Create school
router.post('/', async (req, res) => {
  try {
    const { name, code, domain, logo_url, timezone, db_name, db_user, db_password, db_host, db_port } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if name already exists
    const existingSchoolByName = await pool.query(
      'SELECT id FROM schools WHERE name = $1',
      [name]
    );

    if (existingSchoolByName.rows.length > 0) {
      return res.status(400).json({ error: 'School with this name already exists' });
    }

    // Check if code already exists
    const existingSchoolByCode = await pool.query(
      'SELECT id FROM schools WHERE code = $1',
      [code]
    );

    if (existingSchoolByCode.rows.length > 0) {
      return res.status(400).json({ error: 'School with this code already exists' });
    }

    // Auto-generate database credentials if not provided (for single-database setup)
    const dbName = db_name || `school_${code.toLowerCase()}`;
    const dbUser = db_user || process.env.DB_USER || 'postgres';
    const dbPassword = db_password || process.env.DB_PASSWORD || 'postgres';
    const dbHost = db_host || process.env.DB_HOST || 'localhost';
    const dbPort = db_port || parseInt(process.env.DB_PORT) || 5432;

    const result = await pool.query(
      `INSERT INTO schools (name, code, domain, timezone, logo_url, status, db_name, db_user, db_password, db_host, db_port)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, name, code, domain, timezone, logo_url, status, db_host, db_port, db_name, created_at, updated_at`,
      [
        name,
        code,
        domain || '',
        timezone || 'Asia/Kolkata',
        logo_url || '',
        'active',
        dbName,
        dbUser,
        dbPassword,
        dbHost,
        dbPort
      ]
    );

    res.status(201).json({ data: result.rows[0], message: 'School created successfully' });
  } catch (error) {
    console.error('Error creating school:', error);
    if (error.code === '23505') {
      res.status(400).json({ error: 'School with this code, name, or database name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
});

// Update school
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, domain, logo_url, timezone } = req.body;

    const result = await pool.query(
      `UPDATE schools
       SET name = COALESCE($1, name),
           domain = COALESCE($2, domain),
           timezone = COALESCE($3, timezone),
           logo_url = COALESCE($4, logo_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, domain, timezone, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ data: result.rows[0], message: 'School updated successfully' });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// Delete school
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if school has users
    const usersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE school_id = $1',
      [id]
    );

    if (parseInt(usersCheck.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Cannot delete school with existing users. Please remove all users first.'
      });
    }

    const result = await pool.query('DELETE FROM schools WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ message: 'School deleted successfully' });
  } catch (error) {
    console.error('Error deleting school:', error);

    // Handle foreign key constraint errors
    if (error.code === '23503') {
      return res.status(400).json({
        error: 'Cannot delete school. It has associated records (users, students, etc.)'
      });
    }

    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// Get school stats
router.get('/:code/stats', async (req, res) => {
  try {
    res.json({
      stats: {
        idle_conns: 0,
        max_conns: 10,
        active_conns: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
