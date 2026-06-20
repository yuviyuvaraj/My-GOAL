import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Plus,
  User,
  Settings,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Layers,
  FileText,
  Clock,
  Wifi,
  Battery,
  AlertCircle,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';

import { Goal, ProgressEntry, Note, Profile, SimulatedNotification } from './types';
import {
  getLocalStorage,
  setLocalStorage,
  getItemAsync,
  setItemAsync,
  clearAllAsync,
  DEFAULT_GOALS,
  DEFAULT_PROGRESS,
  DEFAULT_NOTES,
  DEFAULT_PROFILE,
} from './lib/storage';

import { useTheme, ThemeProvider as ThemeCtxProvider } from './components/ThemeProvider';
import AddGoalPopup from './components/AddGoalPopup';
import GoalCard from './components/GoalCard';
import GoalDetails from './components/GoalDetails';
import NotesTab from './components/NotesTab';
import ProfilePage from './components/ProfilePage';
import NotificationCenter from './components/NotificationCenter';
import ConfirmDialog from './components/ConfirmDialog';

function Dashboard() {
  const { theme, setTheme, isDarkActive } = useTheme();

  // 1. Storage & Core States
  const [goals, setGoals] = useState<Goal[]>(() => getLocalStorage<Goal[]>('my-goals-list', DEFAULT_GOALS));
  const [progressList, setProgressList] = useState<ProgressEntry[]>(() =>
    getLocalStorage<ProgressEntry[]>('my-goals-progress', DEFAULT_PROGRESS)
  );
  const [notes, setNotes] = useState<Note[]>(() => getLocalStorage<Note[]>('my-goals-notes', DEFAULT_NOTES));
  const [profile, setProfile] = useState<Profile>(() => getLocalStorage<Profile>('my-goals-profile', DEFAULT_PROFILE));
  const [notifications, setNotifications] = useState<SimulatedNotification[]>(() =>
    getLocalStorage<SimulatedNotification[]>('my-goals-notifications', [])
  );
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);

  // Load from IndexedDB on startup
  useEffect(() => {
    async function loadIndexedData() {
      try {
        const storedGoals = await getItemAsync<Goal[]>('my-goals-list', DEFAULT_GOALS);
        const storedProgress = await getItemAsync<ProgressEntry[]>('my-goals-progress', DEFAULT_PROGRESS);
        const storedNotes = await getItemAsync<Note[]>('my-goals-notes', DEFAULT_NOTES);
        const storedProfile = await getItemAsync<Profile>('my-goals-profile', DEFAULT_PROFILE);
        const storedNotifications = await getItemAsync<SimulatedNotification[]>('my-goals-notifications', []);

        setGoals(storedGoals);
        setProgressList(storedProgress);
        setNotes(storedNotes);
        setProfile(storedProfile);
        setNotifications(storedNotifications);
      } catch (e) {
        console.error('IndexedDB loading issue, using fallback localStorage:', e);
      } finally {
        setIsStorageInitialized(true);
      }
    }
    loadIndexedData();
  }, []);

  // 2. Navigation State
  // 3 pages: 0 = Daily Goals, 1 = One-Time Goals, 2 = Notes
  const [activePage, setActivePage] = useState<number>(0);

  // Swipe gesture trackers
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // 3. UI Toggle States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [activeDetailGoal, setActiveDetailGoal] = useState<Goal | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isAnyModalOpen = isAddOpen || !!editingGoal || !!activeDetailGoal || isProfileOpen || confirmState.isOpen;

  // 4. Real-time clock for simulated phone status bar
  const [systemTime, setSystemTime] = useState('');

  // Save states to local storage and IndexedDB on modification
  useEffect(() => {
    if (isStorageInitialized) {
      setLocalStorage('my-goals-list', goals);
      setItemAsync('my-goals-list', goals);
    }
  }, [goals, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      setLocalStorage('my-goals-progress', progressList);
      setItemAsync('my-goals-progress', progressList);
    }
  }, [progressList, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      setLocalStorage('my-goals-notes', notes);
      setItemAsync('my-goals-notes', notes);
    }
  }, [notes, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      setLocalStorage('my-goals-profile', profile);
      setItemAsync('my-goals-profile', profile);
    }
  }, [profile, isStorageInitialized]);

  useEffect(() => {
    if (isStorageInitialized) {
      setLocalStorage('my-goals-notifications', notifications);
      setItemAsync('my-goals-notifications', notifications);
    }
  }, [notifications, isStorageInitialized]);

  // Handle system clock updates
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Today date helper formatting
  const todayStr = new Date().toISOString().split('T')[0];

  // Look up progress for today for a specific daily goal
  const getTodayProgress = (goalId: string) => {
    return progressList.find((p) => p.goalId === goalId && p.date === todayStr);
  };

  // 5. Swipe Gestures Implementation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 75; // px

    if (distance > minSwipeDistance) {
      // Swiped Left -> Go right to next page
      setActivePage((prev) => Math.min(2, prev + 1));
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Go left to previous page
      setActivePage((prev) => Math.max(0, prev - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // 6. Goals Logic (Create, Edit, Delete, Update Progress)
  const handleAddOrEditGoal = (goalData: Omit<Goal, 'id' | 'createdAt'> & { id?: string }) => {
    if (goalData.id) {
      // Edit
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalData.id
            ? {
                ...g,
                name: goalData.name,
                startDate: goalData.startDate,
                endDate: goalData.endDate,
                type: goalData.type,
                targetLimit: goalData.targetLimit,
                unit: goalData.unit,
                reminders: goalData.reminders,
                completed: goalData.completed,
                completedAt: goalData.completedAt,
              }
            : g
        )
      );

      // If progress logs don't exist yet for today on a daily tracker and it was updated,
      // let's ensure we update active detail goals too
      if (activeDetailGoal?.id === goalData.id) {
        setActiveDetailGoal((prev) => (prev ? { ...prev, ...goalData } as Goal : null));
      }
    } else {
      // Create new
      const newGoal: Goal = {
        id: `g-${Date.now()}`,
        name: goalData.name,
        startDate: goalData.startDate,
        endDate: goalData.endDate,
        type: goalData.type,
        targetLimit: goalData.targetLimit,
        unit: goalData.unit,
        reminders: goalData.reminders,
        completed: goalData.type === 'one-time' ? false : undefined,
        createdAt: new Date().toISOString(),
      };
      setGoals((prev) => [newGoal, ...prev]);

      // Initialize progress entry for today if daily goal
      if (newGoal.type === 'daily') {
        const initialLog: ProgressEntry = {
          goalId: newGoal.id,
          date: todayStr,
          value: 0,
          status: 'not-done',
        };
        setProgressList((prev) => [...prev, initialLog]);
      }
    }

    setIsAddOpen(false);
    setEditingGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Goal',
      message: 'Are you sure you want to delete this goal and its entire history? This action is permanent.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
        setProgressList((prev) => prev.filter((p) => p.goalId !== goalId));
        if (activeDetailGoal?.id === goalId) {
          setActiveDetailGoal(null);
        }
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleUpdateDailyProgress = (goalId: string, date: string, value: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const target = goal.targetLimit || 1;
    let status: 'not-done' | 'partially-done' | 'completed' = 'not-done';
    if (value >= target) status = 'completed';
    else if (value > 0) status = 'partially-done';

    setProgressList((prev) => {
      const exists = prev.some((p) => p.goalId === goalId && p.date === date);
      if (exists) {
        return prev.map((p) => (p.goalId === goalId && p.date === date ? { ...p, value, status } : p));
      } else {
        return [...prev, { goalId, date, value, status }];
      }
    });
  };

  const toggleOneTimeGoalComplete = (goalId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const isDone = !g.completed;
          return {
            ...g,
            completed: isDone,
            completedAt: isDone ? todayStr : undefined,
          };
        }
        return g;
      })
    );
  };

  // 7. Notes CRUD Functions
  const handleCreateNote = (title: string, content: string) => {
    const newNote: Note = {
      id: `n-${Date.now()}`,
      title,
      content,
      lastModified: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, title, content, lastModified: new Date().toISOString() } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Note',
      message: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmText: 'Delete',
      isDestructive: true,
      onConfirm: () => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // 8. Notifications simulation engines
  const simulateLocalNotification = (goalId: string, alarmTime: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const newNotification: SimulatedNotification = {
      id: `notif-${Date.now()}`,
      goalId: goal.id,
      goalName: goal.name,
      time: alarmTime,
      type: goal.type,
      timestamp: Date.now(),
      snoozedCount: 0,
      status: 'active',
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'dismissed' as const } : n)));
  };

  const handleSnoozeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'active' as const, snoozedCount: n.snoozedCount + 1 } : n))
    );
    // Non-blocking user feedback for snooze confirmation
    console.log('Alarm Snoozed for 10 minutes locally! Simulated notification will remind again soon.');
  };

  const handleMarkCompleteFromNotification = (goalId: string, notifId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    if (goal.type === 'daily') {
      const target = goal.targetLimit || 1;
      handleUpdateDailyProgress(goalId, todayStr, target);
    } else {
      toggleOneTimeGoalComplete(goalId);
    }

    // Mark notification completed
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, status: 'completed' as const } : n)));
  };

  // Helper: Clear local storage and reload mock default states
  const resetToFactoryDefaults = async () => {
    setConfirmState({
      isOpen: true,
      title: 'Reset All Data',
      message: 'Are you sure you want to reset all goals, progress heatmaps, profile biometrics, and notes to default samples?',
      confirmText: 'Reset Workstation',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        await clearAllAsync();
        window.location.reload();
      }
    });
  };

  // Filter lists based on tab pages
  const dailyGoals = goals.filter((g) => g.type === 'daily');
  const oneTimeGoals = goals.filter((g) => g.type === 'one-time');

  // Daily views statistics calculations
  const totalCompletedDailyToday = dailyGoals.filter((g) => {
    const prog = getTodayProgress(g.id);
    return prog && prog.value >= (g.targetLimit || 1);
  }).length;

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 font-sans flex flex-col items-center justify-center p-0 md:p-6 transition-colors duration-300">
      
      {/* Outer Dashboard layout headers for Presentation Mode */}
      <header className="hidden md:flex flex-col items-center justify-center mb-5 text-center select-none">
        <h1 className="text-3xl font-extrabold text-stone-850 dark:text-stone-100 flex items-center gap-2">
          <Flame className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-pulse" />
          <span>My Goals Workstation</span>
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md">
          A high-fidelity Progressive Web App (PWA) configured precisely with Android Material 3 design and physical gesture navigation.
        </p>

        <button
          onClick={resetToFactoryDefaults}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 dark:bg-amber-500/5 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-full text-[10px] font-bold tracking-wider transition uppercase"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reload Sample Stats</span>
        </button>
      </header>

      {/* Main Simulated Phone Window Shell Container */}
      <div className="w-full max-w-md md:h-[820px] aspect-[9/19] md:rounded-[3rem] md:shadow-2xl md:border-8 md:border-stone-800 dark:md:border-stone-850 bg-stone-100 dark:bg-stone-900 relative overflow-hidden flex flex-col transition-all duration-300">
        
        {/* Device camera hole & ear piece (Sleek Notch) */}
        <div className="hidden md:block absolute top-1 left-1/2 transform -translate-x-1/2 w-32 h-6.5 bg-stone-900 dark:bg-stone-950 rounded-b-2xl z-50 overflow-hidden shadow-inner">
          <div className="absolute top-1 right-8 w-2 h-2 rounded-full bg-stone-800" />
          <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-stone-700 rounded-full" />
        </div>

        {/* Dynamic Android Push Notifications overlays */}
        <NotificationCenter
          notifications={notifications}
          onDismiss={handleDismissNotification}
          onSnooze={handleSnoozeNotification}
          onMarkComplete={handleMarkCompleteFromNotification}
          goals={goals}
          onSimulateReminder={simulateLocalNotification}
        />

        {/* Android status bar */}
        <div className="pt-2 px-6 pb-1 bg-white dark:bg-stone-900 flex justify-between items-center text-[11px] font-black font-mono tracking-tight text-stone-700 dark:text-stone-300 z-30 select-none border-b border-stone-100 dark:border-stone-800/40">
          <span>{systemTime || '14:30'}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <span className="text-[9px] uppercase font-bold">LTE</span>
            <Battery className="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500" />
          </div>
        </div>

        {/* Global Clean Minimalism Top Bar (3 Menus / Themes / Profile) */}
        <div className="px-5 py-3.5 bg-white dark:bg-stone-900 flex justify-between items-center border-b border-stone-150 dark:border-stone-800/60 z-30 select-none transition-colors duration-300">
          {/* Profile Menu Item */}
          <div 
            onClick={() => setIsProfileOpen(true)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300 font-extrabold text-xs shadow-xs border border-purple-500/15 group-hover:scale-105 active:scale-95 transition-transform duration-200">
              {profile.name ? profile.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'}
            </div>
            <div>
              <span className="block text-[8px] text-stone-400 dark:text-stone-500 uppercase font-black tracking-widest leading-none">
                Streak Master
              </span>
              <h2 className="text-xs font-black text-stone-800 dark:text-stone-200 leading-tight">
                {profile.name}
              </h2>
            </div>
          </div>

          {/* Theme Dropdown Selector Menu */}
          <div className="relative bg-stone-100 dark:bg-stone-800/80 hover:bg-stone-200 dark:hover:bg-stone-750 border border-stone-200 dark:border-stone-700 rounded-full px-2.5 py-1 z-30 transition text-[10px] font-bold text-stone-850 dark:text-stone-200 shadow-xs cursor-pointer flex items-center">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none pr-1 cursor-pointer appearance-none outline-none border-none"
            >
              <option value="light" className="text-stone-900 bg-white">☀️ Light</option>
              <option value="dark" className="text-stone-900 bg-white dark:bg-stone-900 dark:text-white">🌙 Dark</option>
              <option value="system" className="text-stone-900 bg-white dark:bg-stone-900 dark:text-white">📱 System</option>
            </select>
          </div>
        </div>

        {/* Page Slider / Navigation Swiper Container */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="flex-1 overflow-hidden relative flex flex-col"
        >
          {/* TAB HEADERS (Navigation indicator tabs block) */}
          <div className="grid grid-cols-3 bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 p-1 font-extrabold uppercase text-[10px] tracking-wider select-none z-10 transition">
            <button
              onClick={() => setActivePage(0)}
              className={`py-3 flex flex-col items-center gap-1 transition ${
                activePage === 0
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Daily Goals</span>
            </button>
            <button
              onClick={() => setActivePage(1)}
              className={`py-3 flex flex-col items-center gap-1 transition ${
                activePage === 1
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>One-Time Goals</span>
            </button>
            <button
              onClick={() => setActivePage(2)}
              className={`py-3 flex flex-col items-center gap-1 transition ${
                activePage === 2
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>My Notes</span>
            </button>
          </div>

          {/* Active Navigation underbar pill */}
          <div className="relative w-full h-1 bg-stone-100 dark:bg-stone-800 select-none">
            <motion.div
              className="absolute h-full w-1/3 bg-purple-600 dark:bg-purple-400"
              animate={{ x: `${activePage * 100}%` }}
              transition={{ type: 'spring', stiffness: 220, damping: 25 }}
            />
          </div>

          {/* MAIN PAGE SWIPE CHUNKS */}
          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activePage === 0 && (
                <motion.div
                  key="daily-page"
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-0 p-4 space-y-4 no-scrollbar ${isAnyModalOpen ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto'}`}
                >
                  {/* Daily list header */}
                  <h3 className="text-xs font-black text-stone-500 dark:text-stone-400 pl-1 uppercase tracking-widest pt-1">
                    Your Daily Targets ({dailyGoals.length})
                  </h3>

                  {/* Daily Goal list Cards */}
                  <div className="space-y-3 pb-20">
                    {dailyGoals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-stone-200 dark:border-stone-800 rounded-3xl mt-4">
                        <Sparkles className="w-10 h-10 text-stone-300 mb-2" />
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                          Welcome to My Goals!
                        </h4>
                        <p className="text-[10px] text-stone-400 max-w-[200px] mt-1">
                          You have no daily goals yet. Tap the Floating "+" Button to launch your first target limit routines!
                        </p>
                      </div>
                    ) : (
                      dailyGoals.map((g) => (
                        <GoalCard
                          key={g.id}
                          goal={g}
                          progressToday={getTodayProgress(g.id)}
                          onTap={(selected) => setActiveDetailGoal(selected)}
                          onEdit={(selected) => {
                            setEditingGoal(selected);
                            setIsAddOpen(true);
                          }}
                          onDelete={handleDeleteGoal}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activePage === 1 && (
                <motion.div
                  key="onetime-page"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-0 p-4 space-y-4 no-scrollbar ${isAnyModalOpen ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h2 className="text-lg font-black text-stone-850 dark:text-stone-50 pl-0.5">
                      One-Time Goals
                    </h2>
                    <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                      Pebble list
                    </span>
                  </div>

                  {/* List of One-time goals */}
                  <div className="space-y-3 pb-20">
                    {oneTimeGoals.length === 0 ? (
                      <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-stone-200 dark:border-stone-800 rounded-3xl mt-4">
                        <Layers className="w-10 h-10 text-stone-300 mb-2" />
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
                          Empty Milestones list
                        </h4>
                        <p className="text-[10px] text-stone-400 max-w-[200px] mt-1">
                          Create specific one-time goals or targets by clicking the "+" Floating button!
                        </p>
                      </div>
                    ) : (
                      oneTimeGoals.map((g) => {
                        const isDone = g.completed === true;
                        return (
                          <div
                            key={g.id}
                            className="p-4 bg-white dark:bg-stone-850 border border-stone-250/20 dark:border-stone-750 rounded-2xl shadow-xs relative flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <button
                                  onClick={() => toggleOneTimeGoalComplete(g.id)}
                                  className={`p-1.5 rounded-full transition border ${
                                    isDone
                                      ? 'bg-emerald-500 border-emerald-500 text-white'
                                      : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-transparent'
                                  }`}
                                >
                                  <CheckCircle2 className="w-4 h-4 cursor-pointer" />
                                </button>
                                <div className="min-w-0">
                                  <h3
                                    className={`text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate max-w-[220px] ${
                                      isDone ? 'line-through opacity-50' : ''
                                    }`}
                                  >
                                    {g.name}
                                  </h3>
                                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 font-bold uppercase flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-stone-400" />
                                    <span>Due Date: {g.endDate}</span>
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  isDone
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-400/10 text-amber-400'
                                }`}
                              >
                                {isDone ? 'COMPLETED' : 'PENDING'}
                              </span>
                            </div>

                            {/* One time goal action options */}
                            <div className="mt-3.5 pt-2.5 border-t border-stone-100 dark:border-stone-800/60 flex items-center justify-end gap-2 text-[10px] font-bold">
                              <button
                                onClick={() => {
                                  setEditingGoal(g);
                                  setIsAddOpen(true);
                                }}
                                className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-600 dark:text-stone-300 rounded-lg transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                className="px-3 py-1 bg-stone-100 dark:bg-stone-850 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 rounded-lg transition"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activePage === 2 && (
                <motion.div
                  key="notes-page"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex flex-col"
                >
                  <NotesTab
                    notes={notes}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    isParentModalOpen={isAnyModalOpen}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Home Page Floating Action Button (FAB) at Bottom Right */}
        <AnimatePresence>
          {activePage !== 2 && (
            <motion.button
              id="fab-add-goal"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setEditingGoal(null);
                setIsAddOpen(true);
              }}
              className="absolute bottom-6 right-6 w-14 h-14 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-xl flex items-center justify-center z-30 font-black cursor-pointer animate-none hover:rotate-90 transition-transform duration-300"
            >
              <Plus className="w-7 h-7" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* BOTTOM DEVICE NAVIGATION BAR / PILL CONTAINER */}
        <div className="hidden md:flex h-7 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 pb-2.5 z-40 items-center justify-center pt-1.5 select-none transition">
          <div className="w-32 h-1 bg-stone-800 dark:bg-stone-600 rounded-full cursor-pointer hover:bg-purple-400" />
        </div>
      </div>

      {/* PORTALS & SHEET TOGGLES (Add Goal Popup, Goal Details, Profile Page) */}
      <AnimatePresence>
        {isAddOpen && (
          <AddGoalPopup
            onClose={() => {
              setIsAddOpen(false);
              setEditingGoal(null);
            }}
            onSave={handleAddOrEditGoal}
            editingGoal={editingGoal}
          />
        )}

        {activeDetailGoal && (
          <GoalDetails
            goal={activeDetailGoal}
            progressList={progressList}
            onUpdateProgress={handleUpdateDailyProgress}
            onClose={() => setActiveDetailGoal(null)}
          />
        )}

        {isProfileOpen && (
          <ProfilePage
            profile={profile}
            onSave={(updated) => {
              setProfile(updated);
              setIsProfileOpen(false);
            }}
            onClose={() => setIsProfileOpen(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        isDestructive={confirmState.isDestructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeCtxProvider>
      <Dashboard />
    </ThemeCtxProvider>
  );
}
