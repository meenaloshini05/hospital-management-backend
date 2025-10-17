const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientAge: { type: String, required: true },
  patientAddress: { type: String, required: true },
  patientMobile: { type: String, required: true },
  patientEmail: { type: String, required: true }, // ✅ added this field
  disease: { type: String },
  doctorEmail: { type: String, required: true },
  doctorName: { type: String, required: true }, // add
  specialist: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Reviewed", "Not Reviewed"],
    default: "pending",
  },
  doctorStatus: {
    type: String,
    enum: ["Reviewed", "Not Reviewed"],
    default: "Not Reviewed",
  },
  tokenNumber: { type: Number, unique: true },
  createdAt: { type: Date, default: Date.now },
});

BookingSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastBooking = await mongoose
      .model("Booking")
      .findOne()
      .sort({ tokenNumber: -1 });
    this.tokenNumber = lastBooking ? lastBooking.tokenNumber + 1 : 1;
  }
  next();
});

module.exports = mongoose.model("Booking", BookingSchema);
