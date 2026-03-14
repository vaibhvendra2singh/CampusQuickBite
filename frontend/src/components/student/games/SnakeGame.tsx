import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../../hooks/context/ThemeContext';

const CELL = 20;
const COLS = 20;
const ROWS = 18;
const W = CELL * COLS;
const H = CELL * ROWS;

type Dir = { x: number; y: number };
type Point = { x: number; y: number };

const rand = (max: number) => Math.floor(Math.random() * max);
const newFood = (snake: Point[]): Point => {
    let p: Point;
    do { p = { x: rand(COLS), y: rand(ROWS) }; }
    while (snake.some(s => s.x === p.x && s.y === p.y));
    return p;
};

const SnakeGame: React.FC = () => {
    const { isDark } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        snake: [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }],
        dir: { x: 1, y: 0 } as Dir,
        nextDir: { x: 1, y: 0 } as Dir,
        food: { x: 15, y: 9 } as Point,
        score: 0,
        alive: true,
        started: false,
    });
    const [score, setScore] = useState(0);
    const [alive, setAlive] = useState(true);
    const [started, setStarted] = useState(false);
    const loopRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const draw = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d')!;
        const s = stateRef.current;

        const bgColor = isDark ? '#0F172A' : '#F8FAFC';
        const dotColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(100,120,200,0.08)';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        // Grid dots
        ctx.fillStyle = dotColor;
        for (let i = 0; i < COLS; i++)
            for (let j = 0; j < ROWS; j++)
                ctx.fillRect(i * CELL + CELL / 2 - 1, j * CELL + CELL / 2 - 1, 2, 2);

        // Food
        const gf = ctx.createRadialGradient(
            s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, 2,
            s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2
        );
        gf.addColorStop(0, '#ff4757');
        gf.addColorStop(1, 'rgba(255,71,87,0.15)');
        ctx.fillStyle = gf;
        ctx.beginPath();
        ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff2d3d';
        ctx.beginPath();
        ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.arc(s.food.x * CELL + CELL / 2 - 3, s.food.y * CELL + CELL / 2 - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        // Snake
        s.snake.forEach((seg, i) => {
            const t = i / s.snake.length;
            // vivid green-to-teal gradient along body
            const r = Math.round(22 + t * 20);
            const g = Math.round(195 - t * 50);
            const b = Math.round(100 - t * 30);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            const pad = i === 0 ? 1 : 3;
            const radius = i === 0 ? 6 : 4;
            const rx = seg.x * CELL + pad;
            const ry = seg.y * CELL + pad;
            const rw = CELL - pad * 2;
            const rh = CELL - pad * 2;
            ctx.beginPath();
            ctx.roundRect(rx, ry, rw, rh, radius);
            ctx.fill();
            if (i === 0) {
                ctx.fillStyle = 'rgba(0,0,0,0.55)';
                ctx.beginPath();
                ctx.arc(seg.x * CELL + CELL * 0.35, seg.y * CELL + CELL * 0.35, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(seg.x * CELL + CELL * 0.65, seg.y * CELL + CELL * 0.35, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }, [isDark]);

    const tick = useCallback(() => {
        const s = stateRef.current;
        if (!s.alive || !s.started) return;
        s.dir = s.nextDir;
        const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
        if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS ||
            s.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            s.alive = false;
            setAlive(false);
            draw();
            return;
        }
        s.snake.unshift(head);
        if (head.x === s.food.x && head.y === s.food.y) {
            s.score++;
            setScore(s.score);
            s.food = newFood(s.snake);
        } else {
            s.snake.pop();
        }
        draw();
        const speed = Math.max(80, 200 - s.score * 5);
        loopRef.current = setTimeout(tick, speed);
    }, [draw]);

    const reset = useCallback(() => {
        const s = stateRef.current;
        s.snake = [{ x: 10, y: 9 }, { x: 9, y: 9 }, { x: 8, y: 9 }];
        s.dir = { x: 1, y: 0 };
        s.nextDir = { x: 1, y: 0 };
        s.food = { x: 15, y: 9 };
        s.score = 0;
        s.alive = true;
        s.started = true;
        setScore(0);
        setAlive(true);
        setStarted(true);
        clearTimeout(loopRef.current);
        draw();
        loopRef.current = setTimeout(tick, 200);
    }, [draw, tick]);

    useEffect(() => {
        draw();
        return () => clearTimeout(loopRef.current);
    }, [draw]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const s = stateRef.current;
            const map: Record<string, Dir> = {
                ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
                ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
                ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
                ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
            };
            const d = map[e.key];
            if (d && !(d.x === -s.dir.x && d.y === -s.dir.y)) {
                s.nextDir = d;
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Touch controls
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const onTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        const s = stateRef.current;
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && s.dir.x !== -1) s.nextDir = { x: 1, y: 0 };
            else if (dx < 0 && s.dir.x !== 1) s.nextDir = { x: -1, y: 0 };
        } else {
            if (dy > 0 && s.dir.y !== -1) s.nextDir = { x: 0, y: 1 };
            else if (dy < 0 && s.dir.y !== 1) s.nextDir = { x: 0, y: -1 };
        }
        touchStart.current = null;
    };

    return (
        <div className="flex flex-col items-center justify-between h-full p-3 gap-2" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>WASD or Arrow Keys</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Score:</span>
                    <span className="text-lg font-black font-mono" style={{ color: 'var(--color-brand-500)' }}>{score}</span>
                </div>
            </div>
            <div className="relative" style={{ width: W, height: H }}>
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    style={{ display: 'block', borderRadius: 8, border: '1.5px solid var(--border-color)' }}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                />
                {(!started || !alive) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-sm">
                        {!alive && started && (
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-1">💀</div>
                                <p className="text-white font-black text-xl">Game Over!</p>
                                <p className="text-violet-400 font-bold text-sm mt-1">Score: {score}</p>
                            </div>
                        )}
                        {!started && (
                            <div className="text-center mb-4">
                                <div className="text-5xl mb-2">🐍</div>
                                <p className="text-white font-black text-lg">Snake</p>
                                <p className="text-slate-400 text-xs mt-1">Use WASD or arrow keys</p>
                            </div>
                        )}
                        <button
                            onClick={reset}
                            className="px-8 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md btn-primary"
                        >
                            {started ? 'Play Again' : 'Start Game'}
                        </button>
                    </div>
                )}
            </div>
            {/* D-pad for mobile */}
            <div className="flex flex-col items-center gap-1">
                <button onClick={() => { stateRef.current.nextDir = { x: 0, y: -1 }; }} className="w-10 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors btn-secondary">▲</button>
                <div className="flex gap-1">
                    <button onClick={() => { stateRef.current.nextDir = { x: -1, y: 0 }; }} className="w-10 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors btn-secondary">◀</button>
                    <button onClick={() => { stateRef.current.nextDir = { x: 0, y: 1 }; }} className="w-10 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors btn-secondary">▼</button>
                    <button onClick={() => { stateRef.current.nextDir = { x: 1, y: 0 }; }} className="w-10 h-8 rounded-lg text-xs font-bold flex items-center justify-center border transition-colors btn-secondary">▶</button>
                </div>
            </div>
        </div>
    );
};

export default SnakeGame;
