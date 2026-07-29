import { BrandLogo } from '../components/common/BrandLogo';
import { AmbientVideo } from '../components/common/AmbientVideo';
import { GameImage } from '../components/common/GameImage';
import { useSpeech } from '../hooks/useSpeech';

interface LandingPageProps {
  voiceEnabled: boolean;
  onStart: () => void;
}

export function LandingPage({ voiceEnabled, onStart }: LandingPageProps) {
  const { speak, getSpeakProps } = useSpeech(voiceEnabled);

  function handleStart() {
    speak('מתחילים לשחק וללמוד בכיף.');
    onStart();
  }

  const fallback = (
    <div className="welcome-motion__fallback" aria-hidden="true">
      <GameImage assetId="guideHappy" alt="" className="welcome-motion__guide" decorative />
      <span className="welcome-motion__letter">א</span>
      <span className="welcome-motion__numbers">1 2 3</span>
    </div>
  );

  return (
    <main className="welcome" dir="rtl">
      <div className="welcome__shade" aria-hidden="true" />
      <section className="welcome__content" aria-labelledby="welcome-title">
        <BrandLogo className="welcome__logo" variant="mark" decorative />
        <div className="welcome__copy">
          <h1 id="welcome-title">לומדים בכיף</h1>
          <p>משחקי למידה בעברית</p>
          <span>לילדים בגילאי 3–6</span>
        </div>
        <button
          type="button"
          className="welcome__start"
          onClick={handleStart}
          {...getSpeakProps<HTMLButtonElement>('מתחילים לשחק')}
        >
          <span aria-hidden="true">▶</span>
          מתחילים לשחק
        </button>
      </section>

      <AmbientVideo
        src="/assets/video/learning-garden-welcome.mp4"
        className="welcome-motion"
        fallback={fallback}
        ariaLabel="שיר וניר מזמינים את הילדים להרפתקת למידה"
      />
    </main>
  );
}
