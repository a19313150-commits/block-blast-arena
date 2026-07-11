/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShoppingBag, Coins, RefreshCw, Zap, Trash2, Check, Lock } from 'lucide-react';
import { UserProfile, BlockSkin, PowerUpType } from '../types';
import { SKINS, audio } from '../utils';

interface ShopProps {
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
  onClose: () => void;
}

const POWERUP_ITEMS = [
  {
    type: 'rotate' as PowerUpType,
    name: 'چرخش آجر',
    nameEn: 'Block Rotator',
    description: 'به شما امکان می‌دهد آجرها را قبل از قرار دادن بچرخانید.',
    descriptionEn: 'Allows you to rotate blocks before placing them.',
    cost: 40,
    icon: RefreshCw,
    color: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  },
  {
    type: 'swap' as PowerUpType,
    name: 'تعویض آجرها',
    nameEn: 'Block Swapper',
    description: 'هر ۳ آجر فعال دور را با آجرهای تصادفی جدید تعویض می‌کند.',
    descriptionEn: 'Swaps all 3 active blocks with new random blocks.',
    cost: 60,
    icon: Trash2,
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    type: 'hammer' as PowerUpType,
    name: 'چکش انفجاری',
    nameEn: 'Blast Hammer',
    description: 'یک محدوده ۳x۳ روی صفحه را منفجر و پاکسازی می‌کند.',
    descriptionEn: 'Blasts and clears any 3x3 area on the grid.',
    cost: 100,
    icon: Zap,
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  },
  {
    type: 'undo' as PowerUpType,
    name: 'بازگشت به قبل',
    nameEn: 'Move Undo',
    description: 'حرکت اشتباه قبلی را لغو و جدول را بازمی‌گرداند.',
    descriptionEn: 'Undoes your last move and restores the grid state.',
    cost: 50,
    icon: RefreshCw,
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  },
];

export default function Shop({ profile, onUpdateProfile, onClose }: ShopProps) {

  const buyPowerUp = (type: PowerUpType, cost: number) => {
    if (profile.coins < cost) {
      audio.playGameOver(); // Error buzz sound
      return;
    }

    audio.playPowerup();
    const updated = { ...profile };
    updated.coins -= cost;
    updated.powerups[type] = (updated.powerups[type] || 0) + 1;
    onUpdateProfile(updated);
  };

  const buyOrEquipSkin = (skin: BlockSkin) => {
    const updated = { ...profile };
    const isUnlocked = profile.unlockedSkins.includes(skin.id);

    if (isUnlocked) {
      // Equip skin
      audio.playClick();
      updated.activeSkin = skin.id;
      onUpdateProfile(updated);
      return;
    }

    // Purchase skin
    if (profile.coins < skin.price) {
      audio.playGameOver(); // Error buzz
      return;
    }

    audio.playVictory();
    updated.coins -= skin.price;
    updated.unlockedSkins.push(skin.id);
    updated.activeSkin = skin.id;
    onUpdateProfile(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-slate-900 border border-slate-700/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-white overflow-hidden my-8"
      >
        {/* Background ambient radial gradients */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 blur-3xl rounded-full" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full hover:scale-105 active:scale-95 transition-all"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-sans">فروشگاه قدرت و تم</h2>
              <p className="text-xs text-slate-400 font-sans">Powerups & Block Skins Shop</p>
            </div>
          </div>

          {/* Coins Badge */}
          <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-1.5 rounded-full flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
            <span className="font-extrabold text-amber-400 font-sans">{profile.coins}</span>
          </div>
        </div>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section 1: Power-ups */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 font-sans flex items-center gap-2">
              <span>⚡ قدرت‌های ویژه بازی</span>
              <span className="text-xs font-normal text-slate-500 font-sans">(Power-ups Store)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POWERUP_ITEMS.map((item) => {
                const count = profile.powerups[item.type] || 0;
                const canAfford = profile.coins >= item.cost;
                const Icon = item.icon;

                return (
                  <div
                    key={item.type}
                    className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-2 rounded-xl border ${item.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full font-sans">
                          موجودی: {count}
                        </span>
                      </div>
                      <h4 className="font-bold text-white font-sans">{item.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans">
                        {item.description}
                      </p>
                    </div>

                    <button
                      onClick={() => buyPowerUp(item.type, item.cost)}
                      disabled={!canAfford}
                      className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-lg shadow-amber-500/10'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-4 h-4 fill-current" />
                      خرید با {item.cost} سکه
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Themes / Skins */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 font-sans flex items-center gap-2">
              <span>🎨 پوسته و تم آجرها</span>
              <span className="text-xs font-normal text-slate-500 font-sans">(Visual Skins Store)</span>
            </h3>

            <div className="space-y-3">
              {SKINS.map((skin) => {
                const isUnlocked = profile.unlockedSkins.includes(skin.id);
                const isActive = profile.activeSkin === skin.id;
                const canAfford = profile.coins >= skin.price;

                return (
                  <div
                    key={skin.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isActive
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : isUnlocked
                        ? 'bg-slate-800/40 border-slate-700/50 hover:border-slate-700'
                        : 'bg-slate-850/50 border-slate-800 hover:border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Live Cell Preview Grid */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1.5 ${skin.previewBg}`}>
                        <div className="grid grid-cols-2 gap-1 w-full h-full">
                          {['rose', 'sky', 'amber', 'emerald'].map((col) => (
                            <div
                              key={col}
                              className={skin.cellClass(col).replace('transition-all duration-150', '')}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white font-sans text-base">{skin.nameFa}</h4>
                          <span className="text-xs text-slate-500 font-sans">{skin.name}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-sans">
                          {skin.id === 'neoglow'
                            ? 'تم کلاسیک درخشان بازی'
                            : skin.id === 'royaltimber'
                            ? 'حس نوستالژیک چوبی با افکت برجسته'
                            : skin.id === 'candypop'
                            ? 'رنگ‌های جذاب پاستیلی شاد'
                            : skin.id === 'retropixel'
                            ? 'تم بازی‌های آرکید ۸بیتی قدیمی'
                            : 'تم فوق العاده کهکشانی با درخشش ویژه'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => buyOrEquipSkin(skin)}
                      disabled={!isUnlocked && !canAfford}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs font-sans transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap min-w-[120px] ${
                        isActive
                          ? 'bg-indigo-600 text-white border border-indigo-400'
                          : isUnlocked
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : canAfford
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-lg'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Check className="w-4 h-4" />
                          انتخاب شده
                        </>
                      ) : isUnlocked ? (
                        'فعال‌سازی (Equip)'
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          {skin.price} سکه
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
