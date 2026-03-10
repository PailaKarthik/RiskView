const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create Expo client
const expo = new Expo();

// Send push notification to a single user
const sendPushNotification = async (userId, message) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.pushToken) {
      console.log(`No push token for user ${userId}`);
      return null;
    }

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.log(`Invalid push token: ${user.pushToken}`);
      return null;
    }

    const messages = [
      {
        to: user.pushToken,
        sound: 'default',
        title: 'High Activity Alert',
        body: message
      }
    ];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return null;
  }
};

// Send push notifications to multiple users
const sendPushNotifications = async (userIds, title, message, data = {}) => {
  try {
    const users = await User.find({ 
      _id: { $in: userIds },
      pushToken: { $exists: true, $ne: null }
    });

    const messages = users
      .filter(user => Expo.isExpoPushToken(user.pushToken))
      .map(user => ({
        to: user.pushToken,
        sound: 'default',
        title,
        body: message,
        data
      }));

    if (messages.length === 0) {
      console.log('No valid push tokens found');
      return [];
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notifications:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error in sendPushNotifications:', error);
    return [];
  }
};

// Send notification to users near a location
const sendLocationBasedNotification = async (title, message, category, location, data = {}) => {
  try {
    // Find all users within a certain radius of the location
    const users = await User.find({
      pushToken: { $exists: true, $ne: null }
    }).limit(100); // Limit to prevent sending to too many users

    const userIds = users.map(u => u._id);

    return await sendPushNotifications(
      userIds,
      title,
      message,
      { 
        ...data,
        category,
        latitude: location.coordinates[1],
        longitude: location.coordinates[0]
      }
    );
  } catch (error) {
    console.error('Error in sendLocationBasedNotification:', error);
    return [];
  }
};

module.exports = {
  sendPushNotification,
  sendPushNotifications,
  sendLocationBasedNotification
};
