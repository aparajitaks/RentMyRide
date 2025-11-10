import express from "express";
const router = express.Router();

// Simple health + user echo for tests
router.get("/health", (req, res) => {
  res.json({ ok: true, user: req.user || null });
});

export default router;
