const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      // Write concern: majority — write must be acknowledged by the primary
      // AND at least one secondary before returning success.
      // Guarantees the write survives a primary failover.
      writeConcern: { w: "majority", wtimeout: 5000 },

      // Read preference: primaryPreferred — reads go to the primary by default,
      // falling back to a secondary only when the primary is unavailable.
      // Critical reads (order placement) use readConcern "majority" inside
      // transactions to prevent reading uncommitted data.
      readPreference: "primaryPreferred",
    });

    console.log("MongoDB Atlas Connected");
    console.log("Write concern: majority | Read preference: primaryPreferred");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
