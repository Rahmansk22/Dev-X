import React, { useEffect, useState } from "react";

const prompts = [
  "What would you like to build today?",
  "An enterprise-scale SaaS dashboard...",
  "A modern blog with Clerk Auth & Prisma...",
  "A premium landing page with motion designs...",
  "Your next big idea starts here."
];

export const TypingPrompt: React.FC = () => {
  const [displayed, setDisplayed] = useState("");
  const [promptIdx, setPromptIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const blinkInterval = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const currentPrompt = prompts[promptIdx];
    if (!isDeleting && charIdx < currentPrompt.length) {
      timeout = setTimeout(() => setCharIdx(charIdx + 1), 40 + Math.random() * 60);
    } else if (!isDeleting && charIdx === currentPrompt.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1200);
    } else if (isDeleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(charIdx - 1), 18 + Math.random() * 32);
    } else if (isDeleting && charIdx === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setPromptIdx((i) => (i + 1) % prompts.length);
      }, 600);
    }
    setDisplayed(currentPrompt.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, isDeleting, promptIdx]);

  return (
    <div className="relative w-full text-left">
      <span className="text-sm md:text-base leading-relaxed text-gray-500 font-mono tracking-wide select-none">
        {displayed}
        <span className={`inline-block w-2 h-5 align-middle ml-0.5 animate-bounce" style={{animationDuration:'0.7s'}}`}>
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="3" width="4" height="14" rx="2" fill="#60a5fa" className={blink ? "opacity-100" : "opacity-30"} />
            <path d="M8 0L10.5 5H5.5L8 0Z" fill="#60a5fa" className={blink ? "opacity-100" : "opacity-30"} />
            <path d="M8 20L5.5 15H10.5L8 20Z" fill="#60a5fa" className={blink ? "opacity-100" : "opacity-30"} />
          </svg>
        </span>
      </span>
      <span className={`absolute left-0 top-0 h-full w-full pointer-events-none transition-all duration-300 ${displayed ? "opacity-0" : "opacity-100"}`}></span>
    </div>
  );
};
