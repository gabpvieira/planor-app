import { z } from 'zod';
import {
  insertAppointmentSchema,
  insertTaskSchema,
  insertWorkoutSchema,
  insertWorkoutExerciseSchema,
  insertMealSchema,
  insertHabitSchema,
  insertHabitLogSchema,
  insertGoalSchema,
  insertGoalObjectiveSchema,
  insertFinanceTransactionSchema,
  insertNoteSchema,
  insertKnowledgeItemSchema,
  appointments,
  tasks,
  workouts,
  workoutExercises,
  meals,
  habits,
  habitLogs,
  goals,
  goalObjectives,
  financeTransactions,
  notes,
  knowledgeItems,
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  appointments: {
    list: {
      method: 'GET' as const,
      path: '/api/appointments',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/appointments',
      input: insertAppointmentSchema,
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/appointments/:id',
      input: insertAppointmentSchema.partial(),
      responses: {
        200: z.custom<typeof appointments.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/appointments/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      input: z.object({
        completed: z.string().optional(), // 'true' | 'false'
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  workouts: {
    list: {
      method: 'GET' as const,
      path: '/api/workouts',
      responses: {
        200: z.array(z.custom<typeof workouts.$inferSelect & { exercises: typeof workoutExercises.$inferSelect[] }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workouts/:id',
      responses: {
        200: z.custom<typeof workouts.$inferSelect & { exercises: typeof workoutExercises.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workouts',
      input: insertWorkoutSchema,
      responses: {
        201: z.custom<typeof workouts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/workouts/:id',
      input: insertWorkoutSchema.partial(),
      responses: {
        200: z.custom<typeof workouts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/workouts/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    // Exercises
    addExercise: {
      method: 'POST' as const,
      path: '/api/workouts/:id/exercises',
      input: insertWorkoutExerciseSchema.omit({ workoutId: true }),
      responses: {
        201: z.custom<typeof workoutExercises.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  meals: {
    list: {
      method: 'GET' as const,
      path: '/api/meals',
      input: z.object({
        date: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof meals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/meals',
      input: insertMealSchema,
      responses: {
        201: z.custom<typeof meals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/meals/:id',
      input: insertMealSchema.partial(),
      responses: {
        200: z.custom<typeof meals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/meals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  habits: {
    list: {
      method: 'GET' as const,
      path: '/api/habits',
      responses: {
        200: z.array(z.custom<typeof habits.$inferSelect & { logs: typeof habitLogs.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/habits',
      input: insertHabitSchema,
      responses: {
        201: z.custom<typeof habits.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/habits/:id',
      input: insertHabitSchema.partial(),
      responses: {
        200: z.custom<typeof habits.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/habits/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    // Logs
    log: {
      method: 'POST' as const,
      path: '/api/habits/:id/logs',
      input: insertHabitLogSchema.omit({ habitId: true }),
      responses: {
        201: z.custom<typeof habitLogs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      input: z.object({
        year: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof goals.$inferSelect & { objectives: typeof goalObjectives.$inferSelect[] }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: {
        201: z.custom<typeof goals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/goals/:id',
      input: insertGoalSchema.partial(),
      responses: {
        200: z.custom<typeof goals.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    // Objectives
    addObjective: {
      method: 'POST' as const,
      path: '/api/goals/:id/objectives',
      input: insertGoalObjectiveSchema.omit({ goalId: true }),
      responses: {
        201: z.custom<typeof goalObjectives.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    toggleObjective: {
      method: 'PATCH' as const,
      path: '/api/goals/objectives/:id/toggle',
      input: z.object({ completed: z.boolean() }),
      responses: {
        200: z.custom<typeof goalObjectives.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  finance: {
    list: {
      method: 'GET' as const,
      path: '/api/finance',
      input: z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        type: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof financeTransactions.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/finance',
      input: insertFinanceTransactionSchema,
      responses: {
        201: z.custom<typeof financeTransactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/finance/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  notes: {
    list: {
      method: 'GET' as const,
      path: '/api/notes',
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof notes.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/notes',
      input: insertNoteSchema,
      responses: {
        201: z.custom<typeof notes.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/notes/:id',
      input: insertNoteSchema.partial(),
      responses: {
        200: z.custom<typeof notes.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/notes/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  knowledge: {
    list: {
      method: 'GET' as const,
      path: '/api/knowledge',
      input: z.object({
        search: z.string().optional(),
        topic: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof knowledgeItems.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/knowledge',
      input: insertKnowledgeItemSchema,
      responses: {
        201: z.custom<typeof knowledgeItems.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/knowledge/:id',
      input: insertKnowledgeItemSchema.partial(),
      responses: {
        200: z.custom<typeof knowledgeItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/knowledge/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
