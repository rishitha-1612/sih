const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/onboarding', (req, res) => {
    const { userId, crop, location } = req.body;

    if (!userId || !crop || !location) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    db.run(
        `UPDATE users SET crop_type = ?, location = ? WHERE id = ?`,
        [crop, location, userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error updating user.' });

            // Return updated user data (mocked slightly based on what we sent)
            res.json({ message: 'Onboarding completed', user: { crop, location } });
        }
    );
});

router.put('/language', (req, res) => {
    const { userId, language } = req.body;

    if (!userId || !language) {
        return res.status(400).json({ error: 'Missing requried fields.' });
    }

    db.run(
        `UPDATE users SET language = ? WHERE id = ?`,
        [language, userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error updating language.' });
            res.json({ message: 'Language updated', language });
        }
    );
});

module.exports = router;
