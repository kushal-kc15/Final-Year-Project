import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function OnboardingChecklist({ onClose }) {
  const [tasks, setTasks] = useState([
    { id: 'profile', label: 'Complete your profile', completed: false, link: '/settings' },
    { id: 'expense', label: 'Add your first expense', completed: false, link: '/expenses' },
    { id: 'budget', label: 'Set up a budget', completed: false, link: '/budgets' },
    { id: 'team', label: 'Invite a team member', completed: false, link: '/team' },
    { id: 'report', label: 'View your first report', completed: false, link: '/reports' }
  ]);

  const [isMinimized, setIsMinimized] = useState(false);

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  if (completedCount === tasks.length) {
    return null; // Hide when all tasks completed
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-white rounded-full shadow-2xl p-4 hover:shadow-xl transition-all border border-gray-200 flex items-center gap-3"
        >
          <div className="relative">
            <span className="material-icons text-blue-500 text-2xl">checklist</span>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {completedCount}
            </div>
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {completedCount}/{tasks.length} completed
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-40 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <span className="material-icons">rocket_launch</span>
            Getting Started
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <span className="material-icons text-lg">minimize</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
            >
              <span className="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{completedCount} of {tasks.length} completed</span>
            <span className="font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {tasks.map((task) => (
          <Link
            key={task.id}
            to={task.link}
            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all hover:shadow-md ${
              task.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200 hover:border-blue-300'
            }`}
          >
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleTask(task.id);
              }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                task.completed
                  ? 'bg-green-500 border-green-500'
                  : 'border-gray-300 hover:border-blue-500'
              }`}
            >
              {task.completed && (
                <span className="material-icons text-white text-sm">check</span>
              )}
            </button>
            <span className={`flex-1 text-sm font-medium ${
              task.completed ? 'text-green-700 line-through' : 'text-gray-700'
            }`}>
              {task.label}
            </span>
            {!task.completed && (
              <span className="material-icons text-gray-400 text-lg">arrow_forward</span>
            )}
          </Link>
        ))}
      </div>

      {/* Footer */}
      {completedCount === tasks.length && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <div className="flex items-center gap-3">
            <span className="material-icons text-green-600 text-2xl">celebration</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-green-900">All done!</p>
              <p className="text-xs text-green-700">You're all set to manage expenses</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
