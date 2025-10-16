import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, Settings, User } from 'lucide-react';

const MobileNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/app', icon: Home, label: 'Home' },
    { path: '/app/library', icon: Bookmark, label: 'Library' },
    { path: '/app/preferences', icon: Settings, label: 'Preferences' },
    { path: '/app/profile', icon: User, label: 'Profile' },
  ];

  return (
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-900/95 to-pink-900/95 backdrop-blur-xl border-t border-purple-500/20 z-50">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex justify-around">
            {navItems.map(({ path, icon: Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                  <button
                      key={path}
                      onClick={() => navigate(path)}
                      className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all ${
                          isActive
                              ? 'text-white bg-white/10'
                              : 'text-purple-300 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
              );
            })}
          </div>
        </div>
      </nav>
  );
};

export default MobileNav;
