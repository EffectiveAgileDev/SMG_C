import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import type { APIKeyDisplayProps } from './types';

export function APIKeyCard({ apiKey, onRotate, onDeactivate }: APIKeyDisplayProps) {
  const [isRotating, setIsRotating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);

  const handleRotate = async () => {
    try {
      setIsRotating(true);
      setRotateError(null);
      await onRotate(apiKey.id);
    } catch (error) {
      setRotateError("Could not rotate key");
    } finally {
      setIsRotating(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setIsDeactivating(true);
      await onDeactivate(apiKey.id);
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{apiKey.keyName}</h3>
          <p className="text-sm text-gray-500">{apiKey.platformType}</p>
        </div>
        <div className="flex items-center space-x-2">
          {apiKey.isActive ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              Inactive
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-500">
        <p>Created: {format(new Date(apiKey.createdAt), 'PPp')}</p>
        {apiKey.expiresAt && (
          <p>Expires: {format(new Date(apiKey.expiresAt), 'PPp')}</p>
        )}
        {apiKey.lastUsed && (
          <p>Last used: {format(new Date(apiKey.lastUsed), 'PPp')}</p>
        )}
      </div>

      {rotateError && (
        <div className="text-sm text-red-500">
          {rotateError}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {apiKey.isActive && (
          <>
            <Button
              variant="outline"
              onClick={handleRotate}
              disabled={isRotating}
            >
              {isRotating ? 'Rotating...' : 'Rotate Key'}
            </Button>
            <ConfirmationDialog
              title="Deactivate API Key"
              description={`Are you sure you want to deactivate the API key "${apiKey.keyName}"? This action cannot be undone.`}
              confirmLabel="Deactivate"
              cancelLabel="Cancel"
              onConfirm={handleDeactivate}
              isLoading={isDeactivating}
              trigger={
                <Button variant="destructive">
                  Deactivate
                </Button>
              }
            />
          </>
        )}
      </div>
    </div>
  );
} 