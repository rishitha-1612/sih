const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const router = express.Router();

// Setup Multer for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/disease_scans/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, 'scan-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// GET /api/detection/status
router.get('/status', (req, res) => {
    const statusPath = path.join(__dirname, '../ai_models/disease/training_status.json');
    const modelPath = path.join(__dirname, '../ai_models/disease/plant_disease_prediction_model.h5');

    if (fs.existsSync(statusPath)) {
        try {
            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            // If training is complete but model file is missing for some reason
            if (status.status === 'complete' && !fs.existsSync(modelPath)) {
                return res.json({ status: 'training', message: 'Finalizing model...' });
            }
            return res.json(status);
        } catch (e) {
            return res.json({ status: 'unknown' });
        }
    }

    // If no status file but model exists
    if (fs.existsSync(modelPath)) {
        return res.json({ status: 'complete', message: 'CNN model loaded successfully.' });
    }

    res.json({ status: 'not_started', message: 'Training not started.' });
});

// POST /api/detect-disease
router.post('/detect', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image uploaded' });
    }

    const imagePath = req.file.path;
    const scriptPath = path.join(__dirname, '../ai_models/disease/predict.py');
    const pythonProcess = spawn('python', [scriptPath, imagePath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Python Script Error:', errorString);
            return res.status(500).json({
                error: 'Detection failed',
                details: errorString
            });
        }

        try {
            const results = JSON.parse(dataString);
            res.json({
                ...results,
                imageUrl: `http://localhost:5000/${imagePath.replace(/\\/g, '/')}`
            });
        } catch (e) {
            console.error('JSON Parse Error:', dataString);
            res.status(500).json({
                error: 'Failed to parse detection results',
                raw: dataString
            });
        }
    });
});

module.exports = router;
