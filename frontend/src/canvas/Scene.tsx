import { Canvas } from '@react-three/fiber';
import { Background } from './Background';
import { Preload } from '@react-three/drei';
import { Suspense } from 'react';

import { useTheme } from '../hooks/context/ThemeContext';

// Central Scene Component to be absolute positioned behind HTML overlay
export function Scene() {
    const { isDark } = useTheme();

    return (
        <div className="canvas-container fixed inset-0 w-full h-full -z-10 pointer-events-none">
            <Canvas 
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={[1, 2]} // Support high dpi displays
                gl={{ antialias: true, alpha: true }}
            >
                <Suspense fallback={null}>
                    <Background isDark={isDark} />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}
