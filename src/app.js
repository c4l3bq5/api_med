const express = require('express');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const sessionRoutes = require('./routes/sessions');
const logRoutes = require('./routes/logs');
const medicalHistoryRoutes = require('./routes/medicalHistory');
const userRoutes = require('./routes/users');
const personRoutes = require('./routes/persons');
const roleRoutes = require('./routes/roles');

const User = require('./models/User');
const Person = require('./models/Person');
const Role = require('./models/Role');
const Patient = require('./models/Patient');
const MedicalHistory = require('./models/MedicalHistory');
const Session = require('./models/Session');

const cors = require('cors');

const app = express();

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin']
}));

app.use(express.json());

app.use((req, res, next) => {
  req.db = {
    User,
    Person,
    Role,
    Session,
    Patient,
    MedicalHistory
  };
  next();
});

// Ahora sí las rutas (después del middleware)
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medical-history', medicalHistoryRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/persons', personRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/logs', logRoutes);

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

console.log('=== ENVIRONMENT VARIABLES ===');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'EXISTS' : 'MISSING');
console.log('=============================');

app.listen(PORT, '0.0.0.0', () => {
  console.log(` Server running on port ${PORT}`);
});

module.exports = app;