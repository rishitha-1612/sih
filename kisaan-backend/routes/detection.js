const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { spawn } = require('child_process');
const fs      = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads/disease_scans');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename:    (req, file, cb) => cb(null, 'scan-' + Date.now() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/status', (req, res) => {
    const statusPath = path.join(__dirname, '../ai_models/disease/training_status.json');
    const modelPath  = path.join(__dirname, '../ai_models/disease/plant_disease_prediction_model.keras');
    try {
        if (fs.existsSync(statusPath)) {
            const status = JSON.parse(fs.readFileSync(statusPath, 'utf8'));
            if (status.status === 'complete' && !fs.existsSync(modelPath))
                return res.json({ status: 'training', message: 'Finalizing model...' });
            return res.json(status);
        }
        if (fs.existsSync(modelPath))
            return res.json({ status: 'complete', message: 'CNN model loaded successfully' });
        return res.json({ status: 'not_started', message: 'Training not started' });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: 'Failed to read training status' });
    }
});

router.post('/detect', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imagePath  = req.file.path;
    const scriptPath = path.join(__dirname, '../ai_models/disease/predict.py');
    const baseUrl    = process.env.BASE_URL || 'http://localhost:5000';
    const imageUrl   = `${baseUrl}/uploads/disease_scans/${req.file.filename}`;

    const pythonProcess = spawn('python', [scriptPath, imagePath]);
    let output = '', errorOutput = '';

    pythonProcess.stdout.on('data', (data) => { output      += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorOutput += data.toString(); });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('[Detection] Python error:', errorOutput);
            return res.status(500).json({ error: 'Prediction failed', details: errorOutput });
        }
        try {
            const result = JSON.parse(output);
            res.json({
                diseasePredicted: result.disease,
                confidence:       `${result.confidence}%`,
                treatment:        result.treatment,
                imageUrl
            });
        } catch (err) {
            console.error('[Detection] Parse error:', output);
            res.status(500).json({ error: 'Invalid prediction output', rawOutput: output });
        }
    });
});

module.exports = router;