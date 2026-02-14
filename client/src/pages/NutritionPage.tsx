import { useState, useEffect, useRef } from "react";
import { useNutritionProfile, useDailyNutrition, useWeeklyNutrition, useMealPlans } from "@/hooks/use-supabase-nutrition";
import { FloatingHeader } from "@/components/FloatingHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { format, addDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Apple, Plus, Flame, Beef, Wheat, Droplets, ChevronLeft, ChevronRight,
  Sparkles, Calendar, FileText, Trash2, Loader2, Settings, Target,
  TrendingUp, Coffee, UtensilsCrossed, Moon, Cookie, Download, Archive
} from "lucide-react";
import type { Database, MealPlanJson, MealPlanDay } from "@/types/database.types";

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type FoodLog = Database['public']['Tables']['daily_food_logs']['Row'];

const MEAL_CONFIG: Record<MealType, { icon: typeof Coffee; label: string; color: string }> = {
  breakfast: { icon: Coffee, label: 'Café da Manhã', color: 'text-amber-400' },
  lunch: { icon: UtensilsCrossed, label: 'Almoço', color: 'text-emerald-400' },
  dinner: { icon: Moon, label: 'Jantar', color: 'text-blue-400' },
  snack: { icon: Cookie, label: 'Lanches', color: 'text-pink-400' },
};

// ===== CALORIE RING COMPONENT =====
function CalorieRing({ 
  consumed, 
  target, 
  size = 180,
  strokeWidth = 12,
  animate = true 
}: { 
  consumed: number; 
  target: number; 
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.min((consumed / target) * 100, 100);
  const remaining = Math.max(target - consumed, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setProgress(percentage), 100);
      return () => clearTimeout(timer);
    } else {
      setProgress(percentage);
    }
  }, [percentage, animate]);

  const isOver = consumed > target;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/5"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calorieGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="calorieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isOver ? "#ef4444" : "#22c55e"} />
            <stop offset="100%" stopColor={isOver ? "#f97316" : "#10b981"} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold font-mono tracking-tight">
          {remaining.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">Restantes</span>
        <span className="text-[10px] text-muted-foreground/60 mt-1">
          {consumed.toLocaleString()} / {target.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ===== MACRO RING COMPONENT =====
function MacroRing({ 
  value, 
  target, 
  label, 
  color,
  size = 64 
}: { 
  value: number; 
  target: number; 
  label: string;
  color: string;
  size?: number;
}) {
  const [progress, setProgress] = useState(0);
  const percentage = Math.min((value / target) * 100, 100);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setProgress(percentage), 200);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/5"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold font-mono">{Math.round(value)}g</span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ===== WEEKLY CHART COMPONENT =====
function WeeklyChart({ data }: { data: { date: string; calories: number; target: number }[] }) {
  const maxCalories = Math.max(...data.map(d => Math.max(d.calories, d.target)), 1);

  return (
    <div className="flex items-end justify-between gap-2 h-24 px-2">
      {data.map((day, i) => {
        const height = (day.calories / maxCalories) * 100;
        const isToday = i === data.length - 1;
        const dayName = format(new Date(day.date), 'EEE', { locale: ptBR });
        const isOnTarget = day.calories >= day.target * 0.9 && day.calories <= day.target * 1.1;

        return (
          <div key={day.date} className="flex flex-col items-center gap-1 flex-1">
            <div className="relative w-full h-20 flex items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-[24px] rounded-t-md transition-all duration-500",
                  isToday ? "bg-gradient-to-t from-emerald-500 to-emerald-400" :
                  isOnTarget ? "bg-emerald-500/60" : "bg-white/20"
                )}
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
            <span className={cn(
              "text-[10px] capitalize",
              isToday ? "text-emerald-400 font-medium" : "text-muted-foreground"
            )}>
              {dayName}
            </span>
          </div>
        );
      })}
    </div>
  );
}


