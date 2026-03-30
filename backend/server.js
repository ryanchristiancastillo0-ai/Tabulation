require('dotenv').config();
const express = require('express');
const cors = require('cors');

const dataRoutes = require('./routes/data');
const judgeRoutes = require('./routes/judge');
const authRoutes = require('./routes/auth');
// Note: We don't put 'protect' here anymore; we move it into the routes file.

const app = express();
app.use(cors());
app.use(express.json());

// Auth routes (Login/Register)
app.use('/api/admin', authRoutes); 

// Judge Terminal routes (Public)
app.use('/api/judge', judgeRoutes); 

// Data routes (We remove 'protect' from here to avoid the 404/Access Denied)
app.use('/api', dataRoutes); 

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));