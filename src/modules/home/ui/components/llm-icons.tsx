import * as React from "react";

export const ClaudeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#ECECEC" />
    <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#222">C</text>
  </svg>
);

export const GrokIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#1A1A1A" />
    <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">G</text>
  </svg>
);

export const GeminiIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#4285F4" />
    <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">Ge</text>
  </svg>
);

export const LlamaIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" viewBox="0 0 32 32" fill="none" {...props}>
    <circle cx="16" cy="16" r="16" fill="#FFB300" />
    <text x="16" y="21" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff">L</text>
  </svg>
);
