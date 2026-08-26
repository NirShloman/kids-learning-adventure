import { ReactNode, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface AmbientVideoProps {
  src: string;
  poster: string;
  className: string;
  fallback: ReactNode;
  ariaLabel?: string;
}

export function AmbientVideo({ src, poster, className, fallback, ariaLabel }: AmbientVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion || hasError) return;
    void video.play().catch(() => {
      // Autoplay is an enhancement; the static artwork remains available.
    });
  }, [hasError, reduceMotion]);

  useEffect(() => {
    const onAppState = (event: Event) => {
      const video = videoRef.current;
      if (!video) return;
      if (!(event as CustomEvent<{ isActive: boolean }>).detail.isActive) video.pause();
      else if (!reduceMotion && !hasError) void video.play().catch(() => undefined);
    };
    window.addEventListener('lomdim:app-state', onAppState);
    return () => window.removeEventListener('lomdim:app-state', onAppState);
  }, [hasError, reduceMotion]);

  return (
    <div
      className={`${className} ambient-video ${isReady ? 'ambient-video--ready' : ''}`}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : 'true'}
    >
      <div className="ambient-video__fallback">{fallback}</div>
      {!hasError && (
        <video
          ref={videoRef}
          className="ambient-video__media"
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          tabIndex={-1}
          onCanPlay={() => setIsReady(true)}
          onError={() => setHasError(true)}
          autoPlay={!reduceMotion}
        />
      )}
    </div>
  );
}
