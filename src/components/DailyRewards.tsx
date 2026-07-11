/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Coins, RefreshCw, Star, Zap, CheckCircle2 } from 'lucide-react';
import { PowerUps, UserProfile } from '../types';
import { audio } from '../utils';

interface DailyRewardsProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onClose: () => void;
}

const REWARDS_WHEEL = [
  { type: 'coins', amount: 100, label: '۱۰۰ سکه', labelEn: '100 Coins', color: 'from-yellow-400 to-amber-500', icon: Coins },
  { type: 'rotate', amount: 2, label: '۲ چرخش', labelEn: '2 Rotate', color: 'from-sky-400 to-blue-500', icon: RefreshCw },
  { type: 'coins', amount: 250, label: '۲۵۰ سکه', labelEn: '250 Coins', color: 'from-amber-500 to-orange-600', icon: Coins },
  { type: 'swap', amount: 1, label: '۱ تعویض', labelEn: '1 Swap', color: 'from-purple-400 to-indigo-500', icon: RefreshCw },
  { type: 'coins', amount: 50, label: '۵۰ سکه', labelEn: '50 Coins', color: 'from-yellow-300 to-amber-400', icon: Coins },
  { type: 'hammer', amount: 1, label: '۱ چکش', labelEn: '1 Hammer', color: 'from-red-400 to-rose-500', icon: Zap },
  { type: 'coins', amount: 500, label: '۵۰۰ سکه', labelEn: '500 Coins', color: 'from-yellow-500 to-orange-500 border-2 border-yellow-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]', icon: Coins },
  { type: 'undo', amount: 2, label: '۲ بازگشت', labelEn: '2 Undo', color: 'from-teal-400 to-emerald-500', icon: RefreshCw },
];

