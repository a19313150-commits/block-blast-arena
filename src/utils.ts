/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BlockTemplate, Level, BlockSkin, ActiveBlock, Quest } from './types';

// Web Audio API Sound Synthesizer for high fidelity retro & arcade sounds with zero external assets
class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  getMuted() {
    return this.isMuted;
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playPlace() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playRotate() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  playLineClear() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5
    osc1.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.16); // G5
    osc1.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.24); // C6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(261.63, this.ctx.currentTime); // C4
    osc2.frequency.exponentialRampToValueAtTime(523.25, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.35);
    osc2.stop(this.ctx.currentTime + 0.35);
  }

  playCombo(combo: number) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    // A rising arpeggio based on combo size
    const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50]; // Scale
    const pitchIdx = Math.min(combo - 1, notes.length - 1);
    const startNote = notes[pitchIdx];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(startNote, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(startNote * 1.5, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.26);
  }

  playPowerup() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.36);
  }

  playDailyReward() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(554.37, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.55);
  }

  playGameOver() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.6);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(295, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 0.6);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.7);
    osc2.stop(this.ctx.currentTime + 0.7);
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51];
    const timings = [0, 0.1, 0.2, 0.3, 0.45, 0.55, 0.7];

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + timings[idx]);

      gain.gain.setValueAtTime(0.1, this.ctx!.currentTime + timings[idx]);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx!.currentTime + timings[idx] + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + timings[idx]);
      osc.stop(this.ctx!.currentTime + timings[idx] + 0.28);
    });
  }
}

export const audio = new WebAudioSynth();

// Block templates representing different geometric configurations
export const BLOCK_TEMPLATES: BlockTemplate[] = [
  // 1x1 Single
  { id: '1x1', shape: [[1]], color: 'amber' },

  // 2x1 Duo
  { id: '2x1_h', shape: [[1, 1]], color: 'sky' },
  { id: '2x1_v', shape: [[1], [1]], color: 'sky' },

  // 3x1 Trio
  { id: '3x1_h', shape: [[1, 1, 1]], color: 'indigo' },
  { id: '3x1_v', shape: [[1], [1], [1]], color: 'indigo' },

  // 4x1 Tetromino line
  { id: '4x1_h', shape: [[1, 1, 1, 1]], color: 'emerald' },
  { id: '4x1_v', shape: [[1], [1], [1], [1]], color: 'emerald' },

  // 5x1 Pentomino line (extreme, but blocks blast is famous for these challenge blocks)
  { id: '5x1_h', shape: [[1, 1, 1, 1, 1]], color: 'rose' },
  { id: '5x1_v', shape: [[1], [1], [1], [1], [1]], color: 'rose' },

  // 2x2 Square
  { id: '2x2', shape: [[1, 1], [1, 1]], color: 'violet' },

  // 3x3 Square (Big boss block!)
  { id: '3x3', shape: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], color: 'rose' },

  // Small L
  { id: 'L_2x2_0', shape: [[1, 0], [1, 1]], color: 'fuchsia' },
  { id: 'L_2x2_1', shape: [[1, 1], [1, 0]], color: 'fuchsia' },
  { id: 'L_2x2_2', shape: [[1, 1], [0, 1]], color: 'fuchsia' },
  { id: 'L_2x2_3', shape: [[0, 1], [1, 1]], color: 'fuchsia' },

  // Standard L 3x3
  { id: 'L_3x3_0', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'cyan' },
  { id: 'L_3x3_1', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'cyan' },
  { id: 'L_3x3_2', shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: 'cyan' },
  { id: 'L_3x3_3', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: 'cyan' },

  // Corner T-Shapes
  { id: 'T_3x3_0', shape: [[1, 1, 1], [0, 1, 0], [0, 1, 0]], color: 'lime' },
  { id: 'T_3x3_1', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: 'lime' },
  { id: 'T_2x3_0', shape: [[1, 1, 1], [0, 1, 0]], color: 'lime' },
  { id: 'T_2x3_1', shape: [[0, 1], [1, 1], [0, 1]], color: 'lime' },

  // Z and S shapes
  { id: 'Z_3x2', shape: [[1, 1, 0], [0, 1, 1]], color: 'orange' },
  { id: 'S_3x2', shape: [[0, 1, 1], [1, 1, 0]], color: 'orange' },
  { id: 'Z_2x3', shape: [[0, 1], [1, 1], [1, 0]], color: 'orange' },
  { id: 'S_2x3', shape: [[1, 0], [1, 1], [0, 1]], color: 'orange' },

  // Corner 3x3 V-shape (Corner 3-long legs)
  { id: 'Corner_3x3_0', shape: [[1, 1, 1], [1, 0, 0], [1, 0, 0]], color: 'pink' },
  { id: 'Corner_3x3_1', shape: [[1, 1, 1], [0, 0, 1], [0, 0, 1]], color: 'pink' },
  { id: 'Corner_3x3_2', shape: [[1, 0, 0], [1, 0, 0], [1, 1, 1]], color: 'pink' },
  { id: 'Corner_3x3_3', shape: [[0, 0, 1], [0, 0, 1], [1, 1, 1]], color: 'pink' },

  // Diagonal/Stair shapes
  { id: 'Stair_0', shape: [[1, 0], [1, 1], [0, 1]], color: 'teal' },
  { id: 'Plus_3x3', shape: [[0, 1, 0], [1, 1, 1], [0, 1, 0]], color: 'teal' },
];

