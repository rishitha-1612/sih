require('dotenv').config();
process.env.PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION = 'python';
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const marketRoutes = require('./routes/market');
const schemesRoutes = require('./routes/schemes');
const detectionRoutes = require('./routes/detection');
const advisoryRoutes = require('./routes/advisory');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/advisory', advisoryRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'KisaanKonnect API is running' });
});

// Global Error Handler for malformed JSON
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('Bad JSON structure received');
        return res.status(400).send({ error: "Invalid JSON format in request body" }); // Bad request
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
