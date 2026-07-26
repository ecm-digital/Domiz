import { useEffect, type RefObject } from 'react';

const REVEALED_CLASS = 'is-revealed';

/**
 * Odsłania elementy oznaczone atrybutem data-reveal, gdy wejdą w widok.
 * Przy wyłączonych animacjach lub braku IntersectionObserver treść jest widoczna od razu.
 */
export function useRevealOnScroll(containerRef: RefObject<HTMLElement | null>, deps: unknown[] = []) {
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const items = Array.from(container.querySelectorAll<HTMLElement>(`[data-reveal]:not(.${REVEALED_CLASS})`));
        if (items.length === 0) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
            items.forEach((item) => item.classList.add(REVEALED_CLASS));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add(REVEALED_CLASS);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

        items.forEach((item) => observer.observe(item));

        return () => observer.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerRef, ...deps]);
}
