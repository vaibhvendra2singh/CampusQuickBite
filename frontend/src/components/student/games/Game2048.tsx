import React, { useState, useCallback, useEffect } from 'react';

const SIZE = 4;
type Board = number[][];

const emptyBoard = (): Board => Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

const addRandom = (b: Board): Board => {
    const empty: [number, number][] = [];
    b.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
    if (!empty.length) return b;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const nb = b.map(row => [...row]);
    nb[r][c] = Math.random() < 0.9 ? 2 : 4;
    return nb;
};

const initBoard = (): Board => addRandom(addRandom(emptyBoard()));

const slideLeft = (row: number[]): { row: number[]; gained: number } => {
    const nums = row.filter(Boolean);
    let gained = 0;
    for (let i = 0; i < nums.length - 1; i++) {
        if (nums[i] === nums[i + 1]) {
            nums[i] *= 2;
            gained += nums[i];
            nums.splice(i + 1, 1);
        }
    }
    while (nums.length < SIZE) nums.push(0);
    return { row: nums, gained };
};

type MoveDir = 'left' | 'right' | 'up' | 'down';

const move = (b: Board, dir: MoveDir): { board: Board; gained: number } => {
    let gained = 0;
    let nb: Board = b.map(r => [...r]);
    if (dir === 'left') {
        nb = nb.map(row => { const r = slideLeft(row); gained += r.gained; return r.row; });
    } else if (dir === 'right') {
        nb = nb.map(row => { const r = slideLeft([...row].reverse()); gained += r.gained; return r.row.reverse(); });
    } else if (dir === 'up') {
        nb = nb.map((_, c) => nb.map(row => row[c])).map(col => { const r = slideLeft(col); gained += r.gained; return r.row; });
        nb = nb[0].map((_, c) => nb.map(row => row[c]));
    } else {
        nb = nb.map((_, c) => nb.map(row => row[c])).map(col => { const r = slideLeft([...col].reverse()); gained += r.gained; return r.row.reverse(); });
        nb = nb[0].map((_, c) => nb.map(row => row[c]));
    }
    return { board: nb, gained };
};

const boardEqual = (a: Board, b: Board) => a.every((row, r) => row.every((v, c) => v === b[r][c]));

const canMove = (b: Board): boolean => {
    for (let r = 0; r < SIZE; r++)
        for (let c = 0; c < SIZE; c++) {
            if (!b[r][c]) return true;
            if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
            if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
        }
    return false;
};

const TILE_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
    0:    { bg: 'rgba(255,255,255,0.04)', text: 'transparent', shadow: 'none' },
    2:    { bg: '#1e1b4b', text: '#a5b4fc', shadow: '0 4px 16px rgba(139,92,246,0.2)' },
    4:    { bg: '#2d1b69', text: '#c4b5fd', shadow: '0 4px 16px rgba(139,92,246,0.3)' },
    8:    { bg: '#4c1d95', text: '#ede9fe', shadow: '0 4px 20px rgba(139,92,246,0.4)' },
    16:   { bg: '#5b21b6', text: '#fff', shadow: '0 4px 20px rgba(139,92,246,0.5)' },
    32:   { bg: '#7c3aed', text: '#fff', shadow: '0 6px 24px rgba(124,58,237,0.5)' },
    64:   { bg: '#6d28d9', text: '#fff', shadow: '0 6px 28px rgba(109,40,217,0.6)' },
    128:  { bg: '#4338ca', text: '#ffd700', shadow: '0 8px 32px rgba(67,56,202,0.6)' },
    256:  { bg: '#3730a3', text: '#ffd700', shadow: '0 8px 32px rgba(55,48,163,0.7)' },
    512:  { bg: '#1e40af', text: '#ffd700', shadow: '0 10px 40px rgba(30,64,175,0.7)' },
    1024: { bg: '#1d4ed8', text: '#ffd700', shadow: '0 10px 40px rgba(29,78,216,0.8)' },
    2048: { bg: 'linear-gradient(135deg, #ffd700, #ff8c00)', text: '#000', shadow: '0 12px 48px rgba(255,215,0,0.8)' },
};

