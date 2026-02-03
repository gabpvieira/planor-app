# PLANOR - Database Schema Documentation

## Project Information
- **Supabase Project ID**: qchuggfaogrkyurktwxg
- **Project Name**: Planor
- **Region**: sa-east-1 (South America)
- **Status**: ACTIVE_HEALTHY
- **Database Version**: PostgreSQL 17.6.1

## Migration Summary

All migrations were successfully executed via Supabase MCP on February 2, 2026.

### Migration Order

1. **001_create_profiles_table** - User profiles linked to Supabase Auth
2. **002_create_appointments_table** - Calendar events and time blocks
3. **003_create_tasks_table** - Task management system
4. **004_create_workouts_tables** - Workout plans and exercises
5. **005_create_meals_table** - Nutrition tracking
6. **006_create_habits_tables** - Habit tracking with daily logs
7. **007_create_goals_tables** - Annual goals with objectives
8. **008_create_finance_transactions_table** - Financial tracking
9. **009_create_notes_table** - Quick notes system
10. **010_create_knowledge_items_table** - Long-form knowledge base
11. **011_create_updated_at_trigger** - Automatic timestamp updates
12. **create_projects_table** - Projects table for task organization
13. **upgrade_tasks_table** - Enhanced tasks with subtasks, tags, etc.
14. **upgrade_habits_premium** - Premium habit tracker features (streaks, colors, icons)
15. **habits_streak_trigger** - Automatic streak calculation trigger

## Database Tables

### 1. profiles
**Purpose**: User profile data linked to Supabase Auth

**Columns**:
- `id` (uuid, PK) - References auth.users(id)
- `email` (text, NOT NULL)
- `full_name` (text)
- `avatar_url` (text)
- `subscription_plan` (text) - 'free', 'monthly', 'annual'
- `subscription_status` (text) - 'active', 'cancelled', 'expired'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: email
**RLS**: Enabled - Users can view/update own profile

---

### 2. appointments
**Purpose**: Calendar events and time blocking

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `start_time` (timestamptz, NOT NULL)
- `end_time` (timestamptz, NOT NULL)
- `type` (text) - 'event', 'block'
- `color` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, start_time, (user_id, start_time)
**RLS**: Enabled - Full CRUD for own appointments

---

### 3. tasks
**Purpose**: Task management with priorities

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `completed` (boolean, default: false)
- `priority` (text) - 'low', 'medium', 'high'
- `due_date` (timestamptz)
- `order` (integer, default: 0)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, due_date, (user_id, completed)
**RLS**: Enabled - Full CRUD for own tasks

---

