import React, { useState, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';
import {
  FileText, Loader2, Sparkles, Trash2, Check, Bot
} from 'lucide-react';
import { FINANCE_CATEGORIES } from '@/types/finance.types';

interface AITransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
}

interface StatementImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountId?: string | null;
}

const categoryOptions = Object.entries(FINANCE_CATEGORIES).map(([slug, data]) => ({
  value: slug,
  label: data.label,
}));

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function StatementImport({ open, onOpenChange, accountId }: StatementImportProps) {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<'upload' | 'processing' | 'review'>('upload');
  const [transactions, setTransactions] = useState<AITransaction[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fileName, setFileName] = useState('');

  const resetState = useCallback(() => {
    setStep('upload');
    setTransactions([]);
    setIsDragging(false);
    setIsSaving(false);
    setFileName('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onOpenChange(false);
  }, [onOpenChange, resetState]);

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setStep('processing');

    try {
      let payload: { text?: string; imageBase64?: string; pdfBase64?: string; mimeType?: string } = {};

      // Process based on file type
      if (file.type === 'application/pdf') {
        const base64 = await fileToBase64(file);
        // Remove the data:application/pdf;base64, prefix
        payload = { pdfBase64: base64.split(',')[1], mimeType: file.type };
      } else if (file.type === 'text/csv' || file.type === 'text/plain') {
        const text = await file.text();
        payload = { text };
      } else if (file.type.startsWith('image/')) {
        const base64 = await fileToBase64(file);
        payload = { imageBase64: base64.split(',')[1], mimeType: file.type };
      }

      const { data, error } = await supabase.functions.invoke('process-statement', {
        body: payload,
      });

      if (error) throw error;
      if (!data.transactions?.length) {
        throw new Error('Nenhuma transação encontrada no extrato');
      }

      setTransactions(data.transactions);
      setStep('review');
    } catch (error: any) {
      toast({
        title: 'Erro ao importar',
        description: error.message || 'Não foi possível processar o extrato',
        variant: 'destructive',
      });
      setStep('upload');
    }
  }, [toast]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const removeTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const updateTransaction = (index: number, field: keyof AITransaction, value: string | number) => {
    setTransactions(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleConfirm = async () => {
    if (!user?.id || transactions.length === 0) return;
    setIsSaving(true);

    try {
      const rows = transactions.map(t => ({
        user_id: user.id,
        type: t.type,
        amount: Math.abs(t.amount),
        category: t.category,
        description: `${t.description} ✨`,
        date: t.date,
        account_id: accountId || null,
        card_id: null,
        installments_total: 1,
        installment_current: 1,
        parent_transaction_id: null,
        is_subscription: false,
        is_transfer: false,
        transfer_to_account_id: null,
        recurring_bill_id: null,
        paid: true,
        due_date: null,
      }));

      const { error } = await supabase.from('finance_transactions').insert(rows as any);
      if (error) throw error;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['finance-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] });

      toast({
        title: 'Extrato importado',
        description: `${transactions.length} transações adicionadas com sucesso`,
      });
      handleClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar as transações',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" />
            Importar Extrato com IA
          </DialogTitle>
        </DialogHeader>

        {/* Upload Step */}
        {step === 'upload' && (
          <div className="p-6">
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                transition-all duration-200
                ${isDragging
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-border/60 hover:border-primary/50 hover:bg-muted/30'
                }
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.csv,.txt,.png,.jpg,.jpeg,.webp"
                onChange={handleFileSelect}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <FileText className="size-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Arraste seu extrato aqui ou clique para buscar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, CSV ou Imagem (PNG, JPG) — máx. 10MB
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="p-12 flex flex-col items-center gap-4">
            <div className="relative">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="size-8 text-primary animate-pulse" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <Loader2 className="size-3 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Analisando extrato com IA...</p>
              <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === 'review' && (
          <>
            <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-3 text-xs">
              <Badge variant="outline" className="gap-1">
                <Bot className="size-3" /> {transactions.length} transações
              </Badge>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                ↑ {formatCurrency(totalIncome)}
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                ↓ {formatCurrency(totalExpense)}
              </Badge>
            </div>

            <ScrollArea className="flex-1 max-h-[50vh]">
              <div className="px-6 pb-4 space-y-2">
                {transactions.map((t, i) => (
                  <div
                    key={i}
                    className="group flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border/40 bg-card hover:bg-muted/30 transition-colors"
                  >
                    {/* Date */}
                    <Input
                      type="date"
                      value={t.date}
                      onChange={(e) => updateTransaction(i, 'date', e.target.value)}
                      className="h-8 text-xs w-full sm:w-[120px] shrink-0"
                    />

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <Input
                        value={t.description}
                        onChange={(e) => updateTransaction(i, 'description', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>

                    {/* Category */}
                    <Select
                      value={t.category}
                      onValueChange={(v) => updateTransaction(i, 'category', v)}
                    >
                      <SelectTrigger className="h-8 text-xs w-full sm:w-[140px] shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(c => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Amount */}
                    <span className={`text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(t.amount))}
                    </span>

                    {/* AI Badge + Delete */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 gap-0.5">
                        <Sparkles className="size-2.5" /> IA
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={() => removeTransaction(i)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter className="p-4 border-t border-border/40 flex-row gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
                Cancelar
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isSaving || transactions.length === 0}
                className="flex-1 sm:flex-none gap-2"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Confirmar {transactions.length} Lançamentos
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
