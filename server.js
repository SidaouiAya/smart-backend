const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { execSync } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// ===== Nodemailer =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'projetsmart9@gmail.com',
    pass: 'YOUR_APP_PASSWORD',
  }
});

// ===== Sensor Data =====
let sensorData = {
  machine_1: {
    temperature: 0,
    humidity: 0,
    pressure: 0,
    current: 0,
    vibration: "NO",
    status: "Running"
  }
};

// ===== Send Code by Email =====
app.post('/api/send-code', async (req, res) => {
  const { email, code } = req.body;
  try {
    await transporter.sendMail({
      from: 'projetsmart9@gmail.com',
      to: email,
      subject: 'Code de vérification - Smart Industry',
      html: `
        <div style="font-family: Arial; padding: 20px; background: #1A1A2E; color: white; border-radius: 10px;">
          <h2 style="color: #7C3AED;">🔐 Code de vérification</h2>
          <p>Votre code est :</p>
          <h1 style="color: #B57BFF; letter-spacing: 8px;">${code}</h1>
          <p style="color: #888;">Ce code est valable 30 secondes.</p>
        </div>
      `,
    });
    console.log(`[${new Date().toLocaleTimeString()}] Code ${code} envoyé à ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ===== Update Sensor Data =====
app.post('/api/update', (req, res) => {
  const { temp, hum, pressure, courant, vibration } = req.body;

  let status = "Running";
  if (temp > 30 || courant > 2.0 || vibration === "YES") status = "Failure";
  else if (temp > 25) status = "Warning";

  sensorData.machine_1 = {
    temperature: parseFloat(temp) || 0,
    humidity:    parseFloat(hum) || 0,
    pressure:    parseFloat(pressure) || 0,
    current:     parseFloat(courant) || 0,
    vibration:   vibration || "NO",
    status:      status
  };

  console.log(`[${new Date().toLocaleTimeString()}] Data:`, sensorData.machine_1);
  res.json({ success: true, status });
});

// ===== Get Sensor Data =====
app.get('/api/sensors/:machine_id', (req, res) => {
  const data = sensorData[req.params.machine_id];
  if (!data) return res.status(404).json({ error: "Not found" });
  res.json(data);
});

app.get('/api/sensors', (req, res) => res.json(sensorData));

// ===== Prediction =====
app.get('/api/predict/:machine_id', (req, res) => {
  const data = sensorData[req.params.machine_id];
  if (!data) return res.status(404).json({ error: "Not found" });

  const now = new Date();
  const input = [
    data.temperature,
    data.vibration === "YES" ? 1 : 0,
    data.humidity,
    data.current,
    now.getHours(),
    now.getDate(),
    now.getMonth() + 1
  ].join(',');

  try {
    const result = execSync(`python predict.py ${input}`).toString().trim();
    res.json({ prediction: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/', (req, res) => res.json({ message: "Smart Industry API running!" }));

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});