'use client';

import { motion } from 'framer-motion';

interface ClayButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  colorClass?: string;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export default function ClayButton({ 
  children, 
  onClick, 
  colorClass = "bg-cyan-300 text-cyan-950", // Colores pastel por defecto
  className = "",
  type = "button"
}: ClayButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      // Aquí está la magia de la animación (resorte físico)
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      // Las clases de sombra que configuraste en tu CSS
      className={`font-extrabold px-6 py-3 rounded-3xl shadow-clay hover:shadow-clay-hover active:shadow-clay-active transition-shadow duration-300 flex items-center justify-center gap-2 ${colorClass} ${className}`}
    >
      {children}
    </motion.button>
  );
}