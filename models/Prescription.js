const mongoose = require("mongoose");

const PrescriptionSchema = new mongoose.Schema(
  {
    doctorId: String,
    doctorName: String,
    doctorEmail: String,
    patientName: String,
    patientEmail: String,
    patientAge: Number,
    diagnosis: String,
    medicines: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prescription", PrescriptionSchema);
