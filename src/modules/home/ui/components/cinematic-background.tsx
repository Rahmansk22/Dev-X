"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export const CinematicBackground = () => {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const y1 = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050505]">
            {/* Ambient Nebula */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,_rgba(59,130,246,0.08)_0%,_transparent_50%)]"
            />

            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[-10%] right-[-10%] w-[120%] h-[120%] bg-[radial-gradient(circle_at_50%_50%,_rgba(168,85,247,0.08)_0%,_transparent_50%)]"
            />

            {/* Floating 3D HUD Elements (Simulated) */}
            <motion.div
                style={{ y: y1, rotateX: rotate }}
                className="absolute top-[20%] left-[5%] opacity-20"
            >
                <div className="w-64 h-64 border border-blue-500/20 rounded-full flex items-center justify-center">
                    <div className="w-48 h-48 border border-blue-500/10 rounded-full animate-spin [animation-duration:30s]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]" />
                </div>
            </motion.div>

            <motion.div
                style={{ y: y2, rotateY: rotate }}
                className="absolute bottom-[20%] right-[5%] opacity-20"
            >
                <div className="w-80 h-80 border border-purple-500/20 rounded-[4rem] flex items-center justify-center rotate-45">
                    <div className="w-60 h-60 border border-purple-500/10 rounded-[3rem] animate-pulse" />
                </div>
            </motion.div>

            {/* Scanlines / Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />

            {/* Particle Stream */}
            <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                            x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                            y: [Math.random() * 100 + "%", Math.random() * 100 + "%"]
                        }}
                        transition={{
                            duration: Math.random() * 10 + 10,
                            repeat: Infinity,
                            delay: Math.random() * 5
                        }}
                        className="absolute size-1 bg-white rounded-full blur-[1px]"
                    />
                ))}
            </div>
        </div>
    );
};
