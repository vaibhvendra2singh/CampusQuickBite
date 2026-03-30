import { useEffect, useRef } from 'react';

const MatrixRain = ({ duration = 3000, onComplete }: { duration?: number, onComplete?: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]';
        const fontSize = 16;
        const columns = canvas.width / fontSize;
        const drops: number[] = [];

        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }

        let animationFrameId: number;

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = characters.charAt(Math.floor(Math.random() * characters.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        const timer = setTimeout(() => {
            cancelAnimationFrame(animationFrameId);
            if (onComplete) onComplete();
        }, duration);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timer);
        };
    }, [duration, onComplete]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[100] pointer-events-none opacity-80"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};

export default MatrixRain;
