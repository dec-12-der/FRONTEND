import express from "express";
import { sendSMS, makeCall } from "../services/fonosterService.js";
const router = express.Router();

router.post("/sms", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) return res.status(400).json({ error: "Missing 'to' or 'message'" });

  try {
    const response = await sendSMS(to, message);
    res.json({ success: true, response });
  } catch {
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

router.post("/call", async (req, res) => {
  const { to, app } = req.body;
  if (!to || !app) return res.status(400).json({ error: "Missing 'to' or 'app'" });

  try {
    const response = await makeCall(to, undefined, app);
    res.json({ success: true, response });
  } catch {
    res.status(500).json({ error: "Failed to initiate call" });
  }
});

export default router;
