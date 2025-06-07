// models/user.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true // Each email must be unique in the database
  },
  passwordHash: { // We store the HASH, never the plain password
    type: String,
    required: true
  },
});

// This transform function is crucial for security.
// It ensures that the password hash is never sent back to the front-end.
userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    // The passwordHash should not be revealed
    delete returnedObject.passwordHash;
  }
});

module.exports = mongoose.model('User', userSchema);