export function getRandomBlocks(): ActiveBlock[] {
  const blocks: ActiveBlock[] = [];
  for (let i = 0; i < 3; i++) {
    const template = BLOCK_TEMPLATES[Math.floor(Math.random() * BLOCK_TEMPLATES.length)];
    blocks.push({
      id: `${template.id}-${Date.now()}-${i}-${Math.random()}`,
      shape: JSON.parse(JSON.stringify(template.shape)),
      color: template.color,
      placed: false,
    });
  }
  return blocks;
}

export function rotateBlockShape(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const newShape: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newShape[c][rows - 1 - r] = shape[r][c];
    }
  }
  return newShape;
}

// 5 Gorgeous Skins/Themes matching Block Blast aesthetic
export const SKINS: BlockSkin[] = [
  {
    id: 'neoglow',
    name: 'Neon Glow',
    nameFa: 'نئون درخشان',
    previewBg: 'bg-gradient-to-br from-slate-950 to-indigo-950 border border-indigo-500/50',
    glowClass: 'shadow-[0_0_15px_rgba(var(--color-glow),0.6)]',
    cellClass: (color: string, isGhost = false) => {
      const colorMap: { [key: string]: string } = {
        amber: 'from-amber-400 to-amber-600 border-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]',
        sky: 'from-sky-400 to-sky-600 border-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.4)]',
        indigo: 'from-indigo-400 to-indigo-600 border-indigo-300 shadow-[0_0_8px_rgba(129,140,248,0.4)]',
        emerald: 'from-emerald-400 to-emerald-600 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.4)]',
        rose: 'from-rose-400 to-rose-600 border-rose-300 shadow-[0_0_8px_rgba(251,113,133,0.4)]',
        violet: 'from-violet-400 to-violet-600 border-violet-300 shadow-[0_0_8px_rgba(167,139,250,0.4)]',
        fuchsia: 'from-fuchsia-400 to-fuchsia-600 border-fuchsia-300 shadow-[0_0_8px_rgba(232,121,249,0.4)]',
        cyan: 'from-cyan-400 to-cyan-600 border-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
        lime: 'from-lime-400 to-lime-600 border-lime-300 shadow-[0_0_8px_rgba(163,230,53,0.4)]',
        orange: 'from-orange-400 to-orange-600 border-orange-300 shadow-[0_0_8px_rgba(251,146,60,0.4)]',
        pink: 'from-pink-400 to-pink-600 border-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.4)]',
        teal: 'from-teal-400 to-teal-600 border-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.4)]',
        gray: 'from-slate-400 to-slate-600 border-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.4)]',
      };
      const activeColor = colorMap[color] || 'from-blue-400 to-blue-600 border-blue-300';
      return `bg-gradient-to-b ${activeColor} border-2 rounded-md ${isGhost ? 'opacity-30' : ''} transition-all duration-150`;
    },
    price: 0,
  },
  {
    id: 'royaltimber',
    name: 'Royal Timber',
    nameFa: 'چوب سلطنتی',
    previewBg: 'bg-gradient-to-br from-amber-900 to-amber-950 border border-amber-700/50',
    glowClass: 'shadow-[0_4px_10px_rgba(0,0,0,0.4)]',
    cellClass: (color: string, isGhost = false) => {
      // Wood textured look
      const colorMap: { [key: string]: string } = {
        amber: 'bg-amber-700 border-amber-900 ring-1 ring-amber-500/20',
        sky: 'bg-sky-800 border-sky-950 ring-1 ring-sky-500/20',
        indigo: 'bg-indigo-800 border-indigo-950 ring-1 ring-indigo-500/20',
        emerald: 'bg-emerald-800 border-emerald-950 ring-1 ring-emerald-500/20',
        rose: 'bg-rose-800 border-rose-950 ring-1 ring-rose-500/20',
        violet: 'bg-violet-800 border-violet-950 ring-1 ring-violet-500/20',
        fuchsia: 'bg-fuchsia-800 border-fuchsia-950 ring-1 ring-fuchsia-500/20',
        cyan: 'bg-cyan-800 border-cyan-950 ring-1 ring-cyan-500/20',
        lime: 'bg-lime-800 border-lime-950 ring-1 ring-lime-500/20',
        orange: 'bg-orange-800 border-orange-950 ring-1 ring-orange-500/20',
        pink: 'bg-pink-800 border-pink-950 ring-1 ring-pink-500/20',
        teal: 'bg-teal-800 border-teal-950 ring-1 ring-teal-500/20',
        gray: 'bg-stone-700 border-stone-900 ring-1 ring-stone-500/20',
      };
      const activeColor = colorMap[color] || 'bg-amber-800 border-amber-950';
      return `${activeColor} border-t-4 border-r-2 border-b-2 border-l-4 rounded shadow-inner ${isGhost ? 'opacity-30' : ''} transition-all duration-150 relative after:absolute after:inset-1 after:border after:border-white/5 after:rounded-sm`;
    },
    price: 300,
  },
  {
    id: 'candypop',
    name: 'Candy Pop',
    nameFa: 'پاستیل شیرین',
    previewBg: 'bg-gradient-to-br from-pink-100 to-sky-100 border border-pink-300/50',
    glowClass: 'shadow-[0_8px_16px_rgba(244,114,182,0.25)]',
    cellClass: (color: string, isGhost = false) => {
      // Jelly look
      const colorMap: { [key: string]: string } = {
        amber: 'from-amber-300 via-amber-400 to-amber-500 border-amber-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        sky: 'from-sky-300 via-sky-400 to-sky-500 border-sky-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        indigo: 'from-indigo-300 via-indigo-400 to-indigo-500 border-indigo-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        emerald: 'from-emerald-300 via-emerald-400 to-emerald-500 border-emerald-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        rose: 'from-rose-300 via-rose-400 to-rose-500 border-rose-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        violet: 'from-violet-300 via-violet-400 to-violet-500 border-violet-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        fuchsia: 'from-fuchsia-300 via-fuchsia-400 to-fuchsia-500 border-fuchsia-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        cyan: 'from-cyan-300 via-cyan-400 to-cyan-500 border-cyan-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        lime: 'from-lime-300 via-lime-400 to-lime-500 border-lime-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        orange: 'from-orange-300 via-orange-400 to-orange-500 border-orange-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        pink: 'from-pink-300 via-pink-400 to-pink-500 border-pink-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        teal: 'from-teal-300 via-teal-400 to-teal-500 border-teal-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
        gray: 'from-slate-300 via-slate-400 to-slate-500 border-slate-200 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]',
      };
      const activeColor = colorMap[color] || 'from-pink-300 to-pink-500 border-pink-200';
      return `bg-gradient-to-br ${activeColor} border-3 rounded-2xl ${isGhost ? 'opacity-30 shadow-none' : 'shadow-md'} transition-all duration-150`;
    },
    price: 600,
  },
  {
    id: 'retropixel',
    name: 'Retro Arcade',
    nameFa: 'پیکسلی نوستالژیک',
    previewBg: 'bg-black border-2 border-green-500',
    glowClass: 'shadow-[0_0_8px_rgba(0,255,0,0.5)]',
    cellClass: (color: string, isGhost = false) => {
      // Pixel arts
      const colorMap: { [key: string]: string } = {
        amber: 'bg-amber-500 border-amber-300 border-b-amber-700 border-r-amber-700',
        sky: 'bg-sky-500 border-sky-300 border-b-sky-700 border-r-sky-700',
        indigo: 'bg-indigo-500 border-indigo-300 border-b-indigo-700 border-r-indigo-700',
        emerald: 'bg-emerald-500 border-emerald-300 border-b-emerald-700 border-r-emerald-700',
        rose: 'bg-rose-500 border-rose-300 border-b-rose-700 border-r-rose-700',
        violet: 'bg-violet-500 border-violet-300 border-b-violet-700 border-r-violet-700',
        fuchsia: 'bg-fuchsia-500 border-fuchsia-300 border-b-fuchsia-700 border-r-fuchsia-700',
        cyan: 'bg-cyan-500 border-cyan-300 border-b-cyan-700 border-r-cyan-700',
        lime: 'bg-lime-500 border-lime-300 border-b-lime-700 border-r-lime-700',
        orange: 'bg-orange-500 border-orange-300 border-b-orange-700 border-r-orange-700',
        pink: 'bg-pink-500 border-pink-300 border-b-pink-700 border-r-pink-700',
        teal: 'bg-teal-500 border-teal-300 border-b-teal-700 border-r-teal-700',
        gray: 'bg-slate-500 border-slate-300 border-b-slate-700 border-r-slate-700',
      };
      const activeColor = colorMap[color] || 'bg-slate-500 border-slate-300';
      return `${activeColor} border-4 rounded-none ${isGhost ? 'opacity-30' : ''} transition-all duration-150`;
    },
    price: 1000,
  },
  {
    id: 'cosmicstar',
    name: 'Cosmic Space',
    nameFa: 'فضای کیهانی',
    previewBg: 'bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 border border-fuchsia-500/50',
    glowClass: 'shadow-[0_0_20px_rgba(236,72,153,0.5)]',
    cellClass: (color: string, isGhost = false) => {
      const colorMap: { [key: string]: string } = {
        amber: 'from-amber-500 via-amber-600 to-yellow-400 border-amber-300',
        sky: 'from-sky-500 via-sky-600 to-cyan-400 border-sky-300',
        indigo: 'from-indigo-500 via-indigo-600 to-violet-400 border-indigo-300',
        emerald: 'from-emerald-500 via-emerald-600 to-teal-400 border-emerald-300',
        rose: 'from-rose-500 via-rose-600 to-pink-400 border-rose-300',
        violet: 'from-violet-500 via-violet-600 to-purple-400 border-violet-300',
        fuchsia: 'from-fuchsia-500 via-fuchsia-600 to-purple-400 border-fuchsia-300',
        cyan: 'from-cyan-500 via-cyan-600 to-sky-400 border-cyan-300',
        lime: 'from-lime-500 via-lime-600 to-yellow-300 border-lime-300',
        orange: 'from-orange-500 via-orange-600 to-amber-400 border-orange-300',
        pink: 'from-pink-500 via-pink-600 to-rose-400 border-pink-300',
        teal: 'from-teal-500 via-teal-600 to-cyan-400 border-teal-300',
        gray: 'from-slate-500 via-slate-600 to-slate-400 border-slate-300',
      };
      const activeColor = colorMap[color] || 'from-indigo-500 to-indigo-600';
      return `bg-gradient-to-r ${activeColor} border-2 rounded-xl border-dashed ${isGhost ? 'opacity-30' : ''} transition-all duration-150 relative overflow-hidden before:absolute before:inset-0.5 before:bg-white/10 before:rounded-lg`;
    },
    price: 1500,
  }
];

