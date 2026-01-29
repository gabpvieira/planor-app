import { db } from "./db";
import {
  users, appointments, tasks, workouts, workoutExercises, meals, habits, habitLogs,
  goals, goalObjectives, financeTransactions, notes, knowledgeItems,
  type User, type InsertUser, type Appointment, type InsertAppointment,
  type Task, type InsertTask, type Workout, type InsertWorkout,
  type WorkoutExercise, type InsertWorkoutExercise, type WorkoutWithExercises,
  type Meal, type InsertMeal, type Habit, type InsertHabit,
  type HabitLog, type InsertHabitLog, type HabitWithLogs,
  type Goal, type InsertGoal, type GoalObjective, type InsertGoalObjective, type GoalWithObjectives,
  type FinanceTransaction, type InsertFinanceTransaction, type Note, type InsertNote,
  type KnowledgeItem, type InsertKnowledgeItem
} from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Appointments
  getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, userId: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number, userId: string): Promise<void>;

  // Tasks
  getTasks(userId: string, completed?: boolean): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, userId: string, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number, userId: string): Promise<void>;

  // Workouts
  getWorkouts(userId: string): Promise<WorkoutWithExercises[]>;
  getWorkout(id: number, userId: string): Promise<WorkoutWithExercises | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, userId: string, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number, userId: string): Promise<void>;
  addWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise>;

  // Meals
  getMeals(userId: string, date?: Date): Promise<Meal[]>;
  createMeal(meal: InsertMeal): Promise<Meal>;
  updateMeal(id: number, userId: string, meal: Partial<InsertMeal>): Promise<Meal | undefined>;
  deleteMeal(id: number, userId: string): Promise<void>;

  // Habits
  getHabits(userId: string): Promise<HabitWithLogs[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  updateHabit(id: number, userId: string, habit: Partial<InsertHabit>): Promise<Habit | undefined>;
  deleteHabit(id: number, userId: string): Promise<void>;
  logHabit(log: InsertHabitLog): Promise<HabitLog>;

  // Goals
  getGoals(userId: string, year?: number): Promise<GoalWithObjectives[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, userId: string, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number, userId: string): Promise<void>;
  addGoalObjective(objective: InsertGoalObjective): Promise<GoalObjective>;
  toggleGoalObjective(id: number, completed: boolean): Promise<GoalObjective | undefined>;

  // Finance
  getFinanceTransactions(userId: string, startDate?: Date, endDate?: Date, type?: string): Promise<FinanceTransaction[]>;
  createFinanceTransaction(transaction: InsertFinanceTransaction): Promise<FinanceTransaction>;
  deleteFinanceTransaction(id: number, userId: string): Promise<void>;

  // Notes
  getNotes(userId: string, search?: string): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, userId: string, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number, userId: string): Promise<void>;

  // Knowledge
  getKnowledgeItems(userId: string, search?: string, topic?: string): Promise<KnowledgeItem[]>;
  createKnowledgeItem(item: InsertKnowledgeItem): Promise<KnowledgeItem>;
  updateKnowledgeItem(id: number, userId: string, item: Partial<InsertKnowledgeItem>): Promise<KnowledgeItem | undefined>;
  deleteKnowledgeItem(id: number, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Appointments
  async getAppointments(userId: string, startDate?: Date, endDate?: Date): Promise<Appointment[]> {
    const conditions = [eq(appointments.userId, userId)];
    if (startDate) conditions.push(gte(appointments.startTime, startDate));
    if (endDate) conditions.push(lte(appointments.endTime, endDate));
    return await db.select().from(appointments).where(and(...conditions));
  }
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newItem] = await db.insert(appointments).values(appointment).returning();
    return newItem;
  }
  async updateAppointment(id: number, userId: string, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [updated] = await db.update(appointments)
      .set(appointment)
      .where(and(eq(appointments.id, id), eq(appointments.userId, userId)))
      .returning();
    return updated;
  }
  async deleteAppointment(id: number, userId: string): Promise<void> {
    await db.delete(appointments).where(and(eq(appointments.id, id), eq(appointments.userId, userId)));
  }

  // Tasks
  async getTasks(userId: string, completed?: boolean): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];
    if (completed !== undefined) conditions.push(eq(tasks.completed, completed));
    return await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.id));
  }
  async createTask(task: InsertTask): Promise<Task> {
    const [newItem] = await db.insert(tasks).values(task).returning();
    return newItem;
  }
  async updateTask(id: number, userId: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const [updated] = await db.update(tasks)
      .set(task)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updated;
  }
  async deleteTask(id: number, userId: string): Promise<void> {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  // Workouts
  async getWorkouts(userId: string): Promise<WorkoutWithExercises[]> {
    const userWorkouts = await db.select().from(workouts).where(eq(workouts.userId, userId)).orderBy(desc(workouts.date));
    const results: WorkoutWithExercises[] = [];
    for (const workout of userWorkouts) {
      const exercises = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workout.id));
      results.push({ ...workout, exercises });
    }
    return results;
  }
  async getWorkout(id: number, userId: string): Promise<WorkoutWithExercises | undefined> {
    const [workout] = await db.select().from(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
    if (!workout) return undefined;
    const exercises = await db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workout.id));
    return { ...workout, exercises };
  }
  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const [newItem] = await db.insert(workouts).values(workout).returning();
    return newItem;
  }
  async updateWorkout(id: number, userId: string, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const [updated] = await db.update(workouts)
      .set(workout)
      .where(and(eq(workouts.id, id), eq(workouts.userId, userId)))
      .returning();
    return updated;
  }
  async deleteWorkout(id: number, userId: string): Promise<void> {
    await db.delete(workouts).where(and(eq(workouts.id, id), eq(workouts.userId, userId)));
  }
  async addWorkoutExercise(exercise: InsertWorkoutExercise): Promise<WorkoutExercise> {
    const [newItem] = await db.insert(workoutExercises).values(exercise).returning();
    return newItem;
  }

  // Meals
  async getMeals(userId: string, date?: Date): Promise<Meal[]> {
    const conditions = [eq(meals.userId, userId)];
    // Simple date filtering (exact match or range if needed, here assuming exact day match logic handled by caller or simple timestamp compare)
    // For simplicity, returning all or handling strict equality if provided.
    // In production, date ranges are better.
    return await db.select().from(meals).where(and(...conditions)).orderBy(desc(meals.date));
  }
  async createMeal(meal: InsertMeal): Promise<Meal> {
    const [newItem] = await db.insert(meals).values(meal).returning();
    return newItem;
  }
  async updateMeal(id: number, userId: string, meal: Partial<InsertMeal>): Promise<Meal | undefined> {
    const [updated] = await db.update(meals)
      .set(meal)
      .where(and(eq(meals.id, id), eq(meals.userId, userId)))
      .returning();
    return updated;
  }
  async deleteMeal(id: number, userId: string): Promise<void> {
    await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
  }

  // Habits
  async getHabits(userId: string): Promise<HabitWithLogs[]> {
    const userHabits = await db.select().from(habits).where(eq(habits.userId, userId));
    const results: HabitWithLogs[] = [];
    for (const habit of userHabits) {
      const logs = await db.select().from(habitLogs).where(eq(habitLogs.habitId, habit.id));
      results.push({ ...habit, logs });
    }
    return results;
  }
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const [newItem] = await db.insert(habits).values(habit).returning();
    return newItem;
  }
  async updateHabit(id: number, userId: string, habit: Partial<InsertHabit>): Promise<Habit | undefined> {
    const [updated] = await db.update(habits)
      .set(habit)
      .where(and(eq(habits.id, id), eq(habits.userId, userId)))
      .returning();
    return updated;
  }
  async deleteHabit(id: number, userId: string): Promise<void> {
    await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId)));
  }
  async logHabit(log: InsertHabitLog): Promise<HabitLog> {
    const [newItem] = await db.insert(habitLogs).values(log).returning();
    return newItem;
  }

  // Goals
  async getGoals(userId: string, year?: number): Promise<GoalWithObjectives[]> {
    const conditions = [eq(goals.userId, userId)];
    if (year) conditions.push(eq(goals.year, year));
    const userGoals = await db.select().from(goals).where(and(...conditions));
    const results: GoalWithObjectives[] = [];
    for (const goal of userGoals) {
      const objectives = await db.select().from(goalObjectives).where(eq(goalObjectives.goalId, goal.id));
      results.push({ ...goal, objectives });
    }
    return results;
  }
  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newItem] = await db.insert(goals).values(goal).returning();
    return newItem;
  }
  async updateGoal(id: number, userId: string, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const [updated] = await db.update(goals)
      .set(goal)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)))
      .returning();
    return updated;
  }
  async deleteGoal(id: number, userId: string): Promise<void> {
    await db.delete(goals).where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }
  async addGoalObjective(objective: InsertGoalObjective): Promise<GoalObjective> {
    const [newItem] = await db.insert(goalObjectives).values(objective).returning();
    return newItem;
  }
  async toggleGoalObjective(id: number, completed: boolean): Promise<GoalObjective | undefined> {
    const [updated] = await db.update(goalObjectives)
      .set({ completed })
      .where(eq(goalObjectives.id, id))
      .returning();
    return updated;
  }

  // Finance
  async getFinanceTransactions(userId: string, startDate?: Date, endDate?: Date, type?: string): Promise<FinanceTransaction[]> {
    const conditions = [eq(financeTransactions.userId, userId)];
    if (startDate) conditions.push(gte(financeTransactions.date, startDate));
    if (endDate) conditions.push(lte(financeTransactions.date, endDate));
    if (type) conditions.push(eq(financeTransactions.type, type));
    return await db.select().from(financeTransactions).where(and(...conditions)).orderBy(desc(financeTransactions.date));
  }
  async createFinanceTransaction(transaction: InsertFinanceTransaction): Promise<FinanceTransaction> {
    const [newItem] = await db.insert(financeTransactions).values(transaction).returning();
    return newItem;
  }
  async deleteFinanceTransaction(id: number, userId: string): Promise<void> {
    await db.delete(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)));
  }

  // Notes
  async getNotes(userId: string, search?: string): Promise<Note[]> {
    return await db.select().from(notes).where(eq(notes.userId, userId)).orderBy(desc(notes.createdAt));
  }
  async createNote(note: InsertNote): Promise<Note> {
    const [newItem] = await db.insert(notes).values(note).returning();
    return newItem;
  }
  async updateNote(id: number, userId: string, note: Partial<InsertNote>): Promise<Note | undefined> {
    const [updated] = await db.update(notes)
      .set({ ...note, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    return updated;
  }
  async deleteNote(id: number, userId: string): Promise<void> {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
  }

  // Knowledge
  async getKnowledgeItems(userId: string, search?: string, topic?: string): Promise<KnowledgeItem[]> {
    const conditions = [eq(knowledgeItems.userId, userId)];
    if (topic) conditions.push(eq(knowledgeItems.topic, topic));
    return await db.select().from(knowledgeItems).where(and(...conditions)).orderBy(desc(knowledgeItems.createdAt));
  }
  async createKnowledgeItem(item: InsertKnowledgeItem): Promise<KnowledgeItem> {
    const [newItem] = await db.insert(knowledgeItems).values(item).returning();
    return newItem;
  }
  async updateKnowledgeItem(id: number, userId: string, item: Partial<InsertKnowledgeItem>): Promise<KnowledgeItem | undefined> {
    const [updated] = await db.update(knowledgeItems)
      .set({ ...item, updatedAt: new Date() })
      .where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, userId)))
      .returning();
    return updated;
  }
  async deleteKnowledgeItem(id: number, userId: string): Promise<void> {
    await db.delete(knowledgeItems).where(and(eq(knowledgeItems.id, id), eq(knowledgeItems.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
