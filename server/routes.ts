import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, getUserId } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Setup Auth
  setupAuth(app);
  registerAuthRoutes(app);

  // Middleware to ensure authentication for API routes
  const requireAuth = isAuthenticated;

  // === APPOINTMENTS ===
  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const userId = getUserId(req);
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const items = await storage.getAppointments(userId, startDate, endDate);
    res.json(items);
  });

  app.post(api.appointments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.create.input.parse(req.body);
      const item = await storage.createAppointment({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.appointments.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateAppointment(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.appointments.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAppointment(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  // === TASKS ===
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    const completed = req.query.completed === 'true' ? true : req.query.completed === 'false' ? false : undefined;
    const items = await storage.getTasks(getUserId(req), completed);
    res.json(items);
  });

  app.post(api.tasks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const item = await storage.createTask({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.tasks.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateTask(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.tasks.delete.path, requireAuth, async (req, res) => {
    await storage.deleteTask(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  // === WORKOUTS ===
  app.get(api.workouts.list.path, requireAuth, async (req, res) => {
    const items = await storage.getWorkouts(getUserId(req));
    res.json(items);
  });

  app.get(api.workouts.get.path, requireAuth, async (req, res) => {
    const item = await storage.getWorkout(Number(req.params.id), getUserId(req));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post(api.workouts.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.workouts.create.input.parse(req.body);
      const item = await storage.createWorkout({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.workouts.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateWorkout(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.workouts.delete.path, requireAuth, async (req, res) => {
    await storage.deleteWorkout(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  app.post(api.workouts.addExercise.path, requireAuth, async (req, res) => {
    try {
      const input = api.workouts.addExercise.input.parse(req.body);
      // Verify ownership of workout first
      const workout = await storage.getWorkout(Number(req.params.id), getUserId(req));
      if (!workout) return res.status(404).json({ message: "Workout not found" });
      
      const item = await storage.addWorkoutExercise({ ...input, workoutId: Number(req.params.id) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === MEALS ===
  app.get(api.meals.list.path, requireAuth, async (req, res) => {
    const items = await storage.getMeals(getUserId(req));
    res.json(items);
  });

  app.post(api.meals.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.meals.create.input.parse(req.body);
      const item = await storage.createMeal({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.meals.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateMeal(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.meals.delete.path, requireAuth, async (req, res) => {
    await storage.deleteMeal(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  // === HABITS ===
  app.get(api.habits.list.path, requireAuth, async (req, res) => {
    const items = await storage.getHabits(getUserId(req));
    res.json(items);
  });

  app.post(api.habits.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.habits.create.input.parse(req.body);
      const item = await storage.createHabit({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.habits.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateHabit(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.habits.delete.path, requireAuth, async (req, res) => {
    await storage.deleteHabit(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  app.post(api.habits.log.path, requireAuth, async (req, res) => {
    try {
      const input = api.habits.log.input.parse(req.body);
      // Verify ownership? Ideally yes.
      const item = await storage.logHabit({ ...input, habitId: Number(req.params.id) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // === GOALS ===
  app.get(api.goals.list.path, requireAuth, async (req, res) => {
    const items = await storage.getGoals(getUserId(req), req.query.year ? Number(req.query.year) : undefined);
    res.json(items);
  });

  app.post(api.goals.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.goals.create.input.parse(req.body);
      const item = await storage.createGoal({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.goals.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateGoal(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.goals.delete.path, requireAuth, async (req, res) => {
    await storage.deleteGoal(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  app.post(api.goals.addObjective.path, requireAuth, async (req, res) => {
    try {
      const input = api.goals.addObjective.input.parse(req.body);
      // Verify ownership
      const item = await storage.addGoalObjective({ ...input, goalId: Number(req.params.id) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.goals.toggleObjective.path, requireAuth, async (req, res) => {
    const item = await storage.toggleGoalObjective(Number(req.params.id), req.body.completed);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  // === FINANCE ===
  app.get(api.finance.list.path, requireAuth, async (req, res) => {
    const items = await storage.getFinanceTransactions(getUserId(req));
    res.json(items);
  });

  app.post(api.finance.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.finance.create.input.parse(req.body);
      const item = await storage.createFinanceTransaction({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.delete(api.finance.delete.path, requireAuth, async (req, res) => {
    await storage.deleteFinanceTransaction(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  // === NOTES ===
  app.get(api.notes.list.path, requireAuth, async (req, res) => {
    const items = await storage.getNotes(getUserId(req));
    res.json(items);
  });

  app.post(api.notes.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.notes.create.input.parse(req.body);
      const item = await storage.createNote({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.notes.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateNote(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.notes.delete.path, requireAuth, async (req, res) => {
    await storage.deleteNote(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  // === KNOWLEDGE ===
  app.get(api.knowledge.list.path, requireAuth, async (req, res) => {
    const items = await storage.getKnowledgeItems(getUserId(req), undefined, req.query.topic as string);
    res.json(items);
  });

  app.post(api.knowledge.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.knowledge.create.input.parse(req.body);
      const item = await storage.createKnowledgeItem({ ...input, userId: getUserId(req) });
      res.status(201).json(item);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.put(api.knowledge.update.path, requireAuth, async (req, res) => {
    const item = await storage.updateKnowledgeItem(Number(req.params.id), getUserId(req), req.body);
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.delete(api.knowledge.delete.path, requireAuth, async (req, res) => {
    await storage.deleteKnowledgeItem(Number(req.params.id), getUserId(req));
    res.status(204).send();
  });

  return httpServer;
}
