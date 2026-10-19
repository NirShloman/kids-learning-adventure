import { ReactNode, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface AmbientVideoProps {
  src: string;
  poster: string;
  className: string;
  fallback: ReactNode;
  ariaLabel?: string;
  children?: ReactNode;
  fit?: 'contain' | 'cover';
}

export function AmbientVideo({ src, poster, className, fallback, ariaLabel, children, fit = 'contain' }: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [profileReduced, setProfileReduced] = useState(() => document.documentElement.dataset.reducedMotion === 'true');
  const staticOnly = Boolean(reduceMotion || profileReduced);
  useEffect(() => {
    const update = () => setProfileReduced(document.documentElement.dataset.reducedMotion === 'true');
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] });
    update();
    return () => observer.disconnect();
  }, []);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setIsReady(false); setHasError(false); }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (staticOnly || hasError) { video.pause(); return; }
    void video.play().catch(() => {
      // Autoplay is an enhancement; the static artwork remains available.
    });
  }, [hasError, staticOnly, src]);

  useEffect(() => {
    const onAppState = (event: Event) => {
      const video = videoRef.current;
      if (!video) return;
      if (!(event as CustomEvent<{ isActive: boolean }>).detail.isActive) video.pause();
      else if (!staticOnly && !hasError) void video.play().catch(() => undefined);
    };
    window.addEventListener('lomdim:app-state', onAppState);
    const visibility = () => {
      if (document.hidden) videoRef.current?.pause();
      else if (!staticOnly && !hasError) void videoRef.current?.play().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('lomdim:app-state', onAppState);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [hasError, staticOnly]);

  return (
    <div
      className={`${className} ambient-video ${isReady ? 'ambient-video--ready' : ''}`}
      role={ariaLabel && !children ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel && !children ? undefined : children ? undefined : 'true'}
    >
      <div className="ambient-video__fallback">{fallback}</div>
      {!hasError && (
        <video
          ref={videoRef}
          className="ambient-video__media"
          style={{ objectFit: fit }}
          src={staticOnly ? undefined : src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          onPlaying={() => setIsReady(true)}
          onError={() => setHasError(true)}
          autoPlay={!staticOnly}
        />
      )}
      {children ? <div className="ambient-video__overlay">{children}</div> : null}
    </div>
  );
}
