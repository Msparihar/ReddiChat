import React from 'react';

const RedditCommunities = () => {
  const communities = [
    { name: 'r/AskReddit', members: '44.2M', icon: '🤔' },
    { name: 'r/funny', members: '42.1M', icon: '😂' },
    { name: 'r/gaming', members: '38.9M', icon: '🎮' },
    { name: 'r/Music', members: '32.4M', icon: '🎵' },
    { name: 'r/pics', members: '30.1M', icon: '📸' },
    { name: 'r/videos', members: '28.7M', icon: '🎥' },
    { name: 'r/memes', members: '26.3M', icon: '😄' },
    { name: 'r/Showerthoughts', members: '24.8M', icon: '🚿' },
    { name: 'r/aww', members: '23.5M', icon: '🐾' },
    { name: 'r/technology', members: '22.1M', icon: '💻' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4 drop-shadow-lg">Top Reddit Communities</h3>
      <div className="grid grid-cols-2 gap-3">
        {communities.map((community, index) => (
          <div
            key={community.name}
            className="flex items-center space-x-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 hover:border-white/30 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
          >
            <div className="text-2xl drop-shadow-sm">{community.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate drop-shadow-sm">
                {community.name}
              </p>
              <p className="text-xs text-white/70 font-medium">
                {community.members} members
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center pt-2">
        <p className="text-sm text-white/80 font-medium drop-shadow-sm">
          Join these communities to start conversations
        </p>
      </div>
    </div>
  );
};

export default RedditCommunities;
