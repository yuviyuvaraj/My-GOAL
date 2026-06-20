import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Yes, Delete",
  cancelText = "Cancel",
  isDestructive = true,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl p-5 shadow-2xl relative z-10 border border-stone-200 dark:border-stone-800 text-center select-none"
          >
            {/* Soft colored alert shape */}
            <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              isDestructive 
                ? 'bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400' 
                : 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
            }`}>
              {isDestructive ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>

            <h3 className="text-base font-extrabold text-stone-900 dark:text-stone-100 mb-1.5 leading-tight">
              {title}
            </h3>
            
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-5 leading-relaxed px-1">
              {message}
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-700 dark:text-stone-300 font-bold rounded-2xl text-xs transition"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={onConfirm}
                className={`flex-1 py-2.5 text-white font-bold rounded-2xl text-xs transition shadow-sm ${
                  isDestructive 
                    ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-650' 
                    : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-650'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
