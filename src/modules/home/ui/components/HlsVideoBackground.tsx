"use client";

import React, { useEffect, useRef } from "react";
import Hls from "hls.js";

export function HlsVideoBackground({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        debug: false,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((err) => console.warn("Auto-play prevented", err));
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // For Safari where HLS is supported natively
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        video.play().catch((err) => console.warn("Auto-play prevented", err));
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      className="fixed inset-0 w-full h-full object-cover z-0 opacity-60 brightness-[1.2] contrast-[1.2] saturate-150 mix-blend-screen pointer-events-none"
      autoPlay
      loop
      muted
      playsInline
    />
  );
}
