const express = require('express');
const cors    = require('cors');
require('dotenv').config();

require('./config/db');

const authRoutes     = require('./routes/auth');
const itemRoutes     = require('./routes/items');
const customerRoutes = require('./routes/customers');
const billRoutes = require('./routes/bills');
const paymentRoutes = require('./routes/payments');
const reportRoutes = require('./routes/reports');
const supplierRoutes = require('./routes/suppliers');
const purchaseRoutes = require('./routes/purchases');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',      authRoutes);
app.use('/api/items',     itemRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Clothing Inventory API running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Clothing Inventory Server running on http://localhost:${PORT}`);
});