// Helper to generate a preplaced grid based on levels
function createLevelGrid(levelId: number): { r: number; c: number; isFrozen?: boolean; isGem?: boolean; color: string }[] {
  const list: { r: number; c: number; isFrozen?: boolean; isGem?: boolean; color: string }[] = [];
  
  if (levelId === 1) {
    // Super simple: clear 4 blocks of wood, preplaced single block
    list.push({ r: 7, c: 3, color: 'gray', isFrozen: true });
    list.push({ r: 7, c: 4, color: 'gray', isFrozen: true });
  } else if (levelId === 2) {
    // Clear 4 frozen blocks in corners
    list.push({ r: 0, c: 0, color: 'sky', isFrozen: true });
    list.push({ r: 0, c: 7, color: 'sky', isFrozen: true });
    list.push({ r: 7, c: 0, color: 'sky', isFrozen: true });
    list.push({ r: 7, c: 7, color: 'sky', isFrozen: true });
  } else if (levelId === 3) {
    // Clear some gem blocks along the diagonal
    for (let i = 2; i <= 5; i++) {
      list.push({ r: i, c: i, color: 'violet', isGem: true });
    }
  } else if (levelId === 4) {
    // Smile shape
    list.push({ r: 2, c: 2, color: 'indigo', isFrozen: true });
    list.push({ r: 2, c: 5, color: 'indigo', isFrozen: true });
    list.push({ r: 5, c: 1, color: 'rose', isGem: true });
    list.push({ r: 5, c: 6, color: 'rose', isGem: true });
    list.push({ r: 6, c: 2, color: 'rose', isGem: true });
    list.push({ r: 6, c: 3, color: 'rose', isGem: true });
    list.push({ r: 6, c: 4, color: 'rose', isGem: true });
    list.push({ r: 6, c: 5, color: 'rose', isGem: true });
  } else if (levelId === 5) {
    // Cross shape of frozen
    for (let i = 0; i < 8; i++) {
      if (i !== 3 && i !== 4) {
        list.push({ r: i, c: 3, color: 'emerald', isFrozen: true });
        list.push({ r: 3, c: i, color: 'emerald', isFrozen: true });
      }
    }
  } else if (levelId === 6) {
    // Gem shower
    for (let i = 0; i < 8; i += 2) {
      list.push({ r: 2, c: i, color: 'amber', isGem: true });
      list.push({ r: 5, c: i + 1, color: 'pink', isGem: true });
    }
  } else if (levelId === 7) {
    // Maze barrier
    for (let c = 0; c < 6; c++) list.push({ r: 2, c, color: 'gray', isFrozen: true });
    for (let c = 2; c < 8; c++) list.push({ r: 5, c, color: 'gray', isFrozen: true });
  } else if (levelId === 8) {
    // H Shape
    for (let r = 1; r <= 6; r++) {
      list.push({ r, c: 1, color: 'orange', isFrozen: true });
      list.push({ r, c: 6, color: 'orange', isFrozen: true });
    }
    list.push({ r: 3, c: 2, color: 'cyan', isGem: true });
    list.push({ r: 3, c: 3, color: 'cyan', isGem: true });
    list.push({ r: 3, c: 4, color: 'cyan', isGem: true });
    list.push({ r: 3, c: 5, color: 'cyan', isGem: true });
  } else if (levelId === 9) {
    // Outer frame of ice
    for (let i = 1; i <= 6; i++) {
      list.push({ r: 1, c: i, color: 'indigo', isFrozen: true });
      list.push({ r: 6, c: i, color: 'indigo', isFrozen: true });
      list.push({ r: i, c: 1, color: 'indigo', isFrozen: true });
      list.push({ r: i, c: 6, color: 'indigo', isFrozen: true });
    }
  } else {
    // For general high levels (10 to 30), procedurally generate interesting structures
    const randomSeed = levelId * 13;
    const blockCount = Math.min(4 + (levelId % 8), 12);
    for (let i = 0; i < blockCount; i++) {
      const r = (randomSeed + i * 7) % 8;
      const c = (randomSeed + i * 11) % 8;
      const isGem = (i % 2 === 0);
      const isFrozen = !isGem;
      list.push({
        r,
        c,
        isFrozen,
        isGem,
        color: ['teal', 'orange', 'fuchsia', 'lime', 'rose', 'sky'][i % 6],
      });
    }
  }

  return list;
}

