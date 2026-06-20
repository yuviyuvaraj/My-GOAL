import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Calendar, Ruler, Weight as WeightIcon, ShieldAlert, Check, X } from 'lucide-react';
import { Profile } from '../types';

interface ProfilePageProps {
  profile: Profile;
  onSave: (p: Profile) => void;
  onClose: () => void;
}

export default function ProfilePage({ profile, onSave, onClose }: ProfilePageProps) {
  const [name, setName] = useState(profile.name);
  const [age, setAge] = useState(profile.age);
  const [height, setHeight] = useState(profile.height);
  const [weight, setWeight] = useState(profile.weight);
  const [appStartDate, setAppStartDate] = useState(profile.appStartDate);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (age <= 0 || age > 120) newErrors.age = 'Enter a valid age (1-120)';
    if (height <= 30 || height > 280) newErrors.height = 'Enter a valid height (30-280 cm)';
    if (weight <= 2 || weight > 600) newErrors.weight = 'Enter a valid weight (2-600 kg)';
    if (!appStartDate) newErrors.appStartDate = 'App start date is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      appStartDate,
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
        {/* Dynamic Handle bar for bottom drawer effect */}
        <div className="mx-auto w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold tracking-wider uppercase">User Settings</span>
            <h2 className="text-xl font-bold dark:text-stone-100 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Personal Profile</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition text-stone-500 dark:text-stone-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Avatar Badge */}
        <div className="flex flex-col items-center justify-center py-4 mb-6 bg-gradient-to-tr from-purple-500/10 to-indigo-500/10 dark:from-purple-500/5 dark:to-indigo-500/5 border border-purple-500/20 rounded-3xl">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-md">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="mt-2 text-sm font-bold dark:text-stone-200">{name || 'Active User'}</span>
          <span className="text-[10px] text-stone-500 dark:text-stone-400">Offline Local Storage Enabled</span>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          {/* Goal Name / Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Alex Rivera"
              className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                errors.name ? 'border-red-500 ring-1 ring-red-400' : 'border-stone-200 dark:border-stone-750'
              } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:bg-stone-800 dark:text-stone-100 transition shadow-sm`}
            />
            {errors.name && (
              <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 pl-1">
                <ShieldAlert className="w-3 h-3" /> {errors.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                <span>Age (Years)</span>
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={age || ''}
                onChange={(e) => {
                  setAge(Number(e.target.value));
                  if (errors.age) setErrors((prev) => ({ ...prev, age: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                  errors.age ? 'border-red-500 ring-1 ring-red-400' : 'border-stone-200 dark:border-stone-750'
                } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
              />
              {errors.age && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 pl-1">
                  <ShieldAlert className="w-3 h-3" /> {errors.age}
                </span>
              )}
            </div>

            {/* App Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>App Start Date</span>
              </label>
              <input
                type="date"
                value={appStartDate}
                onChange={(e) => {
                  setAppStartDate(e.target.value);
                  if (errors.appStartDate) setErrors((prev) => ({ ...prev, appStartDate: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                  errors.appStartDate ? 'border-red-500 ring-1 ring-red-400' : 'border-stone-200 dark:border-stone-750'
                } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
              />
              {errors.appStartDate && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 pl-1">
                  <ShieldAlert className="w-3 h-3" /> {errors.appStartDate}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-stone-400" />
                <span>Height (cm)</span>
              </label>
              <input
                type="number"
                min="30"
                max="280"
                value={height || ''}
                onChange={(e) => {
                  setHeight(Number(e.target.value));
                  if (errors.height) setErrors((prev) => ({ ...prev, height: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                  errors.height ? 'border-red-500 ring-1 ring-red-400' : 'border-stone-200 dark:border-stone-750'
                } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
              />
              {errors.height && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 pl-1">
                  <ShieldAlert className="w-3 h-3" /> {errors.height}
                </span>
              )}
            </div>

            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider pl-1 flex items-center gap-1">
                <WeightIcon className="w-3.5 h-3.5 text-stone-400" />
                <span>Weight (kg)</span>
              </label>
              <input
                type="number"
                min="2"
                max="600"
                value={weight || ''}
                onChange={(e) => {
                  setWeight(Number(e.target.value));
                  if (errors.weight) setErrors((prev) => ({ ...prev, weight: '' }));
                }}
                className={`w-full px-4 py-2.5 bg-white dark:bg-stone-800 border ${
                  errors.weight ? 'border-red-500 ring-1 ring-red-400' : 'border-stone-200 dark:border-stone-750'
                } rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm`}
              />
              {errors.weight && (
                <span className="text-[10px] text-red-500 font-bold flex items-center gap-1 pl-1">
                  <ShieldAlert className="w-3 h-3" /> {errors.weight}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-bold border border-stone-200 dark:border-stone-750 text-stone-700 dark:text-stone-300 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition shadow-sm flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Save Profile</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
