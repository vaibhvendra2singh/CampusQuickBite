/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/context/AuthContext';
import api from '../../services/api';
import confetti from 'canvas-confetti';

const ASCII_ART = `
 ██████╗  █████╗ ███╗   ███╗██████╗ ██╗   ██╗███████╗
██╔════╝ ██╔══██╗████╗ ████║██╔══██╗██║   ██║██╔════╝
██║      ███████║██╔████╔██║██████╔╝██║   ██║███████╗
██║      ██╔══██║██║╚██╔╝██║██╔═══╝ ██║   ██║╚════██║
╚██████╗ ██║  ██║██║ ╚═╝ ██║██║     ╚██████╔╝███████║
 ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝      ╚═════╝ ╚══════╝

        ██████╗ ██╗████████╗███████╗███████╗
        ██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝
        ██████╔╝██║   ██║   █████╗  ███████╗
        ██╔══██╗██║   ██║   ██╔══╝  ╚════██║
        ██████╔╝██║   ██║   ███████╗███████║
        ╚═════╝ ╚═╝   ╚═╝   ╚══════╝╚══════╝

[ CAMPUS BITES — SHADOW NETWORK ACCESS GRANTED ]
[ CLEARANCE LEVEL: SHADOW MEMBER               ]
[ YOU FOUND THE HIDDEN PATH. WELL PLAYED. 🎩   ]
`;

const LINES = [
    '> Initializing shadow protocol...',
    '> Scanning for authorized personnel...',
    '> Identity confirmed.',
    '> Granting SHADOW MEMBER clearance...',
    '> Injecting +50 XP to your account...',
    '> Badge unlocked: 🎭 Shadow Member',
    '> Welcome to the inner circle.',
    '> The kitchen sees all. 👁️',
];

