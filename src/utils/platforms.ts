export interface PlatformConfig {
  platform: string;
  connected: boolean;
  charLimit: number;
}

export const PLATFORMS: PlatformConfig[] = [
  { platform: 'twitter', connected: true, charLimit: 280 },
  { platform: 'facebook', connected: true, charLimit: 63206 },
  { platform: 'instagram', connected: false, charLimit: 2200 },
  { platform: 'linkedin', connected: true, charLimit: 3000 }
];

export const validateContent = (content: string, platforms: string[]): string | null => {
  for (const platformName of platforms) {
    const platformConfig = PLATFORMS.find(p => p.platform === platformName);
    if (platformConfig?.charLimit && content.length > platformConfig.charLimit) {
      return `Exceeds ${platformName}'s character limit (${content.length}/${platformConfig.charLimit})`;
    }
  }
  return null;
};

export const isPlatformConnected = (platform: string): boolean => {
  const platformConfig = PLATFORMS.find(p => p.platform === platform);
  return platformConfig?.connected ?? false;
}; 