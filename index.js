const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connectDB = require("./config/dbconnection");
const { JWT_SECRET, verifyToken, permit } = require('./middleware/auth');

// Models
const Register = require('./models/Register');
const Doctor = require('./models/Doctor');
const Booking = require('./models/Booking');
const Prescription = require('./models/Prescription');

connectDB();

app.use(cors());
app.use(bodyParser.json());

// ------------------ Auth Routes ------------------
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await Register.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    const user = new Register({ name, email, password: hashed, role: role || 'user' });
    await user.save();
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await Register.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const payload = { id: user._id, role: user.role, email: user.email, name: user.name };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ------------------ Doctor CRUD (Admin allowed) ------------------

// Doctorlist - manage doctor(admin)
// Doctor details will be added to the Database
app.post('/api/doctors', verifyToken, permit('admin'), async (req, res) => {
  try {
    const doc = new Doctor(req.body);
    await doc.save();
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// allow simple filtering by name/specialist/state/language
// accessible to any authenticated user
// search bar
// Doctorlist - manage doctor(admin)
app.get('/api/doctors', verifyToken, async (req, res) => {
 
  const q = req.query; 
  const filter = {};
  if (q.name) filter.doctorName = new RegExp(q.name, 'i');
  if (q.specialist) filter.specialist = new RegExp(q.specialist, 'i');
  if (q.language) filter.language = new RegExp(q.language, 'i');
  if (q.doctorfrom) filter.doctorfrom = new RegExp(q.doctorfrom, 'i');
  try {
    const docs = await Doctor.find(filter);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Doctorlist - manage doctor(admin)
// Doctor list will be display it in table
app.get('/api/doctors/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Doctorlist - manage doctor(admin)
// Edit button (Doctors details can be updated)
app.put('/api/doctors/:id', verifyToken, permit('admin'), async (req, res) => {
  try {
    const doc = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Doctorlist - manage doctor(admin)
// Delete button (Doctors details can be deleted)
app.delete('/api/doctors/:id', verifyToken, permit('admin'), async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Doctor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Fetch all appointments for logged-in doctor
// appointmentstatus - appointment status (doctor)
app.get("/api/doctor/appointments", async (req, res) => {
  try {
    const { doctorEmail } = req.query;
    if (!doctorEmail) return res.status(400).json({ message: "Doctor email is required" });

    const appointments = await Booking.find({ doctorEmail});
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Update appointment status (Reviewed / Not Reviewed)
// appointmentstatus - appointment status (doctor)
app.put("/api/doctor/appointments/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorStatus  } = req.body;

    const updated = await Booking.findByIdAndUpdate(id, { doctorStatus  }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Delete an appointment
// appointmentstatus - appointment status (doctor)
app.delete("/api/doctor/appointments/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get('/api/doctors/appointments/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Doctor.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




//  Get all bookings or filter by doctorId / doctorName
app.get("/api/patients", async (req, res) => {
  try {
    const { doctorId, doctorName } = req.query;
    let query = {};

    if (doctorId) query.doctorId = doctorId;
    if (doctorName)
      query.doctorName = { $regex: doctorName, $options: "i" }; // case-insensitive search

    const bookings = await Booking.find(query);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// ✅ Delete a record
app.delete("/api/patients/:id", async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: "Record deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ------------------ Booking CRUD ------------------
// bookingform - book appointment (user)
// managebookings - Appointments (Admin)
// Data is added to the database
app.post('/api/bookings', verifyToken, permit('user', 'admin'), async (req, res) => {
try {
const booking = new Booking(req.body);
booking.status = 'Pending';
await booking.save();
res.status(201).json({
      success: true,
      message: "Booking created successfully",
      tokenNumber: booking.tokenNumber, // 👈 send token back
      booking,
    });
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// patientbookingstatus - my bookings (user)
app.get("/api/bookings", async (req, res) => {
  try {
    const { patientEmail } = req.query;
    const filter = patientEmail ? { patientEmail } : {};
    const bookings = await Booking.find(filter);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// managebookings - Appointments (Admin)
// edit status (Approved / Rejected)
app.put('/api/bookings/:id', verifyToken, permit('admin','doctor'), async (req, res) => {
try {
const b = await Booking.findByIdAndUpdate(
req.params.id,
req.body,
{ new: true }
);
res.json(b);
} catch (err) {
res.status(500).json({ message: err.message });
}
});

// managebookings - Appointments (Admin)
// delete booking appointments
app.delete('/api/bookings/:id', verifyToken, permit('admin'), async (req, res) => {
try {
await Booking.findByIdAndDelete(req.params.id);
res.json({ message: 'Booking deleted' });
} catch (err) {
res.status(500).json({ message: err.message });
}
});


// add data to the table
// Doctorprescription - Prescription (doctor)
app.post("/api/prescriptions", async (req, res) => {
   try {
    console.log("Incoming data:", req.body);   // 👈 log request data
    const prescription = new Prescription(req.body);
    await prescription.save();
    res.status(201).json(prescription);
  } catch (err) {
    console.error("Error saving prescription:", err);  // 👈 log full error
    res.status(500).json({ error: err.message });
  }
});

// Get prescriptions by doctor 
// Display the prescription in the table
// Doctorprescription - Prescription (doctor)
app.get("/api/prescriptions/doctor", async (req, res) => {
  try {
    const { doctorEmail } = req.query;
    const prescriptions = await Prescription.find({ doctorEmail }).sort({
      createdAt: -1,
    });
    res.json(prescriptions);
  } catch (err) {
    console.error("Error fetching prescriptions:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Edit the patient prescription in the table by doctor 
// Doctorprescription - Prescription (doctor)
app.put("/api/prescriptions/:id", async (req, res) => {
  try {
    const updated = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated document
    );
    if (!updated) return res.status(404).json({ error: "Prescription not found" });
    res.json(updated);
  } catch (err) {
    console.error("Error updating prescription:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});

// Delete Prescription
// Doctorprescription - Prescription (doctor)
app.delete("/api/prescriptions/:id", async (req, res) => {
  try {
    const deleted = await Prescription.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Prescription not found" });
    res.json({ message: "Prescription deleted successfully" });
  } catch (err) {
    console.error("Error deleting prescription:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
});


// userprescription - my prescription (user)
// Patient sees only their prescriptions
app.get("/api/prescriptions/patient", async (req, res) => {
  try {
    const { patientEmail } = req.query;
    if (!patientEmail) {
      return res.status(400).json({ error: "patientEmail is required" });
    }
    const prescriptions = await Prescription.find({ patientEmail });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));