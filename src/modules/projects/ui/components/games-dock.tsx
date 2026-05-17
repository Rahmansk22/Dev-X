"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gamepad2Icon,
    RotateCcwIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ZapIcon,
    DicesIcon,
    LayoutGridIcon,
    HeartIcon,
    SwordIcon,
    TrophyIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// --- LUDO (ELITE 15x15 GRID) ---
const Ludo = () => {
    const [pPos, setPPos] = useState(0);
    const [cPos, setCPos] = useState(0);
    const [turn, setTurn] = useState<'player' | 'computer'>('player');
    const [dice, setDice] = useState(1);
    const [rolling, setRolling] = useState(false);

    // Path maps for a 15x15 grid. 
    // This is a simplified path that follows the outer rim then goes home.
    // Length 56 steps.
    const getCellCoords = (step: number, isComputer: boolean) => {
        // Simplified path: outer square loop
        if (step > 56) step = 56;
        const offset = isComputer ? 0 : 0; // In a real game they start at different points
        
        // This is a visual representation of the path in the 15x15 grid
        // Home Red: 0-5, 0-5 | Home Blue: 9-14, 0-5 | etc.
        // For this demo, we'll map the 56 steps to grid positions.
        const path = [
            [6,1], [6,2], [6,3], [6,4], [6,5], [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
            [0,7], [0,8], [1,8], [2,8], [3,8], [4,8], [5,8], [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
            [7,14], [8,14], [8,13], [8,12], [8,11], [8,10], [8,9], [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
            [14,7], [14,6], [13,6], [12,6], [11,6], [10,6], [9,6], [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
            [7,0], [7,1], [7,2], [7,3], [7,4], [7,5], [7,6], [7,7] // Home
        ];
        
        const coord = path[step] || [7, 7];
        return { r: coord[0], c: coord[1] };
    };

    const rollDice = () => {
        if (rolling || turn !== 'player') return;
        setRolling(true);
        setTimeout(() => {
            const val = Math.floor(Math.random() * 6) + 1;
            setDice(val);
            setRolling(false);
            const next = Math.min(pPos + val, 56);
            setPPos(next);
            if (next < 56) setTurn('computer');
        }, 600);
    };

    useEffect(() => {
        if (turn === 'computer' && pPos < 56 && cPos < 56) {
            const t = setTimeout(() => {
                const val = Math.floor(Math.random() * 6) + 1;
                setDice(val);
                const next = Math.min(cPos + val, 56);
                setCPos(next);
                setTurn('player');
            }, 1000);
            return () => clearTimeout(t);
        }
    }, [turn, pPos, cPos]);

    const renderGrid = () => {
        const rows = [];
        const pCoord = getCellCoords(pPos, false);
        const cCoord = getCellCoords(cPos, true);

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const isP = pCoord.r === r && pCoord.c === c;
                const isC = cCoord.r === r && cCoord.c === c;
                
                // Color Zones
                let bg = "bg-white/[0.03]";
                if (r < 6 && c < 6) bg = "bg-red-500/20";
                if (r < 6 && c > 8) bg = "bg-blue-500/20";
                if (r > 8 && c < 6) bg = "bg-green-500/20";
                if (r > 8 && c > 8) bg = "bg-yellow-500/20";
                if (r >= 6 && r <= 8 && c >= 6 && c <= 8) bg = "bg-white/10"; // Home center

                // Path segments
                const isPath = (r === 7) || (c === 7) || (r >= 6 && r <= 8) || (c >= 6 && c <= 8);

                rows.push(
                    <div key={`${r}-${c}`} className={cn("size-full border-[0.5px] border-white/5 flex items-center justify-center relative", bg, isPath && "border-white/10")}>
                        {isP && (
                            <motion.div layoutId="player" className="size-3 md:size-4 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] z-10" />
                        )}
                        {isC && (
                            <motion.div layoutId="computer" className="size-3 md:size-4 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444] z-10" />
                        )}
                    </div>
                );
            }
        }
        return rows;
    };

    return (
        <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="grid grid-cols-15 grid-rows-15 size-64 md:size-80 bg-black border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                {renderGrid()}
            </div>
            <div className="flex items-center gap-8 bg-white/5 p-4 rounded-3xl border border-white/10">
                 <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-blue-400">YOU</span>
                    <div className="size-12 bg-white rounded-xl flex items-center justify-center text-black text-xl font-black">{turn === 'player' ? (rolling ? '?' : dice) : '-'}</div>
                 </div>
                 <Button onClick={rollDice} disabled={rolling || turn === 'computer' || pPos === 56 || cPos === 56} className="bg-blue-600 h-12 px-8 rounded-xl font-black uppercase text-xs">Roll Strike</Button>
                 <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-black text-red-500">BOT</span>
                    <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center text-white/50 text-xl font-black">{turn === 'computer' ? dice : '-'}</div>
                 </div>
            </div>
            {(pPos === 56 || cPos === 56) && (
                <div className="text-center animate-bounce">
                    <p className="text-xl font-black text-white">{pPos === 56 ? "VICTORY" : "BOTS WIN"}</p>
                    <Button onClick={() => { setPPos(0); setCPos(0); setTurn('player'); }} className="mt-2 text-xs uppercase font-bold text-blue-400">Re-initiate Race</Button>
                </div>
            )}
        </div>
    );
};

// --- TIC TAC TOE (IMPOSSIBLE) ---
const TicTacToe = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);

    const checkWinner = (sq: any[]) => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for(let [a,b,c] of lines) if(sq[a] && sq[a] === sq[b] && sq[a] === sq[c]) return sq[a];
        return sq.includes(null) ? null : 'Draw';
    };

    const minimax = (nb: any[], p: string): any => {
        const avail = nb.map((v,i) => v === null ? i : null).filter(v => v !== null);
        const win = checkWinner(nb);
        if(win === 'O') return {score: 10}; if(win === 'X') return {score: -10}; if(avail.length === 0) return {score: 0};
        const moves = [];
        for(let i=0; i<avail.length; i++){
            const move: any = {index: avail[i]}; nb[avail[i]] = p;
            move.score = minimax(nb, p === 'O' ? 'X' : 'O').score;
            nb[avail[i]] = null; moves.push(move);
        }
        let best = 0;
        if(p === 'O'){ let bs = -1e4; for(let i=0; i<moves.length; i++) if(moves[i].score > bs){bs = moves[i].score; best = i;} }
        else { let bs = 1e4; for(let i=0; i<moves.length; i++) if(moves[i].score < bs){bs = moves[i].score; best = i;} }
        return moves[best];
    };

    const handleClick = (i: number) => {
        if(winner || board[i] || !isXNext) return;
        const nb = [...board]; nb[i] = 'X'; setBoard(nb);
        const w = checkWinner(nb); if(w) setWinner(w); else setIsXNext(false);
    };

    useEffect(() => {
        if(!isXNext && !winner){
            setTimeout(() => {
                const b = minimax([...board], 'O'); const nb = [...board]; nb[b.index] = 'O'; setBoard(nb);
                const w = checkWinner(nb); if(w) setWinner(w); else setIsXNext(true);
            }, 600);
        }
    }, [isXNext, winner]);

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className="grid grid-cols-3 gap-3">{board.map((s,i)=>(<button key={i} onClick={()=>handleClick(i)} className="size-20 md:size-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black transition-all hover:border-blue-500/50" style={{color:s==='X'?'#3b82f6':'#f87171'}}>{s}</button>))}</div>
            {winner && <div className="text-center"><p className="text-2xl font-black text-white">{winner === 'Draw' ? "DRAW" : "LOSS"}</p><Button onClick={()=>{setBoard(Array(9).fill(null));setWinner(null);setIsXNext(true);}} className="mt-4 bg-white text-black px-6 font-black uppercase text-xs">Restart</Button></div>}
        </div>
    );
};

