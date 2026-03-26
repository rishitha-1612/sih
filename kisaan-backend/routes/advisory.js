const express    = require('express');
const router     = express.Router();
const { spawn }  = require('child_process');
const path       = require('path');
const Advisory   = require('../models/Advisory');

// =============================================
// POST /recommend — run ML model
// =============================================
router.post('/recommend', async (req, res) => {
    const scriptPath = path.join(__dirname, '../ai_models/advisory/predict.py');

    const pythonProcess = spawn('python', [
        scriptPath,
        JSON.stringify(req.body)
    ]);

    let output = '';
    let error  = '';

    pythonProcess.stdout.on('data', (data) => { output += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { error  += data.toString(); });

    // Handle Python not found / spawn failure
    pythonProcess.on('error', (err) => {
        console.error('[Advisory] Spawn error:', err.message);
        return res.status(500).json({ error: `Failed to start Python: ${err.message}. Make sure Python is installed and on PATH.` });
    });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error('[Advisory] Python error:', error);
            return res.status(500).json({ error });
        }

        try {
            const result = JSON.parse(output);

            // ✅ Save result to MongoDB so /latest can retrieve it
            const userId = req.body.user_id || req.body.userId;
            if (userId) {
                await Advisory.findOneAndUpdate(
                    { user_id: userId },
                    {
                        user_id:    userId,
                        fertilizer: result.fertilizer,
                        confidence: result.confidence,
                        input:      req.body,
                        createdAt:  new Date()
                    },
                    { upsert: true, new: true }
                ).catch(() => {}); // silently skip if model doesn't exist yet
            }

            res.json(result);

        } catch {
            res.status(500).json({ error: 'Invalid response', raw: output });
        }
    });
});

// =============================================
// GET /latest/:userId — for Shop recommendations
// =============================================
router.get('/latest/:userId', async (req, res) => {
    try {
        const advisory = await Advisory.findOne({ user_id: req.params.userId })
            .sort({ createdAt: -1 });

        if (!advisory) {
            return res.status(404).json({ error: 'No advisory found' });
        }

        res.json({
            fertilizer: advisory.fertilizer,
            confidence: advisory.confidence
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch advisory' });
    }
});

module.exports = router;