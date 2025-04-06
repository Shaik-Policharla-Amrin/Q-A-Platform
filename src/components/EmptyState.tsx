import React from 'react';
import { SearchX } from 'lucide-react';

// Define the props for the EmptyState component
interface EmptyStateProps {
  message: string; // Main message to display
  submessage?: string; // Optional submessage
}

// Functional component for displaying an empty state
const EmptyState: React.FC<EmptyStateProps> = ({ message, submessage }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Icon */}
      <SearchX className="h-16 w-16 text-gray-400 mb-4" />
      
      {/* Main message */}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      
      {/* Optional submessage */}
      {submessage && (
        <p className="text-sm text-gray-500 text-center max-w-sm">{submessage}</p>
      )}
    </div>
  );
};

export default EmptyState;