### 4. workouts
**Purpose**: Workout plan tracking

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `date` (timestamptz, NOT NULL)
- `completed` (boolean, default: false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, date
**RLS**: Enabled - Full CRUD for own workouts

---

### 5. workout_exercises
**Purpose**: Individual exercises within workouts

**Columns**:
- `id` (serial, PK)
- `workout_id` (integer, FK → workouts, CASCADE)
- `exercise_name` (text, NOT NULL)
- `sets` (integer, NOT NULL)
- `reps` (integer)
- `weight` (text) - Allows "20kg" or "Bodyweight"
- `notes` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: workout_id
**RLS**: Enabled - Access through parent workout ownership

---

### 6. meals
**Purpose**: Nutrition and meal tracking

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `calories` (integer)
- `protein` (integer)
- `carbs` (integer)
- `fats` (integer)
- `date` (timestamptz, NOT NULL)
- `type` (text) - 'breakfast', 'lunch', 'dinner', 'snack'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, date, (user_id, date)
**RLS**: Enabled - Full CRUD for own meals

---

### 7. habits
**Purpose**: Habit definitions and tracking setup (Premium Habit Tracker)

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `frequency` (text) - 'daily', 'weekly', 'specific_days'
- `target_count` (integer, default: 1)
- `current_streak` (integer, default: 0) - Current consecutive days streak
- `longest_streak` (integer, default: 0) - Longest streak ever achieved
- `total_completions` (integer, default: 0) - Total completions count
- `last_completed_at` (timestamptz) - Last completion timestamp
- `color_hex` (text, default: '#3B82F6') - Hex color for display
- `icon_name` (text, default: 'Target') - Lucide icon name
- `time_of_day` (text) - 'morning', 'afternoon', 'evening'
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, (user_id, time_of_day), (user_id, current_streak DESC)
**RLS**: Enabled - Full CRUD for own habits
**Triggers**: Automatic streak calculation on habit_logs changes

---

### 8. habit_logs
**Purpose**: Daily habit completion tracking

**Columns**:
- `id` (serial, PK)
- `habit_id` (integer, FK → habits, CASCADE)
- `date` (date, NOT NULL)
- `count` (integer, default: 0)
- `completed` (boolean, default: false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Constraints**: UNIQUE(habit_id, date)
**Indexes**: habit_id, date, (habit_id, date)
**RLS**: Enabled - Access through parent habit ownership

---

### 9. goals
**Purpose**: Annual goal tracking

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `description` (text)
- `year` (integer, NOT NULL)
- `status` (text) - 'not_started', 'in_progress', 'completed'
- `progress` (integer, 0-100)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, year, (user_id, year)
**RLS**: Enabled - Full CRUD for own goals

---

### 10. goal_objectives
**Purpose**: Breakdown of goals into smaller objectives

**Columns**:
- `id` (serial, PK)
- `goal_id` (integer, FK → goals, CASCADE)
- `title` (text, NOT NULL)
- `completed` (boolean, default: false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: goal_id
**RLS**: Enabled - Access through parent goal ownership

---

### 11. finance_transactions
**Purpose**: Income and expense tracking

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `type` (text) - 'income', 'expense'
- `amount` (numeric(12,2), NOT NULL)
- `category` (text, NOT NULL)
- `description` (text)
- `date` (timestamptz, NOT NULL)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, date, type, (user_id, date)
**RLS**: Enabled - Full CRUD for own transactions

---

### 12. notes
**Purpose**: Quick note-taking system

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `content` (text)
- `is_pinned` (boolean, default: false)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, is_pinned, created_at DESC
**RLS**: Enabled - Full CRUD for own notes

---

### 13. knowledge_items
**Purpose**: Long-form knowledge base and documentation

**Columns**:
- `id` (serial, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, NOT NULL)
- `content` (text) - Supports Markdown
- `topic` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Indexes**: user_id, topic, created_at DESC
**RLS**: Enabled - Full CRUD for own knowledge items

---

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies ensuring:
- Users can only access their own data
- Full CRUD operations on owned records
- Child tables (exercises, logs, objectives) inherit parent ownership

### Foreign Key Constraints
- All user_id columns reference `auth.users(id)` with CASCADE delete
- Child tables reference parents with CASCADE delete
- Maintains referential integrity

### Data Validation
- CHECK constraints on enum-like fields (status, type, priority)
- NOT NULL constraints on required fields
- UNIQUE constraints where needed (habit_logs date tracking)

### Automatic Timestamps
- All tables include `created_at` and `updated_at`
- Trigger function automatically updates `updated_at` on row changes

## Performance Optimizations

### Indexes Created
- Primary keys on all tables
- Foreign key indexes for joins
- Composite indexes for common query patterns
- Date-based indexes for time-series queries

### Query Optimization
- Indexes on user_id for user-scoped queries
- Date indexes for calendar and timeline views
- Composite indexes for filtered queries

## Integration with Supabase Auth

The schema is designed to work seamlessly with Supabase Authentication:
- `profiles` table links to `auth.users` via UUID
- All data tables reference `auth.users` directly
- RLS policies use `auth.uid()` for user context
- Automatic cleanup on user deletion (CASCADE)

## Next Steps

1. **Update .env file** with Supabase credentials:
   ```
   SUPABASE_URL=https://qchuggfaogrkyurktwxg.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   ```

2. **Configure Supabase client** in your application

3. **Test RLS policies** with different user contexts

4. **Implement API routes** using the schema

5. **Add seed data** for development/testing

## Schema Compliance

✅ All tables created via MCP migrations
✅ Standard fields (created_at, updated_at) on all tables
✅ Foreign keys with explicit ON DELETE/UPDATE
✅ Indexes on all foreign keys
✅ Integrated with Supabase Auth
✅ RLS enabled and configured
✅ Versioned migrations
✅ Clean, scalable structure
✅ No manual SQL required
