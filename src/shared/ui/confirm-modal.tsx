"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "확인",
  cancelText = "취소",
  isDestructive = true,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 flex flex-col rounded-3xl p-6 shadow-2xl max-w-[320px] w-full pointer-events-auto border border-black/5 dark:border-zinc-800"
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
                    isDestructive
                      ? "bg-red-50 dark:bg-red-900/30 text-red-500"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-500"
                  }`}
                >
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                  {title}
                </h3>
                <div className="text-xs font-semibold text-gray-500 mb-8 leading-relaxed max-w-[260px] mx-auto text-balance">
                  {message}
                </div>
              </div>
              <div className="flex gap-2 w-full mt-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-2xl text-xs font-black tracking-widest text-gray-500 dark:text-gray-400 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-3 px-4 rounded-2xl text-xs font-black tracking-widest text-white transition-all shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                    isDestructive
                      ? "bg-red-500 hover:bg-red-600 shadow-red-500/25"
                      : "bg-blue-500 hover:bg-blue-600 shadow-blue-500/25"
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
