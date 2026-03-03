const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_kisaan_key';

router.post('/signup', async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (name, email, phone, password, points, language, location, crop_type, soil_type) VALUES (?, ?, ?, ?, 10, 'en', '', '', '')`,
            [name, email, phone, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'User with this email or phone already exists.' });
                    }
                    return res.status(500).json({ error: 'Database error: ' + err.message });
                }

                const user_id = this.lastID;
                const token = jwt.sign({ id: user_id }, JWT_SECRET, { expiresIn: '7d' });

                res.json({
                    message: 'Signup successful',
                    token,
                    user: { id: user_id, name, email, phone, points: 10 }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', (req, res) => {
    const { identifier, password } = req.body; // identifier can be email or phone

    if (!identifier || !password) {
        return res.status(400).json({ error: 'Identifier and password are required.' });
    }

    db.get(
        `SELECT * FROM users WHERE email = ? OR phone = ?`,
        [identifier, identifier],
        async (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (!user) return res.status(400).json({ error: 'Invalid credentials.' });
            if (!user.password) return res.status(400).json({ error: 'No password set for this user.' });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

            const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    location: user.location,
                    crop: user.crop_type,
                    language: user.language,
                    points: user.points
                }
            });
        }
    );
});

module.exports = router;
