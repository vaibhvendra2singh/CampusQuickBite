import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="relative min-h-screen w-full bg-[#0A0A0A] text-[#F8F9FA] font-sans selection:bg-[#0070FF]/30 selection:text-[#0070FF] overflow-hidden">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-radial-[circle_at_center] from-transparent via-transparent to-[#0A0A0A] opacity-90 z-10" />
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-full object-cover brightness-[0.4] saturate-[1.1] scale-105"
                >
                    <source src="/hero-bg-compressed.mp4" type="video/mp4" />
                </video>
            </div>

            <nav className="fixed top-0 w-full px-4 sm:px-[5%] py-4 sm:py-6 flex justify-between items-center z-50">
                <Link to="/" className="text-lg sm:text-2xl font-black tracking-tighter flex-shrink-0">
                    CAMPUS<span className="text-[#0070FF]">BITE</span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-4 md:gap-6 bg-white/5 backdrop-blur-3xl px-3 sm:px-5 md:px-6 py-2 rounded-full border border-white/10">
                    <Link
                        to="/login"
                        className="text-xs sm:text-sm font-semibold text-[#A0A0A0] hover:text-white transition-colors whitespace-nowrap"
                    >
                        Sign In
                    </Link>
                    <Link
                        to="/register"
                        className="text-xs sm:text-sm font-semibold text-[#A0A0A0] hover:text-white transition-colors hidden xs:block sm:block"
                    >
                        Join
                    </Link>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#0070FF] text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(0,112,255,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(0,112,255,0.6)] transition-all whitespace-nowrap"
                    >
                        Order Now
                    </button>
                </div>
            </nav>

            <main className="relative z-20 h-screen flex flex-col justify-center items-center text-center px-4 sm:px-[5%] pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center w-full"
                >
                    <h1
                        className="font-black tracking-[-0.05em] leading-[0.9] select-none text-transparent bg-clip-text bg-gradient-to-b from-white/60 to-white/10 w-full"
                        style={{
                            WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                            textShadow: '0 0 40px rgba(0,112,255,0.2)',
                            fontSize: 'clamp(2.8rem, 18vw, 10rem)',
                        }}
                    >
                        CAMPUS
                        <br className="block sm:hidden" />
                        <span className="text-[#0070FF] sm:text-transparent sm:bg-clip-text sm:bg-gradient-to-b sm:from-white/60 sm:to-white/10"
                            style={{
                                WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                            }}
                        >BITE</span>
                    </h1>

                    <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/50 font-medium tracking-wide max-w-xs sm:max-w-sm">
                        Skip the queue. Order ahead. Eat smarter.
                    </p>
                </motion.div>
            </main>

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="fixed top-32 left-[5%] z-30 bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl w-48 hidden md:block"
            >
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#0070FF] font-bold mb-1">Live Queue</h4>
                <p className="font-extrabold text-lg">128 Orders</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="fixed bottom-32 left-[5%] z-30 bg-white/5 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl w-56 hidden md:block"
            >
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-[#0070FF] font-bold mb-1">Trending</h4>
                <p className="font-extrabold text-lg text-[#F8F9FA]">SnaEats&nbsp;&nbsp;4.9⭐️</p>
            </motion.div>

            <div className="fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto max-w-xs sm:max-w-none">
                <button
                    onClick={() => navigate('/login')}
                    className="w-full sm:w-auto bg-white/10 backdrop-blur-3xl border border-white/20 text-white px-10 sm:px-16 py-3.5 sm:py-4 rounded-full text-base sm:text-xl font-black tracking-widest hover:bg-[#0070FF] hover:border-[#0070FF] transition-all hover:scale-105 active:scale-95 shadow-2xl group"
                >
                    START
                    <span className="ml-3 sm:ml-4 opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700;1,900&display=swap');
                .font-playfair { font-family: 'Playfair Display', serif; }
            `}} />
        </div>
    );
};

export default Landing;
