import { motion } from 'framer-motion';

interface ListeningOrbProps {
  isListening?: boolean;
  isProcessing?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ListeningOrb({ 
  isListening = false, 
  isProcessing = false,
  size = 'md' 
}: ListeningOrbProps) {
  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-48 h-48',
    lg: 'w-64 h-64'
  };

  return (
    <div className="relative flex items-center justify-center overflow-visible">
      {/* Container com efeito gooey/metaball */}
      <div 
        className={`${sizeClasses[size]} relative overflow-visible`}
        style={{
          filter: isListening ? 'blur(1px) contrast(150%)' : 'blur(0.5px) contrast(120%)'
        }}
      >
        {/* Camada Externa - Aura mais suave */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isProcessing 
              ? 'radial-gradient(circle, rgba(147, 51, 234, 0.4) 0%, rgba(139, 92, 246, 0.2) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(34, 211, 238, 0.15) 40%, transparent 70%)',
            filter: 'blur(20px)'
          }}
          animate={isListening ? {
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3]
          } : isProcessing ? {
            rotate: [0, 360]
          } : {
            scale: 1,
            opacity: 0.2
          }}
          transition={{
            duration: isProcessing ? 8 : 4,
            repeat: Infinity,
            repeatType: isProcessing ? 'loop' : 'mirror',
            ease: 'easeInOut'
          }}
        />

        {/* Camada Média - Glow principal */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isProcessing
              ? 'radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, rgba(147, 51, 234, 0.3) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, rgba(34, 211, 238, 0.25) 50%, transparent 70%)',
            filter: 'blur(15px)'
          }}
          animate={isListening ? {
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.7, 0.5]
          } : {
            scale: 1,
            opacity: 0.3
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: 0.2
          }}
        />

        {/* Camada Interna - Núcleo brilhante */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isProcessing
              ? 'radial-gradient(circle, rgba(192, 132, 252, 0.8) 0%, rgba(168, 85, 247, 0.4) 40%, transparent 60%)'
              : 'radial-gradient(circle, rgba(96, 165, 250, 0.8) 0%, rgba(59, 130, 246, 0.5) 40%, transparent 60%)',
            filter: 'blur(10px)'
          }}
          animate={isListening ? {
            scale: [1, 1.15, 1],
            opacity: [0.7, 0.9, 0.7]
          } : {
            scale: 1,
            opacity: 0.5
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: 0.4
          }}
        />

        {/* Núcleo Central - Ponto focal */}
        <motion.div
          className="absolute inset-0 m-auto rounded-full"
          style={{
            width: '40%',
            height: '40%',
            background: isProcessing
              ? 'radial-gradient(circle, rgba(233, 213, 255, 0.9) 0%, rgba(192, 132, 252, 0.6) 50%, transparent 80%)'
              : 'radial-gradient(circle, rgba(224, 242, 254, 0.9) 0%, rgba(96, 165, 250, 0.7) 50%, transparent 80%)',
            filter: 'blur(5px)'
          }}
          animate={isListening ? {
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8]
          } : {
            scale: 1,
            opacity: 0.6
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut'
          }}
        />

        {/* Ondas Sonoras (Ripples) - apenas quando ouvindo */}
        {isListening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: 'rgba(96, 165, 250, 0.6)'
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 1.5],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'easeOut'
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{
                borderColor: 'rgba(34, 211, 238, 0.5)'
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 1.5],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: 'easeOut',
                delay: 1
              }}
            />
          </>
        )}
      </div>

      {/* Reflexo sutil no fundo */}
      <div 
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(ellipse at bottom, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          filter: 'blur(30px)',
          transform: 'translateY(20%)'
        }}
      />
    </div>
  );
}
