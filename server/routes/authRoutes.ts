import express from "express";
import { z } from "zod";
import { User } from "../shared/schema"; // Make sure User type exists and matches DB shape

const router = express.Router();

// Basic login schema
const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

// Simulated user store (replace with DB later)
const mockUser: User = {
  id: 1,
  username: "admin",
  password: "admin", // Do NOT do this in production
};

// Login endpoint
router.post("/login", (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid input" });
  }

  const { username, password } = parsed.data;
  if (username === mockUser.username && password === mockUser.password) {
    // Set session or token here if needed
    return res.json({ id: mockUser.id, username: mockUser.username });
  } else {
    return res.status(401).json({ error: "Invalid credentials" });
  }
});

// Example authenticated endpoint (stub)
router.get("/user", (req, res) => {
  // Replace with actual session/user lookup
  return res.json(mockUser);
});

export default router;

