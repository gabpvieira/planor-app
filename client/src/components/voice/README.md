# ListeningOrb Component

Componente visual premium e orgânico que representa a IA "ouvindo" no Command Center do Planor.

## Características

### Visual
- **Núcleo Azul Profundo**: Gradiente radial de blue-500 → cyan-400
- **Efeito de Camadas**: 4 camadas concêntricas com opacidades decrescentes
- **Efeito Gooey/Metaball**: Usando blur e contrast para criar fusão líquida
- **Modo Escuro**: Brilho intenso contra fundo escuro (néon líquido)

### Animações (Framer Motion)
- **Estado Ouvindo** (`isListening={true}`):
  - Pulsação orgânica com ritmos diferentes por camada
  - Ondas sonoras (ripples) emanando do centro
  
- **Estado Processando** (`isProcessing={true}`):
  - Rotação lenta (8s)
  - Mudança de cor para roxo/púrpura

- **Estado Inativo**: Opacidade reduzida, sem animações

## Props

```typescript
interface ListeningOrbProps {
  isListening?: boolean;    // Ativa pulsação e ondas sonoras
  isProcessing?: boolean;   // Muda cor para roxo e adiciona rotação
  size?: 'sm' | 'md' | 'lg'; // Tamanho do orbe (padrão: 'md')
}
```

## Uso

### Básico
```tsx
import ListeningOrb from '@/components/voice/ListeningOrb';

<ListeningOrb isListening={isRecording} />
```

### Com todos os estados
```tsx
<ListeningOrb 
  isListening={isRecording} 
  isProcessing={isProcessing}
  size="lg"
/>
```

### No CommandCenterPage
```tsx
<div 
  className="cursor-pointer"
  onClick={isListening ? stopListening : startListening}
>
  <ListeningOrb 
    isListening={isListening} 
    isProcessing={isProcessing}
    size="lg"
  />
</div>
```

## Demo

Para testar o componente isoladamente:

```tsx
import ListeningOrbDemo from '@/components/voice/ListeningOrbDemo';

// Use em uma rota de teste
<ListeningOrbDemo />
```

## Tamanhos

- `sm`: 128px (w-32 h-32)
- `md`: 192px (w-48 h-48) - padrão
- `lg`: 256px (w-64 h-64)

## Tecnologias

- React
- Framer Motion (animações)
- Tailwind CSS (estilos)

## Estrutura de Camadas

1. **Camada Externa** (Aura): Blur 20px, animação 4s
2. **Camada Média** (Glow): Blur 15px, animação 3s
3. **Camada Interna** (Núcleo): Blur 10px, animação 2s
4. **Núcleo Central** (Ponto Focal): Blur 5px, animação 1.5s
5. **Ondas Sonoras** (Ripples): Apenas quando `isListening={true}`
6. **Reflexo** (Fundo): Efeito de profundidade

## Cores

### Estado Ouvindo (Azul)
- `blue-500` → `cyan-400` (gradiente)
- `blue-400` (ondas sonoras)

### Estado Processando (Roxo)
- `purple-600` → `purple-400` (gradiente)
- Transição suave entre estados
