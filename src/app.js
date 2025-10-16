const express = require('express');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const medicalHistoryRoutes = require('./routes/medicalHistory');
const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);

const userRoutes = require('./routes/users');
const personRoutes = require('./routes/persons');
const roleRoutes = require('./routes/roles');

app.use('/api/users', userRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/roles', roleRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!' 
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});

module.exports = app;