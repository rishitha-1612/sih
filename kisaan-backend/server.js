require('dotenv').config({ path: require('path').join(__dirname, '.env') });
process.env.PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION = 'python';

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const connectDB = require('./config/db');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const marketRoutes = require('./routes/market');
const schemesRoutes = require('./routes/schemes');
const detectionRoutes = require('./routes/detection');
const advisoryRoutes = require('./routes/advisory');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/schemes', schemesRoutes);
app.use('/api/detection', detectionRoutes);
app.use('/api/advisory', advisoryRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'KisaanKonnect API is running'
  });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({
      error: "Invalid JSON format in request body"
    });
  }
  next();
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
