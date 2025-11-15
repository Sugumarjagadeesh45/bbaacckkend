const { sendNotificationToMultipleDrivers, sendNotificationToDriver, testFirebaseConnection } = require('./firebaseService');
const Driver = require('../models/driver/driver');

console.log('📱 Notification Service loaded');




// In /services/notificationService.js - Update driver query

class NotificationService {
  
  // In /services/notificationService.js - Update driver query

  // services/notificationService.js
static async sendRideRequestToAllDrivers(rideData) {
  try {
    console.log('🚨 SENDING RIDE REQUEST NOTIFICATIONS TO ALL DRIVERS');

    // ஆன்லைனில் இருக்கும் டிரைவர்களை FCM டோக்கனுடன் கேள்
    const allDrivers = await Driver.find({
      $or: [
        { status: "Live" },
        { status: "online" }, 
        { status: "available" },
        { isOnline: true },
        { lastUpdate: { $gte: new Date(Date.now() - 10 * 60 * 1000) } }
      ],
      fcmToken: { 
        $exists: true, 
        $ne: null, 
        $ne: '',
        $type: 'string'
      }
    });

    console.log(`📱 Found ${allDrivers.length} drivers with FCM tokens`);

    // செல்ல FCM டோக்கன்களை வடிக்கட்டு
    const driverTokens = allDrivers.map(driver => driver.fcmToken).filter(token => token);
    
    if (driverTokens.length === 0) {
      console.log('⚠️ No drivers with FCM tokens found');
      return { success: false, message: 'No drivers available' };
    }

    // FCM அறிவிப்பு தரவை உருவாக்கு
    const notificationData = {
      type: 'ride_request',
      rideId: rideData.rideId,
      pickup: JSON.stringify(rideData.pickup),
      drop: JSON.stringify(rideData.drop),
      fare: rideData.fare?.toString() || '0',
      distance: rideData.distance || '0 km',
      vehicleType: rideData.vehicleType || 'taxi',
      userName: rideData.userName || 'Customer',
      userMobile: rideData.userMobile || 'N/A',
      timestamp: new Date().toISOString(),
      priority: 'high',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
      sound: 'default' // 🔊 ஒலிக்கு முக்கியமாக
    };

    // FCM அனுப்பு
    const result = await sendNotificationToMultipleDrivers(
      driverTokens,
      '🚖 New Ride Request!',
      `Pickup: ${rideData.pickup?.address?.substring(0, 40)}... | Fare: ₹${rideData.fare}`,
      notificationData
    );

    console.log(`📊 FCM Results: ${result.successCount} success, ${result.failureCount} failed`);
    return result;
  } catch (error) {
    console.error('❌ Error in sendRideRequestToAllDrivers:', error);
    return { success: false, message: error.message };
  }
}


}


module.exports = NotificationService;



// const { sendNotificationToMultipleDrivers, sendNotificationToDriver } = require('./firebaseService');
// const Driver = require('../models/driver/driver');

// console.log('📱 Notification Service loaded');

// class NotificationService {
//   /**
//    * Send ride request notification to all available drivers
//    */
//   static async sendRideRequestToAllDrivers(rideData) {
//     try {
//       console.log('🚨 SENDING RIDE REQUEST NOTIFICATIONS TO ALL DRIVERS');
//       console.log('📊 Ride Data:', {
//         rideId: rideData.rideId,
//         pickup: rideData.pickup?.address || 'Selected Location',
//         fare: rideData.fare,
//         vehicleType: rideData.vehicleType
//       });

//       // Get ALL active drivers with valid FCM tokens
//       const allDrivers = await Driver.find({ 
//         status: "Live",
//         fcmToken: { $exists: true, $ne: null, $ne: '' }
//       }).select('fcmToken driverId name vehicleType');

//       console.log(`📱 Found ${allDrivers.length} drivers with FCM tokens`);

//       const driverTokens = allDrivers.map(driver => driver.fcmToken).filter(token => token);
      
//       if (driverTokens.length === 0) {
//         console.log('⚠️ No drivers with valid FCM tokens found');
//         return {
//           success: false,
//           message: 'No drivers with FCM tokens available',
//           sentCount: 0,
//           totalDrivers: 0
//         };
//       }

//       // In notificationService.js, sendRideRequestToAllDrivers function
// const notificationData = {
//   type: 'ride_request',
//   rideId: rideData.rideId,
//   pickup: JSON.stringify(rideData.pickup || {}),
//   drop: JSON.stringify(rideData.drop || {}),
//   fare: rideData.fare?.toString() || '0',
//   distance: rideData.distance || '0 km',
//   vehicleType: rideData.vehicleType || 'taxi',
//   userName: rideData.userName || 'Customer',  // Changed from customerName
//   userMobile: rideData.userMobile || 'N/A',    // Added missing field
//   timestamp: new Date().toISOString(),
//   priority: 'high',
//   click_action: 'FLUTTER_NOTIFICATION_CLICK'
// };


