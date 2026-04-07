import { Stars, Sparkles, Float, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

export function Background() {
    const { viewport } = useThree();
    const isMobile = viewport.width < 5;

    const primaryColor = "#ffffff";
    const dustColor = "#4ade80";

    return (
        <group>
            <Stars
                radius={100}
                depth={50}
                count={400}
                factor={4}
                saturation={0}
                fade
                speed={0.1}
            />

            <Sparkles
                count={isMobile ? 12 : 25}
                scale={20}
                size={3}
                speed={0.1}
                opacity={0.3}
                color={dustColor}
            />

            <Float speed={0.4} rotationIntensity={0.2} floatIntensity={0.5}>
                <Sphere args={[1.2, 8, 8]} position={[isMobile ? -2 : -6, 2, -12]}>
                    <meshBasicMaterial color={primaryColor} wireframe transparent opacity={0.08} />
                </Sphere>
                <Sphere args={[0.6, 6, 6]} position={[isMobile ? 2 : 5, -3, -10]}>
                    <meshBasicMaterial color={dustColor} wireframe transparent opacity={0.1} />
                </Sphere>
            </Float>

            <ambientLight intensity={0.4} />
            <fog attach="fog" args={['#0D0C0B', 10, 30]} />
        </group>
    );
}
