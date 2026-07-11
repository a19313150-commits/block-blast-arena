/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  RefreshCw,
  Zap,
  Trash2,
  Trophy,
  ArrowLeft,
  Coins,
  CheckCircle,
  AlertCircle,
  Flame,
  Award,
} from 'lucide-react';
import { UserProfile, Level, ActiveBlock, BoardCell, PowerUpType } from '../types';
import { getRandomBlocks, SKINS, audio, rotateBlockShape } from '../utils';
import BlockGrid from './BlockGrid';

interface GamePlayProps {
  key?: any;
  profile: UserProfile;
  mode: 'classic' | 'adventure' | 'arena';
  selectedLevel: Level | null;
  onUpdateProfile: (p: UserProfile) => void;
  onClose: () => void;
  // External hooks for Arena mode
  externalGrid?: BoardCell[][];
  onGridChange?: (grid: BoardCell[][]) => void;
  onScoreChange?: (score: number) => void;
  onGameOverChange?: (over: boolean) => void;
  isArenaOpponentReady?: boolean;
  arenaOpponent?: {
    username: string;
    avatar: string;
    score: number;
    board: (string | null)[][];
    status: string;
  };
  timeRemaining?: number;
  playerEmojis?: { emoji: string; timestamp: number }[];
  oppEmojis?: { emoji: string; timestamp: number }[];
  onSendEmoji?: (emoji: string) => void;
}

