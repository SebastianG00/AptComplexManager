// index.js (Final Verified Version)

require('dotenv').config();
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Routers and Models
const authRouter = require('./controllers/auth');
const Tenant = require('./models/formatTenant');

// Middleware
const authMiddleware = require('./utils/authMiddleware');

const app = express();

// --- MIDDLEWARE SETUP ---
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173' // Or whatever your local client port is
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method);
  console.log('Path:  ', request.path);
  console.log('---');
  next();
};
app.use(requestLogger);

// --- DATABASE CONNECTION ---
mongoose.set('strictQuery', false);
const url = process.env.MONGODB_URI;
mongoose.connect(url)
  .then(() => { console.log('Successfully connected to MongoDB!'); })
  .catch((error) => { console.error('Error connecting to MongoDB:', error.message); });


// --- API ROUTES ---

// Authentication routes are public (not protected by authMiddleware)
app.use('/api/auth', authRouter);

// All tenant routes below are protected and require a valid token
app.get('/api/tenants', authMiddleware, async (request, response, next) => {
  try {
    const tenants = await Tenant.find({ user: request.userId });
    response.json(tenants);
  } catch (error) { next(error); }
});

app.get('/api/tenants/:id', authMiddleware, async (request, response, next) => {
    try {
        const tenant = await Tenant.findOne({ _id: request.params.id, user: request.userId });
        if (tenant) {
            response.json(tenant);
        } else {
            response.status(404).send({ error: 'Tenant not found or permission denied' });
        }
    } catch (error) { next(error); }
});

app.post('/api/tenants', authMiddleware, async (request, response, next) => {
    const body = request.body;
    const tenant = new Tenant({
        name: body.name,
        apartment: body.apartment,
        unitType: body.unitType,
        monthlyRent: body.monthlyRent,
        notes: body.notes || '',
        rentHistory: [],
        payments: [],
        user: request.userId
    });
    try {
        const savedTenant = await tenant.save();
        response.status(201).json(savedTenant);
    } catch (error) { next(error); }
});

app.put('/api/tenants/:id', authMiddleware, async (request, response, next) => {
    const { notes, monthlyRent } = request.body;
    try {
        const tenant = await Tenant.findOne({ _id: request.params.id, user: request.userId });
        if (!tenant) {
            return response.status(404).json({ error: 'Tenant not found or permission denied' });
        }
        if (monthlyRent !== undefined && tenant.monthlyRent !== Number(monthlyRent)) {
            tenant.monthlyRent = Number(monthlyRent);
            tenant.rentHistory.push({ amount: Number(monthlyRent), date: new Date() });
        }
        if (notes !== undefined) {
            tenant.notes = notes;
        }
        const updatedTenant = await tenant.save();
        response.json(updatedTenant);
    } catch (error) { next(error); }
});

app.post('/api/tenants/:id/payments', authMiddleware, async (request, response, next) => {
    try {
        const tenant = await Tenant.findOne({ _id: request.params.id, user: request.userId });
        if (!tenant) {
            return response.status(404).json({ error: 'Tenant not found or permission denied' });
        }
        tenant.payments.push(request.body);
        const updatedTenant = await tenant.save();
        response.status(201).json(updatedTenant);
    } catch (error) { next(error); }
});

app.delete('/api/tenants/:id', authMiddleware, async (request, response, next) => {
    try {
        const result = await Tenant.findOneAndDelete({ _id: request.params.id, user: request.userId });
        if (result) {
            response.status(204).end();
        } else {
            response.status(404).json({ error: 'Tenant not found or permission denied' });
        }
    } catch (error) { next(error); }
});


// --- ERROR HANDLING & SERVER START ---
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'Unknown endpoint' });
};
app.use(unknownEndpoint);

const errorHandler = (error, request, response, next) => {
  console.error("GLOBAL ERROR HANDLER:", error.message);
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'Malformatted ID' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});