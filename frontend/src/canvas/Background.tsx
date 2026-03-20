import { Stars, Sparkles, Float, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function Background({ isDark }: { isDark: boolean }) {
    const { viewport } = useThree();
    const isMobile = viewport.width < 5; // A typical desktop view is ~7-8 units wide at z=0, mobile is ~2-3

    const primaryColor = isDark ? "#ffffff" : "#0070FF";
    const dustColor = isDark ? "#4ade80" : "#2563eb";

    return (
        <group>
            {/* Reduced star count significantly for perf */}
            <Stars
                radius={100}
                depth={50}
                count={1200} // Locked count across themes so geometry isn't rebuilt
                factor={4}
                saturation={0}
                fade
                speed={0.3}
            />

            <Sparkles
                count={50} // Locked count
                scale={20}
                size={3} // Locked size
                speed={0.2}
                opacity={isDark ? 0.4 : 0.2} // Opacity uniform is cheap to update
                color={dustColor}
            />

            {/* Shift spheres closer to center on mobile so they don't render off-screen */}
            <Float speed={0.3} rotationIntensity={0.3} floatIntensity={0.8}>
                <Sphere args={[1, 12, 12]} position={[isMobile ? -2 : -5, 2, -10]}>
                    <meshStandardMaterial
                        color={primaryColor}
                        wireframe
                        transparent
                        opacity={0.12}
                    />
                </Sphere>
            </Float>

            <Float speed={0.5} rotationIntensity={0.3} floatIntensity={0.5}>
                <Sphere args={[0.5, 8, 8]} position={[isMobile ? 1.5 : 4, -3, -8]}>
                    <meshStandardMaterial
                        color={dustColor}
                        wireframe
                        transparent
                        opacity={0.15}
                    />
                </Sphere>
            </Float>

            <ambientLight intensity={isDark ? 0.2 : 0.4} />
            <directionalLight position={[10, 10, 5]} intensity={isDark ? 0.6 : 1.0} color={isDark ? "#ffffff" : "#f8fafc"} />

            <fog attach="fog" args={[isDark ? '#0D0C0B' : '#cbd5e1', 10, 30]} />
        </group>
    );
}
