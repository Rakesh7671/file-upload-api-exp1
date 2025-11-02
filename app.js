const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

// Create upload directory if not exists
if (!fs.existsSync(process.env.UPLOAD_DIR)) {
    fs.mkdirSync(process.env.UPLOAD_DIR);
}

// ==================== Multer Configuration ====================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, process.env.UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// ==================== Rate Limiting ====================
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // limit each IP to 5 requests per windowMs
    message: { error: 'Too many requests, please try again later.' }
});

app.use(limiter); // Apply to all requests

// ==================== ROUTES ====================

// Test route
app.get('/', (req, res) => {
    res.send('Welcome to File Upload API');
});

// Upload single file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ message: 'File uploaded successfully', file: req.file.filename });
});

// List uploaded files
app.get('/files', (req, res) => {
    fs.readdir(process.env.UPLOAD_DIR, (err, files) => {
        if (err) return res.status(500).json({ error: 'Cannot read files' });
        res.json({ files });
    });
});

// Default 404 route
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Start server
app.listen(process.env.PORT, () => console.log(`🚀 Server running at http://localhost:${process.env.PORT}`));