require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");

const app = express();

/* ---------- Basic middleware ---------- */
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------- Uploads directory (static) ---------- */
const uploadsDir = path.join(__dirname, "uploads");
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✅ Created uploads directory:", uploadsDir);
  }
} catch (err) {
  console.warn("⚠️ Could not ensure uploads directory:", err.message);
}
app.use("/uploads", express.static(uploadsDir));

// In your server routes (backend)
app.post('/drivers/update-fcm-token', async (req, res) => {
  try {
    const { driverId, fcmToken, platform } = req.body;
    
    console.log('📱 Updating FCM token for driver:', driverId);
    
    // Update driver document with new FCM token
    const result = await Driver.findByIdAndUpdate(
      driverId,
      { 
        fcmToken: fcmToken,
        fcmPlatform: platform,
        fcmUpdatedAt: new Date()
      },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Driver not found' });
    }
    
    console.log('✅ FCM token updated for driver:', driverId);
    res.json({ success: true, message: 'FCM token updated successfully' });
    
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// In app.js - make sure this route exists
app.post('/api/drivers/update-fcm-token', async (req, res) => {
  try {
    const { driverId, fcmToken, platform } = req.body;
    
    console.log('📱 Updating FCM token for driver:', driverId);
    
    if (!driverId || !fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID and FCM token are required'
      });
    }

    // Update driver's FCM token in database
    const Driver = require('./models/driver/driver'); // ✅ ADD THIS LINE
    const result = await Driver.findOneAndUpdate(
      { driverId: driverId },
      { 
        fcmToken: fcmToken,
        fcmTokenUpdatedAt: new Date(),
        platform: platform
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    console.log('✅ FCM token updated for driver:', driverId);
    
    res.json({
      success: true,
      message: 'FCM token updated successfully',
      driverId: driverId
    });
    
  } catch (error) {
    console.error('❌ Error updating FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/* ---------- Helper: safeRequireRoute ---------- */
/**
 * Attempts to require a route file and returns an express Router.
 * If file missing or has errors, returns an empty Router to prevent crash.
 *
 * @param {string} relPath - relative path (from app.js) to route file e.g. "./routes/rideRoutes"
 * @param {string} name - friendly name for logs
 * @returns {express.Router}
 */
function safeRequireRoute(relPath, name = "Route") {
  const fullPath = path.join(__dirname, relPath);
  console.log(`🔍 Loading ${name} route from: ${fullPath}`);
  
  try {
    // Try known file extensions
    const candidates = [
      `${fullPath}.js`,
      fullPath,
      path.join(fullPath, "index.js"),
    ];

    let found = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        found = c;
        console.log(`✅ Found ${name} route file: ${c}`);
        break;
      }
    }

    if (!found) {
      console.warn(`⚠️ ${name} route file not found at "${relPath}" (skipping)`);
      return express.Router();
    }

    console.log(`📦 Requiring ${name} route module from: ${found}`);
    const routeModule = require(found);

    // If the module itself is a function (router factory) or router, return it
    if (typeof routeModule === "function" || routeModule instanceof express.Router) {
      console.log(`✅ Loaded ${name} route from "${relPath}"`);
      return routeModule;
    }

    // If module exports an object with default or router property, try to return it
    if (routeModule && routeModule.router) {
      console.log(`✅ Loaded ${name} route (router property) from "${relPath}"`);
      return routeModule.router;
    }
    if (routeModule && routeModule.default) {
      console.log(`✅ Loaded ${name} route (default export) from "${relPath}"`);
      return routeModule.default;
    }

    // If it exports an object but not a router, warn and return empty router
    console.warn(
      `⚠️ ${name} route module at "${relPath}" did not export an Express router/function. Returning empty router.`
    );
    return express.Router();
  } catch (err) {
    console.error(`❌ Failed to load ${name} route from "${relPath}":`, err.message);
    // Return a no-op router so server can start
    return express.Router();
  }
}

/* ---------- Load routes safely ---------- */
console.log("🔄 Loading routes...");

const adminRoutes = safeRequireRoute("./routes/adminRoutes", "Admin");
const driverRoutes = safeRequireRoute("./routes/driverRoutes", "Driver");
const rideRoutes = safeRequireRoute("./routes/rideRoutes", "Ride");
const groceryRoutes = safeRequireRoute("./routes/groceryRoutes", "Grocery");
const authRoutes = safeRequireRoute("./routes/authRoutes", "Auth");
const userRoutes = safeRequireRoute("./routes/userRoutes", "User");
const walletRoutes = safeRequireRoute("./routes/walletRoutes", "Wallet");
const routeRoutes = safeRequireRoute("./routes/routeRoutes", "Route");
const ridePriceRoutes = safeRequireRoute("./routes/ridePriceRoutes", "Ride Price");
const driverLocationHistoryRoutes = safeRequireRoute("./routes/driverLocationHistoryRoutes", "Driver Location History");
const testRoutes = safeRequireRoute("./routes/testRoutes", "Test");
const notificationRoutes = safeRequireRoute("./routes/notificationRoutes", "Notification");

/* ---------- Mount routes (only once, consistent paths) ---------- */
console.log("📡 Mounting routes...");

app.use("/api/admin", adminRoutes);
console.log("✅ Mounted /api/admin routes");

app.use("/api/drivers", driverRoutes);
console.log("✅ Mounted /api/drivers routes");

app.use("/api/routes", routeRoutes);
console.log("✅ Mounted /api/routes routes");

app.use("/api/rides", rideRoutes);
console.log("✅ Mounted /api/rides routes");

app.use("/api/groceries", groceryRoutes);
console.log("✅ Mounted /api/groceries routes");

app.use("/api/auth", authRoutes);
console.log("✅ Mounted /api/auth routes");

app.use("/api/users", userRoutes);
console.log("✅ Mounted /api/users routes");

app.use("/api/wallet", walletRoutes);
console.log("✅ Mounted /api/wallet routes");

app.use("/api/admin/ride-prices", ridePriceRoutes);
console.log("✅ Mounted /api/admin/ride-prices routes");

app.use("/api", driverLocationHistoryRoutes);
console.log("✅ Mounted /api driver location history routes");

app.use("/api/test", testRoutes);
console.log("✅ Mounted /api/test routes");

app.use("/api/notifications", notificationRoutes);
console.log("✅ Mounted /api/notifications routes");

console.log("🎉 All routes mounted successfully!");

/* ---------- Test route to verify server restart ---------- */
app.get("/api/test-connection", (req, res) => {
  res.json({ 
    success: true, 
    message: "Server is running and routes are updated!",
    timestamp: new Date().toISOString()
  });
});

/* ---------- Direct test route for driver token check ---------- */
app.get("/api/direct-test", (req, res) => {
  const Driver = require('./models/driver/driver');
  
  Driver.findOne({ driverId: 'dri123' })
    .then(driver => {
      res.json({
        success: true,
        message: 'Direct test route working!',
        driver: driver ? {
          driverId: driver.driverId,
          name: driver.name,
          hasFCMToken: !!driver.fcmToken,
          fcmToken: driver.fcmToken ? `${driver.fcmToken.substring(0, 20)}...` : 'NULL',
          status: driver.status,
          lastUpdate: driver.lastUpdate
        } : null
      });
    })
    .catch(error => {
      res.status(500).json({
        success: false,
        error: error.message
      });
    });
});

/* ---------- Health / root route ---------- */
app.get("/", (req, res) => {
  res.json({ 
    message: "Taxi app API is running", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/* ---------- Error handler (last) ---------- */
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || "Internal Server Error",
      // in non-production you can return the stack — remove in prod
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    },
  });
});

/* ---------- Export app ---------- */
module.exports = app;



// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const fs = require("fs");
// const morgan = require("morgan");

// const app = express();

// /* ---------- Basic middleware ---------- */
// app.use(morgan("dev"));
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ---------- Uploads directory (static) ---------- */
// const uploadsDir = path.join(__dirname, "uploads");
// try {
//   if (!fs.existsSync(uploadsDir)) {
//     fs.mkdirSync(uploadsDir, { recursive: true });
//     console.log("✅ Created uploads directory:", uploadsDir);
//   }
// } catch (err) {
//   console.warn("⚠️ Could not ensure uploads directory:", err.message);
// }
// app.use("/uploads", express.static(uploadsDir));

// /* ---------- Helper: safeRequireRoute ---------- */
// /**
//  * Attempts to require a route file and returns an express Router.
//  * If file missing or has errors, returns an empty Router to prevent crash.
//  *
//  * @param {string} relPath - relative path (from app.js) to route file e.g. "./routes/rideRoutes"
//  * @param {string} name - friendly name for logs
//  * @returns {express.Router}
//  */
// function safeRequireRoute(relPath, name = "Route") {
//   const fullPath = path.join(__dirname, relPath);
//   try {
//     // Try known file extensions
//     const candidates = [
//       `${fullPath}.js`,
//       fullPath,
//       path.join(fullPath, "index.js"),
//     ];

//     let found = null;
//     for (const c of candidates) {
//       if (fs.existsSync(c)) {
//         found = c;
//         break;
//       }
//     }

//     if (!found) {
//       console.warn(`⚠️ ${name} route file not found at "${relPath}" (skipping)`);
//       return express.Router();
//     }

//     const routeModule = require(found);

//     // If the module itself is a function (router factory) or router, return it
//     if (typeof routeModule === "function" || routeModule instanceof express.Router) {
//       console.log(`✅ Loaded ${name} route from "${relPath}"`);
//       return routeModule;
//     }

//     // If module exports an object with default or router property, try to return it
//     if (routeModule && routeModule.router) {
//       console.log(`✅ Loaded ${name} route (router property) from "${relPath}"`);
//       return routeModule.router;
//     }
//     if (routeModule && routeModule.default) {
//       console.log(`✅ Loaded ${name} route (default export) from "${relPath}"`);
//       return routeModule.default;
//     }

//     // If it exports an object but not a router, warn and return empty router
//     console.warn(
//       `⚠️ ${name} route module at "${relPath}" did not export an Express router/function. Returning empty router.`
//     );
//     return express.Router();
//   } catch (err) {
//     console.error(`❌ Failed to load ${name} route from "${relPath}":`, err.message);
//     // Return a no-op router so server can start
//     return express.Router();
//   }
// }

// /* ---------- Load routes safely ---------- */
// console.log("🔄 Loading routes...");

// const adminRoutes = safeRequireRoute("./routes/adminRoutes", "Admin");
// const driverRoutes = safeRequireRoute("./routes/driverRoutes", "Driver");
// const rideRoutes = safeRequireRoute("./routes/rideRoutes", "Ride");
// const groceryRoutes = safeRequireRoute("./routes/groceryRoutes", "Grocery");
// const authRoutes = safeRequireRoute("./routes/authRoutes", "Auth");
// const userRoutes = safeRequireRoute("./routes/userRoutes", "User");
// const walletRoutes = safeRequireRoute("./routes/walletRoutes", "Wallet");
// const routeRoutes = safeRequireRoute("./routes/routeRoutes", "Route");
// const ridePriceRoutes = safeRequireRoute("./routes/ridePriceRoutes", "Ride Price");
// const driverLocationHistoryRoutes = safeRequireRoute("./routes/driverLocationHistoryRoutes", "Driver Location History");
// const testRoutes = safeRequireRoute("./routes/testRoutes", "Test");
// const notificationRoutes = safeRequireRoute("./routes/notificationRoutes", "Notification");

// /* ---------- Mount routes (only once, consistent paths) ---------- */
// app.use("/api/admin", adminRoutes);
// // Make sure driver routes are mounted correctly
// app.use("/api/drivers", driverRoutes);
// app.use("/api/routes", routeRoutes);
// app.use("/api/rides", rideRoutes);
// app.use("/api/groceries", groceryRoutes);
// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/wallet", walletRoutes);
// // ridePriceRoutes placed under admin as your code suggested
// app.use("/api/admin/ride-prices", ridePriceRoutes);
// // driver location history mounted under /api (if that’s intended)
// app.use("/api", driverLocationHistoryRoutes);
// app.use("/api/test", testRoutes);
// app.use("/api/notifications", notificationRoutes);

// /* ---------- Health / root route ---------- */
// app.get("/", (req, res) => {
//   res.json({ message: "Taxi app API is running", uptime: process.uptime() });
// });


// /* ---------- Test route to verify server restart ---------- */
// app.get("/api/test-connection", (req, res) => {
//   res.json({ 
//     success: true, 
//     message: "Server is running and routes are updated!",
//     timestamp: new Date().toISOString()
//   });
// });


// /* ---------- Error handler (last) ---------- */
// app.use((err, req, res, next) => {
//   console.error("❌ Unhandled error:", err.stack || err);
//   const status = err.status || 500;
//   res.status(status).json({
//     error: {
//       message: err.message || "Internal Server Error",
//       // in non-production you can return the stack — remove in prod
//       stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
//     },
//   });
// });

// /* ---------- Export app ---------- */
// module.exports = app;
