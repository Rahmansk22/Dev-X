"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loading3D } from "@/components/loading-3d";

export const NavigationObserver = () => {
    const [isNavigating, setIsNavigating] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // When pathname or searchParams change, the navigation is complete
        setIsNavigating(false);
    }, [pathname, searchParams]);

    useEffect(() => {
        const handleAnchorClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest("a");

            if (
                anchor &&
                anchor.href &&
                anchor.href.startsWith(window.location.origin) &&
                !anchor.href.includes("#") &&
                anchor.target !== "_blank" &&
                anchor.href !== window.location.href
            ) {
                setIsNavigating(true);
            }
        };

        document.addEventListener("click", handleAnchorClick);
        return () => document.removeEventListener("click", handleAnchorClick);
    }, []);

    if (!isNavigating) return null;

    return <Loading3D />;
};
