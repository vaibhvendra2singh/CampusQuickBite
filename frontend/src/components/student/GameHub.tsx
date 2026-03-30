import React, { useState, useEffect } from 'react';
import { MiniGameWindow } from './MiniGameWindow';
import SnakeGame from './games/SnakeGame';
import Game2048 from './games/Game2048';
import FlappyGame from './games/FlappyGame';
import BreakoutGame from './games/BreakoutGame';
import MemoryGame from './games/MemoryGame';
import TicTacToeGame from './games/TicTacToeGame';
import { useAuth } from '../../hooks/context/AuthContext';
import { useToast } from '../../hooks/context/ToastContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';

type GameId = 'snake' | '2048' | 'flappy' | 'breakout' | 'memory' | 'tictactoe';

interface GameDef {
    id: GameId;
    title: string;
    emoji: string;
    description: string;
    color: string;
    width?: number;
    height?: number;
}

const GAMES: GameDef[] = [
    {
        id: 'snake',
        title: 'Snake',
        emoji: '🐍',
        description: 'Classic snake — eat, grow, survive!',
        color: 'from-violet-600 to-purple-700',
        width: 440,
        height: 560,
    },
    {
        id: '2048',
        title: '2048',
        emoji: '🔢',
        description: 'Merge tiles to reach 2048!',
        color: 'from-blue-600 to-violet-600',
        width: 400,
        height: 520,
    },
    {
        id: 'flappy',
        title: 'Flappy Bird',
        emoji: '🐤',
        description: 'Dodge the pipes — how far can you go?',
        color: 'from-yellow-500 to-orange-500',
        width: 400,
        height: 560,
    },
    {
        id: 'breakout',
        title: 'Breakout',
        emoji: '🧱',
        description: 'Smash through the wall!',
        color: 'from-pink-500 to-rose-600',
        width: 440,
        height: 600,
    },
    {
        id: 'memory',
        title: 'Memory Match',
        emoji: '🧠',
        description: 'Test your memory and match the food!',
        color: 'from-indigo-500 to-purple-600',
        width: 360,
        height: 520,
    },
    {
        id: 'tictactoe',
        title: 'Tic Tac Toe',
        emoji: '⭕',
        description: 'Classic three-in-a-row battle!',
        color: 'from-emerald-500 to-teal-600',
        width: 320,
        height: 500,
    },
];

interface OpenGame {
    id: GameId;
    key: number;
}

const listeners: Array<() => void> = [];
const emitToggle = () => listeners.forEach(fn => fn());

export const GameHubInline: React.FC = () => (
    <button
        id="mini-games-fab"
        onClick={emitToggle}
        className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-200 flex-shrink-0"
        style={{
            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
            boxShadow: '0 8px 24px rgba(139,92,246,0.4)',
        }}
        title="Mini Games"
    >
        <span className="text-xl md:text-2xl">🎮</span>
    </button>
);

const GameHub: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [openGames, setOpenGames] = useState<OpenGame[]>([]);
    
    const { user, updateUser } = useAuth();
    const { showToast } = useToast();
    const [claimingPro, setClaimingPro] = useState(false);

    useEffect(() => {
        const handleScore = async (e: any) => {
            const score = e.detail?.score || 0;
            if (score >= 10 && user && !user.hasProGamerBadge && !claimingPro) {
                setClaimingPro(true);
                try {
                    await api.post('/users/badge', { type: 'pro_gamer' });
                    // Star blast animation for Pro Gamer
                    const defaults = { spread: 360, ticks: 50, gravity: 0, decay: 0.94, startVelocity: 30, colors: ['#00e5ff', '#ffeb3b', '#cc00ff'] };
                    confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ['star'] });
                    confetti({ ...defaults, particleCount: 10, scalar: 0.75, shapes: ['circle'] });
                    
                    updateUser({ ...user, hasProGamerBadge: true });
                    showToast('🏆 Pro Gamer Badge Unlocked! (+40 XP)', 'success');
                } catch (err: any) {
                    if (err.response?.status === 409) {
                        updateUser({ ...user, hasProGamerBadge: true });
                    }
                    console.error('Pro Gamer Badge Error:', err);
                } finally {
                    setClaimingPro(false);
                }
            }
        };

        window.addEventListener('campus_bite_score', handleScore as EventListener);
        return () => window.removeEventListener('campus_bite_score', handleScore as EventListener);
    }, [user, claimingPro, updateUser, showToast]);

    useEffect(() => {
        const handler = () => setOpen(o => !o);
        listeners.push(handler);
        return () => { const idx = listeners.indexOf(handler); if (idx > -1) listeners.splice(idx, 1); };
    }, []);

    const openGame = (id: GameId) => {
        setOpenGames(prev => {
            if (prev.some(g => g.id === id)) return prev;
            return [...prev, { id, key: Date.now() }];
        });
        setOpen(false);
    };

    const closeGame = (id: GameId) => {
        setOpenGames(prev => prev.filter(g => g.id !== id));
    };

    const renderGame = (id: GameId) => {
        switch (id) {
            case 'snake': return <SnakeGame />;
            case '2048': return <Game2048 />;
            case 'flappy': return <FlappyGame />;
            case 'breakout': return <BreakoutGame />;
            case 'memory': return <MemoryGame />;
            case 'tictactoe': return <TicTacToeGame />;
        }
    };

    return (
        <>
            {open && (
                <div
                    className="fixed bottom-28 right-8 z-[9990] rounded-2xl overflow-hidden shadow-2xl"
                    style={{
                        background: 'var(--bg-card)',
                        border: '1.5px solid var(--border-color)',
                        backdropFilter: 'blur(24px)',
                        minWidth: 280,
                        boxShadow: '0 16px 48px var(--shadow-color)',
                    }}
                >
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <p className="font-black text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>🎮 Mini Games</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Take a break while you wait!</p>
                    </div>
                    <div className="p-3 flex flex-col gap-2">
                        {GAMES.map(game => (
                            <button
                                key={game.id}
                                onClick={() => openGame(game.id)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left group relative overflow-hidden"
                                style={{
                                    background: openGames.some(g => g.id === game.id)
                                        ? 'rgba(0,112,255,0.08)'
                                        : 'var(--bg-card-hover)',
                                    border: openGames.some(g => g.id === game.id)
                                        ? '1px solid rgba(0,112,255,0.3)'
                                        : '1px solid var(--border-color)',
                                }}
                            >
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${game.color} flex-shrink-0 shadow-lg transition-transform`}
                                >
                                    {game.emoji}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{game.title}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{game.description}</p>
                                </div>
                                {openGames.some(g => g.id === game.id) && (
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg" style={{ color: 'var(--color-brand-500)', background: 'rgba(0,112,255,0.08)' }}>Open</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>Games open as floating windows ✨</p>
                    </div>
                </div>
            )}

            {openGames.map((g, i) => {
                const def = GAMES.find(d => d.id === g.id)!;
                return (
                    <MiniGameWindow
                        key={g.key}
                        title={def.title}
                        emoji={def.emoji}
                        onClose={() => closeGame(g.id)}
                        defaultWidth={def.width}
                        defaultHeight={def.height}
                        defaultX={60 + i * 30}
                        defaultY={80 + i * 30}
                    >
                        {renderGame(g.id)}
                    </MiniGameWindow>
                );
            })}

            {open && (
                <div className="fixed inset-0 z-[9989]" onClick={() => setOpen(false)} />
            )}
        </>
    );
};

export default GameHub;
