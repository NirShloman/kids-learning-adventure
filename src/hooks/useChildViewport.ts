import { useEffect } from 'react';

export function useChildViewport() {
  useEffect(() => {
    const update = () => {
      // Pinch zoom retains normal document scrolling; only the software keyboard resizes the stage.
      const viewport = window.visualViewport;
      document.documentElement.style.setProperty('--child-height', `${viewport && viewport.scale === 1 ? viewport.height : window.innerHeight}px`);
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);
}
