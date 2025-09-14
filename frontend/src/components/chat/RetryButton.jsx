import React from 'react';
import { useChatStore } from '../../stores/chat-store';

const RetryButton = ({ message }) => {
  const { retryFailedMessage, retryCount, maxRetries } = useChatStore();

  if (!message?.canRetry || retryCount >= maxRetries) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={retryFailedMessage}
        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        disabled={retryCount >= maxRetries}
      >
        {retryCount > 0 ? `Retry (${retryCount}/${maxRetries})` : 'Retry'}
      </button>
      <span className="text-xs text-gray-500">
        {retryCount > 0 && `${maxRetries - retryCount} attempts remaining`}
      </span>
    </div>
  );
};

export default RetryButton;
