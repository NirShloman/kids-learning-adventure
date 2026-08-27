import { BrandLogo } from '../components/common/BrandLogo';
import { AmbientVideo } from '../components/common/AmbientVideo';
import { GameImage } from '../components/common/GameImage';
import { useSpeech } from '../hooks/useSpeech';
import { brand } from '../config/brand';

interface LandingPageProps {
  voiceEnabled: boolean;
  onStart: () => void;
}

export function LandingPage({ voiceEnabled, onStart }: LandingPageProps) {
  const { speak, getSpeakProps } = useSpeech(voiceEnabled);

  function handleStart() {
    speak('מתחילים לשחק ולגלות עם ידע׳לה.');
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
        <BrandLogo className="welcome__logo" variant="full" tagline="" decorative />
        <div className="welcome__copy">
          <h1 id="welcome-title" className="visually-hidden">{brand.hebrewName}</h1>
          <p>{brand.tagline}</p>
          <span>{brand.descriptor} {brand.ageDescriptor}</span>
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
        poster="/assets/video/learning-garden-welcome.poster.webp"
        className="welcome-motion"
        fallback={fallback}
        ariaLabel="שיר וניר מזמינים את הילדים להרפתקת למידה"
      />
    </main>
  );
}
