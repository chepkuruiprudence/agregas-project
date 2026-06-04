interface OrderTimelineProps {
  status: string;
  createdAt: string;
}

/**
 * Shows the order lifecycle timeline
 * Highlights completed stages and current stage
 */
export const OrderTimeline = ({ status, createdAt }: OrderTimelineProps) => {
  const statuses = [
    { key: 'pending', label: 'Ordered', date: new Date(createdAt).toLocaleDateString() },
    { key: 'confirmed', label: 'Confirmed', date: 'Within 1h' },
    { key: 'processing', label: 'Processing', date: '1-2h' },
    { key: 'in_delivery', label: 'In Transit', date: '2-4h' },
    { key: 'delivered', label: 'Delivered', date: 'Pending' },
  ];

  const isStatusCompleted = (checkStatus: string) => {
    const currentIndex = statuses.findIndex(s => s.key === status?.toLowerCase());
    const checkIndex = statuses.findIndex(s => s.key === checkStatus);
    return checkIndex <= currentIndex;
  };

  return (
    <div className="border-t border-gray-100 p-4 sm:p-6">
      <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-4">Order Timeline</p>
      
      {/* Mobile: Vertical Timeline */}
      <div className="sm:hidden space-y-4">
        {statuses.map((item, index) => {
          const isCompleted = isStatusCompleted(item.key);
          const isActive = status?.toLowerCase() === item.key;
          
          return (
            <div key={item.key}>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-gray-300'
                    }`}
                  >
                    {isCompleted && index !== statuses.length - 1 ? '✓' : ''}
                  </div>
                  {index < statuses.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}
                    />
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item.label}
                  </p>
                  <p className={`text-xs ${isCompleted || isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden sm:flex justify-between items-end">
        {statuses.map((item, index) => {
          const isCompleted = isStatusCompleted(item.key);
          const isActive = status?.toLowerCase() === item.key;
          
          return (
            <div key={item.key} className="flex-1">
              <div className="relative">
                {/* Timeline dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500 ring-2 ring-blue-300' : 'bg-gray-300'
                    }`}
                  >
                    {isCompleted && index !== statuses.length - 1 ? '✓' : ''}
                  </div>
                  
                  {/* Connector line */}
                  {index < statuses.length - 1 && (
                    <div
                      className={`absolute top-2 left-1/2 w-full h-0.5 -ml-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      style={{ marginLeft: 'calc(50% + 8px)' }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className="mt-3 text-center">
                  <p className={`text-xs sm:text-sm font-semibold ${
                    isCompleted || isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isCompleted || isActive ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};