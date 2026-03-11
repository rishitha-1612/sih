const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

// FastAPI LLM Service URL — set LLM_SERVICE_URL in .env to point to your deployed service
const LLM_SERVICE_URL = process.env.LLM_SERVICE_URL || 'http://localhost:8000';

// Setup Multer for Image Uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// 1. POST /register
router.post('/register', (req, res) => {
    const { phone, name, language, location, crop_type, soil_type } = req.body;

    db.run(
        `INSERT INTO users (phone, name, language, location, crop_type, soil_type, points) VALUES (?, ?, ?, ?, ?, ?, 10)`,
        [phone, name, language, location, crop_type, soil_type],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ error: 'User already exists' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, message: 'User registered successfully with 10 welcome points!' });
        }
    );
});

// 2. POST /chat
router.post('/chat', async (req, res) => {
    const { user_id, message } = req.body;

    try {
        // 1. Check if user exists to prevent 500 SQLite Foreign Key crashes
        const userRow = await new Promise((resolve, reject) => {
            db.get(`SELECT id, language, points_today, last_point_date FROM users WHERE id = ?`, [user_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let activeUserId = user_id;
        let pToday = 0;
        let lastPDate = null;
        let langPref = 'en';

        if (userRow) {
            pToday = userRow.points_today || 0;
            lastPDate = userRow.last_point_date;
            langPref = userRow.language || 'en';
        }

        if (!userRow) {
            // 2. Automatically create a default demo user if they don't exist
            activeUserId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO users (id, phone, name, language, location, crop_type, soil_type, points) VALUES (?, ?, ?, ?, ?, ?, ?, 10)`,
                    [user_id, `demo-${Date.now()}`, 'Demo Farmer', 'en', 'Unknown', 'Unknown', 'Unknown'],
                    function (err) {
                        if (err) reject(err);
                        else resolve(user_id);
                    }
                );
            });
        }

        // 3. Save user message securely
        db.run(`INSERT INTO chats (user_id, message, is_bot_reply) VALUES (?, ?, 0)`, [activeUserId, message]);

        // Fetch last 5 messages for context
        const chatHistory = await new Promise((resolve, reject) => {
            db.all(
                `SELECT message, is_bot_reply FROM chats WHERE user_id = ? ORDER BY timestamp DESC LIMIT 5`,
                [activeUserId],
                (err, rows) => {
                    if (err) resolve([]);
                    else resolve(rows.reverse()); // Reverse to get chronological order for context
                }
            );
        });

        const messages = [
            {
                role: 'system',
                content: `You are Kisaan Mitra AI, a helpful, friendly, and highly knowledgeable agricultural expert and assistant for Indian farmers. Always reply in a concise, action-oriented, and easy-to-understand manner. IMPORTANT: The user prefers the language code/name: "${langPref}". Please respond in that language.`
            }
        ];

        // Format historical context into prompt
        for (const msg of chatHistory) {
            // We ignore the very latest message from history because it corresponds to the current one that was just inserted 
            // OR if there's any duplicate just to be safe. We'll simply append the user message explicitly afterwards.
            if (msg.message !== message && msg.is_bot_reply !== undefined) {
                messages.push({
                    role: msg.is_bot_reply ? 'assistant' : 'user',
                    content: msg.message
                });
            }
        }

        // Append current message
        messages.push({ role: 'user', content: message });

        let botReply = "I'm sorry, I couldn't process your request.";

        try {
            // Call the FastAPI LLM service (TinyLlama) — no Ollama needed!
            // 120s timeout to allow model cold-start loading on first request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(`${LLM_SERVICE_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messages,
                    language: langPref
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`LLM service error ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            if (data && data.reply) {
                botReply = data.reply;
            }
        } catch (err) {
            console.error('FastAPI LLM Service Error:', err.message);
            const serviceErrMsg = err.name === 'AbortError'
                ? `⏳ The AI is still loading the TinyLlama model (this only happens once). Please wait 30 seconds and try again.`
                : `⚠️ AI service error. Make sure the FastAPI service is running: uvicorn main:app --reload --port 8000`;
            db.run(`INSERT INTO chats (user_id, message, is_bot_reply) VALUES (?, ?, 1)`, [activeUserId, serviceErrMsg]);
            return res.status(503).json({ error: serviceErrMsg });
        }

        // Save bot reply
        db.run(`INSERT INTO chats (user_id, message, is_bot_reply) VALUES (?, ?, 1)`, [activeUserId, botReply]);

        // Add points logic (max 20 per day)
        let pointsEarned = 0;
        const todayStr = new Date().toISOString().split('T')[0];

        if (lastPDate !== todayStr) {
            pToday = 0;
        }

        if (pToday < 20) {
            let ptsToAdd = Math.min(20, 20 - pToday); // Earn +20 per question, max 20 per day
            pointsEarned = ptsToAdd;
            pToday += ptsToAdd;
            db.run(`UPDATE users SET points = points + ?, points_today = ?, last_point_date = ? WHERE id = ?`, [pointsEarned, pToday, todayStr, activeUserId]);
        }

        res.json({ reply: botReply, points_earned: pointsEarned });
    } catch (error) {
        console.error('Chat Endpoint Error:', error);
        res.status(500).json({ error: error.message || 'Failed to generate AI response.' });
    }
});

// 3. POST /upload-image
router.post('/upload-image', upload.single('image'), async (req, res) => {
    const { user_id } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const imageUrl = req.file.path;

    try {
        // 1. Check if user exists to prevent 500 SQLite Foreign Key crashes
        const userExists = await new Promise((resolve, reject) => {
            db.get(`SELECT id FROM users WHERE id = ?`, [user_id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        let activeUserId = user_id;

        if (!userExists) {
            // 2. Automatically create a default demo user if they don't exist
            activeUserId = await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO users (id, phone, name, language, location, crop_type, soil_type, points) VALUES (?, ?, ?, ?, ?, ?, ?, 10)`,
                    [user_id, `demo-${Date.now()}`, 'Demo Farmer', 'en', 'Unknown', 'Unknown', 'Unknown'],
                    function (err) {
                        if (err) reject(err);
                        else resolve(user_id);
                    }
                );
            });
        }

        const fileBytes = fs.readFileSync(imageUrl);
        const base64Data = fileBytes.toString("base64");

        let parsedData = {
            diseasePredicted: "Analysis Failed",
            confidence: "0%",
            treatment: "Could not process image."
        };

        try {
            // Call the FastAPI LLM service vision endpoint — TinyLlama (text-only, describes symptoms)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000);

            const response = await fetch(`${LLM_SERVICE_URL}/analyze-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image_base64: base64Data
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errBody = await response.text();
                throw new Error(`LLM vision service error ${response.status}: ${errBody}`);
            }

            const data = await response.json();
            if (data) {
                parsedData = {
                    diseasePredicted: data.diseasePredicted || 'Analysis Completed',
                    confidence: data.confidence || 'N/A',
                    treatment: data.treatment || 'See full response above.'
                };
            }
        } catch (err) {
            console.error('FastAPI Vision Service Error:', err.message);
            const serviceErrMsg = err.name === 'AbortError'
                ? `⏳ The AI is still loading (this only happens once). Please wait 30 seconds and try again.`
                : `⚠️ Vision AI service error. Make sure the FastAPI service is running: uvicorn main:app --reload --port 8000`;
            parsedData.treatment = serviceErrMsg;
            db.run(`INSERT INTO scans (user_id, image_url, disease_predicted, confidence, treatment) VALUES (?, ?, ?, ?, ?)`,
                [activeUserId, imageUrl, parsedData.diseasePredicted, parsedData.confidence, parsedData.treatment]
            );
            return res.status(503).json({
                error: serviceErrMsg,
                diseasePredicted: parsedData.diseasePredicted,
                confidence: parsedData.confidence,
                treatment: parsedData.treatment,
                imageUrl,
                points_earned: 0
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        let pointsEarned = 0;

        // Wait to get counts of scans today to grant 10 points properly
        const scanCountToday = await new Promise((resolve) => {
            db.get(`SELECT COUNT(*) as c FROM scans WHERE user_id = ? AND date(timestamp) = ?`, [activeUserId, todayStr], (err, row) => {
                if (err) return resolve(0);
                resolve(row ? row.c : 0);
            });
        });

        // Save scan result
        db.run(
            `INSERT INTO scans (user_id, image_url, disease_predicted, confidence, treatment) VALUES (?, ?, ?, ?, ?)`,
            [activeUserId, imageUrl, parsedData.diseasePredicted, parsedData.confidence, parsedData.treatment]
        );

        if (scanCountToday < 1) { // They get exactly 10 points for the first scan today (up to max 10 pts per day limit)
            pointsEarned = 10;
            db.run(`UPDATE users SET points = points + 10 WHERE id = ?`, [activeUserId]);
        }

        res.json({
            diseasePredicted: parsedData.diseasePredicted,
            confidence: parsedData.confidence,
            treatment: parsedData.treatment,
            imageUrl,
            points_earned: pointsEarned
        });

    } catch (error) {
        console.error('Image Scan Endpoint Error:', error);
        res.status(500).json({ error: error.message || 'Failed to process image scan.' });
    }
});

// 4. GET /points/:user_id
router.get('/points/:user_id', (req, res) => {
    db.get(`SELECT points FROM users WHERE id = ?`, [req.params.user_id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ points: row ? row.points : 0 });
    });
});

module.exports = router;
