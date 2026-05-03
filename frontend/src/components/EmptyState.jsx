export default function EmptyState({ 
  icon = 'inbox', 
  title = 'No data yet', 
  description = 'Get started by adding your first item',
  actionLabel = 'Get Started',
  onAction,
  illustration = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <span className="material-icons text-gray-400 text-5xl">{icon}</span>
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 max-w-md mb-6 leading-relaxed">{description}</p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all inline-flex items-center gap-2"
        >
          <span className="material-icons text-lg">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
