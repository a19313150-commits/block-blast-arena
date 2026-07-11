/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords, Zap, AlertTriangle, Users, Smile, Compass } from 'lucide-react';
import { UserProfile, ActiveBlock, BoardCell, OpponentState, BlockSkin } from '../types';
import { OPPONENT_BOTS, audio } from '../utils';
import BlockGrid from './BlockGrid';
import GamePlay from './GamePlay';

interface ArenaDuelProps {
  profile: UserProfile;
  skin: BlockSkin;
  onUpdateProfile: (p: UserProfile) => void;
  onClose: () => void;
  userGrid: BoardCell[][]; // Pass reference to user's grid state
  userScore: number;
  userGameOver: boolean;
  onResetUserGame: () => void;
  onGridChange: (grid: BoardCell[][]) => void;
  onScoreChange: (score: number) => void;
  onGameOverChange: (over: boolean) => void;
}

const EMOJIS = ['😂', '😎', '😠', '😮', '👍', '🔥', '👑', '💥'];

export default function ArenaDuel({
  profile,
  skin,
  onUpdateProfile,
  onClose,
  userGrid,
  userScore,
  userGameOver,
  onResetUserGame,
  onGridChange,
  onScoreChange,
  onGameOverChange,
}: ArenaDuelProps) {
  const [stage, setStage] = useState<'lobby' | 'searching' | 'playing' | 'result'>('lobby');
  const [opponent, setOpponent] = useState<any | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(90); // 90 seconds speed duel
  const [oppState, setOppState] = useState<OpponentState>({
    username: '',
    avatar: '🤖',
    trophies: 100,
    score: 0,
    board: Array(8).fill(null).map(() => Array(8).fill(null)),
    emojisSent: [],
    status: 'playing',
  });

  const [playerEmojis, setPlayerEmojis] = useState<{ emoji: string; timestamp: number }[]>([]);
  const [resultMessage, setResultMessage] = useState<{ title: string; subtitle: string; trophies: number; coins: number; isWin: boolean } | null>(null);

  const searchTimerRef = useRef<any>(null);
  const gameTimerRef = useRef<any>(null);
  const botPlayIntervalRef = useRef<any>(null);

  // Start Searching for opponent
  const startMatchmaking = () => {
    audio.playClick();
    setStage('searching');

    // Pick random bot matching user trophy level
    const matchedBot = OPPONENT_BOTS[Math.floor(Math.random() * OPPONENT_BOTS.length)];
    
    let searchStep = 0;
    searchTimerRef.current = setInterval(() => {
      searchStep++;
      if (searchStep >= 3) {
        clearInterval(searchTimerRef.current);
        // Found opponent
        setOpponent(matchedBot);
        setOppState({
          username: matchedBot.username,
          avatar: matchedBot.avatar,
          trophies: Math.max(100, profile.trophies + Math.floor(Math.random() * 200 - 100)),
          score: 0,
          board: Array(8).fill(null).map(() => Array(8).fill(null)),
          emojisSent: [],
          status: 'playing',
        });
        
        audio.playVictory(); // Match found chime
        setTimeout(() => {
          setStage('playing');
          onResetUserGame(); // Reset user board
          setTimeRemaining(90);
        }, 1500);
      }
    }, 1000);
  };

  // Main match timer
  useEffect(() => {
    if (stage === 'playing') {
      gameTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(gameTimerRef.current);
            endMatch(true); // End duel due to time out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    };
  }, [stage]);

  // Bot intelligence/placement simulator
  useEffect(() => {
    if (stage === 'playing' && opponent) {
      botPlayIntervalRef.current = setInterval(() => {
        // Decide to place a block
        setOppState((prev) => {
          if (prev.status !== 'playing') return prev;

          // AI placement simulation
          const newGrid = prev.board.map((row) => [...row]);
          let placed = false;
          let newScore = prev.score;

          // Bot has some rate to fail placing blocks (Game over)
          const isBotGameOver = Math.random() < opponent.errorRate && prev.score > 400;
          if (isBotGameOver) {
            return {
              ...prev,
              status: 'gameover',
            };
          }

          // Generate simulated blocks placement on bot's grid
          // Fill 1-4 random cells
          const numCells = Math.floor(Math.random() * 4) + 1;
          const colors = ['rose', 'sky', 'amber', 'emerald', 'indigo', 'violet'];
          const cellColor = colors[Math.floor(Math.random() * colors.length)];

          let cellsPlaced = 0;
          for (let attempt = 0; attempt < 30; attempt++) {
            const r = Math.floor(Math.random() * 8);
            const c = Math.floor(Math.random() * 8);
            if (newGrid[r][c] === null) {
              newGrid[r][c] = cellColor;
              cellsPlaced++;
              if (cellsPlaced >= numCells) {
                placed = true;
                break;
              }
            }
          }

          if (placed) {
            newScore += numCells * 15;
            audio.playPlace();

            // Simulate clearing lines every now and then
            if (Math.random() < 0.35) {
              // Find a filled row to clear
              let clearedAny = false;
              for (let r = 0; r < 8; r++) {
                if (newGrid[r].every((cell) => cell !== null)) {
                  newGrid[r] = Array(8).fill(null);
                  newScore += 100;
                  clearedAny = true;
                }
              }
              if (clearedAny) {
                audio.playLineClear();
              }
            }
          }

          // Bot randomly sends emojis
          const shouldSendEmoji = Math.random() < 0.25;
          let newEmojis = [...prev.emojisSent];
          if (shouldSendEmoji) {
            const botEmoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
            newEmojis.push({ emoji: botEmoji, timestamp: Date.now() });
          }

          return {
            ...prev,
            board: newGrid,
            score: newScore,
            emojisSent: newEmojis,
          };
        });
      }, opponent.speedMs);
    }

    return () => {
      if (botPlayIntervalRef.current) clearInterval(botPlayIntervalRef.current);
    };
  }, [stage, opponent]);

  // Sync player status and check win condition immediately if one gets GameOver
  useEffect(() => {
    if (stage === 'playing') {
      if (userGameOver) {
        // Player loses on spot unless opponent is already game over or has lower score
        endMatch(false);
      } else if (oppState.status === 'gameover') {
        // Opponent got game over, player survives! If player has or gets higher score, they win immediately
        if (userScore > oppState.score) {
          endMatch(true);
        }
      }
    }
  }, [userGameOver, oppState.status, userScore, stage]);

  // End match and calculate results
  const endMatch = (timeUp: boolean) => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (botPlayIntervalRef.current) clearInterval(botPlayIntervalRef.current);

    const isWin = userScore > oppState.score;
    const trophiesChange = isWin ? 30 : -20;
    const coinsReward = isWin ? 50 : 10;

    // Save results to profile
    const updated = { ...profile };
    updated.trophies = Math.max(0, updated.trophies + trophiesChange);
    updated.coins += coinsReward;

    // Track daily quest progress
    const winDuelQuest = updated.quests.find((q) => q.type === 'win_duels');
    if (winDuelQuest && isWin && !winDuelQuest.claimed) {
      winDuelQuest.current = Math.min(winDuelQuest.target, winDuelQuest.current + 1);
    }

    onUpdateProfile(updated);

    if (isWin) {
      audio.playVictory();
      setResultMessage({
        title: '🎉 پیروزی درخشان!',
        subtitle: `شما حریف قدرتمند خود ${oppState.username} را با امتیاز ${userScore} در برابر ${oppState.score} شکست دادید!`,
        trophies: trophiesChange,
        coins: coinsReward,
        isWin: true,
      });
    } else {
      audio.playGameOver();
      setResultMessage({
        title: '💔 شکست در میدان نبرد',
        subtitle: `متاسفانه حریف شما ${oppState.username} با امتیاز ${oppState.score} در برابر ${userScore} پیروز شد.`,
        trophies: trophiesChange,
        coins: coinsReward,
        isWin: false,
      });
    }

    setStage('result');
  };

  // Handle player sending emojis
  const sendEmoji = (emoji: string) => {
    audio.playClick();
    setPlayerEmojis((prev) => [...prev, { emoji, timestamp: Date.now() }]);
    
    // Simulate opponent reacting to player's emoji
    setTimeout(() => {
      if (stage === 'playing') {
        const reactions = ['👍', '😎', '🔥', '💥'];
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];
        setOppState((prev) => ({
          ...prev,
          emojisSent: [...prev.emojisSent, { emoji: reaction, timestamp: Date.now() }],
        }));
      }
    }, 1500);
  };

  const getRankName = (trophies: number) => {
    if (trophies < 500) return { fa: 'برنز', en: 'Bronze', color: 'text-amber-600' };
    if (trophies < 1200) return { fa: 'نقره', en: 'Silver', color: 'text-slate-400' };
    if (trophies < 2200) return { fa: 'طلا', en: 'Gold', color: 'text-yellow-400' };
    if (trophies < 3500) return { fa: 'پلاتین', en: 'Platinum', color: 'text-teal-400' };
    if (trophies < 5000) return { fa: 'الماس', en: 'Diamond', color: 'text-indigo-400' };
    return { fa: 'قهرمان', en: 'Champion', color: 'text-rose-500 font-extrabold animate-pulse' };
  };

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 flex flex-col justify-between text-white overflow-y-auto">
      {/* LOBBY SCREEN */}
      {stage === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <div className="p-5 bg-gradient-to-tr from-indigo-500 to-rose-500 rounded-3xl shadow-xl shadow-indigo-500/10 mb-6">
            <Swords className="w-16 h-16 text-white" />
          </div>

          <h2 className="text-3xl font-black tracking-tight font-sans">میدان رقابت آنلاین دوئل</h2>
          <p className="text-sm text-slate-400 mt-2 font-sans mb-8">
            Block Blast Live 1v1 Online Arena
          </p>

          {/* User Stats Card */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-8 text-right">
            <div className="flex justify-between items-center mb-3">
              <span className={`text-sm font-bold font-sans ${getRankName(profile.trophies).color}`}>
                لیگ {getRankName(profile.trophies).fa} ({getRankName(profile.trophies).en})
              </span>
              <span className="text-xs text-slate-500 font-sans">رتبه فعلی شما</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-indigo-400 font-sans flex items-center gap-1.5">
                <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                {profile.trophies} کاپ
              </span>
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-bold font-sans">{profile.username}</div>
                  <div className="text-[10px] text-slate-400 text-left">Level {profile.level}</div>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xl shadow-inner border border-slate-700/50">
                  {profile.avatar}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={startMatchmaking}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer font-sans"
            >
              شروع رقابت آنلاین (Find Opponent)
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white font-semibold text-sm rounded-2xl transition-all cursor-pointer font-sans"
            >
              بازگشت به منوی اصلی
            </button>
          </div>
        </div>
      )}

      {/* SEARCHING MATCH LOBBY */}
      {stage === 'searching' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          {/* Radar animation */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
            <div className="absolute inset-4 rounded-full border-2 border-indigo-500/40 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute inset-8 rounded-full border-2 border-indigo-500/60 animate-ping" style={{ animationDelay: '1s' }} />
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 z-10">
              <Users className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>

          <h3 className="text-2xl font-bold font-sans">در حال جستجو برای حریف آنلاین...</h3>
          <p className="text-slate-400 text-xs mt-1 font-sans">Matching you with an active puzzle champion</p>

          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs flex items-center gap-3 justify-end font-sans">
            <div className="text-right">
              <div className="font-bold">{profile.username}</div>
              <div className="text-xs text-indigo-400 font-medium">🏆 {profile.trophies} کاپ</div>
            </div>
            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-xl">
              {profile.avatar}
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE DUEL ARENA */}
      {stage === 'playing' && opponent && (
        <div className="flex-1 flex flex-col w-full h-full overflow-y-auto">
          <GamePlay
            profile={profile}
            mode="arena"
            selectedLevel={null}
            onUpdateProfile={onUpdateProfile}
            onClose={onClose}
            externalGrid={userGrid}
            onGridChange={onGridChange}
            onScoreChange={onScoreChange}
            onGameOverChange={onGameOverChange}
            
            // Arena specific props
            arenaOpponent={{
              username: oppState.username,
              avatar: oppState.avatar,
              score: oppState.score,
              board: oppState.board,
              status: oppState.status,
            }}
            timeRemaining={timeRemaining}
            playerEmojis={playerEmojis}
            oppEmojis={oppState.emojisSent}
            onSendEmoji={sendEmoji}
          />
        </div>
      )}

      {/* RESULT SCREEN */}
      {stage === 'result' && resultMessage && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-xl mb-6 ${
              resultMessage.isWin
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-rose-500 text-white shadow-rose-500/20'
            }`}
          >
            {resultMessage.isWin ? '🏆' : '💀'}
          </motion.div>

          <h2 className="text-3xl font-black tracking-tight font-sans text-white">
            {resultMessage.title}
          </h2>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed font-sans px-4">
            {resultMessage.subtitle}
          </p>

          {/* Rewards Card */}
          <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 my-8 grid grid-cols-2 gap-4">
            <div className="text-center font-sans">
              <span className="text-slate-500 text-xs">کاپ دریافت شده</span>
              <div className={`text-2xl font-black mt-1 ${resultMessage.isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resultMessage.trophies >= 0 ? `+${resultMessage.trophies}` : resultMessage.trophies} کاپ
              </div>
            </div>

            <div className="text-center border-l border-slate-800 font-sans">
              <span className="text-slate-500 text-xs">جایزه سکه</span>
              <div className="text-2xl font-black text-yellow-400 mt-1 flex items-center justify-center gap-1">
                +{resultMessage.coins}
                <span className="w-3.5 h-3.5 bg-yellow-400 rounded-full inline-block shadow-[0_0_8px_#fbbf24]" />
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer font-sans"
          >
            تایید و بازگشت به منو
          </button>
        </div>
      )}
    </div>
  );
}
