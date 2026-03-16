import React, { useState, useRef, useEffect } from 'react';
import { FiMove } from 'react-icons/fi';

interface MiniGameWindowProps {
    title: string;
    emoji: string;
    onClose: () => void;
    children: React.ReactNode;
    defaultWidth?: number;
    defaultHeight?: number;
    defaultX?: number;
    defaultY?: number;
}

export const MiniGameWindow: React.FC<MiniGameWindowProps> = ({
    title,
    emoji,
    onClose,
    children,
    defaultWidth = 420,
    defaultHeight = 540,
    defaultX,
    defaultY,
}) => {
    const [pos, setPos] = useState({
        x: defaultX ?? Math.random() * (window.innerWidth - defaultWidth - 40) + 20,
        y: defaultY ?? Math.random() * (window.innerHeight - defaultHeight - 80) + 80,
    });
    const [{ w: sizeW, h: sizeH }] = useState({ w: defaultWidth, h: defaultHeight });
    const [dragging, setDragging] = useState(false);
    const [maximized, setMaximized] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (maximized) return;
        setDragging(true);
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        e.preventDefault();
    };

    useEffect(() => {
        if (!dragging) return;
        const handleMove = (e: MouseEvent) => {
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - sizeW, e.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
            });
        };
        const handleUp = () => setDragging(false);
        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
        };
    }, [dragging, sizeW]);

    const windowStyle = maximized
        ? { top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 }
        : minimized
        ? { bottom: 20, right: 20, width: 220, height: 48, top: 'auto', left: 'auto' }
        : { top: pos.y, left: pos.x, width: sizeW, height: sizeH };

    return (
        <div
            ref={windowRef}
            className="fixed z-[9999] flex flex-col select-none overflow-hidden"
            style={{
                ...windowStyle,
                borderRadius: maximized ? 0 : 18,
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-card)',
                backdropFilter: 'blur(20px)',
                transition: dragging ? 'none' : 'bottom 0.25s, right 0.25s, width 0.25s, height 0.25s, border-radius 0.25s',
                boxShadow: '0 8px 40px var(--shadow-color), 0 2px 8px var(--shadow-color)',
            }}
        >
            {/* Title Bar */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-grab active:cursor-grabbing"
                style={{
                    background: 'var(--bg-card-hover)',
                    borderBottom: '1.5px solid var(--border-color)',
                    flexShrink: 0,
                }}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                        style={{ background: 'var(--color-brand-500)', opacity: 0.9 }}
                    >
                        {emoji}
                    </div>
                    <span className="font-black text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</span>
                    <FiMove className="w-3 h-3 ml-0.5" style={{ color: 'var(--text-muted)' }} />
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => setMinimized(m => !m)}
                        className="w-3.5 h-3.5 rounded-full transition-all "
                        style={{ background: '#fbbf24', boxShadow: '0 1px 4px rgba(251,191,36,0.4)' }}
                        title="Minimize"
                    />
                    <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={() => { setMaximized(m => !m); setMinimized(false); }}
                        className="w-3.5 h-3.5 rounded-full transition-all "
                        style={{ background: '#34d399', boxShadow: '0 1px 4px rgba(52,211,153,0.4)' }}
                        title="Maximize"
                    />
                    <button
                        onMouseDown={e => e.stopPropagation()}
                        onClick={onClose}
                        className="w-3.5 h-3.5 rounded-full transition-all "
                        style={{ background: '#f87171', boxShadow: '0 1px 4px rgba(248,113,113,0.4)' }}
                        title="Close"
                    />
                </div>
            </div>

            {/* Content */}
            {!minimized && (
                <div className="flex-1 overflow-hidden relative" style={{ minHeight: 0 }}>
                    {children}
                </div>
            )}
        </div>
    );
};
