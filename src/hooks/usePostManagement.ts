import { useState } from 'react';
import { isPlatformConnected } from '../utils/platforms';

interface Post {
  id: number;
  content: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_for: string;
  platforms: string[];
}

interface NewPost {
  content: string;
  platforms: string[];
  scheduled_for: string;
}

interface UsePostManagementProps {
  initialPosts?: Post[];
}

export function usePostManagement({ initialPosts = [] }: UsePostManagementProps = {}) {
  const [showDialog, setShowDialog] = useState(false);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [platformToConnect, setPlatformToConnect] = useState<string | null>(null);
  const [newPost, setNewPost] = useState<NewPost>({
    content: '',
    platforms: [],
    scheduled_for: '',
  });
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);

  const handleSlotClick = (date: Date, hour: number) => {
    const scheduled_for = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        0,
        0,
        0
      )
    ).toISOString();
    
    setNewPost(prev => ({ ...prev, scheduled_for }));
    setShowDialog(true);
  };

  const handlePlatformToggle = (platform: string) => {
    if (!isPlatformConnected(platform)) {
      setPlatformToConnect(platform);
      setShowConnectionDialog(true);
      setShowDialog(false);
      return;
    }

    setNewPost(prev => {
      const updatedPlatforms = prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform];
      
      return {
        ...prev,
        platforms: updatedPlatforms
      };
    });
  };

  const handleConnectPlatform = () => {
    // In a real app, this would initiate OAuth flow
    setShowConnectionDialog(false);
    setPlatformToConnect(null);
  };

  const handleDragStart = (postId: number) => {
    setDraggedPostId(postId);
  };

  const handleDrop = (date: Date, hour: number) => {
    if (draggedPostId === null) return;

    // Create a UTC date for the new scheduled time
    const newScheduledFor = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        hour,
        0,
        0,
        0
      )
    ).toISOString();

    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === draggedPostId
          ? { ...post, scheduled_for: newScheduledFor }
          : post
      )
    );
    setDraggedPostId(null);
  };

  const handleCreatePost = (post: NewPost) => {
    // In a real app, this would send the post to the backend
    const newId = Math.max(0, ...posts.map(p => p.id)) + 1;
    
    setPosts(prevPosts => [
      ...prevPosts,
      {
        id: newId,
        content: post.content,
        platforms: post.platforms,
        scheduled_for: post.scheduled_for,
        status: 'scheduled'
      }
    ]);
    
    setShowDialog(false);
  };

  return {
    posts,
    newPost,
    showDialog,
    showConnectionDialog,
    platformToConnect,
    handleSlotClick,
    handlePlatformToggle,
    handleConnectPlatform,
    handleDragStart,
    handleDrop,
    handleCreatePost,
    setShowDialog,
    setShowConnectionDialog,
    setNewPost
  };
}

export default usePostManagement; 