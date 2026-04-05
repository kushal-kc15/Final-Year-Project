import { useEffect } from 'react';

function Toast({ message, type = 'error', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const icons = {
    error: 'error',
    success: 'check_circle',
    info: 'info',
  };

  return (
    <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg z-[100] max-w-sm ${styles[type]}`}>
      <span className="material-icons text-sm">{icons[type]}</span>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 transition-opacity">
        <span className="material-icons text-sm">close</span>
      </button>
    </div>
  );
}

export default Toast;