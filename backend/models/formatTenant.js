// models/formatTenant.js
//IMPORTAT: WE NEED TO TELL OUR TENANT SCHEMA THAT EVERY TENANT BELONGS TO A USER/ADMIN
const User = require('./user');
const mongoose = require('mongoose');

// Define a schema for individual payments.
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  method: { type: String, enum: ['Cash', 'Check', 'Money Order', 'Bank Transfer'], required: true },
  paidBy: { type: String, required: true },
  photo: { type: String, default: null }
}, { timestamps: true });

// Define a schema for historical rent records.
const rentHistorySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true }
});

// Define the main schema for a Tenant.
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  apartment: { type: String, required: true, trim: true },
  unitType: { type: String, required: true },
  monthlyRent: { type: Number, required: true },
  notes: { type: String, trim: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // This creates a link to the User model
    required: true
  },
  payments: [paymentSchema],
  rentHistory: [rentHistorySchema],
  
}, { timestamps: true });

// This virtual 'balance' property is calculated on the fly.
tenantSchema.virtual('balance').get(function() {
  const totalPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  return this.monthlyRent - totalPaid;
});

// This is the function that formats the object before it's sent as JSON.
const setJSONTransform = (schema) => {
  schema.set('toJSON', {
    virtuals: true, // IMPORTANT: Make sure virtuals like 'balance' are included
    transform: (document, returnedObject) => {
      // THIS IS THE CRITICAL FIX:
      // It creates a new 'id' property on the object by converting the database '_id'.
      returnedObject.id = returnedObject._id.toString();

      // These lines clean up the object by removing the fields we no longer need.
      delete returnedObject._id;
      delete returnedObject.__v;
    }
  });
};

// Apply the formatting to all schemas
setJSONTransform(tenantSchema);
setJSONTransform(paymentSchema);
setJSONTransform(rentHistorySchema);

module.exports = mongoose.model('Tenant', tenantSchema);