const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide a user ID'],
    },
    message: {
      type: String,
      required: [true, 'Please provide a message'],
    },
    type: {
      type: String,
      enum: ['scam', 'danger'],
      required: [true, 'Please specify a notification type'],
    },
    relatedReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
