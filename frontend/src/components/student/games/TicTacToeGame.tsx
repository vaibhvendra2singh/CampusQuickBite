import React, { useState } from 'react';

type Player = 'X' | 'O' | null;

const TicTacToeGame: React.FC = () => {
    const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<Player | 'Draw'>(null);

    const checkWinner = (squares: Player[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        for (const [a, b, c] of lines) {
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                return squares[a];
            }
        }
        if (squares.every(s => s !== null)) return 'Draw';
        return null;
    };

    const handleClick = (i: number) => {
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = isXNext ? 'X' : 'O';
        setBoard(newBoard);
        setIsXNext(!isXNext);
        const win = checkWinner(newBoard);
        if (win) setWinner(win);
    };

    const reset = () => {
        setBoard(Array(9).fill(null));
        setIsXNext(true);
        setWinner(null);
    };

    const renderSquare = (i: number) => (
        <button
            onClick={() => handleClick(i)}
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-4xl font-black transition-all"
            style={{
                background: 'var(--bg-card-hover)',
                border: '1px solid var(--border-color)',
                color: board[i] === 'X' ? '#f87171' : '#60a5fa',
                boxShadow: board[i] ? 'none' : '0 4px 12px var(--shadow-color)',
            }}
        >
            {board[i]}
        </button>
    );

    return (
        <div className="flex flex-col items-center h-full p-4 gap-4" style={{ background: 'var(--bg-card)' }}>
            <div className="flex items-center justify-between w-full">
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                    {winner ? (winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`) : `Next: ${isXNext ? 'X' : 'O'}`}
                </span>
                <button
                    onClick={reset}
                    className="text-xs font-black uppercase text-violet-500 hover:text-violet-600 transition-colors"
                >
                    Reset Gear
                </button>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => renderSquare(i))}
            </div>

            {winner && (
                <div className="mt-4 text-center">
                    <p className="text-2xl mb-2">{winner === 'Draw' ? '🤝' : '🏆'}</p>
                    <button
                        onClick={reset}
                        className="px-8 py-2 rounded-xl font-bold text-sm text-white btn-primary"
                    >
                        Play Again
                    </button>
                </div>
            )}
        </div>
    );
};

export default TicTacToeGame;
