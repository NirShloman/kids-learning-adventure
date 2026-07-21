import { lazy, ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import type { MotionEvent, RiveSceneName } from './motion.types';

const RiveRuntimeScene = lazy(() => import('./RiveRuntimeScene'));
const localRiveAssets = import.meta.glob('../../assets/animations/*.riv', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

const stateMachines: Record<RiveSceneName, string> = {
  'mascot-guide': 'MascotGuide',
  'brand-intro': 'BrandIntro',
  'answer-feedback': 'AnswerFeedback',
  'reward-stars': 'RewardStars'
};

let activeCanvases = 0;

interface RiveSceneProps {
  scene: RiveSceneName;
  event: MotionEvent;
  stars?: number;
  fallback: ReactNode;
  className?: string;
  ariaLabel?: string;
}

function findAsset(scene: RiveSceneName) {
  const suffix = `/${scene}.riv`;
  return Object.entries(localRiveAssets).find(([path]) => path.replace(/\\/g, '/').endsWith(suffix))?.[1];
}

export function RiveScene({ scene, event, stars, fallback, className = '', ariaLabel }: RiveSceneProps) {
  const [hasSlot, setHasSlot] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const asset = useMemo(() => findAsset(scene), [scene]);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!asset || reduceMotion || activeCanvases >= 2) return;
    activeCanvases += 1;
    setHasSlot(true);
    return () => {
      activeCanvases = Math.max(0, activeCanvases - 1);
    };
  }, [asset, reduceMotion]);

  const showRuntime = Boolean(asset && hasSlot && !hasFailed && !reduceMotion);

  return (
    <div className={`rive-scene ${className}`.trim()} role={ariaLabel ? 'img' : undefined} aria-label={ariaLabel}>
      {!isReady || !showRuntime ? fallback : null}
      {showRuntime ? (
        <Suspense fallback={null}>
          <RiveRuntimeScene
            src={asset!}
            stateMachine={stateMachines[scene]}
            motion={{ event, stars }}
            onLoad={() => setIsReady(true)}
            onError={() => setHasFailed(true)}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
