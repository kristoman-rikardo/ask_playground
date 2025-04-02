
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PulsatingLoaderProps {
  className?: string;
}

const PulsatingLoader: React.FC<PulsatingLoaderProps> = ({ className }) => {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 0.2, 0.6]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-400 opacity-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.8, 0.4, 0.8]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-500 opacity-30"
        />
        <div className="w-3 h-3 rounded-full bg-blue-600 opacity-70" />
      </div>
    </div>
  );
};

export default PulsatingLoader;
