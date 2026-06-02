"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Gamepad2Icon,
    ChevronLeftIcon,
    ChevronRightIcon,
    DicesIcon,
    LayoutGridIcon,
    HeartIcon,
    SwordIcon,
    CoinsIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// ==========================================
// STATIC DICTIONARY FOR INTERNATIONALIZATION
// ==========================================
const TXT = {
    RED: "RED",
    BLUE: "BLUE",
    PlayerBlue: "Player Blue",
    BotRed: "Bot Red",
    RestartRace: "Restart Race",
    Restart: "Restart",
    BotCaptured: "Bot Captured",
    YouCaptured: "You Captured",
    ResetChessDeck: "Reset Chess Deck",
    ComputeAffinities: "Compute Affinities",
    DevXSystems: "Dev X Systems",
    EliteStrategicDeck: "Elite Strategic Deck",
    RealSimulationActive: "Real Simulation Active",
    CloseGames: "Close Games",
    Victory: "VICTORY ACHIEVED!",
    Defeat: "DEFEAT!",
    YourTurn: "Your Turn",
    BotThinking: "Bot Thinking...",
    PassTurn: "Pass Turn",
    RollStrike: "Roll Strike",
    BotPlanning: "Bot is planning next move...",
    YourTurnWhite: "Your turn (White pieces)",
    YourTurnWhiteShort: "Your turn! (White)",
    NoLegalMovesBot: "No legal moves for Bot. You Win!",
    Draw: "DRAW",
    Loss: "LOSS",
    PlayerAName: "PLAYER A NAME",
    PlayerBName: "PLAYER B NAME",
    LudoName: "Elite Ludo",
    LudoDesc: "Real Move & Capture Rules",
    TttName: "Tic Tac Toe",
    TttDesc: "Unbeatable AI Matrix",
    ChessName: "Chess Deck",
    ChessDesc: "Validated Step & Captures",
    FlamesName: "Flames Logic",
    FlamesDesc: "Social compatibility calculations"
};

// ==========================================
// SECURE BOUNDS-CHECKED ARRAY HELPERS
// ==========================================
function safeAt<T>(arr: T[], index: number): T | undefined {
    return arr.at(index);
}

function safeSet<T>(arr: T[], index: number, value: T): T[] {
    return arr.map((item, idx) => idx === index ? value : item);
}

// ==========================================
// 1. ELITE LUDO (REAL BOARD & MULTI-TOKEN RULE)
// ==========================================

