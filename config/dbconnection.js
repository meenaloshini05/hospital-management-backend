const mongoose = require("mongoose");

async function dbconnection() {
  try {
    await mongoose.connect(
      "mongodb+srv://meenaloshinisivakumar_db_user:hm123@hm.m7pcivj.mongodb.net/?retryWrites=true&w=majority&appName=hm",
      {
        ssl: true, // Secure Sockets Layer - data encryption during app connection to database
        tlsAllowInvalidCertificates: false, // Supporting part of ssl
      }
    );
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection error:", err.message);
  }
}

module.exports = dbconnection;
