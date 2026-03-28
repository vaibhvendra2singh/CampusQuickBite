import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../../hooks/context/ThemeContext';

const EMOJIS = ['🍕', '🍔', '🍟', '🍦', '🍩', '🍎', '🍓', '🥑', '🌮', '🍣'];

interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const MemoryGame: React.FC = () => {
    const { isDark } = useTheme();
    const accentColor = isDark ? '#818cf8' : '#6366f1';
    const [cards, setCards] = useState<Card[]>([]);
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const initGame = useCallback(() => {
        const gameCards = [...EMOJIS, ...EMOJIS]
            .sort(() => Math.random() - 0.5)
            .map((emoji, index) => ({
                id: index,
                emoji,
                isFlipped: false,
                isMatched: false,
            }));
        setCards(gameCards);
        setFlippedCards([]);
        setMoves(0);
        setGameOver(false);
    }, []);

    useEffect(() => {
        initGame();
    }, [initGame]);

    const handleCardClick = (id: number) => {
        if (flippedCards.length === 2 || cards[id].isFlipped || cards[id].isMatched || gameOver) return;

        const newCards = [...cards];
        newCards[id].isFlipped = true;
        setCards(newCards);

        const newFlipped = [...flippedCards, id];
        setFlippedCards(newFlipped);

        if (newFlipped.length === 2) {
            setMoves(m => m + 1);
            const [first, second] = newFlipped;
            if (cards[first].emoji === cards[second].emoji) {
                setTimeout(() => {
                    setCards(prev => {
                        const updated = [...prev];
                        updated[first].isMatched = true;
                        updated[second].isMatched = true;
                        if (updated.every(c => c.isMatched)) setGameOver(true);
                        return updated;
                    });
                    setFlippedCards([]);
                }, 500);
            } else {
                setTimeout(() => {
                    setCards(prev => {
                        const updated = [...prev];
                        updated[first].isFlipped = false;
                        updated[second].isFlipped = false;
                        return updated;
                    });
                    setFlippedCards([]);
                }, 1000);
            }
        }
    };

    return (
        <div className="flex flex-col items-center h-full p-4 gap-4" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>Find all pairs!</span>
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Moves:</span>
                    <span className="text-lg font-black font-mono" style={{ color: 'var(--color-brand-500)' }}>{moves}</span>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-2 w-full max-w-[320px]">
                {cards.map(card => (
                    <button
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`aspect-square rounded-xl text-2xl flex items-center justify-center transition-all duration-300 transform ${
                            card.isFlipped || card.isMatched ? 'rotate-y-0' : 'rotate-y-180'
                        }`}
                        style={{
                            background: card.isMatched 
                                ? 'rgba(34, 197, 94, 0.2)' 
                                : card.isFlipped 
                                ? 'var(--bg-card-hover)' 
                                : `linear-gradient(135deg, ${accentColor}, #a855f7)`,
                            border: card.isMatched ? '2px solid #22c55e' : '1px solid var(--border-color)',
                            boxShadow: card.isFlipped || card.isMatched ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)',
                            cursor: card.isMatched ? 'default' : 'pointer'
                        }}
                    >
                        {(card.isFlipped || card.isMatched) ? card.emoji : '❓'}
                    </button>
                ))}
            </div>

            {gameOver && (
                <div className="mt-4 text-center animate-bounce">
                    <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>Perfect Match! 🎉</p>
                    <button
                        onClick={initGame}
                        className="mt-2 px-6 py-2 rounded-xl font-bold text-sm text-white btn-primary"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default MemoryGame;