export default function GamePlay({
  profile,
  mode,
  selectedLevel,
  onUpdateProfile,
  onClose,
  externalGrid,
  onGridChange,
  onScoreChange,
  onGameOverChange,
  arenaOpponent,
  timeRemaining,
  playerEmojis,
  oppEmojis,
  onSendEmoji,
}: GamePlayProps) {
  const currentSkin = SKINS.find((s) => s.id === profile.activeSkin) || SKINS[0];

  // Game board: 8x8 grid of BoardCells
  const [grid, setGrid] = useState<BoardCell[][]>(() => {
    const initialGrid = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null).map(() => ({ color: null } as BoardCell)));
    
    // If we have preplaced levels
    if (mode === 'adventure' && selectedLevel?.preplacedGrid) {
      selectedLevel.preplacedGrid.forEach((block) => {
        initialGrid[block.r][block.c] = {
          color: block.color,
          isFrozen: block.isFrozen,
          isGem: block.isGem,
        } as BoardCell;
      });
    }
    return initialGrid;
  });

  // Level Targets progress (for Adventure mode)
  const [levelProgress, setLevelProgress] = useState({
    score: 0,
    linesCleared: 0,
    gemsCollected: 0,
    colorClearsCount: 0,
    movesPlaced: 0,
  });

  const [activeBlocks, setActiveBlocks] = useState<ActiveBlock[]>(() => getRandomBlocks());
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);
  
  // Mobile touch/dragging states & ref
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchCoords, setTouchCoords] = useState<{ x: number; y: number } | null>(null);
  const [hoverAnchor, setHoverAnchor] = useState<{ r: number; c: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const hoverAnchorRef = useRef<{ r: number; c: number } | null>(null);
  
  // Powerup activation states
  const [hammerActive, setHammerActive] = useState(false);
  const [rotatePowerupActive, setRotatePowerupActive] = useState(false);

  // Score & Combo multipliers
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [comboText, setComboText] = useState<string | null>(null);

  // States
  const [gameOver, setGameOver] = useState(false);
  const [stageCleared, setStageCleared] = useState(false);

  // History for Undo
  const historyRef = useRef<{ grid: BoardCell[][]; score: number; blocks: ActiveBlock[] } | null>(null);

  // Sync to parent hooks for Online Duel mode
  useEffect(() => {
    if (onGridChange) onGridChange(grid);
  }, [grid]);

  useEffect(() => {
    if (onScoreChange) onScoreChange(score);
  }, [score]);

  useEffect(() => {
    if (onGameOverChange) onGameOverChange(gameOver);
  }, [gameOver]);

  // Hover ghost calculations
  const [hoverCells, setHoverCells] = useState<{ r: number; c: number }[]>([]);

  // Reset/Restart Game
  const startNewGame = () => {
    audio.playClick();
    const initialGrid = Array(8)
      .fill(null)
      .map(() => Array(8).fill(null).map(() => ({ color: null } as BoardCell)));

    if (mode === 'adventure' && selectedLevel?.preplacedGrid) {
      selectedLevel.preplacedGrid.forEach((block) => {
        initialGrid[block.r][block.c] = {
          color: block.color,
          isFrozen: block.isFrozen,
          isGem: block.isGem,
        } as BoardCell;
      });
    }

    setGrid(initialGrid);
    setLevelProgress({
      score: 0,
      linesCleared: 0,
      gemsCollected: 0,
      colorClearsCount: 0,
      movesPlaced: 0,
    });
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setStageCleared(false);
    setActiveBlocks(getRandomBlocks());
    setSelectedBlockIdx(null);
    setHammerActive(false);
    setRotatePowerupActive(false);
    historyRef.current = null;
  };

  // Check if a block shape can possibly fit at coordinate (r, c)
  const canFitAt = (blockShape: number[][], r: number, c: number, targetGrid: BoardCell[][]) => {
    const rows = blockShape.length;
    const cols = blockShape[0].length;

    if (r < 0 || c < 0 || r + rows > 8 || c + cols > 8) return false;

    for (let br = 0; br < rows; br++) {
      for (let bc = 0; bc < cols; bc++) {
        if (blockShape[br][bc] === 1) {
          if (targetGrid[r + br][c + bc].color !== null) {
            return false;
          }
        }
      }
    }
    return true;
  };

  // Check if ANY of the remaining unplaced active blocks can fit ANYWHERE on the grid
  const checkGameOver = (currentGrid: BoardCell[][], blocks: ActiveBlock[]) => {
    const unplaced = blocks.filter((b) => !b.placed);
    if (unplaced.length === 0) return false; // Full round completed, will generate new ones anyway

    for (const block of unplaced) {
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (canFitAt(block.shape, r, c, currentGrid)) {
            return false; // Can fit, game continues!
          }
        }
      }
    }
    return true; // No blocks can fit anywhere! Game over.
  };

  // Click on a cell to select target for placing active block
  const handleGridCellClick = (r: number, c: number) => {
    // 1. Hammer Mode
    if (hammerActive) {
      audio.playLineClear();
      const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
      
      // Clear a 3x3 area around click
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
            newGrid[nr][nc] = { color: null };
          }
        }
      }

      setGrid(newGrid);
      setHammerActive(false);

      // Decrement hammer powerup
      const updated = { ...profile };
      updated.powerups.hammer = Math.max(0, updated.powerups.hammer - 1);
      
      // Update daily quest
      const quest = updated.quests.find((q) => q.type === 'use_powerup');
      if (quest && !quest.claimed) {
        quest.current = Math.min(quest.target, quest.current + 1);
      }

      onUpdateProfile(updated);
      return;
    }

    // 2. Standard placing mode
    if (selectedBlockIdx === null) return;
    const block = activeBlocks[selectedBlockIdx];

    if (canFitAt(block.shape, r, c, grid)) {
      // Record history for Undo before placing
      historyRef.current = {
        grid: grid.map((row) => row.map((cell) => ({ ...cell }))),
        score,
        blocks: activeBlocks.map((b) => ({ ...b, shape: b.shape.map((s) => [...s]) })),
      };

      audio.playPlace();

      // Place block
      const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
      const shapeRows = block.shape.length;
      const shapeCols = block.shape[0].length;

      let placedColorCount = 0;

      for (let br = 0; br < shapeRows; br++) {
        for (let bc = 0; bc < shapeCols; bc++) {
          if (block.shape[br][bc] === 1) {
            newGrid[r + br][c + bc] = {
              color: block.color,
              isFrozen: false,
              isGem: false,
            };
            placedColorCount++;
          }
        }
      }

      // Mark block as placed
      const newActiveBlocks = activeBlocks.map((b, idx) =>
        idx === selectedBlockIdx ? { ...b, placed: true } : b
      );

      // Calculate placement score: 10 points per filled square
      let turnScore = placedColorCount * 10;

      // Lines Clearance Scans
      const rowsToClear: number[] = [];
      const colsToClear: number[] = [];

      // Scan rows
      for (let i = 0; i < 8; i++) {
        if (newGrid[i].every((cell) => cell.color !== null)) {
          rowsToClear.push(i);
        }
      }

      // Scan columns
      for (let j = 0; j < 8; j++) {
        let isColFull = true;
        for (let i = 0; i < 8; i++) {
          if (newGrid[i][j].color === null) {
            isColFull = false;
            break;
          }
        }
        if (isColFull) {
          colsToClear.push(j);
        }
      }

      const totalLinesCleared = rowsToClear.length + colsToClear.length;
      let gemsCount = 0;
      let colorTargetCount = 0;

      if (totalLinesCleared > 0) {
        // Line clear audio & multiplier combos
        audio.playLineClear();
        const currentCombo = combo + 1;
        setCombo(currentCombo);

        if (currentCombo > 1) {
          audio.playCombo(currentCombo);
          setComboText(`Combo x${currentCombo}!`);
          setTimeout(() => setComboText(null), 1500);
        }

        // Blast score: 100 points per line, multiplied by combo factor
        turnScore += totalLinesCleared * 100 * currentCombo;

        // Visual break & collect Gems
        rowsToClear.forEach((rowIdx) => {
          for (let colIdx = 0; colIdx < 8; colIdx++) {
            if (newGrid[rowIdx][colIdx].isGem) gemsCount++;
            if (selectedLevel?.targetColorClears && newGrid[rowIdx][colIdx].color === selectedLevel.targetColorClears.color) {
              colorTargetCount++;
            }
            newGrid[rowIdx][colIdx].clearing = true;
          }
        });

        colsToClear.forEach((colIdx) => {
          for (let rowIdx = 0; rowIdx < 8; rowIdx++) {
            if (newGrid[rowIdx][colIdx].isGem) gemsCount++;
            if (selectedLevel?.targetColorClears && newGrid[rowIdx][colIdx].color === selectedLevel.targetColorClears.color) {
              colorTargetCount++;
            }
            newGrid[rowIdx][colIdx].clearing = true;
          }
        });

        // Trigger brief delay to clean visual states
        setTimeout(() => {
          setGrid((g) =>
            g.map((row) =>
              row.map((cell) => (cell.clearing ? { color: null } : cell))
            )
          );
        }, 200);
      } else {
        setCombo(0); // Reset combo if no line cleared
      }

      // Check if all 3 blocks of round are placed
      const allPlaced = newActiveBlocks.every((b) => b.placed);
      let finalActiveBlocks = newActiveBlocks;
      if (allPlaced) {
        finalActiveBlocks = getRandomBlocks();
      }

      // Update States
      const finalScore = score + turnScore;
      setScore(finalScore);
      setActiveBlocks(finalActiveBlocks);
      setSelectedBlockIdx(null);
      setHoverCells([]);

      // Update quests and adventure details
      const updatedProgress = {
        score: finalScore,
        linesCleared: levelProgress.linesCleared + totalLinesCleared,
        gemsCollected: levelProgress.gemsCollected + gemsCount,
        colorClearsCount: levelProgress.colorClearsCount + colorTargetCount,
        movesPlaced: levelProgress.movesPlaced + 1,
      };
      setLevelProgress(updatedProgress);

      // Trigger daily quest updates
      const updatedProfile = { ...profile };
      
      // Quest: place blocks
      const placeQuest = updatedProfile.quests.find((q) => q.type === 'place_blocks');
      if (placeQuest && !placeQuest.claimed) {
        placeQuest.current = Math.min(placeQuest.target, placeQuest.current + placedColorCount);
      }

      // Quest: clear lines
      const clearQuest = updatedProfile.quests.find((q) => q.type === 'clear_lines');
      if (clearQuest && totalLinesCleared > 0 && !clearQuest.claimed) {
        clearQuest.current = Math.min(clearQuest.target, clearQuest.current + totalLinesCleared);
      }

      // Quest: gain score
      const scoreQuest = updatedProfile.quests.find((q) => q.type === 'gain_score');
      if (scoreQuest && !scoreQuest.claimed) {
        scoreQuest.current = Math.min(scoreQuest.target, scoreQuest.current + turnScore);
      }

      onUpdateProfile(updatedProfile);

      // Check Adventure Game Mode Goal Completion
      if (mode === 'adventure' && selectedLevel) {
        const scoreTargetMet = finalScore >= selectedLevel.targetScore;
        const lineTargetMet = selectedLevel.targetLineClears ? updatedProgress.linesCleared >= selectedLevel.targetLineClears : true;
        const gemTargetMet = selectedLevel.targetGems ? updatedProgress.gemsCollected >= selectedLevel.targetGems : true;
        const colorTargetMet = selectedLevel.targetColorClears ? updatedProgress.colorClearsCount >= selectedLevel.targetColorClears.count : true;

        if (scoreTargetMet && lineTargetMet && gemTargetMet && colorTargetMet) {
          // WIN STAGE
          handleAdventureWin();
          return;
        }

        // Limit Moves check
        if (selectedLevel.movesLimit && updatedProgress.movesPlaced >= selectedLevel.movesLimit) {
          setGameOver(true);
          audio.playGameOver();
          return;
        }
      } else if (mode === 'classic') {
        if (finalScore > profile.highestClassicScore) {
          updatedProfile.highestClassicScore = finalScore;
          onUpdateProfile(updatedProfile);
        }
      }

      // Check if board has no available fit moves for remaining blocks
      const isGameOver = checkGameOver(newGrid, finalActiveBlocks);
      if (isGameOver) {
        setGameOver(true);
        audio.playGameOver();
      } else {
        setGrid(newGrid);
      }
    } else {
      audio.playGameOver(); // Buzzer for invalid fit
    }
  };

  // Winning Adventure Mode Level Details
  const handleAdventureWin = () => {
    if (stageCleared) return;
    setStageCleared(true);
    audio.playVictory();

    const updated = { ...profile };
    if (selectedLevel) {
      if (!updated.completedLevels.includes(selectedLevel.id)) {
        updated.completedLevels.push(selectedLevel.id);
      }
      updated.coins += selectedLevel.rewardCoins;
      updated.xp += selectedLevel.rewardXP;

      // Handle profile level upgrade
      const newLvl = Math.floor(updated.xp / 500) + 1;
      if (newLvl > updated.level) {
        updated.level = newLvl;
      }
    }
    onUpdateProfile(updated);
  };

  // Powerups Actions
  const useRotatePowerup = () => {
    if (profile.powerups.rotate <= 0 || rotatePowerupActive) return;
    audio.playClick();
    setRotatePowerupActive(true);
  };

  const executeRotation = (blockIdx: number) => {
    if (!rotatePowerupActive) return;
    
    audio.playRotate();
    const blocks = [...activeBlocks];
    blocks[blockIdx].shape = rotateBlockShape(blocks[blockIdx].shape);
    blocks[blockIdx].rotatedCount = (blocks[blockIdx].rotatedCount || 0) + 1;

    setActiveBlocks(blocks);
    setRotatePowerupActive(false);

    // Decrement powerup count
    const updated = { ...profile };
    updated.powerups.rotate = Math.max(0, updated.powerups.rotate - 1);

    // Daily Quest tracking
    const quest = updated.quests.find((q) => q.type === 'use_powerup');
    if (quest && !quest.claimed) {
      quest.current = Math.min(quest.target, quest.current + 1);
    }
    
    onUpdateProfile(updated);
  };

  const useSwapPowerup = () => {
    if (profile.powerups.swap <= 0) return;

    audio.playPowerup();
    setActiveBlocks(getRandomBlocks());
    setSelectedBlockIdx(null);

    // Decrement swap count
    const updated = { ...profile };
    updated.powerups.swap = Math.max(0, updated.powerups.swap - 1);

    // Daily Quest tracking
    const quest = updated.quests.find((q) => q.type === 'use_powerup');
    if (quest && !quest.claimed) {
      quest.current = Math.min(quest.target, quest.current + 1);
    }

    onUpdateProfile(updated);
  };

  const useHammerPowerup = () => {
    if (profile.powerups.hammer <= 0 || hammerActive) return;
    audio.playClick();
    setHammerActive(true);
    setSelectedBlockIdx(null);
  };

  const useUndoPowerup = () => {
    if (profile.powerups.undo <= 0 || !historyRef.current) return;

    audio.playPowerup();
    setGrid(historyRef.current.grid);
    setScore(historyRef.current.score);
    setActiveBlocks(historyRef.current.blocks);
    setSelectedBlockIdx(null);
    setGameOver(false);

    historyRef.current = null; // Consume undo history

    // Decrement undo count
    const updated = { ...profile };
    updated.powerups.undo = Math.max(0, updated.powerups.undo - 1);

    // Daily Quest tracking
    const quest = updated.quests.find((q) => q.type === 'use_powerup');
    if (quest && !quest.claimed) {
      quest.current = Math.min(quest.target, quest.current + 1);
    }

    onUpdateProfile(updated);
  };

  // Preview cell calculation when a block is clicked/selected
  const handleSelectBlock = (idx: number) => {
    audio.playClick();
    if (rotatePowerupActive) {
      executeRotation(idx);
      return;
    }
    setSelectedBlockIdx(idx === selectedBlockIdx ? null : idx);
    setHoverCells([]);
    setHoverAnchor(null);
  };

  // Cell Hovering previews to let user know where blocks will match
  const handleCellHover = (r: number, c: number) => {
    if (selectedBlockIdx === null) return;
    const block = activeBlocks[selectedBlockIdx];
    const rows = block.shape.length;
    const cols = block.shape[0].length;

    if (r < 0 || c < 0 || r + rows > 8 || c + cols > 8) {
      setHoverCells([]);
      setHoverAnchor(null);
      hoverAnchorRef.current = null;
      return;
    }

    const cells: { r: number; c: number }[] = [];
    for (let br = 0; br < rows; br++) {
      for (let bc = 0; bc < cols; bc++) {
        if (block.shape[br][bc] === 1) {
          cells.push({ r: r + br, c: c + bc });
        }
      }
    }
    setHoverCells(cells);
    setHoverAnchor({ r, c });
    hoverAnchorRef.current = { r, c };
  };

  // Mobile drag-and-drop / touch gesture handlers
  const handleBlockTouchStart = (e: React.TouchEvent, idx: number) => {
    if (hammerActive) return;
    if (rotatePowerupActive) {
      executeRotation(idx);
      e.preventDefault();
      return;
    }

    audio.playClick();
    setSelectedBlockIdx(idx);
    setIsTouchDragging(true);

    const touch = e.touches[0];
    setTouchCoords({ x: touch.clientX, y: touch.clientY });
  };

  const handleGlobalTouchMove = (e: React.TouchEvent) => {
    if (selectedBlockIdx === null || !isTouchDragging) return;
    const touch = e.touches[0];
    setTouchCoords({ x: touch.clientX, y: touch.clientY });

    if (!gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Offset the target position upward to sit cleanly above user's thumb (center of block)
    const TOUCH_OFFSET_Y = -90;
    const cellWidth = rect.width / 8;
    const cellHeight = rect.height / 8;

    const block = activeBlocks[selectedBlockIdx];
    const rows = block.shape.length;
    const cols = block.shape[0].length;

    // Calculate top-left cell coordinate (row, col) such that the block's visual center 
    // is placed exactly over (x, y + TOUCH_OFFSET_Y)
    const col = Math.round(x / cellWidth - cols / 2);
    const row = Math.round((y + TOUCH_OFFSET_Y) / cellHeight - rows / 2);

    if (row >= 0 && row + rows <= 8 && col >= 0 && col + cols <= 8) {
      handleCellHover(row, col);
    } else {
      setHoverCells([]);
      setHoverAnchor(null);
      hoverAnchorRef.current = null;
    }
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (selectedBlockIdx === null || !isTouchDragging) return;

    setIsTouchDragging(false);
    setTouchCoords(null);

    const currentAnchor = hoverAnchorRef.current;
    if (currentAnchor) {
      const { r, c } = currentAnchor;
      handleGridCellClick(r, c);
    }

    setHoverAnchor(null);
    hoverAnchorRef.current = null;
    setHoverCells([]);
  };

  return (
    <div
      className={`w-full max-w-md mx-auto p-4 flex flex-col justify-between min-h-screen text-white select-none ${
        isTouchDragging ? 'touch-none' : ''
      }`}
      onTouchMove={handleGlobalTouchMove}
      onTouchEnd={handleGlobalTouchEnd}
      onTouchCancel={handleGlobalTouchEnd}
    >
      {/* Top Header */}
      {mode !== 'arena' && (
        <div className="flex justify-between items-center bg-slate-900/60 backdrop-blur p-3 rounded-2xl mb-4 border border-slate-800">
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </button>

          {/* Score Display */}
          <div className="text-center font-sans">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">امتیاز بازی</span>
            <h2 className="text-2xl font-black text-indigo-400 leading-none">{score}</h2>
          </div>

          {/* Level Targets or High Score Info */}
          <div className="text-right">
            {mode === 'adventure' && selectedLevel ? (
              <div className="bg-emerald-950/40 border border-emerald-800 px-3 py-1 rounded-xl flex items-center gap-1.5 font-sans">
                <Award className="w-4 h-4 text-emerald-400 animate-pulse" />
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block leading-tight">مرحله {selectedLevel.id}</span>
                  <span className="text-xs font-bold text-emerald-400 leading-none">
                    {score} / {selectedLevel.targetScore}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/80 px-3 py-1 rounded-xl flex items-center gap-1.5 font-sans">
                <Trophy className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block leading-tight">رکورد شما</span>
                  <span className="text-xs font-bold text-yellow-400 leading-none">
                    {Math.max(score, profile.highestClassicScore)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arena 1v1 Status Header */}
      {mode === 'arena' && arenaOpponent && (
        <div className="flex justify-between items-center bg-slate-900/80 border border-slate-800 p-3 rounded-2xl mb-3 shadow-lg">
          {/* Player Info Left */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-lg relative border border-indigo-500/30">
              {profile.avatar}
              {/* Floating Emojis received from opponent */}
              <AnimatePresence>
                {oppEmojis?.map((em, idx) => {
                  if (Date.now() - em.timestamp > 3000) return null;
                  return (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -40, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-50 text-2xl"
                    >
                      {em.emoji}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
            <div className="text-left font-sans">
              <div className="text-xs font-bold text-white truncate max-w-[100px]">{profile.username}</div>
              <div className="text-sm font-black text-indigo-400">{score}</div>
            </div>
          </div>

          {/* Match Timer */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-sans font-semibold">زمان باقی‌مانده</span>
            <span className={`text-lg font-extrabold font-mono ${(timeRemaining || 0) <= 15 ? 'text-rose-500 animate-pulse font-black' : 'text-yellow-400'}`}>
              {timeRemaining}s
            </span>
          </div>

          {/* Opponent Info Right */}
          <div className="flex items-center gap-2">
            <div className="text-right font-sans">
              <div className="text-xs font-bold text-white truncate max-w-[100px]">{arenaOpponent.username}</div>
              <div className="text-sm font-black text-pink-400">{arenaOpponent.score}</div>
            </div>
            <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center text-lg relative border border-pink-500/30">
              {arenaOpponent.avatar}
              {arenaOpponent.status === 'gameover' && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold px-1 rounded-full text-white">OUT</span>
              )}
              {/* Floating Emojis sent by player */}
              <AnimatePresence>
                {playerEmojis?.map((em, idx) => {
                  if (Date.now() - em.timestamp > 3000) return null;
                  return (
                    <motion.span
                      key={idx}
                      initial={{ opacity: 0, y: 10, scale: 0.5 }}
                      animate={{ opacity: 1, y: -40, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      className="absolute z-50 text-2xl"
                    >
                      {em.emoji}
                    </motion.span>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Opponent Grid HUD */}
      {mode === 'arena' && arenaOpponent && (
        <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-2xl flex items-center justify-between mb-3 shadow-md gap-4">
          <div className="text-right font-sans">
            <span className="text-[10px] text-pink-400 block font-bold">برد حریف (Live Opponent)</span>
            <span className="text-xs text-slate-400 mt-1 block font-semibold">امتیاز: {arenaOpponent.score}</span>
          </div>

          <div className="grid grid-cols-8 grid-rows-8 gap-0.5 w-16 h-16 bg-slate-950 border border-slate-800/80 rounded-lg p-0.5">
            {arenaOpponent.board.map((row, r) =>
              row.map((cellColor, c) => (
                <div
                  key={`mini-gameplay-${r}-${c}`}
                  className={`rounded-[1px] aspect-square ${
                    cellColor
                      ? `bg-${cellColor}-500 opacity-90`
                      : 'bg-slate-900/40'
                  }`}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* EMOJIS TAUNT CHAT */}
      {mode === 'arena' && onSendEmoji && (
        <div className="bg-slate-900/60 border border-slate-800 p-1.5 rounded-2xl mb-3 flex items-center justify-between">
          <span className="text-[9px] text-slate-400 font-semibold pr-2 font-sans">کل‌کل زنده (Taunts):</span>
          <div className="flex gap-2.5 overflow-x-auto">
            {['😂', '😎', '😠', '😮', '👍', '🔥', '👑', '💥'].map((em) => (
              <button
                key={em}
                onClick={() => onSendEmoji(em)}
                className="text-xl hover:scale-130 active:scale-90 transition-all cursor-pointer"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Level Targets Panel if in Adventure Mode */}
      {mode === 'adventure' && selectedLevel && (
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl mb-4 text-right">
          <p className="text-[10px] text-slate-400 font-semibold mb-2 font-sans">اهداف مرحله:</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-sans">
            {/* Goal 1: Score */}
            <div className="bg-slate-950/60 p-2 rounded-xl flex justify-between items-center">
              <span className={`font-bold ${score >= selectedLevel.targetScore ? 'text-emerald-400' : 'text-slate-300'}`}>
                {score}/{selectedLevel.targetScore}
              </span>
              <span className="text-slate-400">امتیاز:</span>
            </div>

            {/* Goal 2: Lines Cleared */}
            {selectedLevel.targetLineClears !== undefined && (
              <div className="bg-slate-950/60 p-2 rounded-xl flex justify-between items-center">
                <span className={`font-bold ${levelProgress.linesCleared >= selectedLevel.targetLineClears ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {levelProgress.linesCleared}/{selectedLevel.targetLineClears}
                </span>
                <span className="text-slate-400">پاکسازی:</span>
              </div>
            )}

            {/* Goal 3: Gems Collected */}
            {selectedLevel.targetGems !== undefined && (
              <div className="bg-slate-950/60 p-2 rounded-xl flex justify-between items-center">
                <span className={`font-bold ${levelProgress.gemsCollected >= selectedLevel.targetGems ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {levelProgress.gemsCollected}/{selectedLevel.targetGems}
                </span>
                <span className="text-slate-400">جواهرات:</span>
              </div>
            )}

            {/* Goal 4: Colors targeted */}
            {selectedLevel.targetColorClears !== undefined && (
              <div className="bg-slate-950/60 p-2 rounded-xl flex justify-between items-center">
                <span className={`font-bold ${levelProgress.colorClearsCount >= selectedLevel.targetColorClears.count ? 'text-emerald-400' : 'text-slate-300'}`}>
                  {levelProgress.colorClearsCount}/{selectedLevel.targetColorClears.count}
                </span>
                <span className="text-slate-400">بلوک {selectedLevel.targetColorClears.color === 'amber' ? 'زرد' : 'قرمز'}:</span>
              </div>
            )}

            {/* Goal 5: Moves Limit */}
            {selectedLevel.movesLimit !== undefined && (
              <div className="bg-slate-950/60 p-2 rounded-xl flex justify-between items-center col-span-2 border border-red-950">
                <span className={`font-bold ${selectedLevel.movesLimit - levelProgress.movesPlaced <= 5 ? 'text-rose-500 font-extrabold animate-pulse' : 'text-slate-300'}`}>
                  {selectedLevel.movesLimit - levelProgress.movesPlaced} حرکت باقی‌مانده
                </span>
                <span className="text-slate-400">محدودیت حرکات:</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Combo Pops */}
      <AnimatePresence>
        {comboText && (
          <motion.div
            initial={{ scale: 0.5, y: 20, opacity: 0 }}
            animate={{ scale: [1, 1.3, 1], y: -20, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 transform -translate-x-1/2 top-40 z-30 font-sans font-black text-3xl text-yellow-400 drop-shadow-[0_4px_12px_rgba(234,179,8,0.6)] flex items-center gap-1.5"
          >
            <Flame className="w-8 h-8 text-orange-500 fill-orange-500 animate-bounce" />
            {comboText}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Powerups Tray */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-2xl mb-4 flex justify-around">
        {/* Powerup 1: Rotate */}
        <button
          onClick={useRotatePowerup}
          disabled={profile.powerups.rotate <= 0 || rotatePowerupActive}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
            rotatePowerupActive ? 'bg-indigo-600/30 border border-indigo-500' : 'hover:bg-slate-800/50'
          } disabled:opacity-30`}
        >
          <div className="p-1.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-sans">چرخش ({profile.powerups.rotate})</span>
        </button>

        {/* Powerup 2: Swap */}
        <button
          onClick={useSwapPowerup}
          disabled={profile.powerups.swap <= 0}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer disabled:opacity-30"
        >
          <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-sans">تعویض ({profile.powerups.swap})</span>
        </button>

        {/* Powerup 3: Hammer */}
        <button
          onClick={useHammerPowerup}
          disabled={profile.powerups.hammer <= 0 || hammerActive}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer ${
            hammerActive ? 'bg-rose-600/30 border border-rose-500' : 'hover:bg-slate-800/50'
          } disabled:opacity-30`}
        >
          <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg animate-pulse">
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-sans">چکش ({profile.powerups.hammer})</span>
        </button>

        {/* Powerup 4: Undo */}
        <button
          onClick={useUndoPowerup}
          disabled={profile.powerups.undo <= 0 || !historyRef.current}
          className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-800/50 transition-all cursor-pointer disabled:opacity-30"
        >
          <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg">
            <RotateCcw className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-sans">برگشت ({profile.powerups.undo})</span>
        </button>
      </div>

      {/* Game board element */}
      <div className="flex-1 flex items-center justify-center my-2">
        <div className="relative w-full max-w-sm">
          {/* Instruction helper */}
          {rotatePowerupActive && (
            <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center text-center p-4 rounded-3xl backdrop-blur-sm pointer-events-none">
              <RefreshCw className="w-12 h-12 text-sky-400 animate-spin mb-3" />
              <p className="font-bold text-sm font-sans text-sky-300">چرخش آجر فعال است</p>
              <p className="text-[11px] text-slate-300 mt-1 font-sans">روی یکی از سه آجر پایین کلیک کنید تا آن را بچرخانید</p>
            </div>
          )}

          {/* Active board */}
          <div ref={gridRef} className="relative z-10 w-full" onMouseLeave={() => setHoverCells([])}>
            <div className="grid grid-cols-8 grid-rows-8 gap-0 w-full h-full absolute inset-0 z-0">
              {/* Invisible grid cells helper for mouse hovering drag simulation */}
              {Array(8)
                .fill(null)
                .map((_, r) =>
                  Array(8)
                    .fill(null)
                    .map((_, c) => (
                      <div
                        key={`hover-${r}-${c}`}
                        onMouseEnter={() => handleCellHover(r, c)}
                        onClick={() => handleGridCellClick(r, c)}
                        className="cursor-pointer"
                      />
                    ))
                )}
            </div>

            <BlockGrid
              grid={grid}
              skin={currentSkin}
              hoverCells={hoverCells}
              hoverColor={selectedBlockIdx !== null ? activeBlocks[selectedBlockIdx].color : undefined}
              onCellClick={hammerActive ? (r, c) => handleGridCellClick(r, c) : undefined}
              hammerMode={hammerActive}
            />
          </div>
        </div>
      </div>

      {/* Active Blocks Tray selection */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-3xl mt-4 text-center">
        <p className="text-[10px] text-slate-500 font-semibold mb-3 font-sans">آجرهای فعال برای جایگذاری:</p>
        
        <div className="flex justify-around items-center gap-2">
          {activeBlocks.map((block, idx) => {
            if (block.placed) {
              return (
                <div
                  key={block.id}
                  className="w-20 h-20 border border-dashed border-slate-800/40 rounded-2xl flex items-center justify-center opacity-10 bg-slate-950/20"
                />
              );
            }

            const selected = idx === selectedBlockIdx;

            return (
              <motion.button
                key={block.id}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectBlock(idx)}
                onTouchStart={(e) => handleBlockTouchStart(e, idx)}
                className={`w-24 h-24 p-2 bg-slate-950/80 hover:bg-slate-950 border rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                  selected 
                    ? 'border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30' 
                    : 'border-slate-800/60'
                }`}
              >
                {/* Visual grid layout representation of block shape */}
                <div className="flex flex-col gap-1">
                  {block.shape.map((row, r) => (
                    <div key={r} className="flex gap-1 justify-center">
                      {row.map((cell, c) => (
                        <div
                          key={c}
                          className={`w-3 h-3 rounded-sm ${
                            cell === 1 
                              ? currentSkin.cellClass(block.color, false).replace('rounded-md', 'rounded-sm') 
                              : 'bg-transparent border border-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {selected && (
                  <span className="absolute -top-1.5 -right-1.5 bg-indigo-500 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider font-sans">
                    آماده
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* OVERLAY: GAME OVER OR STAGE COMPLETED MODALS */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700/60 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full inline-flex mb-4">
                <AlertCircle className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-white font-sans">پایان بازی!</h3>
              <p className="text-slate-400 text-xs font-sans mt-1">No more moves can fit on the grid</p>

              <div className="bg-slate-950 p-4 rounded-2xl my-6 border border-slate-850">
                <span className="text-slate-400 text-xs font-sans block">امتیاز نهایی شما:</span>
                <span className="text-3xl font-black text-indigo-400 font-sans mt-1 block">{score}</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={startNewGame}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl active:scale-95 transition-all cursor-pointer font-sans"
                >
                  دوباره تلاش کن (Retry)
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-xl font-bold font-sans text-xs cursor-pointer"
                >
                  منوی اصلی
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {stageCleared && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700/60 p-6 rounded-3xl w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
              <div className="p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full inline-flex mb-4">
                <CheckCircle className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-black text-white font-sans">مرحله با موفقیت حل شد!</h3>
              <p className="text-slate-400 text-xs font-sans mt-1">Stage Completed Successfully!</p>

              {/* Reward stats */}
              {selectedLevel && (
                <div className="bg-slate-950 p-4 rounded-2xl my-6 border border-slate-850 space-y-2.5 text-right font-sans">
                  <span className="text-slate-400 text-xs block text-center mb-1">جوایز دریافت شده:</span>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-extrabold text-yellow-400 flex items-center gap-1">
                      +{selectedLevel.rewardCoins} سکه
                      <Coins className="w-4 h-4 fill-current" />
                    </span>
                    <span className="text-slate-400">سکه:</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-extrabold text-emerald-400">+{selectedLevel.rewardXP} XP</span>
                    <span className="text-slate-400">امتیاز تجربه:</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer font-sans"
              >
                تایید و ادامه مسیر (Continue)
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BLOCK PREVIEW FOR TOUCH DRAGS */}
      {isTouchDragging && touchCoords && selectedBlockIdx !== null && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 scale-110 drop-shadow-[0_15px_30px_rgba(0,0,0,0.6)]"
          style={{
            left: touchCoords.x,
            top: touchCoords.y - 90,
          }}
        >
          <div className="flex flex-col gap-1 p-2.5 bg-slate-900/95 border border-indigo-500/50 rounded-2xl shadow-inner backdrop-blur-md">
            {activeBlocks[selectedBlockIdx].shape.map((row, r) => (
              <div key={r} className="flex gap-1 justify-center">
                {row.map((cell, c) => (
                  <div
                    key={c}
                    className={`w-5 h-5 rounded-md ${
                      cell === 1 
                        ? currentSkin.cellClass(activeBlocks[selectedBlockIdx].color, false)
                        : 'bg-transparent border border-transparent'
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