const SecretPage = () => {
    const { user, updateUser } = useAuth();
    const [displayedLines, setDisplayedLines] = useState<string[]>([]);
    const [showAscii, setShowAscii] = useState(false);
    const [claimed, setClaimed] = useState(false);
    const [alreadyHad, setAlreadyHad] = useState(false);
    const [isGranting, setIsGranting] = useState(false);
    const terminalRef = useRef<HTMLDivElement>(null);
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        hasRun.current = true;

        const claimedKey = `shadow_claimed_${user?.id || 'guest'}`;
        
        if (user && user.role !== 'STUDENT') {
            // Let the typing animation play the rejection lines
        } else if (user?.hasShadowBadge) {
            setAlreadyHad(true);
            setDisplayedLines(LINES);
            setShowAscii(true);
            setClaimed(true);
            return;
        }

        // Terminal typing animation
        let lineIndex = 0;
        const targetLines = user && user.role !== 'STUDENT' ? [
            '> Initializing shadow protocol...',
            '> Scanning for authorized personnel...',
            `> WARNING: Identity '${user.role}' detected.`,
            '> Access Denied.',
            '> SHADOW clearance requires STUDENT status.',
            '> Terminal locked.'
        ] : LINES;

        const addLine = () => {
            if (lineIndex < targetLines.length) {
                const line = targetLines[lineIndex];
                lineIndex++;
                setDisplayedLines(prev => [...prev, line]);
                setTimeout(addLine, lineIndex === 3 ? 800 : 400);
            } else {
                setTimeout(() => setShowAscii(true), 500);
                // Grant XP if logged in and is a student
                if (user?.id && user.role === 'STUDENT' && !isGranting) {
                    grantBadge(claimedKey);
                }
            }
        };
        setTimeout(addLine, 600);
    }, [user, updateUser, isGranting]);

    const grantBadge = async (claimedKey: string) => {
        setIsGranting(true);
        try {
            await api.post('/users/badge', { type: 'shadow' });
            confetti({
                particleCount: 300,
                spread: 360,
                startVelocity: 85,
                decay: 0.85,
                gravity: 1.5,
                ticks: 80,
                origin: { y: 0.5 },
                colors: ['#000000', '#222222', '#111111', '#555555'] // Dark shadow stealth confetti
            });
            localStorage.setItem(claimedKey, '1');
            setClaimed(true);
            if (user) updateUser({ ...user, hasShadowBadge: true });
        } catch (err: any) {
            console.error('Failed to claim badge:', err);
        } finally {
            setIsGranting(false);
        }
    };

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [displayedLines]);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
            style={{ background: '#000', fontFamily: 'monospace' }}
        >
            {/* Scanline overlay effect */}
            <div
                style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.015) 2px, rgba(0,255,0,0.015) 4px)',
                }}
            />
            {/* Green glow blob */}
            <div style={{
                position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
                width: 600, height: 600, borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
                background: 'radial-gradient(circle, rgba(0,255,70,0.08) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />

            <div className="relative z-10 w-full max-w-3xl">
                {/* Terminal window */}
                <div style={{
                    border: '1px solid #00ff46', borderRadius: 12,
                    background: 'rgba(0,20,0,0.95)', boxShadow: '0 0 40px rgba(0,255,70,0.15)',
                    overflow: 'hidden',
                }}>
                    {/* Terminal title bar */}
                    <div style={{
                        background: '#0a1a0a', borderBottom: '1px solid #00ff2240',
                        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#febc2e' }} />
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28c840' }} />
                        <span style={{ color: '#00ff46', fontSize: 12, marginLeft: 8, opacity: 0.7 }}>
                            campus-bites — shadow@terminal ~ /secret
                        </span>
                    </div>

                    {/* Terminal body */}
                    <div
                        ref={terminalRef}
                        style={{
                            padding: '24px', minHeight: 300, maxHeight: '60vh', overflowY: 'auto',
                            color: '#00ff46', fontSize: 14, lineHeight: 1.8,
                        }}
                    >
                        {displayedLines.map((line, i) => (
                            <div key={i} style={{ opacity: 0, animation: `fadeInLine 0.3s ease forwards ${i * 0.05}s` }}>
                                <span style={{ color: '#00ff4680' }}>$</span> {line}
                            </div>
                        ))}
                        {displayedLines.length < LINES.length && (
                            <span style={{ display: 'inline-block', width: 8, height: 16, background: '#00ff46', animation: 'blink 1s step-end infinite' }} />
                        )}
                    </div>
                </div>

                {/* ASCII Art reveal */}
                {showAscii && (
                    <div style={{
                        marginTop: 24, padding: '24px', borderRadius: 12,
                        border: `1px solid ${user && user.role !== 'STUDENT' ? '#ff004640' : '#00ff4640'}`,
                        background: user && user.role !== 'STUDENT' ? 'rgba(255,0,70,0.04)' : 'rgba(0,255,70,0.04)',
                        color: user && user.role !== 'STUDENT' ? '#ff0046' : '#00ff46', fontSize: '10px', lineHeight: 1.4,
                        whiteSpace: 'pre', overflowX: 'auto',
                        animation: 'fadeInUp 0.6s ease forwards',
                        textShadow: user && user.role !== 'STUDENT' ? '0 0 8px rgba(255,0,70,0.6)' : '0 0 8px rgba(0,255,70,0.6)',
                    }}>
                        {user && user.role !== 'STUDENT' ? ASCII_ART.replace('SHADOW NETWORK ACCESS GRANTED', 'SHADOW NETWORK ACCESS DENIED ').replace('CLEARANCE LEVEL: SHADOW MEMBER', 'CLEARANCE LEVEL: NULL          ').replace('YOU FOUND THE HIDDEN PATH. WELL PLAYED. 🎩', 'UNAUTHORIZED ACCESS ATTEMPT LOGGED. 🚨    ') : ASCII_ART}
                    </div>
                )}

                {/* Badge granted message */}
                {showAscii && (
                    <div style={{ marginTop: 24, textAlign: 'center', animation: 'fadeInUp 0.8s ease 0.3s both' }}>
                        {user && user.role !== 'STUDENT' ? (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 12,
                                padding: '14px 28px', borderRadius: 999,
                                border: '1px solid #ff0046',
                                background: 'rgba(255,0,70,0.08)',
                                color: '#ff0046', fontSize: 14, fontFamily: 'monospace',
                                boxShadow: '0 0 20px rgba(255,0,70,0.2)',
                            }}>
                                🛑 ACCESS DENIED · Student Clearance Required
                            </div>
                        ) : alreadyHad ? (
                            <p style={{ color: '#00ff4670', fontSize: 14, fontFamily: 'monospace' }}>
                                // shadow badge already equipped on your profile
                            </p>
                        ) : claimed ? (
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 12,
                                padding: '14px 28px', borderRadius: 999,
                                border: '1px solid #00ff46',
                                background: 'rgba(0,255,70,0.08)',
                                color: '#00ff46', fontSize: 14, fontFamily: 'monospace',
                                boxShadow: '0 0 20px rgba(0,255,70,0.2)',
                            }}>
                                🎭 +50 XP awarded · Shadow Member badge activated
                            </div>
                        ) : (
                            <p style={{ color: '#00ff4670', fontSize: 12, fontFamily: 'monospace' }}>
                                {user ? '// processing...' : '// log in to claim your badge'}
                            </p>
                        )}

                        {!user && (
                            <div style={{ marginTop: 20 }}>
                                <Link
                                    to="/login"
                                    style={{
                                        display: 'inline-block', padding: '10px 24px',
                                        border: '1px solid #00ff46', borderRadius: 8,
                                        color: '#00ff46', fontSize: 13, fontFamily: 'monospace',
                                        background: 'rgba(0,255,70,0.06)', textDecoration: 'none',
                                    }}
                                >
                                    &gt; login to claim badge _
                                </Link>
                            </div>
                        )}

                        <div style={{ marginTop: 32 }}>
                            <Link
                                to="/"
                                style={{
                                    color: '#00ff4650', fontSize: 12, fontFamily: 'monospace',
                                    textDecoration: 'none',
                                    borderBottom: '1px solid #00ff4630',
                                }}
                            >
                                &gt; exit shadow terminal _
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes fadeInLine { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};

export default SecretPage;
