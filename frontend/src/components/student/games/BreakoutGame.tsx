import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../../hooks/context/ThemeContext';

const PADDLE_HEIGHT = 10;
const PADDLE_WIDTH = 75;
const BALL_RADIUS = 6;
const BRICK_ROWS = 5;
const BRICK_COLS = 6;
const BRICK_WIDTH = 55;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 8;
const BRICK_OFFSET_TOP = 40;
const BRICK_OFFSET_LEFT = 15;
const W = 400;
const H = 500;

const BreakoutGame: React.FC = () => {
    const { isDark } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'WON' | 'LOST'>('IDLE');
    
    const stateRef = useRef({
        ball: { x: W / 2, y: H - 30, dx: 4, dy: -4 },
        paddle: { x: (W - PADDLE_WIDTH) / 2 },
        bricks: [] as { x: number; y: number; status: number }[][],
        score: 0
    });

    const initBricks = useCallback(() => {
        const bricks: { x: number; y: number; status: number }[][] = [];
        for (let c = 0; c < BRICK_COLS; c++) {
            bricks[c] = [];
            for (let r = 0; r < BRICK_ROWS; r++) {
                bricks[c][r] = { x: 0, y: 0, status: 1 };
            }
        }
        return bricks;
    }, []);

    const resetGame = useCallback(() => {
        stateRef.current = {
            ball: { x: W / 2, y: H - 30, dx: 4, dy: -4 },
            paddle: { x: (W - PADDLE_WIDTH) / 2 },
            bricks: initBricks(),
            score: 0
        };
        setScore(0);
        setGameState('PLAYING');
    }, [initBricks]);

    const draw = useCallback(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const s = stateRef.current;
        const bgColor = isDark ? '#0F172A' : '#F8FAFC';
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, W, H);

        for (let c = 0; c < BRICK_COLS; c++) {
            for (let r = 0; r < BRICK_ROWS; r++) {
                if (s.bricks[c][r].status === 1) {
                    const brickX = c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT;
                    const brickY = r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP;
                    s.bricks[c][r].x = brickX;
                    s.bricks[c][r].y = brickY;
                    
                    ctx.beginPath();
                    ctx.roundRect(brickX, brickY, BRICK_WIDTH, BRICK_HEIGHT, 4);
                    const hue = (r * 360) / BRICK_ROWS;
                    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }

        ctx.beginPath();
        ctx.arc(s.ball.x, s.ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#60A5FA' : '#3B82F6';
        ctx.fill();
        ctx.closePath();

        ctx.beginPath();
        ctx.roundRect(s.paddle.x, H - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT, 5);
        ctx.fillStyle = isDark ? '#8B5CF6' : '#6D28D9';
        ctx.fill();
        ctx.closePath();
    }, [isDark]);

    const update = useCallback(() => {
        if (gameState !== 'PLAYING') return;

        const s = stateRef.current;
        
        s.ball.x += s.ball.dx;
        s.ball.y += s.ball.dy;

        if (s.ball.x + s.ball.dx > W - BALL_RADIUS || s.ball.x + s.ball.dx < BALL_RADIUS) {
            s.ball.dx = -s.ball.dx;
        }
        if (s.ball.y + s.ball.dy < BALL_RADIUS) {
            s.ball.dy = -s.ball.dy;
        } else if (s.ball.y + s.ball.dy > H - BALL_RADIUS - 10 - PADDLE_HEIGHT) {
            if (s.ball.x > s.paddle.x && s.ball.x < s.paddle.x + PADDLE_WIDTH) {
                s.ball.dy = -s.ball.dy;
                const hitPos = (s.ball.x - (s.paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
                s.ball.dx = hitPos * 4;
            } else if (s.ball.y + s.ball.dy > H - BALL_RADIUS) {
                setGameState('LOST');
            }
        }

        for (let c = 0; c < BRICK_COLS; c++) {
            for (let r = 0; r < BRICK_ROWS; r++) {
                const b = s.bricks[c][r];
                if (b.status === 1) {
                    if (s.ball.x > b.x && s.ball.x < b.x + BRICK_WIDTH && s.ball.y > b.y && s.ball.y < b.y + BRICK_HEIGHT) {
                        s.ball.dy = -s.ball.dy;
                        b.status = 0;
                        s.score++;
                        setScore(s.score);
                        if (s.score === BRICK_ROWS * BRICK_COLS) {
                            setGameState('WON');
                        }
                    }
                }
            }
        }

        draw();
    }, [gameState, draw]);

    useEffect(() => {
        if (gameState === 'IDLE') {
            stateRef.current.bricks = initBricks();
            draw();
        }
        let animationId: number;
        const loop = () => {
            update();
            animationId = requestAnimationFrame(loop);
        };
        animationId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationId);
    }, [update, gameState, initBricks, draw]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            if (relativeX > 0 && relativeX < W) {
                stateRef.current.paddle.x = Math.max(0, Math.min(W - PADDLE_WIDTH, relativeX - PADDLE_WIDTH / 2));
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const step = 20;
            if (e.key === 'ArrowLeft' || e.key === 'a') {
                stateRef.current.paddle.x = Math.max(0, stateRef.current.paddle.x - step);
            } else if (e.key === 'ArrowRight' || e.key === 'd') {
                stateRef.current.paddle.x = Math.min(W - PADDLE_WIDTH, stateRef.current.paddle.x + step);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-between h-full p-3 gap-2" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Mouse or A/D Keys</span>
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
                />
                {gameState !== 'PLAYING' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg backdrop-blur-sm">
                        {gameState === 'LOST' && (
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-1">💥</div>
                                <p className="text-white font-black text-xl">Game Over!</p>
                                <p className="text-blue-400 font-bold text-sm mt-1">Final Score: {score}</p>
                            </div>
                        )}
                        {gameState === 'WON' && (
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-1">🎉</div>
                                <p className="text-white font-black text-xl">You Won!</p>
                                <p className="text-green-400 font-bold text-sm mt-1">Perfect Score: {score}</p>
                            </div>
                        )}
                        {gameState === 'IDLE' && (
                            <div className="text-center mb-4">
                                <div className="text-5xl mb-2">🧱</div>
                                <p className="text-white font-black text-lg">Breakout</p>
                                <p className="text-slate-400 text-xs mt-1">Destroy all bricks to win!</p>
                            </div>
                        )}
                        <button
                            onClick={resetGame}
                            className="px-8 py-3 rounded-xl font-black text-sm text-white transition-all shadow-md btn-primary"
                        >
                            {gameState === 'IDLE' ? 'Start Game' : 'Play Again'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BreakoutGame;