// --- CHESS ---
const ChessLite = () => {
    const [sel, setSel] = useState<number | null>(null);
    const [turn, setTurn] = useState<'white' | 'black'>('white');
    const [board, setBoard] = useState<(string | null)[]>(() => {
        const b = Array(64).fill(null);
        for(let i=8; i<16; i++) b[i] = '♟'; for(let i=48; i<56; i++) b[i] = '♙';
        b[0] = b[7] = '♜'; b[56] = b[63] = '♖'; b[1] = b[6] = '♞'; b[57] = b[62] = '♘'; b[2] = b[5] = '♝'; b[58] = b[61] = '♗';
        b[3] = '♛'; b[4] = '♚'; b[59] = '♕'; b[60] = '♔';
        return b;
    });

    const isB = (p: string | null) => p && '♜♞♝♛♚♟'.includes(p);

    useEffect(() => {
        if(turn === 'black'){
            setTimeout(() => {
                const bP = board.map((p,i)=>isB(p)?i:null).filter(v=>v!==null) as number[];
                if(bP.length > 0){
                    let s = bP[Math.floor(Math.random()*bP.length)], t = s+8;
                    const nb = [...board]; nb[t] = board[s]; nb[s] = null; setBoard(nb); setTurn('white');
                }
            }, 800);
        }
    }, [turn]);

    return (
        <div className="grid grid-cols-8 border border-white/20 rounded-xl overflow-hidden">{board.map((p,i) => (<div key={i} onClick={()=>{if(turn==='white'&&(sel!==null||(p&&!isB(p)))) { if(sel===null) setSel(i); else {const nb=[...board];nb[i]=board[sel];nb[sel]=null;setBoard(nb);setSel(null);setTurn('black');} }}} className={cn("size-8 md:size-10 flex items-center justify-center text-2xl cursor-pointer", ((Math.floor(i/8)+i)%2===1)?"bg-white/5":"bg-white/10", sel===i&&"bg-blue-500/40")}>
            <span className={cn(isB(p)?"text-red-400":"text-blue-400")}>{p}</span>
        </div>))}</div>
    );
};

