export * from "./models/auth";
import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// === APPOINTMENTS ===
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  type: text("type").notNull().default("event"), // event, block
  color: text("color"),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// === TASKS ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority").default("medium").notNull(), // low, medium, high
  dueDate: timestamp("due_date"),
  order: integer("order").default(0),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// === WORKOUTS ===
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseName: text("exercise_name").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps"),
  weight: text("weight"), // Text to allow "20kg" or "Bodyweight"
  notes: text("notes"),
});

export const workoutsRelations = relations(workouts, ({ many }) => ({
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(workoutExercises, ({ one }) => ({
  workout: one(workouts, {
    fields: [workoutExercises.workoutId],
    references: [workouts.id],
  }),
}));

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ id: true });
export type Workout = typeof workouts.$inferSelect;
export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;

export const insertWorkoutExerciseSchema = createInsertSchema(workoutExercises).omit({ id: true });
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type InsertWorkoutExercise = z.infer<typeof insertWorkoutExerciseSchema>;

export type WorkoutWithExercises = Workout & { exercises: WorkoutExercise[] };


// === MEALS (NUTRITION) ===
export const meals = pgTable("meals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  calories: integer("calories"),
  protein: integer("protein"),
  carbs: integer("carbs"),
  fats: integer("fats"),
  date: timestamp("date").notNull(),
  type: text("type").notNull(), // breakfast, lunch, dinner, snack
});

export const insertMealSchema = createInsertSchema(meals).omit({ id: true });
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = z.infer<typeof insertMealSchema>;

// === HABITS ===
export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  frequency: text("frequency").default("daily").notNull(), // daily, weekly
  targetCount: integer("target_count").default(1).notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: 'cascade' }),
  date: date("date").notNull(), // YYYY-MM-DD
  count: integer("count").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const habitsRelations = relations(habits, ({ many }) => ({
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
}));

export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

export const insertHabitLogSchema = createInsertSchema(habitLogs).omit({ id: true });
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = z.infer<typeof insertHabitLogSchema>;

export type HabitWithLogs = Habit & { logs: HabitLog[] };


// === GOALS ===
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  year: integer("year").notNull(),
  status: text("status").default("not_started").notNull(), // not_started, in_progress, completed
  progress: integer("progress").default(0).notNull(), // 0-100
});

export const goalObjectives = pgTable("goal_objectives", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false).notNull(),
});

export const goalsRelations = relations(goals, ({ many }) => ({
  objectives: many(goalObjectives),
}));

export const goalObjectivesRelations = relations(goalObjectives, ({ one }) => ({
  goal: one(goals, {
    fields: [goalObjectives.goalId],
    references: [goals.id],
  }),
}));

export const insertGoalSchema = createInsertSchema(goals).omit({ id: true });
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export const insertGoalObjectiveSchema = createInsertSchema(goalObjectives).omit({ id: true });
export type GoalObjective = typeof goalObjectives.$inferSelect;
export type InsertGoalObjective = z.infer<typeof insertGoalObjectiveSchema>;

export type GoalWithObjectives = Goal & { objectives: GoalObjective[] };

// === FINANCE ===
export const financeTransactions = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // income, expense
  amount: numeric("amount").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  accountId: text("account_id"),
  cardId: text("card_id"),
  installmentsTotal: integer("installments_total").default(1),
  installmentCurrent: integer("installment_current").default(1),
  parentTransactionId: integer("parent_transaction_id"),
  isSubscription: boolean("is_subscription").default(false),
  isTransfer: boolean("is_transfer").default(false),
  transferToAccountId: text("transfer_to_account_id"),
  recurringBillId: integer("recurring_bill_id"),
  paid: boolean("paid").default(true),
  dueDate: timestamp("due_date"),
});

export const insertFinanceTransactionSchema = createInsertSchema(financeTransactions).omit({ id: true });
export type FinanceTransaction = typeof financeTransactions.$inferSelect;
export type InsertFinanceTransaction = z.infer<typeof insertFinanceTransactionSchema>;

// === NOTES ===
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({ id: true, createdAt: true, updatedAt: true });
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;

// === KNOWLEDGE ===
export const knowledgeItems = pgTable("knowledge_items", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  content: text("content"), // Markdown/Long text
  topic: text("topic"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertKnowledgeItemSchema = createInsertSchema(knowledgeItems).omit({ id: true, createdAt: true, updatedAt: true });
export type KnowledgeItem = typeof knowledgeItems.$inferSelect;
export type InsertKnowledgeItem = z.infer<typeof insertKnowledgeItemSchema>;
