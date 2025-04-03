import React from 'react';

interface PlatformDialogProps {
  platform: string;
  onClose: () => void;
  onConnect: () => void;
}

export default function PlatformDialog({ platform, onClose, onConnect }: PlatformDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog">
      <div className="bg-white p-4 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Connect {platform}</h3>
        <p className="mb-4">Please connect your {platform} account to continue.</p>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConnect}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            data-testid={`connect-${platform.toLowerCase()}-button`}
          >
            Connect {platform} Account
          </button>
        </div>
      </div>
    </div>
  );
} 