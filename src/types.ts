/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PowerUpType = 'rotate' | 'swap' | 'hammer' | 'undo';

export interface PowerUps {
  rotate: number;
  swap: number;
  hammer: number;
  undo: number;
}

export interface UserProfile {
  username: string;
  avatar: string; // Emoji or icon name
  level: number;
  xp: number;
  coins: number;
  trophies: number;
  highestClassicScore: number;
  completedLevels: number[]; // Level IDs
  unlockedSkins: string[]; // Skin IDs
  activeSkin: string; // Active Skin ID
  powerups: PowerUps;
  dailyStreak: number;
  lastClaimedDaily: string | null; // Date ISO string
  quests: Quest[];
  lastQuestDate: string | null;
}

export interface Quest {
  id: string;
  description: string;
  descriptionFa: string;
  target: number;
  current: number;
  reward: number;
  type: 'place_blocks' | 'clear_lines' | 'gain_score' | 'win_duels' | 'use_powerup';
  claimed: boolean;
}

export interface BlockTemplate {
  id: string;
  shape: number[][]; // 2D array representation (1s and 0s)
  color: string; // Base tailwind color name like 'amber', 'emerald', etc.
}

export interface ActiveBlock {
  id: string;
  shape: number[][];
  color: string;
  placed: boolean;
  rotatedCount?: number;
}

export interface BoardCell {
  color: string | null; // null if empty, or color name (e.g., 'rose', 'indigo') if filled
  isFrozen?: boolean; // Block that must be cleared to break
  isGem?: boolean; // Gem that gives bonus points/coins when cleared
  clearing?: boolean; // Animation state
}

export interface Level {
  id: number;
  name: string;
  nameFa: string;
  targetScore: number;
  targetLineClears?: number;
  targetColorClears?: { color: string; count: number; current: number };
  targetGems?: number; // Clear pre-placed gem cells
  preplacedGrid?: { r: number; c: number; isFrozen?: boolean; isGem?: boolean; color: string }[];
  rewardCoins: number;
  rewardXP: number;
  movesLimit?: number; // Optional limit of block placements
}

export interface BlockSkin {
  id: string;
  name: string;
  nameFa: string;
  previewBg: string; // CSS bg or Tailwind classes
  cellClass: (color: string, isGhost?: boolean) => string; // Function returning tailwind classes
  glowClass: string;
  price: number;
}

export interface OpponentState {
  username: string;
  avatar: string;
  trophies: number;
  score: number;
  board: (string | null)[][];
  emojisSent: { emoji: string; timestamp: number }[];
  status: 'playing' | 'gameover' | 'completed';
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  avatar: string;
  trophies: number;
  country: string; // Flag emoji
  isSelf?: boolean;
}
