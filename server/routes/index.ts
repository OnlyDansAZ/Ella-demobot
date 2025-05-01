const express = require('express');
const app = express();
const port = 3000;

// Assuming these routes are defined elsewhere and imported correctly.
const authRoutes = require('./routes/auth'); // Example - adapt to your actual path
const calendarRoutes = require('./routes/calendar'); // Example - adapt to your actual path
const conversationRoutes = require('./routes/conversation'); // Example - adapt to your actual path
const personaRoutes = require('./routes/persona'); // Example - adapt to your actual path
const followupRoutes = require('./routes/followup'); // Example - adapt to your actual path
const salesIntelligenceRoutes = require('./routes/salesIntelligence'); // Example - adapt to your actual path


const router = express.Router();


app.use(express.json()); // Added to parse JSON bodies


// API Routes and Health Check
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/followup', followupRoutes);
app.use('/api/sales', salesIntelligenceRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});