// Generate list of 30 levels
export function generateLevels(): Level[] {
  const levels: Level[] = [];
  const baseRewardCoins = 50;
  const baseRewardXP = 100;

  for (let i = 1; i <= 30; i++) {
    const isGemLevel = i % 3 === 0 || i === 4;
    const isLineLevel = i % 2 === 0;

    const targetScore = 500 + i * 150;
    const targetLineClears = isLineLevel ? Math.min(5 + Math.floor(i / 2), 20) : undefined;
    const targetGems = isGemLevel ? Math.min(2 + Math.floor(i / 3), 15) : undefined;

    let preplacedGrid: any[] = [];
    if (i > 1 || i === 1) {
      preplacedGrid = createLevelGrid(i);
    }

    // Set targeted color task
    let targetColorClears: any = undefined;
    if (i % 5 === 0) {
      const colors = ['amber', 'sky', 'rose', 'emerald', 'indigo'];
      targetColorClears = {
        color: colors[i % colors.length],
        count: Math.min(10 + i * 2, 40),
        current: 0,
      };
    }

    levels.push({
      id: i,
      name: `Stage ${i}`,
      nameFa: `مرحله ${i}`,
      targetScore,
      targetLineClears,
      targetGems,
      targetColorClears,
      preplacedGrid,
      rewardCoins: baseRewardCoins + i * 10,
      rewardXP: baseRewardXP + i * 20,
      movesLimit: i > 15 ? 40 + (35 - i) : undefined, // moves limits on high stages
    });
  }

  return levels;
}

