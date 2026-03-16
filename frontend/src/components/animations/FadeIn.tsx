import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface FadeInProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
    className?: string;
    startAnimation?: boolean;
}

export function FadeIn({ children, delay = 0, direction = 'up', fullWidth = false, className = '', startAnimation }: FadeInProps) {
    const directions = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { x: 40, y: 0 },
        right: { x: -40, y: 0 },
        none: { x: 0, y: 0 }
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            animate={startAnimation !== undefined ? (startAnimation ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }) : undefined}
            whileInView={startAnimation === undefined ? { opacity: 1, x: 0, y: 0 } : undefined}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
                duration: 0.8,
                ease: [0.25, 1, 0.5, 1],
                delay: delay
            }}
            style={{ willChange: 'transform, opacity' }}
            className={`${fullWidth ? 'w-full' : ''} ${className}`}
        >
            {children}
        </motion.div>
    );
}
