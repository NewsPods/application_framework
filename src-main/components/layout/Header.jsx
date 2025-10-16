import React from 'react';
import { useAtom } from 'jotai';
import { Bell, Headphones, Sparkles } from 'lucide-react';
import { userAtom } from '../../store/atoms/authAtoms';

const Header = () => {
  const [user] = useAtom(userAtom);

  return (
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-purple-900/80 to-pink-900/80 backdrop-blur-xl border-b border-purple-500/20 z-50">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Headphones className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">NewsPod</h1>
              <p className="text-xs text-purple-200">AI-Powered News</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-lg hover:bg-white/10 transition">
              <Bell className="w-5 h-5 text-purple-200" />
            </button>
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-xs font-medium text-purple-200">
                {user?.subscription === 'premium' ? 'Pro' : 'Free'}
              </span>
              </div>
            </div>
          </div>
        </div>
      </header>
  );
};

export default Header;
