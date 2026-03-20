import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Landing = () => {
    const navigate = useNavigate();


    return (
        <div className="relative min-h-screen w-full bg-[#0A0A0A] text-[#F8F9FA] font-sans selection:bg-[#0070FF]/30 selection:text-[#0070FF] overflow-hidden">
            {/* Background Video */}
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

            {/* Navigation */}
            <nav className="fixed top-0 w-full px-[5%] py-8 flex justify-between items-center z-50">
                <Link to="/" className="text-2xl font-black tracking-tighter">
                    CAMPUS<span className="text-[#0070FF]">BITE</span>
                </Link>

                <div className="flex items-center gap-6 bg-white/5 backdrop-blur-3xl px-6 py-2 rounded-full border border-white/10">
                    <Link to="/login" className="text-sm font-semibold text-[#A0A0A0] hover:text-white transition-colors">SignIn</Link>
                    <Link to="/register" className="text-sm font-semibold text-[#A0A0A0] hover:text-white transition-colors">Join</Link>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-[#0070FF] text-white px-5 py-2 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(0,112,255,0.4)] hover:scale-105 hover:shadow-[0_0_30px_rgba(0,112,255,0.6)] transition-all"
                    >
                        Order Now
                    </button>
                </div>
            </nav>

            {/* Refined Branding Overlay */}
            <main className="relative z-20 h-screen flex flex-col justify-center items-center text-center px-[5%] pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center"
                >
                    <h1
                        className="text-[clamp(4rem,15vw,10rem)] font-black tracking-[-0.05em] leading-[0.9] select-none text-transparent bg-clip-text bg-gradient-to-b from-white/60 to-white/10"
                        style={{
                            WebkitTextStroke: '1px rgba(255,255,255,0.5)',
                            textShadow: '0 0 40px rgba(0,112,255,0.2)'
                        }}
                    >
                        CAMPUSBITE
                    </h1>
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
                <p className="font-extrabold text-lg text-[#F8F9FA]">SnaEats<>  </>4.9⭐️</p>
            </motion.div>


            {/* Navigation CTA Button */}
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => navigate('/login')}
                    className="bg-white/10 backdrop-blur-3xl border border-white/20 text-white px-16 py-4 rounded-full text-xl font-black tracking-widest hover:bg-[#0070FF] hover:border-[#0070FF] transition-all hover:scale-105 active:scale-95 shadow-2xl group"
                >
                    START
                    <span className="ml-4 opacity-50 group-hover:opacity-100 transition-opacity">→</span>
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
