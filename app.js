require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const txRoutes = require('./routes/txRoutes');
const storeRoutes = require('./routes/storeRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Fix untuk Render.com (reverse proxy) agar express-rate-limit bekerja dengan baik
app.set('trust proxy', 1);

// Middlewares
app.use(cors());
app.use(express.json());

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root endpoint untuk healthcheck
app.get('/', (req, res) => {
    res.send('DrainStreak API is running!');
});

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/transactions', txRoutes);
app.use('/api/v1/store', storeRoutes);
// Stats & Simulation (untuk Midnight Checker)
app.use('/api/v1/simulation', statsRoutes); 

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke on the server!' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
