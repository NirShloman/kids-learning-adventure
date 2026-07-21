import { useEffect } from 'react';
import { useRive } from '@rive-app/react-webgl2';
import { getMotionInputName, type MotionPayload } from './motion.types';

interface RiveRuntimeSceneProps {
  src: string;
  stateMachine: string;
  motion: MotionPayload;
  onLoad: () => void;
  onError: () => void;
}

export default function RiveRuntimeScene({ src, stateMachine, motion, onLoad, onError }: RiveRuntimeSceneProps) {
  const { rive, RiveComponent } = useRive({
    src,
    stateMachines: stateMachine,
    autoplay: true,
    onLoad,
    onLoadError: onError
  }, {
    useOffscreenRenderer: true,
    shouldResizeCanvasToContainer: true,
    shouldUseIntersectionObserver: true
  });

  useEffect(() => {
    if (!rive) return;

    const inputs = rive.stateMachineInputs(stateMachine);
    const eventName = getMotionInputName(motion.event);
    const eventInput = inputs.find((input) => input.name === eventName);
    const starsInput = inputs.find((input) => input.name === 'stars');

    if (starsInput && typeof motion.stars === 'number') starsInput.value = motion.stars;
    if (eventInput?.fire) eventInput.fire();
    else if (eventInput) eventInput.value = true;
  }, [motion, rive, stateMachine]);

  useEffect(() => {
    if (!rive) return;
    const handleVisibility = () => document.hidden ? rive.pause() : rive.play(stateMachine);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [rive, stateMachine]);

  return <RiveComponent className="rive-scene__canvas" aria-hidden="true" />;
}
