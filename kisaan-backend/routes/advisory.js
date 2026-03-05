const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

router.post('/recommend', (req, res) => {
    const { n, p, k, temperature, humidity, ph, rainfall } = req.body;

    const scriptPath = path.join(__dirname, '../ai_models/advisory/logic.py');
    const pythonProcess = spawn('python', [
        scriptPath,
        n || 0, p || 0, k || 0,
        temperature || 25, humidity || 50,
        ph || 6.5, rainfall || 100
    ]);

    let dataString = '';
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        try {
            const result = JSON.parse(dataString.trim());
            res.json(result);
        } catch (e) {
            console.error("Advisory Error:", e, dataString);
            res.status(500).json({ error: "Failed to get recommendations" });
        }
    });
});

module.exports = router;
