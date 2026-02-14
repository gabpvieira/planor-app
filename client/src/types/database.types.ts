export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface GoalMilestone {
  value: number
  label: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_plan: 'free' | 'monthly' | 'annual'
          subscription_status: 'active' | 'cancelled' | 'expired'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: 'free' | 'monthly' | 'annual'
          subscription_status?: 'active' | 'cancelled' | 'expired'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_plan?: 'free' | 'monthly' | 'annual'
          subscription_status?: 'active' | 'cancelled' | 'expired'
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          type: 'event' | 'block'
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          type?: 'event' | 'block'
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          type?: 'event' | 'block'
          color?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          completed: boolean
          status: 'active' | 'completed'
          priority: 'P1' | 'P2' | 'P3' | 'P4' | 'low' | 'medium' | 'high'
          due_date: string | null
          project_id: string | null
          tags: string[]
          subtasks: Subtask[]
          recurring: string | null
          estimated_time: number | null
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          status?: 'active' | 'completed'
          priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'low' | 'medium' | 'high'
          due_date?: string | null
          project_id?: string | null
          tags?: string[]
          subtasks?: Subtask[]
          recurring?: string | null
          estimated_time?: number | null
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          status?: 'active' | 'completed'
          priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'low' | 'medium' | 'high'
          due_date?: string | null
          project_id?: string | null
          tags?: string[]
          subtasks?: Subtask[]
          recurring?: string | null
          estimated_time?: number | null
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string
          is_archived: boolean
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color?: string
          icon?: string
          is_archived?: boolean
          order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string
          is_archived?: boolean
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          date: string
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          date: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          date?: string
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      workout_exercises: {
        Row: {
          id: number
          workout_id: number
          exercise_name: string
          sets: number
          reps: number | null
          weight: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          workout_id: number
          exercise_name: string
          sets: number
          reps?: number | null
          weight?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          workout_id?: number
          exercise_name?: string
          sets?: number
          reps?: number | null
          weight?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          calories: number | null
          protein: number | null
          carbs: number | null
          fats: number | null
          date: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          date: string
          type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fats?: number | null
          date?: string
          type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          created_at?: string
          updated_at?: string
        }
      }
      habits: {
        Row: {
          id: number
          user_id: string
          title: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'specific_days'
          target_count: number
          current_streak: number
          longest_streak: number
          total_completions: number
          last_completed_at: string | null
          color_hex: string
          icon_name: string
          time_of_day: 'morning' | 'afternoon' | 'evening' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'specific_days'
          target_count?: number
          current_streak?: number
          longest_streak?: number
          total_completions?: number
          last_completed_at?: string | null
          color_hex?: string
          icon_name?: string
          time_of_day?: 'morning' | 'afternoon' | 'evening' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'specific_days'
          target_count?: number
          current_streak?: number
          longest_streak?: number
          total_completions?: number
          last_completed_at?: string | null
          color_hex?: string
          icon_name?: string
          time_of_day?: 'morning' | 'afternoon' | 'evening' | null
          created_at?: string
          updated_at?: string
        }
      }
      habit_logs: {
        Row: {
          id: number
          habit_id: number
          date: string
          count: number
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          habit_id: number
          date: string
          count?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          habit_id?: number
          date?: string
          count?: number
          completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          category: 'financas' | 'pessoal' | 'saude' | 'carreira'
          start_value: number
          target_value: number
          current_value: number
          unit: string
          deadline: string | null
          milestones: GoalMilestone[]
          is_archived: boolean
          linked_module: 'finance' | 'habits' | 'tasks' | 'workouts' | null
          linked_config: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          category?: 'financas' | 'pessoal' | 'saude' | 'carreira'
          start_value?: number
          target_value?: number
          current_value?: number
          unit?: string
          deadline?: string | null
          milestones?: GoalMilestone[]
          is_archived?: boolean
          linked_module?: 'finance' | 'habits' | 'tasks' | 'workouts' | null
          linked_config?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          category?: 'financas' | 'pessoal' | 'saude' | 'carreira'
          start_value?: number
          target_value?: number
          current_value?: number
          unit?: string
          deadline?: string | null
          milestones?: GoalMilestone[]
          is_archived?: boolean
          linked_module?: 'finance' | 'habits' | 'tasks' | 'workouts' | null
          linked_config?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      goal_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: 'financas' | 'pessoal' | 'saude' | 'carreira'
          default_milestones: GoalMilestone[]
          default_unit: string
          icon: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: 'financas' | 'pessoal' | 'saude' | 'carreira'
          default_milestones?: GoalMilestone[]
          default_unit?: string
          icon?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: 'financas' | 'pessoal' | 'saude' | 'carreira'
          default_milestones?: GoalMilestone[]
          default_unit?: string
          icon?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      finance_transactions: {
        Row: {
          id: number
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description: string | null
          date: string
          account_id: string | null
          card_id: string | null
          installments_total: number
          installment_current: number
          parent_transaction_id: number | null
          is_subscription: boolean
          is_transfer: boolean
          transfer_to_account_id: string | null
          recurring_bill_id: string | null
          paid: boolean
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          type: 'income' | 'expense'
          amount: number
          category: string
          description?: string | null
          date: string
          account_id?: string | null
          card_id?: string | null
          installments_total?: number
          installment_current?: number
          parent_transaction_id?: number | null
          is_subscription?: boolean
          is_transfer?: boolean
          transfer_to_account_id?: string | null
          recurring_bill_id?: string | null
          paid?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          type?: 'income' | 'expense'
          amount?: number
          category?: string
          description?: string | null
          date?: string
          account_id?: string | null
          card_id?: string | null
          installments_total?: number
          installment_current?: number
          parent_transaction_id?: number | null
          is_subscription?: boolean
          is_transfer?: boolean
          transfer_to_account_id?: string | null
          recurring_bill_id?: string | null
          paid?: boolean
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'corrente' | 'poupanca' | 'investimento' | 'carteira'
          balance: number
          color_hex: string
          icon: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'corrente' | 'poupanca' | 'investimento' | 'carteira'
          balance?: number
          color_hex?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'corrente' | 'poupanca' | 'investimento' | 'carteira'
          balance?: number
          color_hex?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      credit_cards: {
        Row: {
          id: string
          user_id: string
          name: string
          card_limit: number
          closing_day: number
          due_day: number
          current_balance: number
          color_hex: string
          brand: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          card_limit?: number
          closing_day?: number
          due_day?: number
          current_balance?: number
          color_hex?: string
          brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          card_limit?: number
          closing_day?: number
          due_day?: number
          current_balance?: number
          color_hex?: string
          brand?: 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recurring_bills: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          frequency: 'mensal' | 'semanal' | 'quinzenal' | 'anual'
          due_day: number
          category: string
          account_id: string | null
          card_id: string | null
          auto_post: boolean
          is_active: boolean
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          frequency?: 'mensal' | 'semanal' | 'quinzenal' | 'anual'
          due_day?: number
          category?: string
          account_id?: string | null
          card_id?: string | null
          auto_post?: boolean
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          frequency?: 'mensal' | 'semanal' | 'quinzenal' | 'anual'
          due_day?: number
          category?: string
          account_id?: string | null
          card_id?: string | null
          auto_post?: boolean
          is_active?: boolean
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      card_invoices: {
        Row: {
          id: string
          user_id: string
          card_id: string
          reference_month: string
          closing_date: string
          due_date: string
          total_amount: number
          paid_amount: number
          status: 'open' | 'closed' | 'paid' | 'partial'
          paid_at: string | null
          paid_from_account_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          card_id: string
          reference_month: string
          closing_date: string
          due_date: string
          total_amount?: number
          paid_amount?: number
          status?: 'open' | 'closed' | 'paid' | 'partial'
          paid_at?: string | null
          paid_from_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          card_id?: string
          reference_month?: string
          closing_date?: string
          due_date?: string
          total_amount?: number
          paid_amount?: number
          status?: 'open' | 'closed' | 'paid' | 'partial'
          paid_at?: string | null
          paid_from_account_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notes: {
        Row: {
          id: number
          user_id: string
          title: string
          content: string | null
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          content?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string | null
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      knowledge_items: {
        Row: {
          id: number
          user_id: string
          title: string
          content: string | null
          topic: string | null
          type: 'note' | 'article' | 'book' | 'video' | 'podcast' | 'ai_insight' | 'link'
          tags: string[]
          progress: number
          ai_summary: string | null
          key_takeaways: string[] | null
          is_favorite: boolean
          is_archived: boolean
          is_to_read: boolean
          source_url: string | null
          last_reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          title: string
          content?: string | null
          topic?: string | null
          type?: 'note' | 'article' | 'book' | 'video' | 'podcast' | 'ai_insight' | 'link'
          tags?: string[]
          progress?: number
          ai_summary?: string | null
          key_takeaways?: string[] | null
          is_favorite?: boolean
          is_archived?: boolean
          is_to_read?: boolean
          source_url?: string | null
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          title?: string
          content?: string | null
          topic?: string | null
          type?: 'note' | 'article' | 'book' | 'video' | 'podcast' | 'ai_insight' | 'link'
          tags?: string[]
          progress?: number
          ai_summary?: string | null
          key_takeaways?: string[] | null
          is_favorite?: boolean
          is_archived?: boolean
          is_to_read?: boolean
          source_url?: string | null
          last_reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      nutrition_profiles: {
        Row: {
          id: string
          user_id: string // UUID stored as string in JS
          weight: number | null
          height: number | null
          age: number | null
          gender: 'male' | 'female' | 'other' | null
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          goal: 'lose' | 'maintain' | 'gain'
          daily_calories_target: number
          protein_target: number
          carbs_target: number
          fat_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight?: number | null
          height?: number | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          goal?: 'lose' | 'maintain' | 'gain'
          daily_calories_target?: number
          protein_target?: number
          carbs_target?: number
          fat_target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number | null
          height?: number | null
          age?: number | null
          gender?: 'male' | 'female' | 'other' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
          goal?: 'lose' | 'maintain' | 'gain'
          daily_calories_target?: number
          protein_target?: number
          carbs_target?: number
          fat_target?: number
          created_at?: string
          updated_at?: string
        }
      }
      daily_food_logs: {
        Row: {
          id: number
          user_id: string
          food_name: string
          description: string | null
          calories: number
          protein: number
          carbs: number
          fat: number
          fiber: number
          serving_size: string | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          logged_at: string
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          food_name: string
          description?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          fiber?: number
          serving_size?: string | null
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          logged_at?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          food_name?: string
          description?: string | null
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          fiber?: number
          serving_size?: string | null
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          logged_at?: string
          created_at?: string
        }
      }
      meal_plans: {
        Row: {
          id: string
          user_id: string
          title: string
          plan_json: MealPlanJson
          total_days: number
          daily_avg_calories: number | null
          status: 'active' | 'archived' | 'completed'
          generated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          plan_json: MealPlanJson
          total_days?: number
          daily_avg_calories?: number | null
          status?: 'active' | 'archived' | 'completed'
          generated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          plan_json?: MealPlanJson
          total_days?: number
          daily_avg_calories?: number | null
          status?: 'active' | 'archived' | 'completed'
          generated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      financial_challenges: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          icon: string
          challenge_type: ChallengeType
          direction: ChallengeDirection
          start_amount: number
          step_amount: number
          total_weeks: number
          current_week: number
          total_deposited: number
          deposit_history: ChallengeDeposit[]
          custom_amounts: number[] | null
          target_amount: number | null
          linked_account_id: string | null
          auto_create_transaction: boolean
          status: ChallengeStatus
          start_date: string
          target_date: string | null
          completed_at: string | null
          notification_enabled: boolean
          notification_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          icon?: string
          challenge_type?: ChallengeType
          direction?: ChallengeDirection
          start_amount?: number
          step_amount?: number
          total_weeks?: number
          current_week?: number
          total_deposited?: number
          deposit_history?: ChallengeDeposit[]
          custom_amounts?: number[] | null
          target_amount?: number | null
          linked_account_id?: string | null
          auto_create_transaction?: boolean
          status?: ChallengeStatus
          start_date?: string
          target_date?: string | null
          completed_at?: string | null
          notification_enabled?: boolean
          notification_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          icon?: string
          challenge_type?: ChallengeType
          direction?: ChallengeDirection
          start_amount?: number
          step_amount?: number
          total_weeks?: number
          current_week?: number
          total_deposited?: number
          deposit_history?: ChallengeDeposit[]
          custom_amounts?: number[] | null
          target_amount?: number | null
          linked_account_id?: string | null
          auto_create_transaction?: boolean
          status?: ChallengeStatus
          start_date?: string
          target_date?: string | null
          completed_at?: string | null
          notification_enabled?: boolean
          notification_day?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Financial Challenge types
export type ChallengeType = '52_weeks' | 'custom_saving';
export type ChallengeDirection = 'standard' | 'inverse';
export type ChallengeStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface ChallengeDeposit {
  week: number;
  date: string;
  status: 'paid' | 'pending' | 'skipped';
  amount: number;
}

// Meal Plan JSON structure
export interface MealPlanDay {
  day: number
  dayName: string
  meals: {
    breakfast: MealPlanMeal[]
    lunch: MealPlanMeal[]
    dinner: MealPlanMeal[]
    snacks: MealPlanMeal[]
  }
  totals: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface MealPlanMeal {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export interface MealPlanJson {
  days: MealPlanDay[]
  summary: {
    avgCalories: number
    avgProtein: number
    avgCarbs: number
    avgFat: number
  }
}
