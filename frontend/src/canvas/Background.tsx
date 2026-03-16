import { Stars, Sparkles, Float, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function Background({ isDark }: { isDark: boolean }) {
    const groupRef = useRef<THREE.Group>(null);

    // Slowly rotate the entire background for an immersive feel
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.005;
            groupRef.current.rotation.z = state.clock.getElapsedTime() * 0.005;
        }
    });

    const primaryColor = isDark ? "#ffffff" : "#0070FF";
    const dustColor = isDark ? "#4ade80" : "#2563eb";

    return (
        <group ref={groupRef}>
            <Stars 
                radius={100} 
                depth={50} 
                count={isDark ? 5000 : 2000} 
                factor={4} 
                saturation={0} 
                fade 
                speed={1} 
            />
            
            <Sparkles 
                count={isDark ? 200 : 100} 
                scale={20} 
                size={isDark ? 5 : 3} 
                speed={0.4} 
                opacity={0.5} 
                color={dustColor} 
            />

            {/* Abstract floating shapes resembling "Planetoño" celestial bodies */}
            <Float speed={0.5} rotationIntensity={1} floatIntensity={1.5}>
                <Sphere args={[1, 32, 32]} position={[-5, 2, -10]}>
                    <meshStandardMaterial 
                        color={primaryColor} 
                        wireframe 
                        transparent 
                        opacity={0.15} 
                    />
                </Sphere>
            </Float>

            <Float speed={0.8} rotationIntensity={0.8} floatIntensity={1}>
                <Sphere args={[0.5, 16, 16]} position={[4, -3, -8]}>
                    <meshStandardMaterial 
                        color={dustColor} 
                        wireframe 
                        transparent 
                        opacity={0.2} 
                    />
                </Sphere>
            </Float>
            
            <ambientLight intensity={isDark ? 0.2 : 0.4} />
            <directionalLight position={[10, 10, 5]} intensity={isDark ? 0.8 : 1.2} color={isDark ? "#ffffff" : "#f8fafc"} />
            <directionalLight position={[-10, -10, -5]} intensity={isDark ? 0.4 : 0.6} color={primaryColor} />
            
            {/* Fog for depth */}
            <fog attach="fog" args={[isDark ? '#030712' : '#cbd5e1', 10, 30]} />
        </group>
    );
}
