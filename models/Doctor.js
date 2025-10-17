const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true },
  doctorName: String,
  email: String,
  doctorFrom: String,
  specialist: String,
  gender: String,
  language: String,
  dateOfJoining: Date,
  dateOfBirth: Date,
});

module.exports = mongoose.model("Doctor", DoctorSchema);
