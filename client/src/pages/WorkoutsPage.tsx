import { useState } from 'react';
import { useSupabaseWorkouts } from '@/hooks/use-supabase-workouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Dumbbell, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toBrasiliaISOString } from '@shared/utils/timezone';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { FloatingHeader } from '@/components/FloatingHeader';

type ExerciseInput = {
  exercise_name: string;
  sets: number;
  reps: number | null;
  weight: string | null;
};

export default function WorkoutsPage() {
  const { workouts, isLoading, toggleComplete, createWorkout, deleteWorkout, isCreating } = useSupabaseWorkouts();
  const { toast } = useToast();
  const [selectedWorkout, setSelectedWorkout] = useState<number | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { exercise_name: '', sets: 3, reps: 10, weight: null }
  ]);

  const handleAddExercise = () => {
    setExercises([...exercises, { exercise_name: '', sets: 3, reps: 10, weight: null }]);
  };

  const handleExerciseChange = (index: number, field: keyof ExerciseInput, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    const validExercises = exercises.filter(ex => ex.exercise_name.trim());
    
    createWorkout({
      workout: {
        title,
        description: description || null,
        date: toBrasiliaISOString(),
        completed: false,
      },
      exercises: validExercises,
    }, {
      onSuccess: () => {
        toast({ title: "Treino criado", description: "Bom treino!" });
        setTitle('');
        setDescription('');
        setExercises([{ exercise_name: '', sets: 3, reps: 10, weight: null }]);
        setIsCreateOpen(false);
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao criar treino", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FloatingHeader 
        title="Treinos"
        subtitle="Gerencie seus treinos e exercícios"
        actions={
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4 mr-2" />
            <span className="hidden sm:inline">Novo Treino</span>
          </Button>
        }
      />

      <div className="px-4 sm:px-6">
        {workouts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum treino cadastrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece criando seu primeiro treino
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="size-4 mr-2" />
                Criar Treino
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout) => (
              <Card
                key={workout.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedWorkout === workout.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedWorkout(workout.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workout.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {format(new Date(workout.date), "d 'de' MMMM, yyyy", {
                          locale: ptBR,
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant={workout.completed ? 'default' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleComplete({
                          id: workout.id,
                          completed: !workout.completed,
                        });
                      }}
                    >
                      {workout.completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Circle className="size-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {workout.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {workout.description}
                    </p>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Exercícios</span>
                      <Badge variant="secondary">
                        {workout.workout_exercises.length}
                      </Badge>
                    </div>
                    {workout.workout_exercises.length > 0 && (
                      <div className="space-y-1 pt-2 border-t">
                        {workout.workout_exercises.slice(0, 3).map((exercise) => (
                          <div
                            key={exercise.id}
                            className="text-xs text-muted-foreground flex items-center justify-between"
                          >
                            <span>{exercise.exercise_name}</span>
                            <span>
                              {exercise.sets}x{exercise.reps || '—'}
                            </span>
                          </div>
                        ))}
                        {workout.workout_exercises.length > 3 && (
                          <p className="text-xs text-muted-foreground italic">
                            +{workout.workout_exercises.length - 3} exercícios
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Workout Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Treino</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Treino</label>
              <Input 
                placeholder="Ex: Treino A - Peito e Tríceps" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição (opcional)</label>
              <Textarea 
                placeholder="Detalhes do treino..." 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Exercícios</label>
              <div className="space-y-3">
                {exercises.map((ex, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Nome do exercício"
                        value={ex.exercise_name}
                        onChange={e => handleExerciseChange(index, 'exercise_name', e.target.value)}
                        className="flex-1"
                      />
                      {exercises.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleRemoveExercise(index)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground">Séries</label>
                        <Input 
                          type="number"
                          min="1"
                          value={ex.sets}
                          onChange={e => handleExerciseChange(index, 'sets', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Reps</label>
                        <Input 
                          type="number"
                          min="1"
                          value={ex.reps || ''}
                          onChange={e => handleExerciseChange(index, 'reps', parseInt(e.target.value) || null)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Peso</label>
                        <Input 
                          placeholder="Ex: 20kg"
                          value={ex.weight || ''}
                          onChange={e => handleExerciseChange(index, 'weight', e.target.value || null)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddExercise}>
                  <Plus className="size-4 mr-1" /> Adicionar Exercício
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Criando..." : "Criar Treino"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
