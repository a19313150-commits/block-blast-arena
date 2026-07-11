/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Swords,
  Map,
  Coins,
  Sparkles,
  ShoppingBag,
  Volume2,
  VolumeX,
  Edit2,
  ListTodo,
  Gift,
  Award,
  Globe,
  Play,
  Check,
} from 'lucide-react';
import { UserProfile, Quest } from '../types';
import { SKINS, DEFAULT_LEADERBOARD, audio } from '../utils';

interface MainMenuProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onSelectMode: (mode: 'classic' | 'adventure' | 'arena') => void;
  onOpenShop: () => void;
  onOpenDailyRewards: () => void;
  onOpenAdventureMap: () => void;
}

const AVATARS = ['🦊', '🐱', '🐼', '🐯', '🦁', '🐸', '🐨', '🐙', '👾', '🚀', '👑', '⚡'];

export default function MainMenu({
  profile,
  onUpdateProfile,
  onSelectMode,
  onOpenShop,
  onOpenDailyRewards,
  onOpenAdventureMap,
}: MainMenuProps) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.username);
  const [activeTab, setActiveTab] = useState<'quests' | 'leaderboard'>('quests');
  const [isMuted, setIsMuted] = useState(audio.getMuted());

  const handleMuteToggle = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    audio.playClick();
  };

  const saveUsername = () => {
    if (tempName.trim()) {
      audio.playClick();
      onUpdateProfile({ ...profile, username: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const selectAvatar = (avatar: string) => {
    audio.playClick();
    onUpdateProfile({ ...profile, avatar });
    setShowAvatarModal(false);
  };

  const claimQuestReward = (quest: Quest) => {
    if (quest.current >= quest.target && !quest.claimed) {
      audio.playVictory();
      const updatedQuests = profile.quests.map((q) =>
        q.id === quest.id ? { ...q, claimed: true } : q
      );
      onUpdateProfile({
        ...profile,
        coins: profile.coins + quest.reward,
        quests: updatedQuests,
      });
    }
  };

  const canClaimDaily = () => {
    if (!profile.lastClaimedDaily) return true;
    const lastClaimDate = new Date(profile.lastClaimedDaily).toDateString();
    return lastClaimDate !== new Date().toDateString();
  };

  const pendingQuestsCount = profile.quests.filter((q) => q.current >= q.target && !q.claimed).length;

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col min-h-screen justify-between text-white select-none">
      {/* Top Bar (Mute, Coins, Shop, Gift) */}
      <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5">
          {/* Mute Button */}
          <button
            onClick={handleMuteToggle}
            className="p-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Daily lucky Spin indicator */}
          <button
            onClick={onOpenDailyRewards}
            className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 hover:scale-105 active:scale-95 text-slate-950 rounded-xl transition-all cursor-pointer relative"
          >
            <Gift className="w-4 h-4 text-slate-950 fill-slate-950" />
            {canClaimDaily() && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-slate-900 animate-pulse" />
            )}
          </button>
        </div>

        {/* Currency & Shop Trigger */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-1 rounded-full flex items-center gap-1.5">
            <Coins className="w-4.5 h-4.5 text-yellow-400 fill-yellow-400" />
            <span className="font-black text-amber-400 text-sm font-sans">{profile.coins}</span>
          </div>

          <button
            onClick={onOpenShop}
            className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg hover:shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            <ShoppingBag className="w-4.5 h-4.5" />
            <span className="text-xs font-bold font-sans">فروشگاه</span>
          </button>
        </div>
      </div>

      {/* Hero Header Logo */}
      <div className="text-center my-6 relative">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="inline-block relative"
        >
          {/* Neon backlighting */}
          <div className="absolute inset-x-0 bottom-2 h-10 bg-indigo-500/20 blur-xl rounded-full" />
          
          <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none bg-gradient-to-b from-indigo-200 via-white to-indigo-400 bg-clip-text text-transparent font-sans">
            بلاک بلست آرنا
          </h1>
          <div className="flex justify-center items-center gap-1.5 mt-1">
            <Sparkles className="w-4 h-4 text-pink-400 fill-pink-400 animate-pulse" />
            <span className="text-xs tracking-[0.25em] font-extrabold uppercase bg-gradient-to-r from-indigo-400 via-pink-400 to-amber-400 bg-clip-text text-transparent font-sans">
              Block Blast Arena
            </span>
          </div>
        </motion.div>
      </div>

      {/* User Profile Card */}
      <div className="bg-slate-900/85 border border-slate-800/60 rounded-3xl p-5 shadow-xl relative overflow-hidden mb-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="flex items-center justify-between gap-4">
          {/* Trophy League Count (Left) */}
          <div className="text-center">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 flex flex-col items-center shadow-inner">
              <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-black text-white text-base mt-1 font-sans">{profile.trophies}</span>
              <span className="text-[9px] text-slate-500 font-sans">کاپ قهرمانی</span>
            </div>
          </div>

          {/* Profile Name & Level Info (Center/Right) */}
          <div className="flex-1 text-right">
            {isEditingName ? (
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={saveUsername}
                  className="bg-emerald-600 hover:bg-emerald-500 p-1.5 rounded-lg text-white font-bold"
                >
                  ذخیره
                </button>
                <input
                  type="text"
                  maxLength={15}
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white max-w-[120px] text-right focus:outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center gap-1 justify-end group">
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <h3 className="font-extrabold text-lg truncate max-w-[140px] font-sans">
                  {profile.username}
                </h3>
              </div>
            )}

            {/* Level and XP progress */}
            <div className="flex justify-end gap-1.5 items-center mt-1">
              <span className="text-xs text-slate-400 font-sans">سطح {profile.level}</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-pulse" />
            </div>

            {/* XP progress bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-850">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (profile.xp % 500) / 5)}%` }}
              />
            </div>
          </div>

          {/* Avatar Picture (Right) */}
          <button
            onClick={() => setShowAvatarModal(true)}
            className="w-14 h-14 bg-gradient-to-tr from-slate-950 to-indigo-950 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center text-3xl shadow-lg hover:scale-105 active:scale-95 transition-all relative cursor-pointer"
          >
            {profile.avatar}
            <span className="absolute -bottom-1 -left-1 bg-indigo-600 text-[9px] px-1 py-0.5 rounded-md text-white font-bold font-sans">ویرایش</span>
          </button>
        </div>
      </div>

      {/* Game Mode Pickers */}
      <div className="space-y-3 mb-5">
        {/* Mode 1: Classic Mode */}
        <button
          onClick={() => onSelectMode('classic')}
          className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 p-4.5 rounded-3xl shadow-xl hover:shadow-indigo-500/10 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer"
        >
          <div className="w-12 h-12 bg-slate-900/30 rounded-2xl flex items-center justify-center text-white shadow-inner">
            <Play className="w-6 h-6 fill-current" />
          </div>

          <div>
            <h3 className="font-black text-lg tracking-tight font-sans">کلاسیک بی‌نهایت</h3>
            <p className="text-xs text-indigo-200 font-sans">رکورد زنی با بلوک‌های متفاوت رنگی</p>
          </div>
        </button>

        {/* Mode 2: Story / Adventure Mode */}
        <button
          onClick={onOpenAdventureMap}
          className="w-full bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 p-4.5 rounded-3xl shadow-xl hover:shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer"
        >
          <div className="w-12 h-12 bg-slate-900/30 rounded-2xl flex items-center justify-center text-white shadow-inner">
            <Map className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-black text-lg tracking-tight font-sans">نقشه مراحل داستانی</h3>
            <p className="text-xs text-emerald-200 font-sans">
              ۳۰ مرحله پرچالش و هیجان‌انگیز • {profile.completedLevels.length} حل شده
            </p>
          </div>
        </button>

        {/* Mode 3: Online Duel Mode */}
        <button
          onClick={() => onSelectMode('arena')}
          className="w-full bg-gradient-to-r from-pink-600 via-rose-700 to-rose-800 hover:from-pink-500 hover:to-rose-700 p-4.5 rounded-3xl shadow-xl hover:shadow-rose-500/10 active:scale-98 transition-all flex items-center justify-between text-right cursor-pointer"
        >
          <div className="w-12 h-12 bg-slate-900/30 rounded-2xl flex items-center justify-center text-white shadow-inner">
            <Swords className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-black text-lg tracking-tight font-sans">میدان دوئل آنلاین</h3>
            <p className="text-xs text-pink-200 font-sans">رقابت زنده ۱ به ۱ و افزایش رتبه لیگ کاپ</p>
          </div>
        </button>
      </div>

      {/* Tabs Layout: Quests & Leaderboard */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl flex-1 flex flex-col overflow-hidden min-h-[180px]">
        {/* Tab Headers */}
        <div className="grid grid-cols-2 border-b border-slate-800/80">
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('quests');
            }}
            className={`py-3 text-center text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'quests'
                ? 'bg-slate-800/40 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {pendingQuestsCount > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-[9px] font-bold text-white rounded-full">
                {pendingQuestsCount}
              </span>
            )}
            <ListTodo className="w-3.5 h-3.5" />
            ماموریت‌های روزانه
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('leaderboard');
            }}
            className={`py-3 text-center text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-slate-800/40 text-indigo-400 border-b-2 border-indigo-500'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            جدول رده‌بندی جهانی
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[160px]">
          {activeTab === 'quests' ? (
            <div className="space-y-3">
              {profile.quests.map((quest) => {
                const complete = quest.current >= quest.target;
                const claimed = quest.claimed;

                return (
                  <div
                    key={quest.id}
                    className="bg-slate-950/40 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between gap-3 text-right"
                  >
                    {/* Claim Button or status indicator */}
                    <button
                      disabled={!complete || claimed}
                      onClick={() => claimQuestReward(quest)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[10px] font-sans transition-all whitespace-nowrap min-w-[70px] flex items-center justify-center gap-1 ${
                        claimed
                          ? 'bg-slate-800 text-slate-500 border border-slate-700/20 cursor-not-allowed'
                          : complete
                          ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-md shadow-amber-500/25 cursor-pointer hover:scale-105'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? (
                        <>
                          <Check className="w-3 h-3 stroke-[3]" />
                          دریافت شد
                        </>
                      ) : complete ? (
                        'دریافت جایزه'
                      ) : (
                        `${quest.reward} سکه`
                      )}
                    </button>

                    {/* Quest text & progress */}
                    <div className="flex-1 font-sans">
                      <div className={`text-xs font-bold ${claimed ? 'text-slate-500 line-through' : 'text-white'}`}>
                        {quest.descriptionFa}
                      </div>
                      <div className="flex justify-end gap-1.5 items-center mt-1">
                        <span className="text-[10px] text-slate-400">
                          {quest.current} / {quest.target}
                        </span>
                        {/* Progress line */}
                        <div className="w-16 bg-slate-850 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, (quest.current / quest.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {DEFAULT_LEADERBOARD.map((item, idx) => {
                const isSelf = item.username === 'Sina_Blast'; // mock spotlighting Sina_Blast
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-xl border font-sans ${
                      isSelf
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300'
                        : 'bg-slate-950/20 border-slate-800 text-slate-300'
                    }`}
                  >
                    {/* Rating / Trophies */}
                    <span className="font-extrabold text-sm flex items-center gap-1">
                      🏆 {item.trophies}
                    </span>

                    {/* Name */}
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{item.username}</span>
                      <span className="text-sm">{item.avatar}</span>
                      <span className="text-xs opacity-75">{item.country}</span>
                    </div>

                    {/* Rank */}
                    <span className={`font-black text-xs min-w-[18px] text-center ${idx < 3 ? 'text-yellow-400 font-extrabold' : 'text-slate-500'}`}>
                      {item.rank}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Selection Modal */}
      <AnimatePresence>
        {showAvatarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700/60 p-6 rounded-3xl w-full max-w-sm text-right relative"
            >
              <h3 className="text-lg font-bold font-sans mb-4 border-b border-slate-800 pb-2">
                انتخاب آواتار جدید
              </h3>
              <div className="grid grid-cols-4 gap-3 py-2">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    onClick={() => selectAvatar(av)}
                    className="w-14 h-14 bg-slate-950 hover:bg-slate-800 rounded-xl flex items-center justify-center text-3xl transition-all hover:scale-110 active:scale-95 border border-slate-800 cursor-pointer"
                  >
                    {av}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl font-bold font-sans text-xs cursor-pointer"
              >
                بستن (Close)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
