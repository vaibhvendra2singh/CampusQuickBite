import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../../hooks/context/ThemeContext';

const W = 360;
const H = 420;
const GRAVITY = 0.45;
const JUMP = -8;
const PIPE_W = 52;
const PIPE_GAP = 140;
const PIPE_SPEED = 2.4;
const BIRD_X = 80;
const BIRD_R = 16;

interface Pipe {
    x: number;
    topH: number;
    passed: boolean;
}

const FlappyGame: React.FC = () => {
    const { isDark } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef({
        birdY: H / 2,
        birdVy: 0,
        pipes: [] as Pipe[],
        score: 0,
        alive: false,
        started: false,
        frameCount: 0,
        bestScore: Number(localStorage.getItem('flappy_best') || 0),
    });
    const [score, setScore] = useState(0);
    const [alive, setAlive] = useState(false);
    const [started, setStarted] = useState(false);
    const [best, setBest] = useState(() => Number(localStorage.getItem('flappy_best') || 0));
    const rafRef = useRef<number | undefined>(undefined);
    const lastTime = useRef(0);

    const draw = useCallback(() => {
        const cvs = canvasRef.current;
        if (!cvs) return;
        const ctx = cvs.getContext('2d')!;
        const s = stateRef.current;

        const sky = ctx.createLinearGradient(0, 0, 0, H);
        if (isDark) {
            sky.addColorStop(0, '#0F172A');
            sky.addColorStop(1, '#1E293B');
        } else {
            sky.addColorStop(0, '#EFF6FF');
            sky.addColorStop(1, '#DBEAFE');
        }
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        [
            [30, 30], [90, 60], [150, 25], [200, 80], [260, 40],
            [310, 70], [340, 20], [50, 100], [130, 95], [290, 110],
        ].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = isDark ? '#0F172A' : '#E2E8F0';
        ctx.fillRect(0, H - 60, W, 60);
        ctx.fillStyle = isDark ? 'rgba(0,112,255,0.3)' : 'rgba(0,112,255,0.5)';
        ctx.fillRect(0, H - 62, W, 3);

        s.pipes.forEach(pipe => {
            const topGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
            topGrad.addColorStop(0, '#1d4ed8');
            topGrad.addColorStop(0.5, '#0070FF');
            topGrad.addColorStop(1, '#1d4ed8');
            ctx.fillStyle = topGrad;
            ctx.beginPath();
            ctx.roundRect(pipe.x, 0, PIPE_W, pipe.topH, [0, 0, 8, 8]);
            ctx.fill();
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.roundRect(pipe.x - 4, pipe.topH - 16, PIPE_W + 8, 16, 4);
            ctx.fill();

            const botY = pipe.topH + PIPE_GAP;
            const botH = H - 60 - botY;
            const botGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
            botGrad.addColorStop(0, '#1d4ed8');
            botGrad.addColorStop(0.5, '#0070FF');
            botGrad.addColorStop(1, '#1d4ed8');
            ctx.fillStyle = botGrad;
            ctx.beginPath();
            ctx.roundRect(pipe.x, botY, PIPE_W, botH, [8, 8, 0, 0]);
            ctx.fill();
            ctx.fillStyle = '#2563eb';
            ctx.beginPath();
            ctx.roundRect(pipe.x - 4, botY, PIPE_W + 8, 16, 4);
            ctx.fill();
        });

        const birdGlow = ctx.createRadialGradient(BIRD_X, s.birdY, 2, BIRD_X, s.birdY, BIRD_R + 6);
        birdGlow.addColorStop(0, 'rgba(251,191,36,0.4)');
        birdGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = birdGlow;
        ctx.beginPath();
        ctx.arc(BIRD_X, s.birdY, BIRD_R + 6, 0, Math.PI * 2);
        ctx.fill();

        const birdGrad = ctx.createRadialGradient(BIRD_X - 4, s.birdY - 4, 2, BIRD_X, s.birdY, BIRD_R);
        birdGrad.addColorStop(0, '#fde68a');
        birdGrad.addColorStop(0.7, '#fbbf24');
        birdGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = birdGrad;
        ctx.beginPath();
        ctx.arc(BIRD_X, s.birdY, BIRD_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a0a3d';
        ctx.beginPath();
        ctx.arc(BIRD_X + 7, s.birdY - 4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(BIRD_X + 8, s.birdY - 5, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(BIRD_X + BIRD_R - 2, s.birdY);
        ctx.lineTo(BIRD_X + BIRD_R + 8, s.birdY + 2);
        ctx.lineTo(BIRD_X + BIRD_R - 2, s.birdY + 6);
        ctx.fill();

        ctx.fillStyle = isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.roundRect(W / 2 - 40, 12, 80, 34, 10);
        ctx.fill();
        ctx.font = 'bold 22px monospace';
        ctx.fillStyle = isDark ? '#fff' : '#0F172A';
        ctx.textAlign = 'center';
        ctx.fillText(String(s.score), W / 2, 35);
        ctx.textAlign = 'left';
    }, [isDark]);

    const doJump = useCallback(() => {
        const s = stateRef.current;
        if (!s.started) {
            s.started = true;
            s.alive = true;
            setStarted(true);
            setAlive(true);
        }
        if (s.alive) s.birdVy = JUMP;
    }, []);

    const gameLoop = useCallback((time: number) => {
        lastTime.current = time;
        const s = stateRef.current;
        if (!s.alive || !s.started) { draw(); rafRef.current = requestAnimationFrame(gameLoop); return; }

        s.birdVy += GRAVITY;
        s.birdY += s.birdVy;
        s.frameCount++;

        if (s.frameCount % 90 === 0) {
            const topH = 60 + Math.random() * (H - 60 - PIPE_GAP - 80 - 60);
            s.pipes.push({ x: W, topH, passed: false });
        }
        s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0);
        s.pipes.forEach(p => {
            p.x -= PIPE_SPEED;
            if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
                p.passed = true;
                s.score++;
                setScore(s.score);
                if (s.score > s.bestScore) {
                    s.bestScore = s.score;
                    setBest(s.score);
                    localStorage.setItem('flappy_best', String(s.score));
                }
            }
        });

        const birdTop = s.birdY - BIRD_R;
        const birdBot = s.birdY + BIRD_R;
        const birdLeft = BIRD_X - BIRD_R;
        const birdRight = BIRD_X + BIRD_R;
        if (birdBot > H - 60 || birdTop < 0) { s.alive = false; setAlive(false); }
        s.pipes.forEach(p => {
            if (birdRight > p.x && birdLeft < p.x + PIPE_W) {
                if (birdTop < p.topH || birdBot > p.topH + PIPE_GAP) {
                    s.alive = false; setAlive(false);
                }
            }
        });

        draw();
        rafRef.current = requestAnimationFrame(gameLoop);
    }, [draw]);

    const reset = useCallback(() => {
        const s = stateRef.current;
        s.birdY = H / 2;
        s.birdVy = 0;
        s.pipes = [];
        s.score = 0;
        s.alive = true;
        s.started = true;
        s.frameCount = 0;
        setScore(0);
        setAlive(true);
        setStarted(true);
    }, []);

    useEffect(() => {
        lastTime.current = performance.now();
        rafRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(rafRef.current!);
    }, [gameLoop]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
                doJump();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [doJump]);

    return (
        <div className="flex flex-col items-center justify-between h-full p-3" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between w-full mb-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Space / Tap to flap!</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-yellow-500">🏆 {best}</span>
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={W}
                    height={H}
                    style={{ display: 'block', borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer' }}
                    onClick={() => alive ? doJump() : reset()}
                    onTouchStart={e => { e.preventDefault(); alive ? doJump() : reset(); }}
                />
                {(!started || !alive) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/65 rounded-xl backdrop-blur-sm">
                        {started && !alive && (
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-1">💥</div>
                                <p className="text-white font-black text-xl">Crashed!</p>
                                <p className="text-yellow-400 font-bold text-sm mt-1">Score: {score}</p>
                            </div>
                        )}
                        {!started && (
                            <div className="text-center mb-4">
                                <div className="text-5xl mb-2">🐤</div>
                                <p className="text-white font-black text-lg">Flappy Bird</p>
                                <p className="text-slate-400 text-xs mt-1">Tap or press Space to jump</p>
                            </div>
                        )}
                        <button
                            onClick={reset}
                            className="px-8 py-3 rounded-xl font-black text-sm text-white btn-primary"
                        >
                            {started ? 'Try Again' : 'Start'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FlappyGame;
