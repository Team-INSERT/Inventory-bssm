"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  id: string;
  name: string;
}

interface PremiumSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export default function PremiumSelect({
  options,
  value,
  onChange,
  placeholder = "선택하세요",
  label,
  className,
}: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-4 bg-gray-50 dark:bg-zinc-950 rounded-2xl border transition-all duration-300 text-sm font-bold",
          isOpen
            ? "border-blue-500 ring-4 ring-blue-500/10 shadow-lg shadow-blue-500/5 bg-white dark:bg-zinc-900"
            : "border-gray-200 dark:border-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-900",
        )}
      >
        <span
          className={cn(
            selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400",
          )}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-[60] w-full mt-2 bg-white/80 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-2xl overflow-hidden max-h-60 overflow-y-auto"
          >
            <div className="p-2 space-y-1">
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    value === option.id
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800",
                  )}
                >
                  {option.name}
                  {value === option.id && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="w-4 h-4" />
                    </motion.div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
