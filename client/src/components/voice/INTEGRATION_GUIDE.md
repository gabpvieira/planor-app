# Guia de Integração - ListeningOrb

## ✅ Configuração Completa

O componente ListeningOrb foi integrado com sucesso no CommandCenterPage!

## 📁 Arquivos Criados

```
client/src/components/voice/
├── ListeningOrb.tsx          # Componente principal
├── ListeningOrbDemo.tsx      # Página de demonstração
├── README.md                 # Documentação completa
└── INTEGRATION_GUIDE.md      # Este arquivo
```

## 🎯 Como Usar

### No CommandCenterPage (já integrado)

O orbe já está funcionando na página `/command-center`:

```tsx
<ListeningOrb 
  isListening={isListening}      // Quando o microfone está ativo
  isProcessing={isProcessing}    // Quando está processando o comando
  size="lg"                      // Tamanho grande
/>
```

### Estados Visuais

1. **Inativo** (padrão)
   - Orbe azul suave, sem animações
   - Opacidade reduzida

2. **Ouvindo** (`isListening={true}`)
   - Pulsação orgânica em múltiplas camadas
   - Ondas sonoras emanando do centro
   - Cor azul intensa (blue-500 → cyan-400)

3. **Processando** (`isProcessing={true}`)
   - Rotação lenta (8 segundos)
   - Cor roxa/púrpura (purple-600 → purple-400)
   - Sem ondas sonoras

## 🧪 Testar o Componente

### Opção 1: Usar a página demo

Crie uma rota temporária para testar:

```tsx
// Em App.tsx ou router
import ListeningOrbDemo from '@/components/voice/ListeningOrbDemo';

<Route path="/orb-demo" element={<ListeningOrbDemo />} />
```

### Opção 2: Testar no CommandCenter

1. Acesse `/command-center`
2. Clique no orbe para ativar o microfone
3. Observe as animações de "ouvindo"
4. Fale um comando para ver o estado "processando"

## 🎨 Personalização

### Mudar Tamanho

```tsx
<ListeningOrb size="sm" />  // 128px
<ListeningOrb size="md" />  // 192px (padrão)
<ListeningOrb size="lg" />  // 256px
```

### Mudar Cores

Edite o arquivo `ListeningOrb.tsx` e ajuste os gradientes:

```tsx
// Estado Ouvindo (Azul)
background: 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, ...)'

// Estado Processando (Roxo)
background: 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, ...)'
```

### Ajustar Velocidade das Animações

```tsx
transition={{
  duration: 4,  // Altere este valor (em segundos)
  repeat: Infinity,
  repeatType: 'mirror'
}}
```

## 🔧 Troubleshooting

### O orbe não aparece
- Verifique se o Framer Motion está instalado: `npm install framer-motion`
- Confirme que o Tailwind CSS está configurado

### Animações não funcionam
- Certifique-se de que `isListening` ou `isProcessing` estão mudando de estado
- Verifique o console do navegador por erros

### Cores não aparecem corretamente
- Confirme que o tema escuro está ativo
- Ajuste o `filter: contrast()` no container pai

## 📱 Responsividade

O componente é totalmente responsivo:

- Desktop: Tamanho `lg` (256px)
- Tablet: Tamanho `md` (192px)
- Mobile: Tamanho `sm` (128px) + botão alternativo

## 🚀 Próximos Passos

1. Testar em diferentes navegadores
2. Ajustar cores conforme o design system do Planor
3. Adicionar sons de feedback (opcional)
4. Implementar haptic feedback em mobile (opcional)

## 💡 Dicas

- O efeito "gooey" funciona melhor com `blur` + `contrast`
- Use `backdrop-blur` no fundo para melhor contraste
- Mantenha o fundo escuro para o efeito de néon
- As animações são otimizadas para performance (GPU-accelerated)

## 📞 Suporte

Se precisar de ajustes ou tiver dúvidas, consulte:
- `README.md` - Documentação completa
- `ListeningOrbDemo.tsx` - Exemplos de uso
- `ListeningOrb.tsx` - Código fonte comentado
