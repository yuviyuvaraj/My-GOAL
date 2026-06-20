import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Minus,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Goal, ProgressEntry } from '../types';

interface GoalDetailsProps {
  goal: Goal;
  progressList: ProgressEntry[];
  onUpdateProgress: (goalId: string, date: string, value: number) => void;
  onClose: () => void;
}

export default function GoalDetails({
  goal,
  progressList,
  onUpdateProgress,
  onClose,
}: GoalDetailsProps) {
  // Calendar tracking - default to current month
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

  // Today string format
  const todayStr = today.toISOString().split('T')[0];

  // Selected date on calendar to edit progress. Defaults to today.
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayStr);

  // View style for progress graph: 'daily' | 'weekly' | 'monthly'
  const [graphMode, setGraphMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Convert month indices to String labels
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Find progress entries for this specific goal
  const goalProgressMap = useMemo(() => {
    const map = new Map<string, ProgressEntry>();
    progressList
      .filter((p) => p.goalId === goal.id)
      .forEach((p) => {
        map.set(p.date, p);
      });
    return map;
  }, [progressList, goal.id]);

  // Handle month increments/decrements
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Calendar render calculations
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayIndex = useMemo(() => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  // Find status of a specific date for this goal
  // returns 'not-done' | 'partially-done' | 'completed' | 'not-started'
  const getProgressStatusForDate = (dateStr: string) => {
    const entry = goalProgressMap.get(dateStr);
    if (!entry) {
      // If date is before goal's start date or after end date, returns 'not-started'
      if (dateStr < goal.startDate || dateStr > goal.endDate) {
        return 'out-of-bounds';
      }
      return 'not-done';
    }
    return entry.status;
  };

  // Track progress value for selected calendar date
  const selectedDateProgress = useMemo(() => {
    return goalProgressMap.get(selectedCalendarDate)?.value || 0;
  }, [goalProgressMap, selectedCalendarDate]);

  const targetLimit = goal.targetLimit || 1;

  // Increment selected date progress
  const stepProgressVal = (amount: number) => {
    const newVal = Math.max(0, selectedDateProgress + amount);
    onUpdateProgress(goal.id, selectedCalendarDate, newVal);
  };

  // Monthly stats calculations for the visible month
  const monthlyStats = useMemo(() => {
    let completed = 0;
    let partial = 0;
    let incomplete = 0;
    let activeDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Only count days within the goal's active date range
      if (dStr >= goal.startDate && dStr <= goal.endDate) {
        activeDays++;
        const status = getProgressStatusForDate(dStr);
        if (status === 'completed') completed++;
        else if (status === 'partially-done') partial++;
        else incomplete++;
      }
    }

    const completionRate = activeDays > 0 ? Math.round((completed / activeDays) * 100) : 0;

    return {
      completed,
      partial,
      incomplete,
      activeDays,
      completionRate,
    };
  }, [currentYear, currentMonth, goalProgressMap, goal.startDate, goal.endDate, daysInMonth]);

  // Generate interactive SVG bar chart data depending on visual mode (Daily, Weekly, Monthly)
  const chartData = useMemo(() => {
    const result: { label: string; val: number; target: number; date: string }[] = [];

    if (graphMode === 'daily') {
      // Last 7 days counting back from today
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const val = goalProgressMap.get(dStr)?.value || 0;
        result.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          val,
          target: targetLimit,
          date: dStr,
        });
      }
    } else if (graphMode === 'weekly') {
      // Split our tracked month into 4 weeks
      for (let w = 1; w <= 4; w++) {
        let totalVal = 0;
        let count = 0;
        const startDay = (w - 1) * 7 + 1;
        const endDay = Math.min(daysInMonth, w * 7);

        for (let d = startDay; d <= endDay; d++) {
          const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const val = goalProgressMap.get(dStr)?.value || 0;
          totalVal += val;
          count++;
        }

        result.push({
          label: `Wk ${w}`,
          val: count > 0 ? parseFloat((totalVal / count).toFixed(1)) : 0,
          target: targetLimit,
          date: '',
        });
      }
    } else {
      // Monthly summary (shows last 4 months)
      for (let i = 3; i >= 0; i--) {
        const targetMonth = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mIdx = targetMonth.getMonth();
        const yVal = targetMonth.getFullYear();

        let totalVal = 0;
        let daysActive = 0;
        const lastDayOfTargetMonth = new Date(yVal, mIdx + 1, 0).getDate();

        for (let d = 1; d <= lastDayOfTargetMonth; d++) {
          const dStr = `${yVal}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const val = goalProgressMap.get(dStr)?.value || 0;
          totalVal += val;
          daysActive++;
        }

        result.push({
          label: monthNames[mIdx].substring(0, 3) + ' ' + String(yVal).substring(2),
          val: daysActive > 0 ? parseFloat((totalVal / daysActive).toFixed(1)) : 0,
          target: targetLimit,
          date: '',
        });
      }
    }

    return result;
  }, [graphMode, goalProgressMap, currentYear, currentMonth, daysInMonth, targetLimit]);

  // Format single date label
  const formatSelectedDateHeading = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const getCalendarDayColorClass = (status: string, isSelected: boolean) => {
    let base = '';
    if (status === 'completed') {
      base = 'bg-emerald-500 text-white font-bold';
    } else if (status === 'partially-done') {
      base = 'bg-amber-500 text-stone-900 font-bold';
    } else if (status === 'out-of-bounds') {
      base = 'bg-stone-100 dark:bg-stone-850 opacity-30 text-stone-400 dark:text-stone-600 line-through';
    } else {
      // not-done
      base = 'bg-red-500/15 dark:bg-red-500/10 border-dashed border border-red-500/40 text-red-700 dark:text-red-400';
    }

    if (isSelected) {
      return `${base} ring-4 ring-purple-600 ring-offset-2 dark:ring-offset-stone-900 scale-105 z-10`;
    }
    return base;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-end justify-center select-none"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 24, stiffness: 210 }}
        className="w-full max-w-md bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-850 rounded-t-[2.5rem] shadow-2xl p-5 overflow-y-auto max-h-[92vh] no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bottom Drawer Notch Handle */}
        <div className="mx-auto w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-4" />

        {/* Top bar with Close */}
        <div className="flex items-start justify-between mb-4 border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="min-w-0 flex-1">
            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider pl-0.5">
              Goal Insights dashboard
            </span>
            <h2 className="text-xl font-extrabold text-stone-900 dark:text-stone-50 truncate mt-0.5">
              {goal.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 transition ml-3"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION 1: TODAY / HIGHLIGHTED DAY STATUS WORKER */}
        <div className="bg-white dark:bg-stone-850 border border-stone-250/20 dark:border-stone-800 rounded-3xl p-4 shadow-sm mb-4">
          <span className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest pl-0.5">
            UPDATE LOG FOR CHOSEN DATE
          </span>
          <h4 className="text-[13px] font-bold text-stone-800 dark:text-stone-200 mt-1 flex items-center gap-1.5 pl-0.5">
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>{formatSelectedDateHeading(selectedCalendarDate)}</span>
            {selectedCalendarDate === todayStr && (
              <span className="bg-purple-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-md uppercase">
                Today
              </span>
            )}
          </h4>

          {/* Stepper block */}
          <div className="flex items-center justify-between mt-4 bg-stone-100 dark:bg-stone-800 px-4 py-3 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400">
                Log Progress
              </span>
              <div className="flex items-baseline gap-1 mt-1 font-black">
                <span className="text-2xl text-purple-700 dark:text-purple-300">
                  {selectedDateProgress}
                </span>
                <span className="text-xs text-stone-400">/</span>
                <span className="text-sm text-stone-500 dark:text-stone-400">
                  {targetLimit} {goal.unit || 'Count'}
                </span>
              </div>
            </div>

            {/* Increments buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => stepProgressVal(-1)}
                className="w-10 h-10 bg-white dark:bg-stone-750 text-stone-700 dark:text-stone-200 rounded-full flex items-center justify-center font-bold active:scale-90 select-none shadow-sm border border-stone-200 dark:border-stone-700"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => stepProgressVal(1)}
                className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold active:scale-90 select-none shadow-md"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stepper feedback message */}
          <div className="mt-3 flex items-center gap-2 text-[10px] text-stone-500 dark:text-stone-400 pl-1">
            <Info className="w-3.5 h-3.5 text-stone-400" />
            <span>Tap any space calendar date below to log its metrics!</span>
          </div>
        </div>

        {/* SECTION 2: MONTHLY HEATMAP CALENDAR */}
        <div className="bg-white dark:bg-stone-850 rounded-3xl p-4 border border-stone-200 dark:border-stone-800 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3 text-stone-900 dark:text-stone-100">
            <h3 className="text-sm font-black flex items-center gap-1">
              <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Goal Heatmap</span>
            </h3>
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              <button
                onClick={handlePrevMonth}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold font-mono px-1">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg text-stone-600 dark:text-stone-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Heatmap Index Info */}
          <div className="flex items-center justify-between py-1 mb-3 border-b dark:border-stone-800 text-[9px] font-bold text-stone-500 uppercase">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-red-500/20 border border-red-400/40" />
              <span>Red: Incomplete</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-400/40" />
              <span>Yellow: Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span>Green: Done</span>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-black text-stone-400 mb-1">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          {/* Calendar Dates Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty slots for start Day offset */}
            {Array.from({ length: firstDayIndex }).map((_, index) => (
              <div key={`offset-${index}`} className="w-full aspect-square" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = selectedCalendarDate === dateStr;
              const status = getProgressStatusForDate(dateStr);

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedCalendarDate(dateStr)}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl text-xs font-semibold focus:outline-none transition ${getCalendarDayColorClass(
                    status,
                    isSelected
                  )}`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: MONTHLY STATS */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white dark:bg-stone-850 p-3.5 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm">
            <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
              Completion Rate
            </span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-baseline gap-1 font-mono">
              <span>{monthlyStats.completionRate}%</span>
              {monthlyStats.completionRate > 75 && (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              )}
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1 pl-0.5">
              Across active logged days
            </p>
          </div>

          <div className="bg-white dark:bg-stone-850 p-3 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm flex flex-col justify-between">
            <span className="text-[9px] uppercase font-bold text-stone-400 dark:text-stone-500 tracking-wider">
              Streak Statistics
            </span>
            <div className="space-y-1.5 mt-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-500 dark:text-stone-400">Completed Days:</span>
                <span className="font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {monthlyStats.completed}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-500 dark:text-stone-400">Partial Days:</span>
                <span className="font-extrabold font-mono text-amber-500">
                  {monthlyStats.partial}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-stone-500 dark:text-stone-400">Incomplete Days:</span>
                <span className="font-extrabold font-mono text-stone-400">
                  {monthlyStats.incomplete}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PROGRESS GRAPH */}
        <div className="bg-white dark:bg-stone-850 p-4 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-stone-900 dark:text-stone-50 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Progress Analytics</span>
            </h3>

            {/* Mode Controls */}
            <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl text-[9px] font-bold text-stone-600 dark:text-stone-300">
              <button
                onClick={() => setGraphMode('daily')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  graphMode === 'daily' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-stone-950 dark:hover:text-stone-105'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setGraphMode('weekly')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  graphMode === 'weekly' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-stone-950 dark:hover:text-stone-105'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setGraphMode('monthly')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  graphMode === 'monthly' ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-stone-950 dark:hover:text-stone-105'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Interactive Responsive SVG Stepper Bar chart */}
          <div className="relative h-44 flex items-end justify-between pt-6 border-b border-stone-100 dark:border-stone-800 pb-2 px-1">
            {chartData.map((bar, i) => {
              // calculate percentage of target
              const barPercent = Math.min(100, Math.round((bar.val / bar.target) * 100));

              return (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end px-1 select-none">
                  {/* Tooltip on Hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-4 bg-stone-800 text-stone-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none transition shadow-sm z-30 flex flex-col items-center font-mono">
                    <span>{bar.val} / {bar.target}</span>
                  </div>

                  {/* Main Progress pillar */}
                  <div className="relative w-7 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden h-32 flex items-end shadow-inner border border-stone-150/40 dark:border-stone-800">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barPercent}%` }}
                      className={`w-full rounded-b-lg border-t border-white/10 ${
                        barPercent >= 100 
                          ? 'bg-emerald-500' 
                          : barPercent > 0 
                            ? 'bg-amber-400' 
                            : 'bg-red-400'
                      }`}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                    />
                  </div>

                  {/* Date or label */}
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 uppercase mt-2 font-bold select-none truncate max-w-[40px] text-center">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 pl-0.5 pr-0.5 uppercase font-bold">
            <span>Chart Mode: {graphMode} View</span>
            <span>Target Color Indexed</span>
          </div>
        </div>

        {/* BUTTONS CONTAINER */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-stone-800 dark:bg-stone-750 hover:bg-stone-900 text-stone-100 font-bold rounded-2xl shadow-md transition text-center text-xs mt-3 select-none flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4 text-stone-400" />
          <span>Exit Drawer Insights</span>
        </button>
      </motion.div>
    </motion.div>
  );
}
