import React from 'react';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to ContentGen</h1>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          title="Create Post"
          description="Create and schedule a new social media post"
          href="/posts/new"
        />
        <QuickActionCard
          title="View Calendar"
          description="Manage your content calendar"
          href="/calendar"
        />
        <QuickActionCard
          title="Image Library"
          description="Browse and manage your media assets"
          href="/library"
        />
      </div>

      {/* Recent Activity */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow p-4">
          {/* We'll populate this with actual data later */}
          <p className="text-gray-500">No recent activity</p>
        </div>
      </section>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
}

function QuickActionCard({ title, description, href }: QuickActionCardProps) {
  return (
    <a
      href={href}
      className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </a>
  );
}