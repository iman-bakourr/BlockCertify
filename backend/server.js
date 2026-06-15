require("dotenv").config();
const express = require("express");
const cors = require("cors");

const universityRoutes = require("./routes/university");
const studentRoutes = require("./routes/student");
const employerRoutes = require("./routes/employer");
const blockchain = require("./blockchain");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  })
);
app.use(express.json());

// Simple request logger (Audit Trail, section 3.2f)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes for each portal ---
app.use("/api/university", universityRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/employer", employerRoutes);

// --- Health / blockchain status check ---
app.get("/api/status", async (req, res) => {
  const status = await blockchain.getBlockchainStatus();
  res.json({
    service: "BlockCertify Backend",
    status: "running",
    blockchain: status,
  });
});

// --- System Error Alert handler (section 3.1d) ---
app.use((err, req, res, next) => {
  console.error("System Error:", err);
  res.status(500).json({ error: "Internal server error. Blockchain connection or smart contract may have failed." });
});

app.listen(PORT, () => {
  console.log(`BlockCertify backend running on http://localhost:${PORT}`);
});
