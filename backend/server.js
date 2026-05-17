require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dataRoutes  = require('./routes/data');
const judgeRoutes = require('./routes/judge');
const authRoutes  = require('./routes/auth');
const schoolRoutes = require('./routes/school');
const locationRoutes = require('./routes/location')
const feedbackRoutes = require('./routes/feedback')

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/feedback', feedbackRoutes)
app.use('/api/locations', locationRoutes)

app.use('/api/admin',   authRoutes);    
app.use('/api/auth',    authRoutes);    
app.use('/api/schools', schoolRoutes);


app.use('/api/judge',   judgeRoutes);
app.use('/api',         dataRoutes);   


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));