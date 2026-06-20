import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Bookmark,
  Check,
  X,
} from 'lucide-react';
import { Note } from '../types';

interface NotesTabProps {
  notes: Note[];
  onCreateNote: (title: string, content: string) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  isParentModalOpen?: boolean;
}

export default function NotesTab({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  isParentModalOpen,
}: NotesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const isModalActive = isParentModalOpen || isAddingNew || !!editingNote;

  // Forms state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [formError, setFormError] = useState('');

  // Search filter
  const filteredNotes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, searchQuery]);

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsAddingNew(false);
    setFormError('');
  };

  const handleOpenAdd = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setIsAddingNew(true);
    setFormError('');
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) {
      setFormError('Note title is required.');
      return;
    }

    if (editingNote) {
      onUpdateNote(editingNote.id, noteTitle.trim(), noteContent);
    } else {
      onCreateNote(noteTitle.trim(), noteContent);
    }

    // Reset states
    setEditingNote(null);
    setIsAddingNew(false);
    setNoteTitle('');
    setNoteContent('');
    setFormError('');
  };

  const formatDateLabel = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900 select-none pb-12">
      {/* Search Header and Quick FAB Row */}
      <div className="p-4 bg-white dark:bg-stone-850 border-b border-stone-200 dark:border-stone-800 space-y-3">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, checklists..."
            className="w-full pl-10 pr-4 py-2.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 dark:text-stone-100 transition shadow-sm"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-[10px] bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-600 dark:text-stone-350 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
              My Scratchpad ({filteredNotes.length} notes)
            </span>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] rounded-xl shadow-md transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Notes Grid */}
      <div className={`flex-1 p-4 space-y-3 no-scrollbar ${isModalActive ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto'}`}>
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-stone-250 dark:border-stone-800 rounded-3xl mt-4">
            <Bookmark className="w-10 h-10 text-stone-300 dark:text-stone-700 mb-2" />
            <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400">
              No Notes Match
            </h4>
            <p className="text-[10px] text-stone-400 max-w-[200px] mt-1">
              {searchQuery
                ? 'Try editing your keyword search terms.'
                : 'Tap "Create Note" to catalog goals, reflections, and reviews!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-stone-850 p-4 border border-stone-250/20 dark:border-stone-750 rounded-2xl shadow-xs relative flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-1.5">
                    <h3 className="text-sm font-black text-stone-900 dark:text-stone-100 group-hover:text-purple-600 transition truncate max-w-[220px]">
                      {note.title}
                    </h3>
                    <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                      <button
                        onClick={() => handleOpenEdit(note)}
                        className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded text-stone-500 dark:text-stone-400 hover:text-purple-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteNote(note.id)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/25 rounded text-stone-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Notes Preview Text */}
                  <p className="text-[11px] text-stone-600 dark:text-stone-350 line-clamp-3 whitespace-pre-line pr-1 font-medium leading-relaxed">
                    {note.content}
                  </p>
                </div>

                {/* Footer and modified timestamp */}
                <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500 font-bold">
                  <span className="flex items-center gap-1 uppercase">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Edited {formatDateLabel(note.lastModified)}</span>
                  </span>
                  <button
                    onClick={() => handleOpenEdit(note)}
                    className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline md:hidden"
                  >
                    Details &rarr;
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE & EDIT OVERLAY MODAL DRAWER */}
      <AnimatePresence>
        {(isAddingNew || editingNote) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center"
            onClick={() => {
              setIsAddingNew(false);
              setEditingNote(null);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 210 }}
              className="w-full max-w-md bg-stone-50 dark:bg-stone-900 border-t border-stone-200 dark:border-stone-850 rounded-t-[2.5rem] p-5 max-h-[85vh] overflow-y-auto no-scrollbar"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Notch bar */}
              <div className="mx-auto w-12 h-1.5 bg-stone-300 dark:bg-stone-700 rounded-full mb-6" />

              {/* Header block within overlay */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-200 dark:border-stone-850">
                <div>
                  <span className="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                    {editingNote ? 'Modify Active Note' : 'Draft Scratchpad Note'}
                  </span>
                  <h3 className="text-base font-black text-stone-900 dark:text-stone-50 mt-0.5">
                    {editingNote ? 'Edit Notes Scratchpad' : 'New Goals Entry'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingNote(null);
                  }}
                  className="p-1.5 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full text-stone-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-4">
                {/* Note title field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                    Note Subject / Title
                  </label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => {
                      setNoteTitle(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="e.g. Weekly Reflections, Fitness Routine"
                    className="w-full px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 text-stone-900 dark:text-stone-100 transition shadow-sm"
                  />
                  {formError && (
                    <span className="text-[10px] text-red-500 font-bold pl-1 mt-0.5">
                      {formError}
                    </span>
                  )}
                </div>

                {/* Note Content Textarea */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                    Note Content Body
                  </label>
                  <textarea
                    rows={8}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write down progress notes, thoughts, tasks checklist, or goal details here..."
                    className="w-full px-4 py-3 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-750 rounded-2xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-600 text-stone-900 dark:text-stone-100 transition shadow-sm leading-relaxed"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNew(false);
                      setEditingNote(null);
                    }}
                    className="flex-1 py-3 text-xs font-bold border border-stone-200 dark:border-stone-750 text-stone-700 dark:text-stone-300 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-2xl shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingNote ? 'Update Note' : 'Save Note'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
