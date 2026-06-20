import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Trash2, Edit2, Play, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Goal, ProgressEntry } from '../types';

interface GoalCardProps {
  key?: string;
  goal: Goal;
  progressToday: ProgressEntry | undefined;
  onTap: (goal: Goal) => void;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export default function GoalCard({
  goal,
  progressToday,
  onTap,
  onEdit,
  onDelete,
}: GoalCardProps) {
  // Long press calculation state
  const [isPressing, setIsPressing] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startPress = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent triggering right clicks
    if ('button' in e && e.button !== 0) return;
    
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      // Trigger long press!
      setShowContextMenu(true);
      setIsPressing(false);
      // Trigger small device-like vibration if supported
      if ('vibrate' in navigator) {
        navigator.vibrate(40);
      }
    }, 600); // 600ms hold
  };

  const endPress = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCardTap = () => {
    // If we just opened context menu, don't tap
    if (showContextMenu) return;
    
    // Check if was long press
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onTap(goal);
  };

  // Progress metrics calculation
  const target = goal.targetLimit || 1;
  const currentVal = progressToday?.value || 0;
  const percent = Math.min(100, Math.round((currentVal / target) * 100));

  let statusText = 'Not Done';
  let statusColor = 'text-red-500 bg-red-500/10 dark:bg-red-500/20';
  let barColor = 'bg-red-500';

  if (currentVal >= target) {
    statusText = 'Completed';
    statusColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20';
    barColor = 'bg-emerald-500';
  } else if (currentVal > 0) {
    statusText = 'Partially Done';
    statusColor = 'text-amber-600 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20';
    barColor = 'bg-amber-500';
  }

  // Formatting date nicely
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="relative">
        {/* Main Card */}
        <motion.div
          id={`goal-card-${goal.id}`}
          onClick={handleCardTap}
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          whileTap={{ scale: 0.98 }}
          animate={isPressing ? { scale: 0.96 } : { scale: 1 }}
          className="relative overflow-hidden cursor-pointer no-select p-4 bg-white dark:bg-stone-850 hover:bg-stone-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-3xl transition shadow-sm select-none"
        >
          {/* Progress Indicator Ring / Status dot at Top Right */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 ${statusColor}`}>
                {currentVal >= target ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : currentVal > 0 ? (
                  <AlertCircle className="w-3 h-3" />
                ) : (
                  <Circle className="w-3 h-3" />
                )}
                <span>{statusText}</span>
              </span>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 truncate">
                {goal.name}
              </h3>
            </div>

            {/* Micro Ring Progress Visualizer */}
            <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="18"
                  className="stroke-stone-200 dark:stroke-stone-700"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <motion.circle
                  cx="24"
                  cy="24"
                  r="18"
                  className={
                    currentVal >= target 
                      ? "stroke-emerald-500" 
                      : currentVal > 0 
                        ? "stroke-amber-500" 
                        : "stroke-red-400"
                  }
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 18}
                  animate={{ strokeDashoffset: (2 * Math.PI * 18) * (1 - percent / 100) }}
                  transition={{ duration: 0.4 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black dark:text-stone-200">
                {percent}%
              </div>
            </div>
          </div>

          {/* Target details */}
          <div className="mt-4 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 pr-1">
            <div className="font-semibold flex items-center gap-1 bg-stone-100 dark:bg-stone-800 px-2.5 py-1 rounded-lg">
              <span className="text-purple-600 dark:text-purple-400 font-bold">{currentVal}</span>
              <span className="text-stone-400">/</span>
              <span>{target} {goal.unit || 'Count'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-stone-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDateStr(goal.startDate)} - {formatDateStr(goal.endDate)}</span>
            </div>
          </div>

          {/* Progress Bar Footer */}
          <div className="mt-3.5 w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${barColor}`}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Quick hold-to-edit indicator */}
          <span className="absolute bottom-1 right-2.5 text-[8px] text-stone-300 dark:text-stone-600 font-medium">
            Hold to edit
          </span>
        </motion.div>

        {/* M3 Style Long Press Action Bottom Sheet Overlay */}
        <AnimatePresence>
          {showContextMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowContextMenu(false)}
              className="absolute inset-0 bg-stone-900/40 backdrop-blur-md rounded-3xl z-20 flex items-center justify-center p-3"
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                className="w-full bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-3 border border-stone-200 dark:border-stone-800 flex items-center justify-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    onEdit(goal);
                  }}
                  className="flex-1 py-2 px-2.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/55 border border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-300 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Goal</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowContextMenu(false);
                    onDelete(goal.id);
                  }}
                  className="flex-1 py-2 px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/55 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Goal</span>
                </button>

                <button
                  onClick={() => setShowContextMenu(false)}
                  className="p-2 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-300 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-850"
                >
                  <span className="text-xs font-bold">X</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
