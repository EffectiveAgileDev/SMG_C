import React, { useState } from 'react';
import { PLATFORMS, validateContent } from '../../utils/platforms';

interface PostDialogProps {
  onClose: () => void;
  onSave: (post: NewPost) => void;
  initialPost: NewPost;
  onPlatformToggle: (platform: string) => void;
}

interface NewPost {
  content: string;
  platforms: string[];
  scheduled_for: string;
}

export default function PostDialog({ onClose, onSave, initialPost, onPlatformToggle }: PostDialogProps) {
  const [post, setPost] = useState<NewPost>(initialPost);
  const [contentError, setContentError] = useState<string | null>(null);

  const handleContentChange = (content: string) => {
    setPost(prev => {
      const updated = { ...prev, content };
      const error = validateContent(content, updated.platforms);
      setContentError(error);
      return updated;
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog">
      <div className="bg-white p-4 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-semibold mb-4">Create a Post</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Platforms</label>
            <div className="mt-2 space-y-2">
              {PLATFORMS.map(({ platform, connected }) => (
                <label key={platform} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={post.platforms.includes(platform)}
                    onChange={() => onPlatformToggle(platform)}
                    disabled={!connected}
                    className="mr-2"
                    aria-label={platform.toLowerCase()}
                  />
                  {platform}
                  {!connected && (
                    <span className="ml-2 text-xs text-red-600">
                      (Not Connected)
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="post-content">Post Content</label>
            <textarea
              id="post-content"
              aria-label="post content"
              value={post.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm ${
                contentError ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={4}
            />
            {contentError && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {contentError}
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(post)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={!!contentError}
            >
              Create Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 