# 🧪 Teste Rápido - Supabase Integrado

## ✅ Status: Servidor Rodando na Porta 5000

---

## 🚀 Acesso Rápido

### Aplicação Principal
```
http://localhost:5000
```

### Novas Páginas Supabase

1. **Hábitos**
   ```
   http://localhost:5000/app/habits
   ```
   - Criar hábitos diários/semanais
   - Marcar execução
   - Ver progresso

2. **Treinos**
   ```
   http://localhost:5000/app/workouts
   ```
   - Criar treinos
   - Adicionar exercícios
   - Marcar como concluído

3. **Finanças**
   ```
   http://localhost:5000/app/finance
   ```
   - Adicionar receitas/despesas
   - Ver resumo financeiro
   - Histórico de transações

4. **Metas**
   ```
   http://localhost:5000/app/goals
   ```
   - Criar metas anuais
   - Adicionar objetivos
   - Acompanhar progresso

---

## 🔐 Login

Use as credenciais de desenvolvimento:
- **Email**: `dev@teste.com`
- **Senha**: `123456`

---

## 🧪 Roteiro de Teste

### 1. Teste de Hábitos

1. Acesse `/app/habits`
2. Clique em "Novo Hábito"
3. Preencha:
   - Título: "Meditar"
   - Frequência: Diário
   - Meta: 1x
4. Salve
5. Clique em "Marcar Hoje"
6. Verifique se o progresso foi atualizado

### 2. Teste de Treinos

1. Acesse `/app/workouts`
2. Clique em "Novo Treino"
3. Preencha:
   - Título: "Treino A"
   - Data: Hoje
   - Adicione exercícios:
     - Supino: 4x12
     - Tríceps: 3x15
4. Salve
5. Marque como concluído

### 3. Teste de Finanças

1. Acesse `/app/finance`
2. Clique em "Nova Transação"
3. Adicione uma receita:
   - Tipo: Receita
   - Valor: R$ 5000
   - Categoria: Salário
4. Adicione uma despesa:
   - Tipo: Despesa
   - Valor: R$ 1500
   - Categoria: Aluguel
5. Verifique o resumo (Saldo = R$ 3500)

### 4. Teste de Metas

1. Acesse `/app/goals`
2. Clique em "Nova Meta"
3. Preencha:
   - Título: "Aprender TypeScript"
   - Ano: 2026
   - Objetivos:
     - Completar curso
     - Fazer 3 projetos
     - Contribuir em open source
4. Salve
5. Marque um objetivo como concluído
6. Verifique o progresso

---

## 🔍 Verificações Técnicas

### Console do Navegador (F12)

Abra o DevTools e verifique:

1. **Sem erros de Supabase**
   - Não deve haver erros de "supabaseUrl is required"
   - Não deve haver erros de autenticação

2. **Network Tab**
   - Verifique as requisições para Supabase
   - Devem retornar 200 OK

3. **Console**
   ```javascript
   // Verificar variáveis de ambiente
   console.log(import.meta.env.VITE_SUPABASE_URL);
   // Deve mostrar: https://qchuggfaogrkyurktwxg.supabase.co
   ```

### Verificar Dados no Supabase

1. Acesse o painel: https://supabase.com/dashboard/project/qchuggfaogrkyurktwxg/editor
2. Selecione uma tabela (ex: habits)
3. Verifique se os dados criados aparecem

---

## ✅ Checklist de Funcionalidades

### Hábitos
- [ ] Criar hábito
- [ ] Listar hábitos
- [ ] Marcar execução
- [ ] Ver progresso
- [ ] Deletar hábito

### Treinos
- [ ] Criar treino
- [ ] Adicionar exercícios
- [ ] Listar treinos
- [ ] Marcar como concluído
- [ ] Deletar treino

### Finanças
- [ ] Adicionar receita
- [ ] Adicionar despesa
- [ ] Ver resumo (receitas, despesas, saldo)
- [ ] Listar transações
- [ ] Deletar transação

### Metas
- [ ] Criar meta
- [ ] Adicionar objetivos
- [ ] Marcar objetivo como concluído
- [ ] Ver progresso
- [ ] Deletar meta

---

## 🐛 Problemas Comuns

### "Nenhum dado aparece"
- Verifique se está logado
- Verifique o console por erros
- Confirme que o Supabase está acessível

### "Erro ao criar"
- Verifique se todos os campos obrigatórios estão preenchidos
- Veja o console para detalhes do erro
- Confirme que o RLS está configurado corretamente

### "Dados de outro usuário aparecem"
- Isso NÃO deve acontecer (RLS deve bloquear)
- Se acontecer, há um problema de segurança

---

## 📊 Dados de Teste Sugeridos

### Hábitos
- Meditar (diário, 1x)
- Ler (diário, 30min)
- Academia (semanal, 3x)
- Beber água (diário, 8x)

### Treinos
- Treino A: Peito e Tríceps
- Treino B: Costas e Bíceps
- Treino C: Pernas e Ombros

### Finanças
- Receitas: Salário, Freelance, Investimentos
- Despesas: Aluguel, Alimentação, Transporte, Lazer

### Metas 2026
- Aprender TypeScript
- Ler 12 livros
- Economizar R$ 10.000
- Fazer 50 treinos

---

## 🎯 Resultado Esperado

Após os testes, você deve ter:

✅ Dados criados em todas as tabelas
✅ UI responsiva e funcional
✅ Operações CRUD funcionando
✅ Dados isolados por usuário (RLS)
✅ Feedback visual claro
✅ Sem erros no console

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique `SUPABASE_STATUS.md` para troubleshooting
2. Consulte `SUPABASE_INTEGRATION.md` para documentação detalhada
3. Revise `FINAL_CHECKLIST.md` para status da integração

---

## 🎉 Sucesso!

Se todos os testes passaram, a integração Supabase está **100% funcional**!

Você agora tem um sistema completo de gerenciamento pessoal com:
- Backend robusto (Supabase)
- Frontend moderno (React + TypeScript)
- Autenticação segura
- CRUD completo
- UI elegante

**Parabéns! O Planor está pronto para uso! 🚀**