export default function DailyRewards({ profile, onUpdateProfile, onClose }: DailyRewardsProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<any | null>(null);
  const [claimedStreak, setClaimedStreak] = useState(false);

  const canClaimWheel = () => {
    if (!profile.lastClaimedDaily) return true;
    const lastClaimDate = new Date(profile.lastClaimedDaily).toDateString();
    const today = new Date().toDateString();
    return lastClaimDate !== today;
  };

  const spinWheel = () => {
    if (spinning || !canClaimWheel()) return;

    audio.playClick();
    setSpinning(true);
    setWonReward(null);

    // Randomize winning index
    const winningIndex = Math.floor(Math.random() * REWARDS_WHEEL.length);
    const degreePerItem = 360 / REWARDS_WHEEL.length;
    
    // Spin at least 5 times (1800 deg) plus the angle for the winning slice
    const totalRotation = rotation + 1800 + (360 - winningIndex * degreePerItem) - (rotation % 360);
    setRotation(totalRotation);

    // Play rapid tick sound effects in intervals
    let ticks = 0;
    const tickInterval = setInterval(() => {
      audio.playRotate();
      ticks++;
      if (ticks >= 25) clearInterval(tickInterval);
    }, 100);

    setTimeout(() => {
      clearInterval(tickInterval);
      const reward = REWARDS_WHEEL[winningIndex];
      setWonReward(reward);
      setSpinning(false);
      audio.playDailyReward();

      // Apply reward to profile
      const updated = { ...profile };
      updated.lastClaimedDaily = new Date().toISOString();
      updated.dailyStreak = (updated.dailyStreak || 0) + 1;

      if (reward.type === 'coins') {
        updated.coins += reward.amount;
      } else {
        const type = reward.type as keyof PowerUps;
        updated.powerups[type] = (updated.powerups[type] || 0) + reward.amount;
      }

      onUpdateProfile(updated);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-md p-6 shadow-2xl text-white overflow-hidden"
      >
        {/* Background Decorative Rings */}
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-pink-500/10 blur-2xl" />

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full hover:scale-105 active:scale-95 transition-all"
        >
          ✕
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-tr from-amber-400 to-orange-500 rounded-2xl shadow-lg mb-3">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight font-sans">جوایز روزانه شانس</h2>
          <p className="text-slate-400 text-sm mt-1 font-sans">Daily Lucky Spin & Chests</p>
        </div>

        {/* Streak Calendar Status */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-amber-400 font-sans">تعداد روزهای متوالی: {profile.dailyStreak || 0} روز</span>
            <span className="text-xs text-slate-400 font-sans">Daily Streak Status</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const active = (profile.dailyStreak || 0) >= day;
              const isToday = (profile.dailyStreak || 0) + 1 === day && canClaimWheel();
              return (
                <div 
                  key={day} 
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-sans transition-all ${
                    active 
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20' 
                      : isToday
                      ? 'bg-indigo-600/40 border border-indigo-400 text-white animate-pulse'
                      : 'bg-slate-800 border border-slate-700/30 text-slate-500'
                  }`}
                >
                  <span>روز {day}</span>
                  {active ? (
                    <CheckCircle2 className="w-4 h-4 mt-1" />
                  ) : (
                    <Coins className="w-4 h-4 mt-1 opacity-70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Spinning Wheel Section */}
        <div className="flex flex-col items-center justify-center relative my-8">
          {/* Outer Wheel Container */}
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-full border-8 border-slate-800 shadow-[0_0_25px_rgba(99,102,241,0.25)] flex items-center justify-center overflow-hidden">
            
            {/* Wheel itself */}
            <motion.div 
              style={{ rotate: rotation }}
              transition={{ type: 'tween', ease: 'easeOut', duration: 3 }}
              className="absolute w-full h-full rounded-full bg-slate-950"
            >
              {REWARDS_WHEEL.map((reward, i) => {
                const angle = 360 / REWARDS_WHEEL.length;
                const rot = i * angle;
                const Icon = reward.icon;

                return (
                  <div 
                    key={i}
                    className="absolute top-0 left-0 w-full h-full origin-center flex justify-center pt-2"
                    style={{ transform: `rotate(${rot}deg)` }}
                  >
                    {/* Slice color segment */}
                    <div 
                      className={`absolute top-0 w-0 h-0 border-l-[60px] border-l-transparent border-r-[60px] border-r-transparent border-t-[140px] opacity-10`}
                      style={{ borderTopColor: i % 2 === 0 ? '#f59e0b' : '#6366f1' }}
                    />
                    
                    {/* Slice contents */}
                    <div className="relative z-10 flex flex-col items-center select-none" style={{ transform: 'rotate(0deg)' }}>
                      <Icon className="w-5 h-5 text-white/90 drop-shadow mb-1" />
                      <span className="text-[10px] font-bold text-center leading-tight tracking-tight max-w-[40px] drop-shadow-md">
                        {reward.amount}
                      </span>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Wheel Center Button / Hub */}
            <div className="absolute w-14 h-14 bg-slate-900 border-4 border-slate-700 rounded-full shadow-lg flex items-center justify-center z-20">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            {/* Pointer Pin at top */}
            <div className="absolute top-0 z-30 transform -translate-y-1">
              <div className="w-4 h-6 bg-red-500 rounded-b-full shadow-md border-2 border-white" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
            </div>
          </div>

          {/* Spin Trigger Button / Locked Message */}
          <div className="mt-6 w-full px-6">
            {canClaimWheel() ? (
              <button
                disabled={spinning}
                onClick={spinWheel}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-lg rounded-2xl shadow-xl hover:shadow-amber-500/20 active:scale-95 transition-all font-sans cursor-pointer flex items-center justify-center gap-2"
              >
                {spinning ? 'در حال چرخش...' : 'چرخاندن چرخ شانس'}
              </button>
            ) : (
              <div className="text-center text-slate-400 text-sm font-sans py-3 bg-slate-800/40 rounded-2xl border border-slate-700/30">
                🔒 فردا دوباره برای جایزه رایگان مراجعه کنید!
                <div className="text-xs text-slate-500 mt-1">Spin available tomorrow!</div>
              </div>
            )}
          </div>
        </div>

        {/* Won Reward Popup */}
        <AnimatePresence>
          {wonReward && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-40 text-center"
            >
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`p-6 rounded-full bg-gradient-to-tr ${wonReward.color} shadow-2xl mb-4`}
              >
                {React.createElement(wonReward.icon, { className: "w-16 h-16 text-white" })}
              </motion.div>
              <h3 className="text-3xl font-black text-yellow-400 font-sans mb-1">تبریک می‌گم!</h3>
              <p className="text-white text-lg font-medium font-sans mb-4">شما برنده شدید:</p>
              
              <div className="text-2xl font-extrabold text-white px-6 py-2 bg-slate-800 rounded-2xl border border-slate-700 mb-6 font-sans">
                {wonReward.label} ({wonReward.labelEn})
              </div>

              <button
                onClick={() => setWonReward(null)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl active:scale-95 transition-all font-sans"
              >
                دریافت جایزه (Collect)
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
