/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loadProfile, saveProfile, SKINS } from './utils';
import { UserProfile, Level, BoardCell } from './types';
import MainMenu from './components/MainMenu';
import GamePlay from './components/GamePlay';
import ArenaDuel from './components/ArenaDuel';
import DailyRewards from './components/DailyRewards';
import Shop from './components/Shop';
import AdventureMap from './components/AdventureMap';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Navigation states: 'menu' | 'classic' | 'adventure' | 'arena'
  const [view, setView] = useState<'menu' | 'classic' | 'adventure' | 'arena'>('menu');
  
  // Modal states
  const [showShop, setShowShop] = useState(false);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [showAdventureMap, setShowAdventureMap] = useState(false);
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);

  // Arena synchronization states
  const [arenaGrid, setArenaGrid] = useState<BoardCell[][]>(() =>
    Array(8)
      .fill(null)
      .map(() => Array(8).fill(null).map(() => ({ color: null })))
  );
  const [arenaScore, setArenaScore] = useState(0);
  const [arenaGameOver, setArenaGameOver] = useState(false);
  const [resetGameTrigger, setResetGameTrigger] = useState(0);

  // Load profile on startup
  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
  }, []);

  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  const selectLevelToPlay = (level: Level) => {
    setActiveLevel(level);
    setShowAdventureMap(false);
    setView('adventure');
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white font-sans">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm">در حال بارگذاری بلاک بلست...</p>
      </div>
    );
  }

  const currentSkin = SKINS.find((s) => s.id === profile.activeSkin) || SKINS[0];

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,rgba(30,27,75,0.4),transparent)] text-white overflow-x-hidden relative">
      
      {/* Decorative stars / dust particles background */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_1px,transparent_1px)]" style={{ backgroundSize: '32px 32px' }} />

      {/* Main Container */}
      <div className="relative z-10 w-full min-h-screen flex flex-col justify-between">
        
        {/* Router of Views */}
        <AnimatePresence mode="wait">
          {view === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full flex-1"
            >
              <MainMenu
                profile={profile}
                onUpdateProfile={handleUpdateProfile}
                onSelectMode={(mode) => setView(mode)}
                onOpenShop={() => setShowShop(true)}
                onOpenDailyRewards={() => setShowDailyRewards(true)}
                onOpenAdventureMap={() => setShowAdventureMap(true)}
              />
            </motion.div>
          )}

          {view === 'classic' && (
            <motion.div
              key="classic"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full flex-1"
            >
              <GamePlay
                profile={profile}
                mode="classic"
                selectedLevel={null}
                onUpdateProfile={handleUpdateProfile}
                onClose={() => setView('menu')}
              />
            </motion.div>
          )}

          {view === 'adventure' && activeLevel && (
            <motion.div
              key="adventure"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full flex-1"
            >
              <GamePlay
                profile={profile}
                mode="adventure"
                selectedLevel={activeLevel}
                onUpdateProfile={handleUpdateProfile}
                onClose={() => {
                  setActiveLevel(null);
                  setShowAdventureMap(true);
                  setView('menu');
                }}
              />
            </motion.div>
          )}

          {view === 'arena' && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="w-full flex-1"
            >
              {/* Render splitting interface with embedded interactive GamePlay */}
              <ArenaDuel
                profile={profile}
                skin={currentSkin}
                onUpdateProfile={handleUpdateProfile}
                onClose={() => setView('menu')}
                userGrid={arenaGrid}
                userScore={arenaScore}
                userGameOver={arenaGameOver}
                onGridChange={setArenaGrid}
                onScoreChange={setArenaScore}
                onGameOverChange={setArenaGameOver}
                onResetUserGame={() => {
                  setArenaGrid(
                    Array(8)
                      .fill(null)
                      .map(() => Array(8).fill(null).map(() => ({ color: null })))
                  );
                  setArenaScore(0);
                  setArenaGameOver(false);
                  setResetGameTrigger((prev) => prev + 1);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODALS AND DRAWERS PORTALS */}
        <AnimatePresence>
          {showShop && (
            <Shop
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onClose={() => setShowShop(false)}
            />
          )}

          {showDailyRewards && (
            <DailyRewards
              profile={profile}
              onUpdateProfile={handleUpdateProfile}
              onClose={() => setShowDailyRewards(false)}
            />
          )}

          {showAdventureMap && (
            <AdventureMap
              profile={profile}
              onSelectLevel={selectLevelToPlay}
              onClose={() => setShowAdventureMap(false)}
            />
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
