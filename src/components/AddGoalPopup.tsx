import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  ClipboardList,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Goal } from '../types';

interface AddGoalPopupProps {
  onClose: () => void;
  onSave: (goal: Omit<Goal, 'id' | 'createdAt'> & { id?: string }) => void;
  editingGoal?: Goal | null;
}

const PRESET_UNITS = [
  'Count',
  'Kg',
  'Liters',
  'Seconds',
  'Minutes',
  'Hours',
  'Pages',
  'Custom',
];

export default function AddGoalPopup({
  onClose,
  onSave,
  editingGoal,
}: AddGoalPopupProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(() => {
    // default to today YYYY-MM-DD
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // default to 30 days from now
    const limit = new Date();
    limit.setDate(limit.getDate() + 30);
    return limit.toISOString().split('T')[0];
  });
  const [type, setType] = useState<'daily' | 'one-time'>('daily');

  // Limit / units
  const [targetLimit, setTargetLimit] = useState<number>(1);
  const [unit, setUnit] = useState('Count');
  const [customUnit, setCustomUnit] = useState('');

  // Reminders list e.g. ["09:00", "20:00"]
  const [reminders, setReminders] = useState<string[]>(['09:00']);
  const [newReminderTime, setNewReminderTime] = useState('12:00');

  // Validation error maps
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (editingGoal) {
      setName(editingGoal.name);
      setStartDate(editingGoal.startDate);
      setEndDate(editingGoal.endDate);
      setType(editingGoal.type);
      setReminders(editingGoal.reminders);

      if (editingGoal.type === 'daily') {
        const goalLimit = editingGoal.targetLimit || 1;
        setTargetLimit(goalLimit);
        const goalUnit = editingGoal.unit || 'Count';
        if (PRESET_UNITS.includes(goalUnit)) {
          setUnit(goalUnit);
        } else {
          setUnit('Custom');
          setCustomUnit(goalUnit);
        }
      }
    }
  }, [editingGoal]);

  const handleAddReminder = () => {
    if (!newReminderTime) return;
    if (reminders.includes(newReminderTime)) {
      setErrors((prev) => ({
        ...prev,
        reminders: 'This reminder time already exists.',
      }));
      return;
    }
    setReminders((prev) => [...prev, newReminderTime].sort());
    setErrors((prev) => ({ ...prev, reminders: '' }));
  };

  const handleRemoveReminder = (index: number) => {
    setReminders((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    }
    if (!startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required';
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date cannot be prior to start date';
    }
    if (type === 'daily' && (!targetLimit || targetLimit <= 0)) {
      newErrors.targetLimit = 'Target limit must be positive';
    }
    if (type === 'daily' && unit === 'Custom' && !customUnit.trim()) {
      newErrors.customUnit = 'Custom unit name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const finalUnit =
      type === 'daily'
        ? unit === 'Custom'
          ? customUnit.trim()
          : unit
        : undefined;

    onSave({
      id: editingGoal?.id,
      name: name.trim(),
      startDate,
      endDate,
      type,
      targetLimit: type === 'daily' ? Number(targetLimit) : undefined,
      unit: finalUnit,
      reminders,
      completed: editingGoal?.completed ?? false,
      completedAt: editingGoal?.completedAt,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center"
      onClick={onClose}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-md bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-850 rounded-t-[2.5rem] shadow-2xl p-6 overflow-y-auto max-h-[85vh] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Notch slider bar */}
        <div className="mx-auto w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wider uppercase">
              {editingGoal ? 'Modifying Goal' : 'Create New Goal'}
            </span>
            <h2 className="text-xl font-black text-stone-900 dark:text-stone-50 flex items-center gap-1.5 mt-0.5">
              <ClipboardList className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>{editingGoal ? 'Edit Goal Values' : 'Add Goal Target'}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full text-stone-500 dark:text-stone-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Goal Name Field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest pl-1">
              Goal Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Read 20 pages, Gym Workout"
              className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                errors.name
                  ? 'border-red-500 ring-2 ring-red-300/40'
                  : 'border-stone-200 dark:border-stone-750'
              } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 text-stone-900 dark:text-stone-100 transition shadow-sm`}
            />
            {errors.name && (
              <span className="text-[10px] text-red-500 font-bold pl-1">
                {errors.name}
              </span>
            )}
          </div>

          {/* Type Choice Selector (Radio Tabs) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest pl-1">
              Goal Frequency & Type
            </label>
            <div className="grid grid-cols-2 gap-2 bg-stone-200/60 dark:bg-stone-800/80 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('daily')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  type === 'daily'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-550'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Daily Recurring</span>
              </button>
              <button
                type="button"
                onClick={() => setType('one-time')}
                className={`py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                  type === 'one-time'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-stone-600 dark:text-stone-300 hover:text-stone-950 dark:hover:text-stone-550'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>One-Time Goal</span>
              </button>
            </div>
          </div>

          {/* Dates Side-by-side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase pl-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (errors.startDate)
                    setErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase pl-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" />
                <span>End / Due Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  if (errors.endDate)
                    setErrors((prev) => ({ ...prev, endDate: '' }));
                }}
                className={`w-full px-3 py-2 bg-white dark:bg-stone-800 border ${
                  errors.endDate
                    ? 'border-red-500'
                    : 'border-stone-200 dark:border-stone-750'
                } rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
              />
              {errors.endDate && (
                <span className="text-[9px] text-red-500 font-bold pl-1 mt-0.5">
                  {errors.endDate}
                </span>
              )}
            </div>
          </div>

          {/* Target limits - Visible ONLY when Daily is selected */}
          <AnimatePresence initial={false}>
            {type === 'daily' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden space-y-3 pt-1"
              >
                <div className="grid grid-cols-2 gap-3 bg-purple-500/5 dark:bg-purple-500/10 p-3 rounded-2xl border border-purple-500/10">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase pl-1">
                      Target Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={targetLimit}
                      onChange={(e) => {
                        setTargetLimit(Number(e.target.value));
                        if (errors.targetLimit)
                          setErrors((prev) => ({ ...prev, targetLimit: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-white dark:bg-stone-800 border ${
                        errors.targetLimit
                          ? 'border-red-500'
                          : 'border-stone-200 dark:border-stone-750'
                      } rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
                    />
                    {errors.targetLimit && (
                      <span className="text-[9px] text-red-500 font-bold mt-0.5">
                        {errors.targetLimit}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-stone-600 dark:text-stone-400 uppercase pl-1">
                      Measurement Unit
                    </label>
                    <div className="relative">
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm appearance-none pr-8 cursor-pointer"
                      >
                        {PRESET_UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {unit === 'Custom' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-1.5"
                  >
                    <label className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase pl-1">
                      Specify Custom Unit Name
                    </label>
                    <input
                      type="text"
                      value={customUnit}
                      onChange={(e) => {
                        setCustomUnit(e.target.value);
                        if (errors.customUnit)
                          setErrors((prev) => ({ ...prev, customUnit: '' }));
                      }}
                      placeholder="e.g. Cups, KM, Reps, Hours"
                      className={`w-full px-3 py-2 bg-white dark:bg-stone-800 border ${
                        errors.customUnit
                          ? 'border-red-500'
                          : 'border-stone-200 dark:border-stone-750'
                      } rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
                    />
                    {errors.customUnit && (
                      <span className="text-[9px] text-red-500 font-bold">
                        {errors.customUnit}
                      </span>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alarm Reminders Subform */}
          <div className="space-y-2 border-t dark:border-stone-800 pt-3">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest pl-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Alarm Reminders ({reminders.length})</span>
            </label>

            <div className="flex gap-2">
              <input
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
                className="px-3 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm w-36"
              />
              <button
                type="button"
                onClick={handleAddReminder}
                className="flex-1 py-2 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold rounded-xl text-xs hover:bg-purple-200 dark:hover:bg-purple-950/60 transition flex items-center justify-center gap-1 shadow-sm border border-purple-200 dark:border-purple-900/30"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Alarm</span>
              </button>
            </div>

            {errors.reminders && (
              <span className="text-[10px] text-red-500 font-bold pl-1">
                {errors.reminders}
              </span>
            )}

            {/* List of times */}
            <div className="flex flex-wrap gap-1.5 mt-2 max-h-24 overflow-y-auto p-1 bg-stone-100 dark:bg-stone-850 rounded-xl">
              {reminders.length === 0 ? (
                <div className="text-[10px] text-stone-400 dark:text-stone-500 italic p-1">
                  No reminders configured. Alarms disabled.
                </div>
              ) : (
                reminders.map((time, index) => (
                  <span
                    key={`${time}-${index}`}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-full text-xs font-mono font-bold shadow-xs hover:border-red-500/40 group transition"
                  >
                    <span>{time}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveReminder(index)}
                      className="p-0.5 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Form Action buttons */}
          <div className="flex items-center gap-3 pt-3 border-t dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 text-xs font-bold border border-stone-200 dark:border-stone-750 text-stone-700 dark:text-stone-300 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition shadow-sm text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-md transition text-center"
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
