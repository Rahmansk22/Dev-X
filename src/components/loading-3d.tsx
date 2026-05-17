"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export const Loading3D = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505]">
            {/* Background radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Outer 3D Ring 1 */}
                <motion.div
                    animate={{
                        rotateX: [0, 360],
                        rotateY: [0, 180],
                        rotateZ: [0, 360],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-0 border-2 border-blue-500/20 rounded-full"
                    style={{ transformStyle: "preserve-3d" }}
                />

                {/* Outer 3D Ring 2 */}
                <motion.div
                    animate={{
                        rotateX: [360, 0],
                        rotateY: [180, 0],
                        rotateZ: [360, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-4 border border-purple-500/30 rounded-full"
                    style={{ transformStyle: "preserve-3d" }}
                />

                {/* Central Pulsing Glow */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-10 bg-blue-400 blur-[30px] rounded-full opacity-20"
                />

                {/* The Core Logo Icon (3D-ish feel) */}
                <motion.div
                    animate={{
                        y: [-10, 10, -10],
                        rotateY: [0, 360],
                    }}
                    transition={{
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        rotateY: { duration: 4, repeat: Infinity, ease: "linear" },
                    }}
                    className="relative z-10 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
                    style={{ transformStyle: "preserve-3d" }}
                >
                    <Image src="/logo.svg" alt="Dev X" width={48} height={48} className="drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </motion.div>

                {/* Orbiting particles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            rotate: 360,
                        }}
                        transition={{
                            duration: 2 + i,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_#60a5fa]"
                            style={{ transform: `rotateY(${i * 60}deg) translateZ(80px)` }}
                        />
                    </motion.div>
                ))}
            </div>

            {/* Loading Text */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 flex flex-col items-center gap-3"
            >
                <h2 className="text-xl font-black uppercase tracking-[0.4em] text-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-500">Initializing</span>
                </h2>
                <div className="flex gap-1.5">
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="size-1.5 rounded-full bg-blue-500"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="size-1.5 rounded-full bg-indigo-500"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="size-1.5 rounded-full bg-purple-500"
                    />
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Connecting to Dev X Engine...</p>
            </motion.div>
        </div >
    );
};
