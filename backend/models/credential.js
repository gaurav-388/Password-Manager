const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const credentialSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  website: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  encryptedPassword: {
    type: String, // Storing the encrypted data as a string
    required: true
  },
  iv: {
    type: String, // Storing the IV as a string
    required: true
  }
}, {
  timestamps: true,
});

const Credential = mongoose.model('Credential', credentialSchema);

module.exports = Credential;