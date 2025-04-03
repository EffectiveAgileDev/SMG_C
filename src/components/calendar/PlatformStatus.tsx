import React from 'react';
import { PLATFORMS } from '../../utils/platforms';

interface PlatformIconProps {
  platform: string;
}

const PlatformIcon = ({ platform }: PlatformIconProps) => {
  return (
    <div
      data-testid={`platform-icon-${platform.toLowerCase()}`}
      className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs"
      title={platform}
    >
      {platform[0].toUpperCase()}
    </div>
  );
};

export default function PlatformStatus() {
  return (
    <div data-testid="platform-status" className="mb-4 flex space-x-2">
      {PLATFORMS.map(({ platform, connected }) => (
        <div
          key={platform}
          className={`flex items-center space-x-2 px-3 py-1 rounded ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <PlatformIcon platform={platform} />
          <span>{platform}</span>
          <span className="text-xs">
            {connected ? '✓ Connected' : '× Not Connected'}
          </span>
        </div>
      ))}
    </div>
  );
} 