// ===== FOOD ITEM COMPONENT =====
function FoodItem({ 
  food, 
  onDelete 
}: { 
  food: FoodLog; 
  onDelete: (id: number) => void;
}) {
  return (
    <div className={cn(
      "group flex items-center justify-between p-3 rounded-xl",
      "bg-white/5 border border-white/10",
      "hover:bg-white/8 transition-all"
    )}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{food.food_name}</p>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span className="font-mono">{food.calories} kcal</span>
          <span>P: {food.protein}g</span>
          <span>C: {food.carbs}g</span>
          <span>G: {food.fat}g</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(food.id)}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// ===== MEAL SECTION COMPONENT =====
function MealSection({ 
  type, 
  foods, 
  onAddFood, 
  onDeleteFood,
  isAdding 
}: { 
  type: MealType;
  foods: FoodLog[];
  onAddFood: (type: MealType) => void;
  onDeleteFood: (id: number) => void;
  isAdding: boolean;
}) {
  const config = MEAL_CONFIG[type];
  const Icon = config.icon;
  const totalCalories = foods.reduce((sum, f) => sum + (f.calories || 0), 0);

  return (
    <div className={cn(
      "p-4 rounded-2xl",
      "bg-white/5 border border-white/10",
      "backdrop-blur-md"
    )}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg bg-white/5", config.color)}>
            <Icon className="size-4" />
          </div>
          <span className="font-medium text-sm">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {totalCalories} kcal
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 hover:bg-white/10"
            onClick={() => onAddFood(type)}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {foods.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 text-center py-4">
          Nenhum alimento registrado
        </p>
      ) : (
        <div className="space-y-2">
          {foods.map(food => (
            <FoodItem key={food.id} food={food} onDelete={onDeleteFood} />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== ADD FOOD DIALOG =====
function AddFoodDialog({ 
  isOpen, 
  onClose, 
  mealType,
  onAdd,
  onAnalyze,
  isAnalyzing 
}: { 
  isOpen: boolean;
  onClose: () => void;
  mealType: MealType | null;
  onAdd: (food: any) => void;
  onAnalyze: (description: string) => Promise<any>;
  isAnalyzing: boolean;
}) {
  const [description, setDescription] = useState('');
  const [analyzedFood, setAnalyzedFood] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription('');
      setAnalyzedFood(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleAnalyze = async () => {
    if (!description.trim()) return;
    try {
      const result = await onAnalyze(description);
      setAnalyzedFood(result);
    } catch (error) {
      console.error('Error analyzing food:', error);
    }
  };

  const handleAdd = () => {
    if (!analyzedFood || !mealType) return;
    onAdd({
      food_name: analyzedFood.food_name,
      calories: analyzedFood.calories,
      protein: analyzedFood.protein,
      carbs: analyzedFood.carbs,
      fat: analyzedFood.fat,
      serving_size: analyzedFood.serving_size,
      meal_type: mealType,
      logged_at: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !analyzedFood) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  if (!mealType) return null;
  const config = MEAL_CONFIG[mealType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <config.icon className={cn("size-5", config.color)} />
            Adicionar ao {config.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="O que você comeu? (ex: 3 ovos cozidos e uma banana)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-white/5 border-white/10 focus:border-white/20 pr-20"
              disabled={isAnalyzing}
            />
            <Button
              size="sm"
              className="absolute right-1 top-1 h-7 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
              onClick={handleAnalyze}
              disabled={!description.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <Sparkles className="size-3 mr-1" />
                  IA
                </>
              )}
            </Button>
          </div>

          {analyzedFood && (
            <div className={cn(
              "p-4 rounded-xl",
              "bg-gradient-to-br from-emerald-500/10 to-teal-500/10",
              "border border-emerald-500/20",
              "animate-in fade-in slide-in-from-bottom-2 duration-300"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-emerald-400" />
                <span className="text-sm font-medium">Análise da IA</span>
              </div>
              <p className="text-sm mb-3">{analyzedFood.food_name}</p>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold font-mono text-amber-400">
                    {analyzedFood.calories}
                  </p>
                  <p className="text-[10px] text-muted-foreground">kcal</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold font-mono text-blue-400">
                    {analyzedFood.protein}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Proteína</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold font-mono text-yellow-400">
                    {analyzedFood.carbs}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Carbs</p>
                </div>
                <div className="p-2 rounded-lg bg-white/5">
                  <p className="text-lg font-bold font-mono text-red-400">
                    {analyzedFood.fat}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Gordura</p>
                </div>
              </div>
              {analyzedFood.serving_size && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Porção: {analyzedFood.serving_size}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button 
            onClick={handleAdd} 
            disabled={!analyzedFood}
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
          >
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ===== PROFILE SETTINGS SHEET =====
function ProfileSettingsSheet({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean;
  onClose: () => void;
}) {
  const { profile, updateProfile, isUpdating } = useNutritionProfile();
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    age: '',
    gender: 'male' as 'male' | 'female' | 'other',
    activity_level: 'moderate' as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goal: 'maintain' as 'lose' | 'maintain' | 'gain',
    daily_calories_target: '2000',
    protein_target: '150',
    carbs_target: '250',
    fat_target: '65',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight?.toString() || '',
        height: profile.height?.toString() || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || 'male',
        activity_level: profile.activity_level || 'moderate',
        goal: profile.goal || 'maintain',
        daily_calories_target: profile.daily_calories_target?.toString() || '2000',
        protein_target: profile.protein_target?.toString() || '150',
        carbs_target: profile.carbs_target?.toString() || '250',
        fat_target: profile.fat_target?.toString() || '65',
      });
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile({
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      age: formData.age ? parseInt(formData.age) : null,
      gender: formData.gender,
      activity_level: formData.activity_level,
      goal: formData.goal,
      daily_calories_target: parseInt(formData.daily_calories_target) || 2000,
      protein_target: parseInt(formData.protein_target) || 150,
      carbs_target: parseInt(formData.carbs_target) || 250,
      fat_target: parseInt(formData.fat_target) || 65,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-background/95 backdrop-blur-xl border-white/10 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="size-5" />
            Perfil Nutricional
          </SheetTitle>
          <SheetDescription>
            Configure suas metas e informações pessoais
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Personal Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Informações Pessoais</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Peso (kg)</label>
                <Input
                  type="number"
                  value={formData.weight}
                  onChange={e => setFormData(f => ({ ...f, weight: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Altura (cm)</label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={e => setFormData(f => ({ ...f, height: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10"
                  placeholder="175"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Idade</label>
                <Input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData(f => ({ ...f, age: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Gênero</label>
                <Select value={formData.gender} onValueChange={v => setFormData(f => ({ ...f, gender: v as any }))}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Activity & Goal */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Atividade & Objetivo</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Nível de Atividade</label>
                <Select value={formData.activity_level} onValueChange={v => setFormData(f => ({ ...f, activity_level: v as any }))}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentário</SelectItem>
                    <SelectItem value="light">Leve</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="very_active">Muito Ativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Objetivo</label>
                <Select value={formData.goal} onValueChange={v => setFormData(f => ({ ...f, goal: v as any }))}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lose">Perder Peso</SelectItem>
                    <SelectItem value="maintain">Manter Peso</SelectItem>
                    <SelectItem value="gain">Ganhar Massa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Metas Diárias</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Flame className="size-3 text-amber-400" /> Calorias
                </label>
                <Input
                  type="number"
                  value={formData.daily_calories_target}
                  onChange={e => setFormData(f => ({ ...f, daily_calories_target: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 font-mono"
                  placeholder="2000"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Beef className="size-3 text-blue-400" /> Proteína (g)
                </label>
                <Input
                  type="number"
                  value={formData.protein_target}
                  onChange={e => setFormData(f => ({ ...f, protein_target: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 font-mono"
                  placeholder="150"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wheat className="size-3 text-yellow-400" /> Carboidratos (g)
                </label>
                <Input
                  type="number"
                  value={formData.carbs_target}
                  onChange={e => setFormData(f => ({ ...f, carbs_target: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 font-mono"
                  placeholder="250"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Droplets className="size-3 text-red-400" /> Gordura (g)
                </label>
                <Input
                  type="number"
                  value={formData.fat_target}
                  onChange={e => setFormData(f => ({ ...f, fat_target: e.target.value }))}
                  className="mt-1 bg-white/5 border-white/10 font-mono"
                  placeholder="65"
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isUpdating}
            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
          >
            {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Salvar Configurações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


// ===== MEAL PLAN CARD =====
function MealPlanCard({ 
  plan, 
  onView,
  onArchive,
  onDelete 
}: { 
  plan: Database['public']['Tables']['meal_plans']['Row'];
  onView: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const planJson = plan.plan_json as MealPlanJson;

  return (
    <div className={cn(
      "group p-4 rounded-2xl",
      "bg-white/5 border border-white/10",
      "hover:bg-white/8 hover:border-white/20",
      "transition-all duration-300"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-sm">{plan.title}</h3>
          <p className="text-xs text-muted-foreground">
            {format(new Date(plan.generated_at), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onArchive}
            className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Archive className="size-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-sm font-bold font-mono text-amber-400">
            {planJson?.summary?.avgCalories || plan.daily_avg_calories || '-'}
          </p>
          <p className="text-[10px] text-muted-foreground">kcal/dia</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-sm font-bold font-mono text-blue-400">
            {planJson?.summary?.avgProtein || '-'}g
          </p>
          <p className="text-[10px] text-muted-foreground">Proteína</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-sm font-bold font-mono text-yellow-400">
            {planJson?.summary?.avgCarbs || '-'}g
          </p>
          <p className="text-[10px] text-muted-foreground">Carbs</p>
        </div>
        <div className="p-2 rounded-lg bg-white/5">
          <p className="text-sm font-bold font-mono text-red-400">
            {planJson?.summary?.avgFat || '-'}g
          </p>
          <p className="text-[10px] text-muted-foreground">Gordura</p>
        </div>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full h-8 text-xs hover:bg-white/10"
        onClick={onView}
      >
        <FileText className="size-3 mr-1" />
        Ver Plano Completo
      </Button>
    </div>
  );
}

// ===== MEAL PLAN DETAIL SHEET =====
function MealPlanDetailSheet({ 
  plan, 
  isOpen, 
  onClose 
}: { 
  plan: Database['public']['Tables']['meal_plans']['Row'] | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState(0);

  if (!plan) return null;

  const planJson = plan.plan_json as MealPlanJson;
  const days = planJson?.days || [];
  const currentDay = days[selectedDay];

  const handleExportPDF = () => {
    // Simple text export for now
    const content = days.map(day => {
      let text = `\n=== ${day.dayName} ===\n`;
      Object.entries(day.meals).forEach(([mealType, meals]) => {
        text += `\n${MEAL_CONFIG[mealType as MealType]?.label || mealType}:\n`;
        (meals as any[]).forEach(meal => {
          text += `  - ${meal.name} (${meal.portion}): ${meal.calories} kcal\n`;
        });
      });
      text += `\nTotal: ${day.totals.calories} kcal | P: ${day.totals.protein}g | C: ${day.totals.carbs}g | G: ${day.totals.fat}g\n`;
      return text;
    }).join('\n');

    const blob = new Blob([`${plan.title}\n${content}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl bg-background/95 backdrop-blur-xl border-white/10 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{plan.title}</SheetTitle>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs border-white/10"
              onClick={handleExportPDF}
            >
              <Download className="size-3 mr-1" />
              Exportar
            </Button>
          </div>
          <SheetDescription>
            Plano de {plan.total_days} dias • ~{plan.daily_avg_calories} kcal/dia
          </SheetDescription>
        </SheetHeader>

        {/* Day Selector */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                selectedDay === i
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
              )}
            >
              {day.dayName}
            </button>
          ))}
        </div>

        {/* Day Content */}
        {currentDay && (
          <div className="mt-6 space-y-4">
            {/* Day Totals */}
            <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-amber-400">{currentDay.totals.calories}</p>
                <p className="text-[10px] text-muted-foreground">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-blue-400">{currentDay.totals.protein}g</p>
                <p className="text-[10px] text-muted-foreground">Proteína</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-yellow-400">{currentDay.totals.carbs}g</p>
                <p className="text-[10px] text-muted-foreground">Carbs</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-red-400">{currentDay.totals.fat}g</p>
                <p className="text-[10px] text-muted-foreground">Gordura</p>
              </div>
            </div>

            {/* Meals */}
            {(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map(mealType => {
              const meals = currentDay.meals[mealType] || [];
              if (meals.length === 0) return null;
              const config = MEAL_CONFIG[mealType === 'snacks' ? 'snack' : mealType];
              const Icon = config.icon;

              return (
                <div key={mealType} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={cn("size-4", config.color)} />
                    <span className="font-medium text-sm">{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {meals.map((meal, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                        <div>
                          <p className="text-sm">{meal.name}</p>
                          <p className="text-[10px] text-muted-foreground">{meal.portion}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono text-amber-400">{meal.calories} kcal</p>
                          <p className="text-[10px] text-muted-foreground">
                            P:{meal.protein}g C:{meal.carbs}g G:{meal.fat}g
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}


// ===== MAIN PAGE COMPONENT =====
export default function NutritionPage() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'diary' | 'plans'>('diary');
  const [addFoodMealType, setAddFoodMealType] = useState<MealType | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Database['public']['Tables']['meal_plans']['Row'] | null>(null);

  const { profile } = useNutritionProfile();
  const { summary, isLoading, addFoodAsync, deleteFood, analyzeFood, isAdding, isAnalyzing } = useDailyNutrition(selectedDate);
  const { weeklyData } = useWeeklyNutrition(selectedDate);
  const { plans, generatePlan, archivePlan, deletePlan, isGenerating } = useMealPlans();

  const targets = {
    calories: profile?.daily_calories_target || 2000,
    protein: profile?.protein_target || 150,
    carbs: profile?.carbs_target || 250,
    fat: profile?.fat_target || 65,
  };

  const consumed = {
    calories: summary?.totalCalories || 0,
    protein: summary?.totalProtein || 0,
    carbs: summary?.totalCarbs || 0,
    fat: summary?.totalFat || 0,
  };

  const handlePrevDay = () => {
    const prev = subDays(new Date(selectedDate), 1);
    setSelectedDate(prev.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const next = addDays(new Date(selectedDate), 1);
    setSelectedDate(next.toISOString().split('T')[0]);
  };

  const handleAddFood = async (food: any) => {
    try {
      await addFoodAsync(food);
      toast({ title: 'Alimento adicionado!' });
    } catch (error) {
      toast({ title: 'Erro ao adicionar', variant: 'destructive' });
    }
  };

  const handleDeleteFood = (id: number) => {
    deleteFood(id, {
      onSuccess: () => toast({ title: 'Alimento removido' }),
    });
  };

  const handleGeneratePlan = () => {
    generatePlan(undefined, {
      onSuccess: () => toast({ title: 'Plano gerado com sucesso!' }),
      onError: () => toast({ title: 'Erro ao gerar plano', variant: 'destructive' }),
    });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FloatingHeader 
        title="Nutrição"
        subtitle="Controle sua alimentação com IA"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-white/10 hover:bg-white/5"
            onClick={() => setIsProfileOpen(true)}
          >
            <Target className="size-4 mr-2" />
            <span className="hidden sm:inline">Metas</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6">
        {/* Dashboard Section - Fixed on mobile */}
        <div className={cn(
        "p-4 md:p-6 rounded-2xl",
        "bg-white/5 border border-white/10",
        "backdrop-blur-md",
        isMobile && "sticky top-0 z-10"
      )}>
        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="text-center">
            <p className="font-medium">
              {isToday ? 'Hoje' : format(new Date(selectedDate), "EEEE", { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(selectedDate), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Rings Section */}
        <div className={cn(
          "flex items-center justify-center gap-6 md:gap-12",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Main Calorie Ring */}
          <CalorieRing
            consumed={consumed.calories}
            target={targets.calories}
            size={isMobile ? 160 : 180}
          />

          {/* Macro Rings */}
          <div className="flex gap-4 md:gap-6">
            <MacroRing
              value={consumed.protein}
              target={targets.protein}
              label="Proteína"
              color="#3b82f6"
              size={isMobile ? 56 : 64}
            />
            <MacroRing
              value={consumed.carbs}
              target={targets.carbs}
              label="Carbs"
              color="#eab308"
              size={isMobile ? 56 : 64}
            />
            <MacroRing
              value={consumed.fat}
              target={targets.fat}
              label="Gordura"
              color="#ef4444"
              size={isMobile ? 56 : 64}
            />
          </div>
        </div>

        {/* Weekly Chart */}
        {weeklyData && weeklyData.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="size-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
            </div>
            <WeeklyChart data={weeklyData} />
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="diary" className="data-[state=active]:bg-white/10">
            <Calendar className="size-4 mr-2" />
            Diário
          </TabsTrigger>
          <TabsTrigger value="plans" className="data-[state=active]:bg-white/10">
            <Sparkles className="size-4 mr-2" />
            Planos IA
          </TabsTrigger>
        </TabsList>

        {/* Diary Tab */}
        <TabsContent value="diary" className="mt-4">
          <div className={cn(
            "grid gap-4",
            isMobile ? "grid-cols-1" : "grid-cols-2"
          )}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map(type => (
              <MealSection
                key={type}
                type={type}
                foods={summary?.meals[type] || []}
                onAddFood={setAddFoodMealType}
                onDeleteFood={handleDeleteFood}
                isAdding={isAdding}
              />
            ))}
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-4">
          <div className="space-y-4">
            {/* Generate Button */}
            <div className={cn(
              "p-6 rounded-2xl text-center",
              "bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
              "border border-emerald-500/20"
            )}>
              <Sparkles className="size-8 mx-auto mb-3 text-emerald-400" />
              <h3 className="font-medium mb-1">Gerar Plano com IA</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Crie um plano alimentar personalizado de 7 dias baseado nas suas metas
              </p>
              <Button
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    Gerar Plano
                  </>
                )}
              </Button>
            </div>

            {/* Plans List */}
            {plans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="size-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum plano gerado ainda</p>
              </div>
            ) : (
              <div className={cn(
                "grid gap-4",
                isMobile ? "grid-cols-1" : "grid-cols-2"
              )}>
                {plans.filter(p => p.status === 'active').map(plan => (
                  <MealPlanCard
                    key={plan.id}
                    plan={plan}
                    onView={() => setSelectedPlan(plan)}
                    onArchive={() => archivePlan(plan.id)}
                    onDelete={() => deletePlan(plan.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Mobile FAB */}
      {isMobile && activeTab === 'diary' && (
        <button
          onClick={() => setAddFoodMealType('snack')}
          className="fixed bottom-6 right-6 p-4 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all z-50"
        >
          <Plus className="size-6" />
        </button>
      )}

      {/* Dialogs & Sheets */}
      <AddFoodDialog
        isOpen={!!addFoodMealType}
        onClose={() => setAddFoodMealType(null)}
        mealType={addFoodMealType}
        onAdd={handleAddFood}
        onAnalyze={analyzeFood}
        isAnalyzing={isAnalyzing}
      />

      <ProfileSettingsSheet
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <MealPlanDetailSheet
        plan={selectedPlan}
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
      />
      </div>
    </div>
  );
}
