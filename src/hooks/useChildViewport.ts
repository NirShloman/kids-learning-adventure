import { useEffect } from 'react';

export function useChildViewport() {
  useEffect(() => {
    const update = () => {
      // Pinch zoom retains normal document scrolling; only the software keyboard resizes the stage.
      const viewport = window.visualViewport;
      const staffBar = document.querySelector('.pilot-bar')?.getBoundingClientRect().height ?? 0;
      const height = (viewport && viewport.scale === 1 ? viewport.height : window.innerHeight) - staffBar;
      document.documentElement.style.setProperty('--child-height', `${Math.max(200, height)}px`);
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : undefined;
    const staffBar = document.querySelector('.pilot-bar'); if (staffBar) observer?.observe(staffBar);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      observer?.disconnect();
    };
  }, []);
}