// // In notificationService.js
// console.log('🚨 SENDING REAL RIDE NOTIFICATION:');
// console.log('Payload:', notificationData);
// console.log('Driver Tokens:', driverTokens);

// const result = await sendNotificationToMultipleDrivers(...);
// console.log('📊 NOTIFICATION RESULT:', result);


//       const result = await sendNotificationToMultipleDrivers(
//         driverTokens,
//         '🚖 New Ride Request!',
//         `Pickup: ${rideData.pickup?.address?.substring(0, 40) || 'Selected Location'}...`,
//         notificationData
//       );

//       console.log(`📊 Notification Send Results:`, result);

//       // Log which drivers received notifications
//       if (result.successCount > 0) {
//         console.log(`✅ Notifications sent successfully to ${result.successCount} drivers`);
//       }
//       if (result.failureCount > 0) {
//         console.log(`❌ Failed to send to ${result.failureCount} drivers`);
//       }

//       return {
//         success: result.successCount > 0,
//         sentCount: result.successCount,
//         failedCount: result.failureCount,
//         totalDrivers: driverTokens.length,
//         errors: result.errors
//       };

//     } catch (error) {
//       console.error('❌ Error in sendRideRequestToAllDrivers:', error);
//       return {
//         success: false,
//         message: error.message,
//         sentCount: 0,
//         totalDrivers: 0
//       };
//     }
//   }

//   /**
//    * Send notification to specific driver
//    */
//   static async sendToDriver(driverId, title, body, data = {}) {
//     try {
//       const driver = await Driver.findOne({ driverId });
//       if (!driver || !driver.fcmToken) {
//         console.log(`❌ Driver ${driverId} not found or no FCM token`);
//         return { success: false, error: 'Driver not found or no FCM token' };
//       }

//       const result = await sendNotificationToDriver(driver.fcmToken, title, body, data);
      
//       return { 
//         success: result, 
//         driverId,
//         driverName: driver.name 
//       };
//     } catch (error) {
//       console.error(`❌ Error sending notification to driver ${driverId}:`, error);
//       return { success: false, error: error.message };
//     }
//   }

//   /**
//    * Send ride accepted notification to user
//    */
//   static async sendRideAcceptedToUser(userFCMToken, rideData) {
//     try {
//       if (!userFCMToken) {
//         return { success: false, error: 'No user FCM token provided' };
//       }

//       const result = await sendNotificationToDriver(
//         userFCMToken,
//         '✅ Ride Accepted!',
//         `Driver ${rideData.driverName} is on the way to pick you up`,
//         {
//           type: 'ride_accepted',
//           rideId: rideData.rideId,
//           driverId: rideData.driverId,
//           driverName: rideData.driverName,
//           vehicleType: rideData.vehicleType,
//           eta: rideData.eta || '5 mins',
//           timestamp: new Date().toISOString()
//         }
//       );

//       return { success: result };
//     } catch (error) {
//       console.error('❌ Error sending ride accepted notification:', error);
//       return { success: false, error: error.message };
//     }
//   }

//   /**
//    * Test notification endpoint
//    */
//   static async sendTestNotification(driverId) {
//     return await this.sendToDriver(
//       driverId,
//       '🧪 Test Notification',
//       'This is a test notification from the backend server',
//       {
//         type: 'test',
//         timestamp: new Date().toISOString(),
//         test: 'true'
//       }
//     );
//   }

//   /**
//    * Send driver arrival notification
//    */
//   static async sendDriverArrived(driverId, rideData) {
//     return await this.sendToDriver(
//       driverId,
//       '📍 Driver Arrived',
//       `Driver has arrived at pickup location`,
//       {
//         type: 'driver_arrived',
//         rideId: rideData.rideId,
//         timestamp: new Date().toISOString()
//       }
//     );
//   }

//   /**
//    * Send ride completed notification
//    */
//   static async sendRideCompleted(driverId, rideData) {
//     return await this.sendToDriver(
//       driverId,
//       '🎉 Ride Completed',
//       `Ride completed successfully. Fare: ₹${rideData.fare}`,
//       {
//         type: 'ride_completed',
//         rideId: rideData.rideId,
//         fare: rideData.fare?.toString() || '0',
//         timestamp: new Date().toISOString()
//       }
//     );
//   }
// }

// module.exports = NotificationService;