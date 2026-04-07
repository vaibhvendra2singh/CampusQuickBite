import { Canvas } from '@react-three/fiber';
import { Background } from './Background';
import { Preload } from '@react-three/drei';
import { Suspense } from 'react';

export function Scene() {
    return (
        <div className="canvas-container fixed inset-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-700">
            <Canvas
                camera={{ position: [0, 0, 5], fov: 45 }}
                dpr={1}
                gl={{ 
                    antialias: false, 
                    alpha: true, 
                    powerPreference: 'high-performance',
                    precision: 'lowp',
                    stencil: false,
                    depth: true
                }}
                performance={{ min: 0.5 }}
            >
                <Suspense fallback={null}>
                    <Background />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
}