const Ludo = () => {
    // 2 Tokens per player for rich decision-making without cluttered UI
    const [pTokens, setPTokens] = useState<number[]>([-1, -1]); // Player Blue
    const [cTokens, setCTokens] = useState<number[]>([-1, -1]); // Bot Red
    const [turn, setTurn] = useState<'player' | 'computer'>('player');
    const [dice, setDice] = useState<number>(1);
    const [rolling, setRolling] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);
    const [movableTokens, setMovableTokens] = useState<number[]>([]);
    const [statusMessage, setStatusMessage] = useState<string>("Roll the dice to start!");
    const [turnCount, setTurnCount] = useState(0); // Increments every turn transition to re-trigger bot useEffect

    // 52-cell outer loop around the 15x15 Ludo board
    const ludoPath = [
        [6,1], [6,2], [6,3], [6,4], [6,5],
        [5,6], [4,6], [3,6], [2,6], [1,6], [0,6],
        [0,7],
        [0,8], [1,8], [2,8], [3,8], [4,8], [5,8],
        [6,9], [6,10], [6,11], [6,12], [6,13], [6,14],
        [7,14],
        [8,14], [8,13], [8,12], [8,11], [8,10], [8,9],
        [9,8], [10,8], [11,8], [12,8], [13,8], [14,8],
        [14,7],
        [14,6], [13,6], [12,6], [11,6], [10,6], [9,6],
        [8,5], [8,4], [8,3], [8,2], [8,1], [8,0],
        [7,0], [6,0]
    ];

    // Safe zone coordinates where pieces cannot be captured
    const safeCells = [
        [6,1],   // Red start
        [8,3],   // Left safe
        [3,6],   // Top safe
        [6,11],  // Right safe
        [11,8],  // Bottom safe
        [8,13],  // Blue start
    ];

    const isSafeCell = (r: number, c: number) => {
        return safeCells.some(cell => cell[0] === r && cell[1] === c);
    };

    // Yard (Base) coordinates
    const pYard = [[11, 11], [11, 12]];
    const cYard = [[3, 3], [3, 4]];

    const getBlueCoords = (step: number, tokenIdx: number) => {
        if (step === -1) {
            const yardSpot = safeAt(pYard, tokenIdx) ?? [11, 11];
            return { r: yardSpot[0], c: yardSpot[1] };
        }
        if (step === 56) return { r: 7, c: 7 };
        if (step > 50) {
            // Blue Home Run: maps steps 51-55 to cols/rows on the right-center arm
            return { r: 7, c: 14 - (step - 50) };
        }
        // Active path: loops clockwise starting from cell index 26 (Blue start [8,13])
        const idx = (26 + step) % 52;
        const coord = safeAt(ludoPath, idx) ?? [7, 7];
        return { r: coord[0], c: coord[1] };
    };

    const getRedCoords = (step: number, tokenIdx: number) => {
        if (step === -1) {
            const yardSpot = safeAt(cYard, tokenIdx) ?? [3, 3];
            return { r: yardSpot[0], c: yardSpot[1] };
        }
        if (step === 56) return { r: 7, c: 7 };
        if (step > 50) {
            // Red Home Run: maps steps 51-55 to cols/rows
            return { r: 7, c: step - 50 };
        }
        // Active path starting at cell index 0 (Red start [6,1])
        const coord = safeAt(ludoPath, step) ?? [7, 7];
        return { r: coord[0], c: coord[1] };
    };

    const getMovableTokensForRoll = (player: 'player' | 'computer', rollValue: number) => {
        const tokens = player === 'player' ? pTokens : cTokens;
        const list: number[] = [];

        tokens.forEach((pos, idx) => {
            if (pos === 56) return; // Already home

            if (pos === -1) {
                // Must roll a 6 to leave the yard
                if (rollValue === 6) list.push(idx);
            } else {
                // Cannot overshoot Home (needs exact count)
                if (pos + rollValue <= 56) list.push(idx);
            }
        });
        return list;
    };

    const triggerRoll = () => {
        if (rolling || hasRolled || turn !== 'player') return;
        setRolling(true);
        setStatusMessage("Rolling dice...");
        
        setTimeout(() => {
            const val = Math.floor(Math.random() * 6) + 1;
            setDice(val);
            setRolling(false);
            setHasRolled(true);

            const movable = getMovableTokensForRoll('player', val);
            setMovableTokens(movable);

            if (movable.length === 0) {
                setStatusMessage(`Rolled a ${val}. No legal moves! Passing turn.`);
                setTimeout(() => {
                    setHasRolled(false);
                    setTurn('computer');
                }, 1500);
            } else {
                setStatusMessage(`Rolled a ${val}! Choose a highlighted token to move.`);
            }
        }, 800);
    };

    const handlePlayerMove = (tokenIdx: number) => {
        if (!hasRolled || turn !== 'player' || !movableTokens.includes(tokenIdx)) return;

        const currentPos = safeAt(pTokens, tokenIdx) ?? -1;
        let nextPos = currentPos === -1 ? 0 : currentPos + dice;

        // Perform animated transition step-by-step
        let tempPos = currentPos;
        const interval = setInterval(() => {
            if (tempPos === -1) {
                tempPos = 0;
            } else {
                tempPos++;
            }
            
            setPTokens(prev => safeSet(prev, tokenIdx, tempPos));

            if (tempPos >= nextPos) {
                clearInterval(interval);
                finalizeMove('player', tokenIdx, nextPos);
            }
        }, 100);
    };

    const finalizeMove = (mover: 'player' | 'computer', tokenIdx: number, finalPos: number) => {
        let isCapture = false;

        if (finalPos < 51) {
            // Check capture
            const moverCoords = mover === 'player' ? getBlueCoords(finalPos, tokenIdx) : getRedCoords(finalPos, tokenIdx);
            
            if (!isSafeCell(moverCoords.r, moverCoords.c)) {
                if (mover === 'player') {
                    // Check if Red pieces are captured
                    cTokens.forEach((cPos, cIdx) => {
                        if (cPos !== -1 && cPos < 51) {
                            const cCoords = getRedCoords(cPos, cIdx);
                            if (cCoords.r === moverCoords.r && cCoords.c === moverCoords.c) {
                                // CAPTURE!
                                setCTokens(prev => safeSet(prev, cIdx, -1));
                                isCapture = true;
                            }
                        }
                    });
                } else {
                    // Check if Player pieces are captured
                    pTokens.forEach((pPos, pIdx) => {
                        if (pPos !== -1 && pPos < 51) {
                            const pCoords = getBlueCoords(pPos, pIdx);
                            if (pCoords.r === moverCoords.r && pCoords.c === moverCoords.c) {
                                // CAPTURE!
                                setPTokens(prev => safeSet(prev, pIdx, -1));
                                isCapture = true;
                            }
                        }
                    });
                }
            }
        }

        setMovableTokens([]);
        setHasRolled(false);

        if (isCapture) {
            setStatusMessage(`💥 Capture! Piece sent to the yard! You get a bonus turn!`);
            setTurn(mover);
            setTurnCount(c => c + 1);
        } else if (dice === 6) {
            setStatusMessage(`Rolled a 6! You earn a bonus turn!`);
            setTurn(mover);
            setTurnCount(c => c + 1);
        } else {
            setTurn(mover === 'player' ? 'computer' : 'player');
            setTurnCount(c => c + 1);
        }
    };

    // Bot AI Logic
    useEffect(() => {
        if (turn === 'computer') {
            const botDelay = setTimeout(() => {
                // 1. Roll dice
                const val = Math.floor(Math.random() * 6) + 1;
                setDice(val);

                const movable = getMovableTokensForRoll('computer', val);
                if (movable.length === 0) {
                    setStatusMessage(`Bot rolled a ${val}. No legal moves!`);
                    setTimeout(() => {
                        setTurn('player');
                    }, 1200);
                    return;
                }

                // 2. Select best token to move (AI Strategy: Capture > Leave Yard > Advance)
                let bestTokenIdx = movable[0];
                let highestScore = -100;

                movable.forEach(tIdx => {
                    const currentPos = safeAt(cTokens, tIdx) ?? -1;
                    const nextPos = currentPos === -1 ? 0 : currentPos + val;
                    let score = 0;

                    // Preference A: Capturing a Player token
                    if (nextPos < 51) {
                        const targetCoords = getRedCoords(nextPos, tIdx);
                        if (!isSafeCell(targetCoords.r, targetCoords.c)) {
                            pTokens.forEach(pPos => {
                                if (pPos !== -1 && pPos < 51) {
                                    const pCoords = getBlueCoords(pPos, 0);
                                    if (pCoords.r === targetCoords.r && pCoords.c === targetCoords.c) {
                                        score += 100; // Super high value
                                    }
                                }
                            });
                        }
                    }

                    // Preference B: Getting a token out of the Yard
                    if (currentPos === -1 && val === 6) {
                        score += 50;
                    }

                    // Preference C: Moving closer to Home
                    score += nextPos;

                    if (score > highestScore) {
                        highestScore = score;
                        bestTokenIdx = tIdx;
                    }
                });

                // 3. Move token step-by-step
                const currentPos = safeAt(cTokens, bestTokenIdx) ?? -1;
                let nextPos = currentPos === -1 ? 0 : currentPos + val;
                setStatusMessage(`Bot rolled a ${val} and is moving piece ${bestTokenIdx + 1}...`);

                let tempPos = currentPos;
                const interval = setInterval(() => {
                    if (tempPos === -1) {
                        tempPos = 0;
                    } else {
                        tempPos++;
                    }

                    setCTokens(prev => safeSet(prev, bestTokenIdx, tempPos));

                    if (tempPos >= nextPos) {
                        clearInterval(interval);
                        finalizeMove('computer', bestTokenIdx, nextPos);
                    }
                }, 100);

            }, 1200);

            return () => clearTimeout(botDelay);
        }
    }, [turn, turnCount]);

    const renderBoard = () => {
        const boardCells = [];

        // Check offset stacks if multiple tokens land on same coordinates
        const getTokenOffsets = (r: number, c: number) => {
            const spots: { type: 'blue' | 'red'; idx: number }[] = [];
            pTokens.forEach((pos, idx) => {
                const coords = getBlueCoords(pos, idx);
                if (coords.r === r && coords.c === c) spots.push({ type: 'blue', idx });
            });
            cTokens.forEach((pos, idx) => {
                const coords = getRedCoords(pos, idx);
                if (coords.r === r && coords.c === c) spots.push({ type: 'red', idx });
            });
            return spots;
        };

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const piecesAtCell = getTokenOffsets(r, c);

                // Custom Styling zones
                let zoneStyle = "bg-white/[0.02]";
                
                // Red Zone (Top Left)
                if (r < 6 && c < 6) {
                    zoneStyle = "bg-red-500/10 border-red-500/20";
                }
                // Green Zone (Top Right)
                else if (r < 6 && c > 8) {
                    zoneStyle = "bg-emerald-500/10 border-emerald-500/20";
                }
                // Yellow Zone (Bottom Left)
                else if (r > 8 && c < 6) {
                    zoneStyle = "bg-amber-500/10 border-amber-500/20";
                }
                // Blue Zone (Bottom Right)
                else if (r > 8 && c > 8) {
                    zoneStyle = "bg-blue-500/10 border-blue-500/20";
                }
                // Center Triangle
                else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
                    zoneStyle = "bg-white/10 border-white/20";
                }

                // Path coloring details
                const isRedHomeRun = r === 7 && c >= 1 && c <= 5;
                const isBlueHomeRun = r === 7 && c >= 9 && c <= 13;
                const isSafe = isSafeCell(r, c);

                const isMovableHighlight = turn === 'player' && hasRolled && piecesAtCell.some(p => p.type === 'blue' && movableTokens.includes(p.idx));

                boardCells.push(
                    <div
                        key={`${r}-${c}`}
                        className={cn(
                            "w-full h-full border-[0.5px] border-white/[0.04] flex items-center justify-center relative transition-all duration-300",
                            zoneStyle,
                            isRedHomeRun && "bg-red-500/30 border-red-500/40",
                            isBlueHomeRun && "bg-blue-500/30 border-blue-500/40",
                            isSafe && "bg-amber-500/20 border-amber-500/30",
                            isMovableHighlight && "bg-blue-500/30 border border-blue-400 shadow-[inset_0_0_10px_rgba(59,130,246,0.5)] cursor-pointer"
                        )}
                    >
                        {isSafe && !piecesAtCell.length && (
                            <span className="text-[6px] text-amber-400/50 absolute select-none">★</span>
                        )}

                        {/* Triangles in Home yard */}
                        {r === 2 && c === 2 && <div className="absolute size-8 rounded-full border-4 border-red-500/30 flex items-center justify-center text-[8px] font-bold text-red-500/50">{TXT.RED}</div>}
                        {r === 12 && c === 12 && <div className="absolute size-8 rounded-full border-4 border-blue-500/30 flex items-center justify-center text-[8px] font-bold text-blue-500/50">{TXT.BLUE}</div>}

                        {/* Render pieces inside cell */}
                        <div className="flex gap-0.5 items-center justify-center relative size-full">
                            {piecesAtCell.map((piece, pIdx) => {
                                const isTokenMovable = piece.type === 'blue' && turn === 'player' && hasRolled && movableTokens.includes(piece.idx);
                                return (
                                    <motion.div
                                        key={`${piece.type}-${piece.idx}`}
                                        layoutId={`token-${piece.type}-${piece.idx}`}
                                        onClick={() => piece.type === 'blue' && handlePlayerMove(piece.idx)}
                                        className={cn(
                                            "size-3 md:size-4 rounded-full flex items-center justify-center text-[8px] font-black shadow-lg cursor-pointer select-none transition-all",
                                            piece.type === 'blue'
                                                ? "bg-blue-500 text-white shadow-blue-500/50 border border-blue-300"
                                                : "bg-red-500 text-white shadow-red-500/50 border border-red-300",
                                            isTokenMovable && "animate-bounce scale-125 z-20 border-white ring-2 ring-blue-400"
                                        )}
                                    >
                                        {piece.idx + 1}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                );
            }
        }
        return boardCells;
    };

    const playerWon = pTokens.every(p => p === 56);
    const botWon = cTokens.every(c => c === 56);

    return (
        <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {turn === 'player' ? TXT.YourTurn : TXT.BotThinking}
                </span>
                <p className="text-[10px] text-neutral-400 font-mono mt-2 uppercase tracking-wide px-4">{statusMessage}</p>
            </div>

            <div className="grid grid-cols-15 grid-rows-15 size-72 md:size-88 bg-black/60 border border-white/10 rounded-2xl p-1 overflow-hidden shadow-2xl relative">
                {renderBoard()}
            </div>

            <div className="flex items-center gap-6 bg-white/[0.03] p-4 rounded-[2rem] border border-white/5 w-full max-w-sm justify-between shadow-xl">
                 <div className="flex flex-col items-center gap-1.5 pl-2">
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">{TXT.PlayerBlue}</span>
                    <div className="size-11 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 text-lg font-black shadow-inner">
                        {turn === 'player' ? (rolling ? '?' : dice) : '-'}
                    </div>
                 </div>

                 <Button
                    onClick={triggerRoll}
                    disabled={rolling || hasRolled || turn === 'computer' || playerWon || botWon}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 h-12 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-blue-500/25 flex items-center gap-2 border border-blue-400/30"
                 >
                     <DicesIcon size={14} className="animate-spin-slow" /> {TXT.RollStrike}
                 </Button>

                 <div className="flex flex-col items-center gap-1.5 pr-2">
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">{TXT.BotRed}</span>
                    <div className="size-11 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 border border-red-500/20 text-lg font-black shadow-inner">
                        {turn === 'computer' ? dice : '-'}
                    </div>
                 </div>
            </div>

            {(playerWon || botWon) && (
                <div className="text-center p-4 bg-white/5 border border-white/10 rounded-2xl w-full max-w-xs animate-pulse">
                    <p className="text-lg font-black tracking-wider text-white">
                        {playerWon ? TXT.Victory : TXT.Defeat}
                    </p>
                    <Button
                        onClick={() => {
                            setPTokens([-1, -1]);
                            setCTokens([-1, -1]);
                            setTurn('player');
                            setStatusMessage("Roll to start!");
                        }}
                        className="mt-3 text-[9px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg py-1 px-4"
                    >
                        {TXT.RestartRace}
                    </Button>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 2. STIMULATED IMPOSSIBLE TIC TAC TOE
// ==========================================

const TicTacToe = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);

    const checkWinner = (sq: any[]) => {
        const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        for(let [a,b,c] of lines) {
            const valA = safeAt(sq, a);
            const valB = safeAt(sq, b);
            const valC = safeAt(sq, c);
            if(valA && valA === valB && valA === valC) return valA;
        }
        return sq.includes(null) ? null : 'Draw';
    };

    const minimax = (nb: any[], p: string): any => {
        const avail = nb.map((v,i) => v === null ? i : null).filter(v => v !== null) as number[];
        const win = checkWinner(nb);
        if(win === 'O') return {score: 10}; 
        if(win === 'X') return {score: -10}; 
        if(avail.length === 0) return {score: 0};

        const moves = [];
        for(let i=0; i<avail.length; i++){
            const targetIdx = safeAt(avail, i);
            if (targetIdx !== undefined) {
                const move: any = {index: targetIdx}; 
                let simBoard = safeSet(nb, targetIdx, p);
                move.score = minimax(simBoard, p === 'O' ? 'X' : 'O').score;
                moves.push(move);
            }
        }
        let best = 0;
        if(p === 'O'){ 
            let bs = -1e4; 
            for(let i=0; i<moves.length; i++) {
                const moveScore = safeAt(moves, i)?.score ?? -Infinity;
                if(moveScore > bs){
                    bs = moveScore; 
                    best = i;
                }
            } 
        }
        else { 
            let bs = 1e4; 
            for(let i=0; i<moves.length; i++) {
                const moveScore = safeAt(moves, i)?.score ?? Infinity;
                if(moveScore < bs){
                    bs = moveScore; 
                    best = i;
                }
            } 
        }
        return safeAt(moves, best);
    };

    const handleClick = (i: number) => {
        if(winner || safeAt(board, i) || !isXNext) return;
        const nb = safeSet(board, i, 'X'); 
        setBoard(nb);
        const w = checkWinner(nb); 
        if(w) setWinner(w); 
        else setIsXNext(false);
    };

    useEffect(() => {
        if(!isXNext && !winner){
            setTimeout(() => {
                const b = minimax([...board], 'O'); 
                if (b && b.index !== undefined) {
                    const nb = safeSet(board, b.index, 'O'); 
                    setBoard(nb);
                    const w = checkWinner(nb); 
                    if(w) setWinner(w); 
                    else setIsXNext(true);
                }
            }, 600);
        }
    }, [isXNext, winner]);

    return (
        <div className="flex flex-col items-center gap-8 py-4">
            <div className="grid grid-cols-3 gap-3">
                {board.map((s,i)=>(
                    <button 
                        key={i} 
                        onClick={()=>handleClick(i)} 
                        className="size-20 md:size-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black transition-all hover:border-blue-500/50" 
                        style={{color: s === 'X' ? '#3b82f6' : '#f87171'}}
                    >
                        {s}
                    </button>
                ))}
            </div>
            {winner && (
                <div className="text-center">
                    <p className="text-2xl font-black text-white">
                        {winner === 'Draw' ? TXT.Draw : TXT.Loss}
                    </p>
                    <Button 
                        onClick={()=>{
                            setBoard(Array(9).fill(null));
                            setWinner(null);
                            setIsXNext(true);
                        }} 
                        className="mt-4 bg-white text-black px-6 font-black uppercase text-xs"
                    >
                        {TXT.Restart}
                    </Button>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 3. REAL CHESS LITE (VALIDATED MOVES & DOCK)
// ==========================================

const ChessLite = () => {
    const [sel, setSel] = useState<number | null>(null);
    const [turn, setTurn] = useState<'white' | 'black'>('white');
    const [validMoves, setValidMoves] = useState<number[]>([]);
    const [whiteCaptured, setWhiteCaptured] = useState<string[]>([]);
    const [blackCaptured, setBlackCaptured] = useState<string[]>([]);
    const [statusText, setStatusText] = useState<string>(TXT.YourTurnWhite);

    const [board, setBoard] = useState<(string | null)[]>(() => {
        const b = Array(64).fill(null);
        // Pawns
        for(let i=8; i<16; i++) b[i] = '♟'; 
        for(let i=48; i<56; i++) b[i] = '♙';
        // Rooks
        b[0] = b[7] = '♜'; b[56] = b[63] = '♖'; 
        // Knights
        b[1] = b[6] = '♞'; b[57] = b[62] = '♘'; 
        // Bishops
        b[2] = b[5] = '♝'; b[58] = b[61] = '♗';
        // Queens & Kings
        b[3] = '♛'; b[4] = '♚'; 
        b[59] = '♕'; b[60] = '♔';
        return b;
    });

    const isB = (p: string | null) => p !== null && '♜♞♝♛♚♟'.includes(p);
    const isW = (p: string | null) => p !== null && '♙♖♘♗♕♔'.includes(p);

    // Precise Step and Capture Rule Logic for Chess Pieces
    const getValidMoves = (from: number, b: (string | null)[]): number[] => {
        const piece = safeAt(b, from);
        if (!piece) return [];
        
        const isWhite = isW(piece);
        const r = Math.floor(from / 8);
        const c = from % 8;
        const moves: number[] = [];

        const isEnemy = (to: number) => {
            const p = safeAt(b, to) ?? null;
            if (!p) return false;
            return isWhite ? isB(p) : isW(p);
        };

        const isOccupied = (to: number) => safeAt(b, to) !== null;

        if (piece === '♙') { // White Pawn
            const f1 = from - 8;
            if (f1 >= 0 && !isOccupied(f1)) {
                moves.push(f1);
                const f2 = from - 16;
                if (r === 6 && !isOccupied(f2)) moves.push(f2);
            }
            // Diagonal Captures
            const diagLeft = from - 9;
            const diagRight = from - 7;
            if (diagLeft >= 0 && Math.floor(diagLeft / 8) === r - 1 && isEnemy(diagLeft)) moves.push(diagLeft);
            if (diagRight >= 0 && Math.floor(diagRight / 8) === r - 1 && isEnemy(diagRight)) moves.push(diagRight);
        } else if (piece === '♟') { // Black Pawn
            const f1 = from + 8;
            if (f1 < 64 && !isOccupied(f1)) {
                moves.push(f1);
                const f2 = from + 16;
                if (r === 1 && !isOccupied(f2)) moves.push(f2);
            }
            // Diagonal Captures
            const diagLeft = from + 7;
            const diagRight = from + 9;
            if (diagLeft < 64 && Math.floor(diagLeft / 8) === r + 1 && isEnemy(diagLeft)) moves.push(diagLeft);
            if (diagRight < 64 && Math.floor(diagRight / 8) === r + 1 && isEnemy(diagRight)) moves.push(diagRight);
        } else if (piece === '♖' || piece === '♜') { // Rook
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of dirs) {
                let currR = r + dr, currC = c + dc;
                while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    const to = currR * 8 + currC;
                    if (!isOccupied(to)) {
                        moves.push(to);
                    } else {
                        if (isEnemy(to)) moves.push(to);
                        break;
                    }
                    currR += dr;
                    currC += dc;
                }
            }
        } else if (piece === '♗' || piece === '♝') { // Bishop
            const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                let currR = r + dr, currC = c + dc;
                while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    const to = currR * 8 + currC;
                    if (!isOccupied(to)) {
                        moves.push(to);
                    } else {
                        if (isEnemy(to)) moves.push(to);
                        break;
                    }
                    currR += dr;
                    currC += dc;
                }
            }
        } else if (piece === '♕' || piece === '♛') { // Queen
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of dirs) {
                let currR = r + dr, currC = c + dc;
                while (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    const to = currR * 8 + currC;
                    if (!isOccupied(to)) {
                        moves.push(to);
                    } else {
                        if (isEnemy(to)) moves.push(to);
                        break;
                    }
                    currR += dr;
                    currC += dc;
                }
            }
        } else if (piece === '♘' || piece === '♞') { // Knight
            const diffs = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (const [dr, dc] of diffs) {
                const currR = r + dr, currC = c + dc;
                if (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    const to = currR * 8 + currC;
                    if (!isOccupied(to) || isEnemy(to)) moves.push(to);
                }
            }
        } else if (piece === '♔' || piece === '♚') { // King
            const diffs = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            for (const [dr, dc] of diffs) {
                const currR = r + dr, currC = c + dc;
                if (currR >= 0 && currR < 8 && currC >= 0 && currC < 8) {
                    const to = currR * 8 + currC;
                    if (!isOccupied(to) || isEnemy(to)) moves.push(to);
                }
            }
        }
        return moves;
    };

    const handleTileClick = (index: number) => {
        if (turn !== 'white') return;

        const piece = safeAt(board, index) ?? null;

        if (sel === null) {
            // Select piece
            if (piece && isW(piece)) {
                setSel(index);
                const moves = getValidMoves(index, board);
                setValidMoves(moves);
            }
        } else {
            // Place piece
            if (validMoves.includes(index)) {
                // Capture handling
                const targetPiece = safeAt(board, index) ?? null;
                if (targetPiece) {
                    setBlackCaptured(prev => [...prev, targetPiece]);
                }

                let nb = [...board];
                nb = safeSet(nb, index, safeAt(board, sel) ?? null);
                nb = safeSet(nb, sel, null);
                
                // Pawn promotion simplified
                if (safeAt(nb, index) === '♙' && Math.floor(index / 8) === 0) {
                    nb = safeSet(nb, index, '♕');
                }

                setBoard(nb);
                setSel(null);
                setValidMoves([]);
                setTurn('black');
                setStatusText(TXT.BotPlanning);
            } else if (piece && isW(piece)) {
                // Change selection
                setSel(index);
                const moves = getValidMoves(index, board);
                setValidMoves(moves);
            } else {
                // Cancel selection
                setSel(null);
                setValidMoves([]);
            }
        }
    };

    // Minimax Chess AI with Alpha-Beta Pruning (Tough strategic competitor)
    const PIECE_VALUES = new Map<string, number>([
        ['♙', -10], ['♟', 10],
        ['♘', -30], ['♞', 30],
        ['♗', -30], ['♝', 30],
        ['♖', -50], ['♜', 50],
        ['♕', -90], ['♛', 90],
        ['♔', -9000], ['♚', 9000]
    ]);

    const evaluateBoard = (b: (string | null)[]): number => {
        let score = 0;
        b.forEach((p, idx) => {
            if (p && PIECE_VALUES.has(p)) {
                score += PIECE_VALUES.get(p) ?? 0;
                // Positional bonuses
                const r = Math.floor(idx / 8);
                const c = idx % 8;
                if (p === '♟') { // Black pawn
                    score += r * 0.8; // Encourage pawns to advance
                } else if (p === '♙') { // White pawn
                    score -= (7 - r) * 0.8;
                }
                
                // Encourage control of the 4 center squares
                if (r >= 3 && r <= 4 && c >= 3 && c <= 4) {
                    score += '♜♞♝♛♚♟'.includes(p) ? 5 : -5;
                }
            }
        });
        return score;
    };

    const minimaxChess = (
        b: (string | null)[],
        depth: number,
        alpha: number,
        beta: number,
        isMaximizing: boolean
    ): { score: number; move?: { from: number; to: number } } => {
        const hasWhiteKing = b.includes('♔');
        const hasBlackKing = b.includes('♚');
        if (!hasWhiteKing) return { score: 99999 + depth };
        if (!hasBlackKing) return { score: -99999 - depth };

        if (depth === 0) {
            return { score: evaluateBoard(b) };
        }

        if (isMaximizing) {
            let maxEval = -Infinity;
            let bestMove: { from: number; to: number } | undefined;

            const blackPieces: number[] = [];
            b.forEach((p, idx) => {
                if (p && '♜♞♝♛♚♟'.includes(p)) blackPieces.push(idx);
            });

            for (const from of blackPieces) {
                const moves = getValidMoves(from, b);
                for (const to of moves) {
                    const temp = safeAt(b, to) ?? null;
                    let simBoard = safeSet(b, to, safeAt(b, from) ?? null);
                    simBoard = safeSet(simBoard, from, null);

                    const evaluation = minimaxChess(simBoard, depth - 1, alpha, beta, false).score;

                    if (evaluation > maxEval) {
                        maxEval = evaluation;
                        bestMove = { from, to };
                    }
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            let bestMove: { from: number; to: number } | undefined;

            const whitePieces: number[] = [];
            b.forEach((p, idx) => {
                if (p && '♙♖♘♗♕♔'.includes(p)) whitePieces.push(idx);
            });

            for (const from of whitePieces) {
                const moves = getValidMoves(from, b);
                for (const to of moves) {
                    const temp = safeAt(b, to) ?? null;
                    let simBoard = safeSet(b, to, safeAt(b, from) ?? null);
                    simBoard = safeSet(simBoard, from, null);

                    const evaluation = minimaxChess(simBoard, depth - 1, alpha, beta, true).score;

                    if (evaluation < minEval) {
                        minEval = evaluation;
                        bestMove = { from, to };
                    }
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha) break;
                }
            }
            return { score: minEval, move: bestMove };
        }
    };

    // Bot Move Logic
    useEffect(() => {
        if (turn === 'black') {
            const timer = setTimeout(() => {
                // Call Minimax at depth 3 to find the absolute best competitive move
                const result = minimaxChess([...board], 3, -Infinity, Infinity, true);
                const bestMove = result.move;

                if (bestMove) {
                    const targetPiece = safeAt(board, bestMove.to) ?? null;
                    if (targetPiece) {
                        setWhiteCaptured(prev => [...prev, targetPiece]);
                    }

                    let nb = [...board];
                    nb = safeSet(nb, bestMove.to, safeAt(board, bestMove.from) ?? null);
                    nb = safeSet(nb, bestMove.from, null);

                    // Pawn promotion for Bot
                    if (safeAt(nb, bestMove.to) === '♟' && Math.floor(bestMove.to / 8) === 7) {
                        nb = safeSet(nb, bestMove.to, '♛');
                    }

                    setBoard(nb);
                    setTurn('white');
                    setStatusText(TXT.YourTurnWhiteShort);
                } else {
                    setStatusText(TXT.NoLegalMovesBot);
                }
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [turn]);

    return (
        <div className="flex flex-col items-center gap-6 py-4 w-full">
            <div className="text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {statusText}
                </span>
            </div>

            {/* DOCK FOR CAPTURED PIECES (BOT'S DOCK) */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full max-w-sm justify-between">
                <span className="text-[8px] font-bold text-red-400 uppercase tracking-wider">{TXT.BotCaptured}</span>
                <div className="flex gap-1 min-h-[1.5rem]">
                    {whiteCaptured.map((p, idx) => (
                        <span key={idx} className="text-base text-blue-400 select-none">{p}</span>
                    ))}
                </div>
            </div>

            {/* THE CHESS BOARD */}
            <div className="grid grid-cols-8 grid-rows-8 border-2 border-white/20 rounded-2xl overflow-hidden shadow-2xl relative size-72 md:size-88 bg-neutral-950">
                {board.map((p, i) => {
                    const r = Math.floor(i / 8);
                    const c = i % 8;
                    const isDark = (r + c) % 2 === 1;
                    const isSelected = sel === i;
                    const isValidDestination = validMoves.includes(i);

                    return (
                        <div
                            key={i}
                            onClick={() => handleTileClick(i)}
                            className={cn(
                                "size-full flex items-center justify-center text-2xl md:text-3xl cursor-pointer transition-all relative select-none",
                                isDark ? "bg-[#1e293b]" : "bg-[#475569]",
                                isSelected && "bg-blue-500/50 ring-2 ring-blue-400 z-10",
                                isValidDestination && "bg-emerald-500/40 ring-1 ring-emerald-400 z-10"
                            )}
                        >
                            {p && (
                                <span className={cn(isB(p) ? "text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" : "text-blue-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]")}>
                                    {p}
                                </span>
                            )}
                            
                            {/* Board coordinates indicator */}
                            {c === 0 && (
                                <span className="absolute top-0.5 left-0.5 text-[6px] font-mono text-white/30 uppercase select-none">
                                    {8 - r}
                                </span>
                            )}
                            {r === 7 && (
                                <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono text-white/30 uppercase select-none">
                                    {String.fromCharCode(97 + c)}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* DOCK FOR CAPTURED PIECES (PLAYER'S DOCK) */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 w-full max-w-sm justify-between">
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-wider">{TXT.YouCaptured}</span>
                <div className="flex gap-1 min-h-[1.5rem]">
                    {blackCaptured.map((p, idx) => (
                        <span key={idx} className="text-base text-red-400 select-none">{p}</span>
                    ))}
                </div>
            </div>

            {/* RESET CHESS BUTTON */}
            <Button
                onClick={() => {
                    const b = Array(64).fill(null);
                    for(let i=8; i<16; i++) b[i] = '♟'; for(let i=48; i<56; i++) b[i] = '♙';
                    b[0] = b[7] = '♜'; b[56] = b[63] = '♖'; b[1] = b[6] = '♞'; b[57] = b[62] = '♘'; b[2] = b[5] = '♝'; b[58] = b[61] = '♗';
                    b[3] = '♛'; b[4] = '♚'; b[59] = '♕'; b[60] = '♔';
                    setBoard(b);
                    setSel(null);
                    setValidMoves([]);
                    setTurn('white');
                    setWhiteCaptured([]);
                    setBlackCaptured([]);
                    setStatusText(TXT.YourTurnWhite);
                }}
                variant="ghost"
                className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold border border-white/5 hover:border-white/15 px-4 rounded-lg"
            >
                {TXT.ResetChessDeck}
            </Button>
        </div>
    );
};

// ==========================================
// 4. THE FLAMES SOCIAL MATCH CALCULATOR
// ==========================================

const Flames = () => {
    const [n1, setN1] = useState(""); 
    const [n2, setN2] = useState(""); 
    const [res, setRes] = useState<string | null>(null); 
    const [l, setL] = useState(false);

    const calc = () => { 
        if(!n1 || !n2) return; 
        setL(true); 
        setTimeout(() => { 
            const f = ["Friends", "Lovers", "Affection", "Marriage", "Enemies", "Siblings"]; 
            setRes(safeAt(f, (n1.length + n2.length) % 6) ?? null); 
            setL(false); 
        }, 1500); 
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full max-w-sm px-4">
            <Input value={n1} onChange={e => setN1(e.target.value)} placeholder={TXT.PlayerAName} className="bg-white/5 border-white/10 h-14 font-black text-center text-sm rounded-2xl tracking-wider text-white" />
            <Input value={n2} onChange={e => setN2(e.target.value)} placeholder={TXT.PlayerBName} className="bg-white/5 border-white/10 h-14 font-black text-center text-sm rounded-2xl tracking-wider text-white" />
            <Button onClick={calc} className="w-full bg-white text-black font-black uppercase h-14 rounded-2xl text-[11px] tracking-widest hover:bg-neutral-200 transition-colors">{TXT.ComputeAffinities}</Button>
            {res && !l && <div className="text-2xl font-black text-blue-400 uppercase tracking-widest animate-bounce mt-2">{res}</div>}
        </div>
    );
};

// ==========================================
// 5. MASTER THEME AND GAMES DECK LAYOUT
// ==========================================

export const GamesDock = ({ onClose }: { onClose?: () => void }) => {
    const [selectedGame, setSelectedGame] = useState<string | null>(null);

    const GAMES = [
        { id: 'ludo', name: TXT.LudoName, icon: CoinsIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10', desc: TXT.LudoDesc },
        { id: 'ttt', name: TXT.TttName, icon: SwordIcon, color: 'text-amber-400', bg: 'bg-amber-500/10', desc: TXT.TttDesc },
        { id: 'chess', name: TXT.ChessName, icon: LayoutGridIcon, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: TXT.ChessDesc },
        { id: 'flames', name: TXT.FlamesName, icon: HeartIcon, color: 'text-red-400', bg: 'bg-red-500/10', desc: TXT.FlamesDesc },
    ];

    if (selectedGame) {
        return (
            <div className="h-full flex flex-col bg-[#050505] overflow-auto scrollbar-hide">
                <div className="flex items-center px-6 py-4 border-b border-white/5 gap-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-30">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedGame(null)} className="rounded-full bg-white/5 border-white/10 size-8 text-white hover:bg-white/10">
                        <ChevronLeftIcon className="size-4" />
                    </Button>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/60">
                        {safeAt(GAMES.filter(g => g.id === selectedGame), 0)?.name}
                    </h3>
                </div>
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
        <div className="h-full flex flex-col bg-[#050505] overflow-auto scrollbar-hide">
            {onClose && (
                <div className="flex items-center px-6 py-3.5 border-b border-white/5 gap-4 sticky top-0 bg-[#050505]/80 backdrop-blur-md z-30 justify-between">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onClose} 
                        className="rounded-full bg-white/5 border border-white/10 text-neutral-400 hover:text-white px-4 py-1.5 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-white/10 transition-all"
                    >
                        <ChevronLeftIcon className="size-3.5" /> {TXT.CloseGames}
                    </Button>
                    <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-widest mr-2">{TXT.DevXSystems}</span>
                </div>
            )}
            <div className="flex-1 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
                        <Gamepad2Icon className="size-8 text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{TXT.EliteStrategicDeck}</h2>
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest">{TXT.RealSimulationActive}</p>
                </div>
                <div className="grid gap-4 max-w-lg mx-auto w-full">
                    {GAMES.map((game) => (
                        <button 
                            key={game.id} 
                            onClick={() => setSelectedGame(game.id)} 
                            className="group flex items-center gap-4 p-5 rounded-[2rem] bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05] hover:border-blue-500/25 transition-all text-left shadow-lg"
                        >
                            <div className={cn("size-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 border border-white/5", game.bg)}>
                                <game.icon className={cn("size-6", game.color)} />
                            </div>
                            <div className="flex-1">
                                <div className="font-black text-white text-base tracking-tight">{game.name}</div>
                                <div className="text-[9px] text-white/30 uppercase tracking-widest font-mono mt-0.5">{game.desc}</div>
                            </div>
                            <ChevronRightIcon className="size-4 text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