const getColor = (v: number) => TILE_COLORS[v] || TILE_COLORS[2048];

const Game2048: React.FC = () => {
    const [board, setBoard] = useState<Board>(initBoard);
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(() => Number(localStorage.getItem('2048_best') || 0));
    const [over, setOver] = useState(false);
    const [won, setWon] = useState(false);

    const doMove = useCallback((dir: MoveDir) => {
        setBoard(prev => {
            const { board: nb, gained } = move(prev, dir);
            if (boardEqual(prev, nb)) return prev;
            const final = addRandom(nb);
            setScore(s => {
                const ns = s + gained;
                setBest(b => {
                    if (ns > b) { localStorage.setItem('2048_best', String(ns)); return ns; }
                    return b;
                });
                return ns;
            });
            if (final.some(row => row.includes(2048))) setWon(true);
            if (!canMove(final)) setOver(true);
            return final;
        });
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const map: Record<string, MoveDir> = {
                ArrowLeft: 'left', a: 'left',
                ArrowRight: 'right', d: 'right',
                ArrowUp: 'up', w: 'up',
                ArrowDown: 'down', s: 'down',
            };
            if (map[e.key]) { doMove(map[e.key]); e.preventDefault(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doMove]);

    const touchStart = React.useRef<{ x: number; y: number } | null>(null);
    const onTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? 'right' : 'left');
        else doMove(dy > 0 ? 'down' : 'up');
        touchStart.current = null;
    };

    const restart = () => {
        setBoard(initBoard());
        setScore(0);
        setOver(false);
        setWon(false);
    };

    return (
        <div className="flex flex-col items-center justify-between h-full p-4 gap-3" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between w-full">
                <div className="flex gap-3">
                    <div className="flex flex-col items-center rounded-xl px-4 py-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Score</span>
                        <span className="text-lg font-black font-mono leading-tight" style={{ color: 'var(--color-brand-500)' }}>{score}</span>
                    </div>
                    <div className="flex flex-col items-center rounded-xl px-4 py-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Best</span>
                        <span className="text-lg font-black font-mono leading-tight text-yellow-500">{best}</span>
                    </div>
                </div>
                <button onClick={restart} className="px-4 py-2 text-xs font-black text-white rounded-xl transition-all btn-primary">
                    New Game
                </button>
            </div>

            <div
                className="relative"
                style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 12,
                    padding: 8,
                    display: 'grid',
                    gridTemplateColumns: `repeat(${SIZE}, 1fr)`,
                    gap: 8,
                    width: 320,
                    height: 320,
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
            >
                {board.flat().map((v, i) => {
                    const c = getColor(v);
                    const fontSize = v >= 1024 ? 18 : v >= 128 ? 22 : 28;
                    return (
                        <div
                            key={i}
                            style={{
                                background: c.bg,
                                color: c.text,
                                boxShadow: c.shadow,
                                borderRadius: 8,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize,
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                transition: 'all 0.1s',
                                border: v ? '1px solid rgba(255,255,255,0.08)' : 'none',
                            }}
                        >
                            {v || ''}
                        </div>
                    );
                })}

                {(over || won) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl backdrop-blur-sm" style={{ zIndex: 10 }}>
                        <div className="text-4xl mb-2">{won ? '🏆' : '💀'}</div>
                        <p className="text-white font-black text-xl">{won ? 'You Win!' : 'Game Over!'}</p>
                        <p className="text-violet-400 text-sm mt-1 font-bold">Score: {score}</p>
                        <button onClick={restart} className="mt-4 px-8 py-2.5 rounded-xl font-black text-sm text-white btn-primary">
                            Play Again
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 w-32">
                <div />
                <button onClick={() => doMove('up')} className="h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center btn-secondary">▲</button>
                <div />
                <button onClick={() => doMove('left')} className="h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center btn-secondary">◀</button>
                <button onClick={() => doMove('down')} className="h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center btn-secondary">▼</button>
                <button onClick={() => doMove('right')} className="h-9 rounded-lg text-xs font-bold transition-colors flex items-center justify-center btn-secondary">▶</button>
            </div>
        </div>
    );
};

export default Game2048;