// Global leaderboard dummy data with competitive usernames and ratings
export const DEFAULT_LEADERBOARD: { rank: number; username: string; avatar: string; trophies: number; country: string }[] = [
  { rank: 1, username: 'BlockKing_99', avatar: '👑', trophies: 5420, country: '🇮🇷' },
  { rank: 2, username: 'TetrisGod_x', avatar: '⚡', trophies: 5110, country: '🇩🇪' },
  { rank: 3, username: 'Sina_Blast', avatar: '🔥', trophies: 4890, country: '🇮🇷' },
  { rank: 4, username: 'Yasamin_Puzzler', avatar: '💎', trophies: 4650, country: '🇮🇷' },
  { rank: 5, username: 'PuzzleMaster', avatar: '🧠', trophies: 4400, country: '🇺🇸' },
  { rank: 6, username: 'Ali_BlockStar', avatar: '⭐️', trophies: 4150, country: '🇮🇷' },
  { rank: 7, username: 'ZeroGravity', avatar: '🚀', trophies: 3990, country: '🇬🇧' },
  { rank: 8, username: 'Sara_Neon', avatar: '🌸', trophies: 3820, country: '🇮🇷' },
  { rank: 9, username: 'Speedy_Click', avatar: '🏃', trophies: 3650, country: '🇫🇷' },
  { rank: 10, username: 'BlockBoomer', avatar: '💥', trophies: 3500, country: '🇨🇦' },
];

