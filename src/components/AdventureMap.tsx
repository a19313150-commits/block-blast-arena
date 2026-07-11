/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Trophy, ChevronRight, Lock, Check, Play, Award, HelpCircle } from 'lucide-react';
import { Level, UserProfile } from '../types';
import { generateLevels, audio } from '../utils';

interface AdventureMapProps {
  profile: UserProfile;
  onSelectLevel: (level: Level) => void;
  onClose: () => void;
}

export default function AdventureMap({ profile, onSelectLevel, onClose }: AdventureMapProps) {
  const levels = generateLevels();
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the current active level on mount
  useEffect(() => {
    if (containerRef.current) {
      const activeIdx = Math.max(0, profile.completedLevels.length);
      const activeLevelElem = document.getElementById(`level-node-${activeIdx + 1}`);
      if (activeLevelElem) {
        activeLevelElem.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [profile.completedLevels]);

  const isLevelUnlocked = (levelId: number) => {
    if (levelId === 1) return true;
    return profile.completedLevels.includes(levelId - 1);
  };

  const isLevelCompleted = (levelId: number) => {
    return profile.completedLevels.includes(levelId);
  };

  const handleLevelClick = (level: Level) => {
    if (!isLevelUnlocked(level.id)) {
      audio.playGameOver(); // Buzzer sound
      return;
    }
    audio.playClick();
    setSelectedLevel(level);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="relative bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-xl h-[90vh] flex flex-col text-white shadow-2xl"
      >
        {/* Floating sparkles background */}
        <div className="absolute top-20 left-1/4 w-32 h-32 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
              <Map className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans">نقشه ماجراجویی بلاک‌ها</h2>
              <p className="text-[11px] text-slate-400 font-sans">Adventure Quest Levels Map</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Completed stats */}
            <div className="bg-slate-800/80 px-3.5 py-1 rounded-full flex items-center gap-1.5 border border-slate-700/50">
              <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-bold font-sans">
                {profile.completedLevels.length} / ۳۰
              </span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full hover:scale-105 active:scale-95 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Map Path */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto p-8 relative flex flex-col items-center bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.6),transparent)]"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
          {/* Vertical Connecting Curved SVG Path */}
          <svg className="absolute w-full h-[1800px] top-10 left-0 pointer-events-none z-0 overflow-visible opacity-25">
            <path
              d={levels.reduce((pathString, lvl, idx) => {
                const stepY = 100 + idx * 130;
                // Wobble horizontally to create a nice winding path
                const xOffset = Math.sin(idx * 0.8) * 60 + 288; // 288 is center of 576px (max-w-xl)
                if (idx === 0) return `M ${xOffset} ${stepY}`;
                return `${pathString} Q ${Math.sin((idx - 0.5) * 0.8) * 60 + 288} ${stepY - 65}, ${xOffset} ${stepY}`;
              }, '')}
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeDasharray="10, 10"
              className="animate-[dash_20s_linear_infinite]"
            />
          </svg>

          {/* Level Nodes */}
          <div className="relative z-10 w-full flex flex-col gap-[75px] items-center my-6">
            {levels.map((level, idx) => {
              const unlocked = isLevelUnlocked(level.id);
              const completed = isLevelCompleted(level.id);
              const active = unlocked && !completed;
              // Align wobble offset matching the SVG coordinates above
              const xOffset = Math.sin(idx * 0.8) * 60;

              return (
                <div
                  id={`level-node-${level.id}`}
                  key={level.id}
                  style={{ transform: `translateX(${xOffset}px)` }}
                  className="relative flex items-center justify-center transition-all duration-300"
                >
                  {/* Outer circle layout */}
                  <motion.button
                    whileHover={unlocked ? { scale: 1.15 } : {}}
                    whileTap={unlocked ? { scale: 0.95 } : {}}
                    onClick={() => handleLevelClick(level)}
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold font-sans text-lg border-3 shadow-xl transition-all cursor-pointer relative ${
                      completed
                        ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 border-emerald-300 shadow-emerald-500/20 text-slate-950'
                        : active
                        ? 'bg-gradient-to-tr from-yellow-400 to-amber-500 border-amber-300 shadow-amber-500/40 text-slate-950 animate-bounce'
                        : 'bg-slate-900 border-slate-800 text-slate-600 shadow-none cursor-not-allowed'
                    }`}
                  >
                    {completed ? (
                      <Check className="w-6 h-6 stroke-[3.5]" />
                    ) : !unlocked ? (
                      <Lock className="w-5 h-5 text-slate-700" />
                    ) : (
                      level.id
                    )}

                    {/* Stage Glowing Ring if Active */}
                    {active && (
                      <div className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping opacity-35" />
                    )}
                  </motion.button>

                  {/* Level details / stars indicator under node */}
                  <div className="absolute -bottom-6 flex justify-center w-max gap-0.5 pointer-events-none bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-800/40">
                    <span className={`text-[10px] font-sans font-medium tracking-tight ${unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                      {level.nameFa}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Level Details Drawer / Overlay */}
        <AnimatePresence>
          {selectedLevel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/85 flex items-end justify-center z-40 rounded-3xl p-4"
              onClick={() => setSelectedLevel(null)}
            >
              <motion.div
                initial={{ y: 200 }}
                animate={{ y: 0 }}
                exit={{ y: 200 }}
                className="bg-slate-900 border border-slate-700/50 w-full rounded-2xl p-6 text-right max-w-md shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedLevel(null)}
                  className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full"
                >
                  ✕
                </button>

                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                  <span className="text-emerald-400 font-bold font-sans flex items-center gap-1">
                    <Award className="w-4 h-4 text-emerald-400" />
                    مرحله {selectedLevel.id}
                  </span>
                  <h3 className="text-xl font-bold font-sans">جزئیات مرحله (Stage Objectives)</h3>
                </div>

                {/* Objectives list */}
                <div className="space-y-3 my-5">
                  <p className="text-xs text-slate-400 mb-1 font-sans">اهداف برد مرحله:</p>
                  
                  <div className="bg-slate-950/60 p-4 rounded-xl space-y-2.5 text-right font-sans">
                    {/* Goal 1: Target Score */}
                    <div className="flex justify-between items-center">
                      <span className="text-amber-400 font-extrabold">{selectedLevel.targetScore} امتیاز</span>
                      <span className="text-slate-300 text-xs">کسب امتیاز هدف:</span>
                    </div>

                    {/* Goal 2: Target Line Clears */}
                    {selectedLevel.targetLineClears && (
                      <div className="flex justify-between items-center">
                        <span className="text-sky-400 font-extrabold">{selectedLevel.targetLineClears} ردیف</span>
                        <span className="text-slate-300 text-xs">پاکسازی کامل ردیف/ستون:</span>
                      </div>
                    )}

                    {/* Goal 3: Target Gems */}
                    {selectedLevel.targetGems && (
                      <div className="flex justify-between items-center">
                        <span className="text-purple-400 font-extrabold">{selectedLevel.targetGems} عدد جواهر</span>
                        <span className="text-slate-300 text-xs">شکستن و جمع‌آوری جواهرات:</span>
                      </div>
                    )}

                    {/* Goal 4: Target Color Clears */}
                    {selectedLevel.targetColorClears && (
                      <div className="flex justify-between items-center">
                        <span className="text-rose-400 font-extrabold">{selectedLevel.targetColorClears.count} خانه {selectedLevel.targetColorClears.color === 'amber' ? 'زرد' : selectedLevel.targetColorClears.color === 'sky' ? 'آبی' : selectedLevel.targetColorClears.color === 'rose' ? 'قرمز' : selectedLevel.targetColorClears.color === 'emerald' ? 'سبز' : 'بنفش'}</span>
                        <span className="text-slate-300 text-xs">حذف آجرهای رنگی خاص:</span>
                      </div>
                    )}

                    {/* Goal 5: Moves Limits if any */}
                    {selectedLevel.movesLimit && (
                      <div className="flex justify-between items-center border-t border-slate-800 pt-2.5">
                        <span className="text-red-400 font-extrabold">{selectedLevel.movesLimit} حرکت</span>
                        <span className="text-slate-300 text-xs">محدودیت تعداد حرکت‌ها:</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rewards list */}
                <div className="mb-6">
                  <p className="text-xs text-slate-400 mb-1.5 font-sans">جوایز پیروزی (Rewards):</p>
                  <div className="flex justify-end gap-3 font-sans">
                    <span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-yellow-400 font-bold text-xs flex items-center gap-1.5">
                      {selectedLevel.rewardCoins} سکه
                      <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full inline-block shadow-[0_0_8px_#fbbf24]" />
                    </span>
                    <span className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-lg text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                      +{selectedLevel.rewardXP} XP
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full inline-block shadow-[0_0_8px_#34d399]" />
                    </span>
                  </div>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => onSelectLevel(selectedLevel)}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer font-sans"
                >
                  <Play className="w-5 h-5 fill-current" />
                  شروع مرحله {selectedLevel.id} (Play Stage)
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
