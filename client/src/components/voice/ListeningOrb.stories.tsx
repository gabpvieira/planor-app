/**
 * Storybook stories para o ListeningOrb
 * Use este arquivo se estiver usando Storybook no projeto
 */

import ListeningOrb from './ListeningOrb';

export default {
  title: 'Voice/ListeningOrb',
  component: ListeningOrb,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
      ],
    },
  },
};

export const Inactive = {
  args: {
    isListening: false,
    isProcessing: false,
    size: 'md',
  },
};

export const Listening = {
  args: {
    isListening: true,
    isProcessing: false,
    size: 'md',
  },
};

export const Processing = {
  args: {
    isListening: false,
    isProcessing: true,
    size: 'md',
  },
};

export const Small = {
  args: {
    isListening: true,
    isProcessing: false,
    size: 'sm',
  },
};

export const Medium = {
  args: {
    isListening: true,
    isProcessing: false,
    size: 'md',
  },
};

export const Large = {
  args: {
    isListening: true,
    isProcessing: false,
    size: 'lg',
  },
};

export const AllStates = () => (
  <div className="flex gap-12 items-center p-8 bg-slate-950">
    <div className="text-center space-y-4">
      <ListeningOrb isListening={false} isProcessing={false} size="md" />
      <p className="text-sm text-slate-400">Inativo</p>
    </div>
    <div className="text-center space-y-4">
      <ListeningOrb isListening={true} isProcessing={false} size="md" />
      <p className="text-sm text-blue-400">Ouvindo</p>
    </div>
    <div className="text-center space-y-4">
      <ListeningOrb isListening={false} isProcessing={true} size="md" />
      <p className="text-sm text-purple-400">Processando</p>
    </div>
  </div>
);

export const AllSizes = () => (
  <div className="flex gap-12 items-end p-8 bg-slate-950">
    <div className="text-center space-y-4">
      <ListeningOrb isListening={true} size="sm" />
      <p className="text-xs text-slate-400">Small (128px)</p>
    </div>
    <div className="text-center space-y-4">
      <ListeningOrb isListening={true} size="md" />
      <p className="text-xs text-slate-400">Medium (192px)</p>
    </div>
    <div className="text-center space-y-4">
      <ListeningOrb isListening={true} size="lg" />
      <p className="text-xs text-slate-400">Large (256px)</p>
    </div>
  </div>
);
