import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, Check, Clock, X, Volume2 } from 'lucide-react';
import { SimulatedNotification, Goal } from '../types';

interface NotificationCenterProps {
  notifications: SimulatedNotification[];
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  onMarkComplete: (goalId: string, notificationId: string) => void;
  goals: Goal[];
  onSimulateReminder: (goalId: string, time: string) => void;
}

export default function NotificationCenter({
  notifications,
  onDismiss,
  onSnooze,
  onMarkComplete,
  goals,
  onSimulateReminder,
}: NotificationCenterProps) {
  // Filter active (visible) triggered simulated notifications
  const activeNotifications = notifications.filter((n) => n.status === 'active');

  return (
    <>
      {/* Slide-down Android-style Push Notifications Container */}
      <div className="absolute top-12 left-0 right-0 z-50 flex flex-col gap-2 px-4 pointer-events-none">
        <AnimatePresence>
          {activeNotifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -80, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="w-full bg-stone-900/95 dark:bg-stone-950/95 text-stone-100 rounded-2xl shadow-xl border border-stone-800 pointer-events-auto overflow-hidden text-xs max-w-sm mx-auto"
            >
              {/* Notification Header / System bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-stone-800/60 text-stone-400 text-[10px]">
                <div className="flex items-center gap-1.5 font-medium tracking-tight">
                  <div className="w-4 h-4 bg-purple-600/20 text-purple-400 rounded flex items-center justify-center">
                    <Bell className="w-2.5 h-2.5" />
                  </div>
                  <span>MY GOALS &bull; SYSTEM ALARM</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Just now</span>
                  <button
                    onClick={() => onDismiss(notif.id)}
                    className="p-0.5 hover:bg-stone-800 rounded transition"
                  >
                    <X className="w-3 h-3 text-stone-400 hover:text-stone-200" />
                  </button>
                </div>
              </div>

              {/* Notification Content */}
              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-gradient-to-tr from-purple-500 to-indigo-600 text-white rounded-xl shadow-md">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-stone-100 text-sm">{notif.goalName}</h4>
                      {notif.snoozedCount > 0 && (
                        <span className="bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          Snoozed {notif.snoozedCount}x
                        </span>
                      )}
                    </div>
                    <p className="text-stone-300 mt-0.5 text-xs">
                      {notif.type === 'daily'
                        ? `Time to complete your daily goal! (Scheduled for ${notif.time})`
                        : `Your one-time goal is due! (Scheduled for ${notif.time})`}
                    </p>
                  </div>
                </div>

                {/* Android Quick Actions */}
                <div className="flex items-center justify-end gap-2 mt-3.5 border-t border-stone-800/40 pt-2 text-[10px]">
                  <button
                    onClick={() => onSnooze(notif.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-stone-800 text-amber-400 font-semibold rounded-lg transition"
                  >
                    <Clock className="w-3 h-3" />
                    SNOOZE
                  </button>
                  <button
                    onClick={() => onMarkComplete(notif.goalId, notif.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-sm transition"
                  >
                    <Check className="w-3 h-3" />
                    MARK COMPLETE
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Alarms / Reminders Diagnostics Drawer for presentation testing */}
      <div className="p-3 bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 rounded-b-3xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Bell className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Interactive Android Push Simulators</span>
          </div>
          <span className="text-[10px] text-stone-500 font-mono">Test reminders here!</span>
        </div>

        <div className="flex gap-2 pb-1 overflow-x-auto select-none no-scrollbar">
          {goals.length === 0 ? (
            <div className="text-[11px] text-stone-400 p-1 italic">
              No active goals with reminders yet. Click "+" to create one!
            </div>
          ) : (
            goals.map((g) => {
              if (g.reminders.length === 0) return null;
              return g.reminders.map((time) => (
                <button
                  key={`${g.id}-${time}`}
                  onClick={() => onSimulateReminder(g.id, time)}
                  className="flex flex-shrink-0 items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-full hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20 text-stone-700 dark:text-stone-300 transition text-[10px] font-medium shadow-sm"
                >
                  <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                  <span className="max-w-[70px] truncate">{g.name}</span>
                  <span className="text-stone-500 font-mono border-l dark:border-stone-700 pl-1">{time}</span>
                  <Volume2 className="w-2.5 h-2.5 text-stone-400" />
                </button>
              ));
            })
          )}
        </div>
      </div>
    </>
  );
}
