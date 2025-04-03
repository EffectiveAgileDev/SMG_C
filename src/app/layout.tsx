import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Social Media Content Generator',
  description: 'A powerful tool for generating and managing social media content',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <div className="min-h-screen bg-background">
          <div className="flex">
            {/* Sidebar Navigation */}
            <aside className="w-64 min-h-screen bg-gray-900 text-white">
              <nav className="p-4">
                <div className="mb-8">
                  <h1 className="text-xl font-bold">ContentGen</h1>
                </div>
                <ul className="space-y-2">
                  <li>
                    <a href="/calendar" className="flex items-center p-2 hover:bg-gray-800 rounded">
                      <span>Calendar</span>
                    </a>
                  </li>
                  <li>
                    <a href="/posts" className="flex items-center p-2 hover:bg-gray-800 rounded">
                      <span>Posts</span>
                    </a>
                  </li>
                  <li>
                    <a href="/platforms" className="flex items-center p-2 hover:bg-gray-800 rounded">
                      <span>Platforms</span>
                    </a>
                  </li>
                  <li>
                    <a href="/library" className="flex items-center p-2 hover:bg-gray-800 rounded">
                      <span>Image Library</span>
                    </a>
                  </li>
                  <li>
                    <a href="/settings" className="flex items-center p-2 hover:bg-gray-800 rounded">
                      <span>Settings</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}