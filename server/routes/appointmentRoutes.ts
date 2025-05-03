import express, { Request, Response } from "express";
import { AppointmentStorage } from "../appointmentStorage";

const router = express.Router();
const storage = new AppointmentStorage();

router.get("/", async (_req: Request, res: Response) => {
  const all = await storage.getAll();
  res.json(all);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const appointment = await storage.getById(id);
  if (!appointment) return res.status(404).json({ error: "Not found" });
  res.json(appointment);
});

router.post("/", async (req: Request, res: Response) => {
  const newAppt = await storage.create(req.body);
  res.status(201).json(newAppt);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const updated = await storage.update(id, req.body);
  res.json(updated);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await storage.delete(id);
  res.status(204).end();
});

export default router;
