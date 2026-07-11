/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Gem, Snowflake } from 'lucide-react';
import { BoardCell, BlockSkin } from '../types';

interface BlockGridProps {
  grid: BoardCell[][];
  skin: BlockSkin;
  hoverCells: { r: number; c: number }[]; // Coordinates where the dragged block is hovering
  hoverColor?: string; // Color of the dragged block for preview
  onCellClick?: (r: number, c: number) => void; // Used for hammer powerup
  hammerMode?: boolean;
}

export default function BlockGrid({
  grid,
  skin,
  hoverCells,
  hoverColor,
  onCellClick,
  hammerMode,
}: BlockGridProps) {
  
  const isHovered = (r: number, c: number) => {
    return hoverCells.some((cell) => cell.r === r && cell.c === c);
  };

  return (
    <div className="relative p-3 bg-slate-950 border-4 border-slate-800 rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full aspect-square flex flex-col justify-between overflow-hidden">
      {/* Background neon flares for Neon style */}
      {skin.id === 'neoglow' && (
        <div className="absolute inset-0 bg-indigo-500/5 animate-pulse pointer-events-none" />
      )}

      {/* Grid of cells */}
      <div className="grid grid-cols-8 grid-rows-8 gap-1.5 w-full h-full">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const hover = isHovered(r, c);
            const filled = cell.color !== null;
            const activeColor = hover ? (hoverColor || 'indigo') : (cell.color || '');

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => onCellClick?.(r, c)}
                className={`relative rounded-lg aspect-square flex items-center justify-center transition-all ${
                  hammerMode ? 'hover:bg-rose-500/20 cursor-crosshair border border-rose-500/40 ring-1 ring-rose-500/20' : ''
                } ${
                  filled 
                    ? '' 
                    : hover 
                    ? 'scale-95' 
                    : 'bg-slate-900/60 border border-slate-800/40 shadow-inner'
                }`}
                style={{
                  boxShadow: hover ? '0 0 12px rgba(255,255,255,0.15)' : undefined,
                }}
              >
                {/* Empty cell indicator dot */}
                {!filled && !hover && (
                  <div className="w-1.5 h-1.5 bg-slate-800 rounded-full opacity-60" />
                )}

                {/* Filled or Ghost-Hover Cell styling */}
                {(filled || hover) && (
                  <motion.div
                    layoutId={filled ? undefined : `hover-ghost-${r}-${c}`}
                    className={`absolute inset-0 ${skin.cellClass(activeColor, hover)}`}
                    animate={
                      cell.clearing
                        ? { scale: [1, 1.2, 0], rotate: [0, 45, 90], opacity: 0 }
                        : { scale: 1, opacity: hover ? 0.35 : 1 }
                    }
                    transition={{ duration: cell.clearing ? 0.25 : 0.15 }}
                  >
                    {/* Bevel reflection for Candy or timber skins */}
                    {!hover && (skin.id === 'candypop' || skin.id === 'neoglow') && (
                      <div className="absolute top-0.5 left-0.5 right-0.5 h-1.5 bg-white/20 rounded-t-md pointer-events-none" />
                    )}
                  </motion.div>
                )}

                {/* Special Preplaced States Overlay: Gems / Diamonds */}
                {cell.isGem && !cell.clearing && (
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute z-10 flex items-center justify-center pointer-events-none drop-shadow-[0_2px_8px_rgba(236,72,153,0.6)]"
                  >
                    <Gem className="w-5 h-5 text-pink-400 fill-pink-400" />
                  </motion.div>
                )}

                {/* Special Preplaced States Overlay: Ice Blocks */}
                {cell.isFrozen && !cell.clearing && (
                  <div className="absolute inset-0 z-10 bg-sky-200/20 border-2 border-sky-300 rounded-lg flex items-center justify-center pointer-events-none backdrop-blur-[0.5px]">
                    <Snowflake className="w-4 h-4 text-sky-200 stroke-[2.5] drop-shadow-[0_1px_4px_rgba(56,189,248,0.5)] animate-spin-slow" />
                    {/* Cracks look */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-35" style={{ clipPath: 'polygon(0 0, 40% 50%, 0 100%, 70% 30%)' }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
