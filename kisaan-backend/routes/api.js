const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
require('dotenv').config();

const router = express.Router();

// Initialize Gemini Client safely
let ai = null;

if (process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        console.log("✅ Gemini AI initialized successfully.");
    } catch (e) {
        console.warn("Failed to initialize Gemini:", e.message);
    }
} else {
    console.warn("⚠️ GEMINI_API_KEY is missing in .env");
}

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

        if (!ai) {
            const noKeyReply = "⚠️ AI is not configured. Please create a `.env` file in `kisaan-backend` and add your `GEMINI_API_KEY` to enable Kisaan Mitra AI.";
            db.run(`INSERT INTO chats (user_id, message, is_bot_reply) VALUES (?, ?, 1)`, [activeUserId, noKeyReply]);
            return res.json({ reply: noKeyReply, points_earned: 0 });
        }

        // Call our live Gemini AI logic 
        // (Note: I've retained the Gemini LIVE logic we just built rather than the old keywords logic, 
        //  since it works flawlessly with the system we just wired together!)
        const prompt = `You are Kisaan Mitra AI, a helpful, friendly, and highly knowledgeable agricultural expert and assistant for Indian farmers. 
        Always reply in a concise, action-oriented, and easy-to-understand manner.
        IMPORTANT: The user prefers the language code/name: "${langPref}". Please respond in that language.
        
        Farmer's query: "${message}"`;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let botReply = "I'm sorry, I couldn't process your request.";

        if (result?.candidates?.length > 0) {
            botReply = result.candidates[0].content.parts[0].text;
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
        console.error('Gemini API Error:', error);
        // Extract inner error message if present
        let errMsg = error.message;
        if (error.status === 400 && errMsg.includes('API key not valid')) {
            errMsg = 'API key not valid. Please pass a valid API key.';
        }
        res.status(500).json({ error: errMsg || 'Failed to generate AI response.' });
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

        if (!ai) {
            const noKeyData = {
                diseasePredicted: "Error: AI Not Configured",
                confidence: "0%",
                treatment: "⚠️ Please create a `.env` file in `kisaan-backend` and add your `GEMINI_API_KEY` to enable image scanning."
            };
            db.run(`INSERT INTO scans (user_id, image_url, disease_predicted, confidence, treatment) VALUES (?, ?, ?, ?, ?)`,
                [activeUserId, imageUrl, noKeyData.diseasePredicted, noKeyData.confidence, noKeyData.treatment]
            );
            return res.json({
                ...noKeyData,
                imageUrl,
                points_earned: 0
            });
        }

        // Instead of using ai.files.upload (which causes 500 internals on some SDK/file pairs)
        // We will read the local image file directly to base64 and use inlineData
        let mimeType = req.file.mimetype;
        if (!mimeType || mimeType === 'application/octet-stream') {
            // Default fallback if multer cannot determine the mime type correctly 
            // from some mobile browsers. 
            mimeType = 'image/jpeg';
        }

        const fileBytes = fs.readFileSync(imageUrl);
        const base64Data = fileBytes.toString("base64");

        const prompt = `You are Kisaan Mitra AI, a master agronomist. 
        Analyze the uploaded image of this crop/plant. 
        Identify any visible diseases, pests, deficiencies, or state exactly what the crop is if healthy.
        Provide your response in JSON format exactly like this:
        {
           "diseasePredicted": "Name of disease/pest OR 'Healthy Crop'",
           "confidence": "percentage string like '95%'",
           "treatment": "Provide a practical, step-by-step treatment or maintenance advice for a farmer."
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                },
                prompt
            ]
        });

        // Parse Gemini JSON
        let textResult = response.text;
        textResult = textResult.replace(/```json/g, '').replace(/```/g, ''); // Clean markdown formatting
        const parsedData = JSON.parse(textResult);

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
        console.error('Gemini Image Scan Error:', error);
        let errMsg = error.message;
        if (error.status === 400 && errMsg.includes('API key not valid')) {
            errMsg = 'API key not valid. Please pass a valid API key.';
        }
        res.status(500).json({ error: errMsg || 'Failed to process image scan.' });
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
