import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, Filter, Plus, User, Info, AlertTriangle } from 'lucide-react';
import { TimelineTask, EventDayScheduleItem, TaskPriority } from '../../types';
import { calculateProgress } from '../../lib/math';

interface TimelineTabProps {
  timeline: TimelineTask[];
  daySchedule: EventDayScheduleItem[];
  eventDate: string;
  onUpdateTimeline: (updatedTasks: TimelineTask[]) => void;
  onUpdateSchedule?: (updatedSchedule: EventDayScheduleItem[]) => void;
  isReadOnly?: boolean;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  timeline,
  daySchedule,
  eventDate,
  onUpdateTimeline,
  onUpdateSchedule,
  isReadOnly,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'daySchedule'>('timeline');

  // New task form state
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('Logistics');
  const [newTaskOffset, setNewTaskOffset] = useState(7);
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const { total, completed, percentage } = calculateProgress(timeline);

  const toggleTask = (taskId: string) => {
    if (isReadOnly) return;
    const updated = timeline.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    onUpdateTimeline(updated);
  };

  const handleAddNewTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const eventDateObj = new Date(eventDate);
    const targetDateObj = new Date(eventDateObj.getTime() - newTaskOffset * 86400000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newTask: TimelineTask = {
      id: `task-manual-${Date.now()}`,
      title: newTaskTitle.trim(),
      category: newTaskCategory,
      dueOffsetDays: newTaskOffset,
      targetDate: targetDateObj.toISOString().split('T')[0],
      priority: newTaskPriority,
      completed: false,
      isOverdue: targetDateObj < today,
      isCompressed: false,
    };

    onUpdateTimeline([...timeline, newTask].sort((a, b) => a.targetDate.localeCompare(b.targetDate)));
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const filteredTasks = priorityFilter === 'all'
    ? timeline
    : timeline.filter((t) => t.priority === priorityFilter);

  const overdueCount = timeline.filter((t) => t.isOverdue && !t.completed).length;
  const compressedCount = timeline.filter((t) => t.isCompressed).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Sub-tab navigation */}
      <div className="flex items-center justify-between border-b border-ivory-300 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('timeline')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'timeline'
                ? 'bg-plum-900 text-white shadow-soft'
                : 'text-stone-700 hover:text-plum-900 hover:bg-ivory-200'
            }`}
          >
            Planning Timeline & Checklist ({timeline.length})
          </button>
          <button
            onClick={() => setActiveSubTab('daySchedule')}
            type="button"
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeSubTab === 'daySchedule'
                ? 'bg-plum-900 text-white shadow-soft'
                : 'text-stone-700 hover:text-plum-900 hover:bg-ivory-200'
            }`}
          >
            Event-Day Schedule ({daySchedule.length})
          </button>
        </div>

        {/* Global Progress Pill */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-stone-700">Checklist Completion:</span>
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-32 h-2 bg-ivory-300 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-800">{percentage}%</span>
          </div>
        </div>
      </div>

      {activeSubTab === 'timeline' ? (
        <div className="space-y-6">
          {/* Overdue or Compressed Notices */}
          {(overdueCount > 0 || compressedCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {overdueCount > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-semibold">Unavoidable Overdue Tasks ({overdueCount}):</strong>
                    <p className="mt-0.5">
                      Because the event date is approaching, some preparatory milestones fall before today. Address these urgently.
                    </p>
                  </div>
                </div>
              )}

              {compressedCount > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <strong className="font-semibold">Compressed Timeline ({compressedCount}):</strong>
                    <p className="mt-0.5">
                      Target dates were mathematically condensed into your remaining window to prevent logistical bottlenecks.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar & Add Task */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-4 rounded-2xl border border-ivory-300 shadow-soft">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-stone-700" />
              <span className="text-xs font-semibold text-stone-700">Filter Priority:</span>
              {(['all', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  type="button"
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium capitalize transition-colors ${
                    priorityFilter === p
                      ? 'bg-plum-900 text-white'
                      : 'bg-ivory-200 text-stone-700 hover:bg-ivory-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {!isReadOnly && (
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-coral-600 hover:bg-coral-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Task</span>
              </button>
            )}
          </div>

          {/* Add Task Modal/Card */}
          {showAddTask && (
            <form onSubmit={handleAddNewTask} className="p-5 rounded-2xl bg-coral-50/50 border border-coral-200 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-coral-900">Add New Milestone Task</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Task title (e.g. Confirm wedding car rental)"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-coral-300 bg-white"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Days before event"
                    value={newTaskOffset}
                    onChange={(e) => setNewTaskOffset(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-coral-300 bg-white"
                  />
                </div>
                <div>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-coral-300 bg-white"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-3 py-1 text-xs text-stone-700 hover:bg-stone-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-semibold text-white bg-coral-600 hover:bg-coral-700 rounded-lg"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  task.completed
                    ? 'bg-emerald-50/40 border-emerald-200 opacity-80'
                    : task.isOverdue
                    ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                    : 'bg-white border-ivory-300 hover:border-plum-300 shadow-soft'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={isReadOnly}
                      onChange={() => toggleTask(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded text-coral-600 focus:ring-coral-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs sm:text-sm font-semibold ${task.completed ? 'line-through text-stone-700' : 'text-plum-950'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-ivory-300 text-stone-700 font-medium">
                        {task.category}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-800'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      {task.isCompressed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                          Compressed
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p className="text-xs text-stone-700 mt-1">{task.notes}</p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-stone-700">
                    <Calendar className="w-3.5 h-3.5 text-stone-600" />
                    <span className="font-mono font-medium">{task.targetDate}</span>
                  </div>
                  {task.isOverdue && !task.completed && (
                    <span className="text-[10px] font-bold text-rose-600 block mt-0.5">
                      ⚠️ Overdue
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Event-Day Schedule Sub-Tab */
        <div className="bg-white rounded-3xl border border-ivory-300 shadow-soft overflow-hidden">
          <div className="p-6 border-b border-ivory-300">
            <h3 className="font-serif font-bold text-lg text-plum-950">Event-Day Minute-by-Minute Run Sheet</h3>
            <p className="text-xs text-stone-700">Strict sequencing, team ownership, and operational cues</p>
          </div>

          <div className="divide-y divide-ivory-200">
            {daySchedule.map((item, idx) => (
              <div key={item.id || idx} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-ivory-50/80 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-plum-100 flex items-center justify-center text-plum-900 shrink-0 font-mono text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-coral-700 bg-coral-50 px-2 py-0.5 rounded border border-coral-200">
                        {item.time}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-plum-950">{item.activity}</h4>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-stone-700 mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-stone-600 shrink-0" />
                        <span>{item.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-plum-950 font-medium px-3 py-1.5 rounded-xl bg-ivory-200 shrink-0">
                  <User className="w-3.5 h-3.5 text-plum-700" />
                  <span>Lead: {item.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