export const OPPONENT_BOTS: { username: string; avatar: string; trophiesRange: [number, number]; errorRate: number; speedMs: number }[] = [
  { username: 'امیر_بلاست', avatar: '🔥', trophiesRange: [100, 1000], errorRate: 0.35, speedMs: 4000 },
  { username: 'مریم_پازلی', avatar: '🌸', trophiesRange: [800, 2000], errorRate: 0.25, speedMs: 3500 },
  { username: 'سامان_سرعتی', avatar: '⚡', trophiesRange: [1500, 3000], errorRate: 0.18, speedMs: 2500 },
  { username: 'کویین_بلاک', avatar: '👑', trophiesRange: [2500, 4500], errorRate: 0.12, speedMs: 2800 },
  { username: 'پرو_گیمر', avatar: '😎', trophiesRange: [3500, 6000], errorRate: 0.05, speedMs: 2000 },
];

// Generate initial daily quests
export function generateDailyQuests(): Quest[] {
  return [
    {
      id: 'quest_1',
      description: 'Place 100 blocks on the grid',
      descriptionFa: 'قرار دادن ۱۰۰ آجر در جدول',
      target: 100,
      current: 0,
      reward: 100,
      type: 'place_blocks',
      claimed: false,
    },
    {
      id: 'quest_2',
      description: 'Clear 15 full rows or columns',
      descriptionFa: 'پاک کردن ۱۵ ردیف یا ستون کامل',
      target: 15,
      current: 0,
      reward: 120,
      type: 'clear_lines',
      claimed: false,
    },
    {
      id: 'quest_3',
      description: 'Gain 1000 points in any mode',
      descriptionFa: 'کسب ۱۰۰۰ امتیاز در هر حالتی از بازی',
      target: 1000,
      current: 0,
      reward: 150,
      type: 'gain_score',
      claimed: false,
    },
    {
      id: 'quest_4',
      description: 'Win 2 Arena Duels',
      descriptionFa: 'پیروزی در ۲ دوئل میدان رقابت',
      target: 2,
      current: 0,
      reward: 200,
      type: 'win_duels',
      claimed: false,
    },
    {
      id: 'quest_5',
      description: 'Use power-ups 3 times',
      descriptionFa: 'استفاده از قدرت‌های ویژه به تعداد ۳ بار',
      target: 3,
      current: 0,
      reward: 80,
      type: 'use_powerup',
      claimed: false,
    },
  ];
}

// Profile Save / Load Helpers
const PROFILE_STORAGE_KEY = 'block_blast_arena_profile_v1';

export function loadProfile(): any {
  try {
    const data = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure everything is set
      if (!parsed.quests || parsed.quests.length === 0) {
        parsed.quests = generateDailyQuests();
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load profile', e);
  }

  // Initial user profile
  return {
    username: 'کاربر_جدید',
    avatar: '🦊',
    level: 1,
    xp: 0,
    coins: 200, // Starts with some coins for power-ups
    trophies: 200, // Starts at 200 trophies
    highestClassicScore: 0,
    completedLevels: [],
    unlockedSkins: ['neoglow'],
    activeSkin: 'neoglow',
    powerups: {
      rotate: 3,
      swap: 2,
      hammer: 1,
      undo: 2,
    },
    dailyStreak: 0,
    lastClaimedDaily: null,
    quests: generateDailyQuests(),
    lastQuestDate: new Date().toDateString(),
  };
}

export function saveProfile(profile: any): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}
