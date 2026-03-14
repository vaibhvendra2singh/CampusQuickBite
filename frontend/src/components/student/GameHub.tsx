import React, { useState } from 'react';
import { MiniGameWindow } from './MiniGameWindow';
import SnakeGame from './games/SnakeGame';
import Game2048 from './games/Game2048';
import FlappyGame from './games/FlappyGame';

type GameId = 'snake' | '2048' | 'flappy';

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
];

interface OpenGame {
    id: GameId;
    key: number;
}

const GameHub: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [openGames, setOpenGames] = useState<OpenGame[]>([]);

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
        }
    };

    return (
        <>
            {/* Floating Game Button */}
            <div className="fixed bottom-8 right-8 z-[9990] flex flex-col items-end gap-3">
                {/* Game Picker Panel */}
                {open && (
                    <div
                        className="mb-2 rounded-2xl overflow-hidden shadow-2xl"
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
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-gradient-to-br ${game.color} flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
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

                {/* FAB Button */}
                <button
                    id="mini-games-fab"
                    onClick={() => setOpen(o => !o)}
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-200 relative"
                    style={{
                        background: open
                            ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                            : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                        boxShadow: open
                            ? '0 0 0 4px rgba(139,92,246,0.3), 0 16px 40px rgba(139,92,246,0.5)'
                            : '0 16px 40px rgba(139,92,246,0.4)',
                        transform: open ? 'rotate(45deg)' : 'rotate(0deg) scale(1)',
                    }}
                    title="Mini Games"
                >
                    {open ? (
                        <span className="text-white text-2xl font-black">✕</span>
                    ) : (
                        <span className="text-2xl">🎮</span>
                    )}
                    {openGames.length > 0 && !open && (
                        <span
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 border-2 border-white text-white text-[9px] font-black flex items-center justify-center"
                        >
                            {openGames.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Open Game Windows */}
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

            {/* Backdrop blur-click-away */}
            {open && (
                <div className="fixed inset-0 z-[9989]" onClick={() => setOpen(false)} />
            )}
        </>
    );
};

export default GameHub;
