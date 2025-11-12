const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    status: { type: String, enum: ["Live", "Offline"], default: "Offline" },
    vehicleType: { type: String },

    // 👇 Proper GeoJSON location field (for live tracking, nearby driver, etc.)
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },

    // ✅ Firebase Cloud Messaging & Platform details
    fcmToken: { type: String, default: null },
    platform: { type: String, enum: ["android", "ios"], default: "android" },
    notificationEnabled: { type: Boolean, default: true },

    // ✅ Driver performance and account info
    active: { type: Boolean, default: false },
    totalPayment: { type: Number, default: 0 },
    settlement: { type: Number, default: 0 },
    hoursLive: { type: Number, default: 0 },
    dailyHours: { type: Number, default: 0 },
    dailyRides: { type: Number, default: 0 },
    loginTime: { type: String },
    logoutTime: { type: String },
    earnings: { type: Number, default: 0 },

    // ✅ Security & account settings
    mustChangePassword: { type: Boolean, default: true },
    lastUpdate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ Enable GeoJSON location-based queries (for nearby driver search)
driverSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Driver", driverSchema);