// --- FLAMES ---
const Flames = () => {
    const [n1, setN1] = useState(""); const [n2, setN2] = useState(""); const [res, setRes] = useState<string | null>(null); const [l, setL] = useState(false);
    const calc = () => { if(!n1 || !n2) return; setL(true); setTimeout(() => { const f = ["Friends", "Lovers", "Affection", "Marriage", "Enemies", "Siblings"]; setRes(f[(n1.length + n2.length) % 6]); setL(false); }, 1500); };
    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
            <Input value={n1} onChange={e => setN1(e.target.value)} placeholder="ALPHA" className="bg-white/5 border-white/10 h-14 font-black text-center" />
            <Input value={n2} onChange={e => setN2(e.target.value)} placeholder="BRAVO" className="bg-white/5 border-white/10 h-14 font-black text-center" />
            <Button onClick={calc} className="w-full bg-white text-black font-black uppercase h-14">Compute</Button>
            {res && !l && <div className="text-3xl font-black text-blue-400 uppercase">{res}</div>}
        </div>
    );
};

// --- GAMES DOCK ---
export const GamesDock = () => {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const GAMES = [
        { id: 'ludo', name: 'Elite Ludo', icon: DicesIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: '15x15 Real Board' },
        { id: 'ttt', name: 'Tic Tac Toe', icon: SwordIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Impossible AI' },
        { id: 'chess', name: 'Chess Sandbox', icon: LayoutGridIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Strategic AI' },
        { id: 'flames', name: 'Flames Engine', icon: HeartIcon, color: 'text-red-400', bg: 'bg-red-500/10', desc: 'Social Logic' },
    ];
    if (selectedGame) {
        return (
            <div className="h-full flex flex-col bg-[#050505]">
                <div className="flex items-center p-6 border-b border-white/5 gap-4"><Button variant="ghost" size="icon" onClick={() => setSelectedGame(null)} className="rounded-full bg-white/5 border-white/10 size-8"><ChevronLeftIcon /></Button><h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">{GAMES.find(g => g.id === selectedGame)?.name}</h3></div>
                <div className="flex-1 w-full flex items-center justify-center p-4">
                    {selectedGame === 'ludo' && <Ludo />}
                    {selectedGame === 'ttt' && <TicTacToe />}
                    {selectedGame === 'chess' && <ChessLite />}
                    {selectedGame === 'flames' && <Flames />}
                </div>
            </div>
        );
    }
    return (
        <div className="h-full flex flex-col p-8 bg-[#050505]">
            <div className="text-center mb-12"><div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-500/20"><Gamepad2Icon className="size-8 text-blue-400" /></div><h2 className="text-2xl font-black text-white uppercase tracking-tighter">Elite Strategic Deck</h2><p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest">Real Simulation Active</p></div>
            <div className="grid gap-4 max-w-lg mx-auto w-full">
                {GAMES.map((game) => (
                    <button key={game.id} onClick={() => setSelectedGame(game.id)} className="group flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-blue-500/20 transition-all text-left">
                        <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", game.bg)}><game.icon className={cn("size-6", game.color)} /></div>
                        <div className="flex-1"><div className="font-black text-white text-base tracking-tight">{game.name}</div><div className="text-[9px] text-white/20 uppercase tracking-widest font-mono">{game.desc}</div></div>
                        <ChevronRightIcon className="size-4 text-white/10 group-hover:text-blue-400 transition-all" />
                    </button>
                ))}
            </div>
        </div>
    );
};
