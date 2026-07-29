import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { MatchingGame } from './components/games/matching/MatchingGame';
import { MemoryGame } from './components/games/memory/MemoryGame';
import { PatternGame } from './components/games/patterns/PatternGame';
import { SortingGame } from './components/games/sorting/SortingGame';
import { QuizGame } from './components/games/quiz/QuizGame';
import { ExperienceGame } from './components/games/experience/ExperienceGame';
import { GameModeSelector } from './components/games/experience/GameModeSelector';
import { GameWorld, GameWorldMessage } from './components/games/GameWorld';
import { GameEntryTransition } from './components/games/GameEntryTransition';
import { Button } from './components/common/Button';
import { gameDefinitions } from './data/games';
import { getQuizQuestions } from './services/questionService';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { ExperienceGameId, GameId, GameMode, GameResult, LearnerGender, LearnerSettings, LocalLearnerState, QuizQuestion } from './types';
import { useSpeech } from './hooks/useSpeech';
import { getLocalLearnerState, saveGameSession, saveLearnerSettings } from './services/learnerProgressService';
import { preloadCriticalAssets, preloadImageAssets, preloadImageUrls } from './services/assetPreloadService';
import {
  getCharacterAtlas,
  resolveCharacterSkin
} from './components/games/experience/experienceAssetManifest';
import type { ImageAssetId } from './assets/assetManifest';
import {
  configureAudio,
  playAudioCue,
  playMusic,
  playSfx,
  preloadAudio,
  preloadCriticalAudio,
  stopMusic
} from './services/audioService';
import { musicTracks } from './assets/audioManifest';

const quizGameIds: GameId[] = ['letters', 'numbers', 'shapes', 'colors'];

function App() {
  const [learner, setLearner] = useState<LocalLearnerState>(() => getLocalLearnerState());
  const settings: LearnerSettings = {
    age: learner.age,
    difficulty: learner.difficulty,
    voiceEnabled: learner.narrationEnabled,
    narrationEnabled: learner.narrationEnabled,
    soundEffectsEnabled: learner.soundEffectsEnabled,
    musicEnabled: learner.musicEnabled
  };
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isEnteringGame, setIsEnteringGame] = useState(false);
  const recordedPlaySessionKeyRef = useRef<number | null>(null);
  const introMusicTimerRef = useRef<number | null>(null);
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  const selectedGame = useMemo(
    () => gameDefinitions.find((game) => game.id === selectedGameId) ?? null,
    [selectedGameId]
  );

  useEffect(() => {
    preloadCriticalAssets();
    preloadCriticalAudio();
  }, []);

  useEffect(() => {
    configureAudio({
      musicEnabled: settings.musicEnabled,
      narrationEnabled: settings.narrationEnabled,
      soundEffectsEnabled: settings.soundEffectsEnabled
    });
  }, [settings.musicEnabled, settings.narrationEnabled, settings.soundEffectsEnabled]);

  useEffect(() => {
    if (showLanding || showProfileSetup) {
      stopMusic();
      return;
    }
    if (result) {
      playMusic('summary');
      return;
    }
    if (selectedGameId && !isEnteringGame && quizGameIds.includes(selectedGameId) && !selectedGameMode) {
      playMusic('modeSelection');
      return;
    }
    if (selectedGameId && !isEnteringGame) {
      playMusic(selectedGameId);
      return;
    }
    if (!selectedGameId && introMusicTimerRef.current === null) playMusic('home');
  }, [isEnteringGame, result, selectedGameId, selectedGameMode, showLanding, showProfileSetup]);

  useEffect(() => () => {
    if (introMusicTimerRef.current !== null) window.clearTimeout(introMusicTimerRef.current);
    stopMusic(0);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadQuiz() {
      if (!selectedGameId || !quizGameIds.includes(selectedGameId) || selectedGameMode !== 'quiz') {
        setQuizQuestions([]);
        setIsQuizLoading(false);
        return;
      }

      setIsQuizLoading(true);
      const questions = await getQuizQuestions(selectedGameId, settings.age, settings.difficulty).catch(() => []);
      if (!isActive) return;
      setQuizQuestions(questions);
      setIsQuizLoading(false);
    }

    loadQuiz();
    return () => {
      isActive = false;
    };
  }, [playSessionKey, selectedGameId, selectedGameMode, settings.age, settings.difficulty]);

  function handleSettingsChange(nextSettings: LearnerSettings) {
    setLearner(saveLearnerSettings(nextSettings));
  }

  function handleProfileSave(name: string, gender: LearnerGender) {
    const next: LocalLearnerState = {
      ...learner,
      name,
      gender,
      profileCompleted: true,
      updatedAt: new Date().toISOString()
    };
    setLearner(saveLearnerSettings(next));
    setShowProfileSetup(false);
    setShowLanding(false);
  }

  function handleSelectGame(gameId: GameId) {
    if (introMusicTimerRef.current !== null) {
      window.clearTimeout(introMusicTimerRef.current);
      introMusicTimerRef.current = null;
    }
    const nextGame = gameDefinitions.find((game) => game.id === gameId);
    const assetsToPreload = [nextGame?.backgroundAssetId, nextGame?.imageAssetId]
      .filter((assetId): assetId is ImageAssetId => Boolean(assetId));
    preloadImageAssets(assetsToPreload);
    preloadAudio([musicTracks[gameId], musicTracks.modeSelection]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedGameId(gameId);
    setSelectedGameMode(null);
    setIsEnteringGame(true);
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function handleFinish(score: number, total: number, stars: number) {
    if (recordedPlaySessionKeyRef.current === playSessionKey) return;
    recordedPlaySessionKeyRef.current = playSessionKey;
    playAudioCue('levelComplete');
    if (stars > 0) window.setTimeout(() => playSfx('starReward'), 420);
    if (stars === 3) window.setTimeout(() => playSfx('confetti'), 850);
    setResult({ score, total, stars });
    if (!selectedGame || !selectedGameId) return;

    saveGameSession({
      gameId: selectedGameId,
      gameTitle: selectedGame.title,
      mode: selectedGameMode ?? undefined,
      age: settings.age,
      difficulty: settings.difficulty,
      score,
      total,
      stars
    });
  }

  function handleBackToGamesMenu() {
    setSelectedGameId(null);
    setSelectedGameMode(null);
    setIsEnteringGame(false);
    setResult(null);
    setShowLanding(false);
  }

  function handleBackToLanding() {
    setSelectedGameId(null);
    setSelectedGameMode(null);
    setResult(null);
    setShowLanding(true);
  }

  function handlePlayAgain() {
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function handleStartFromLanding() {
    if (!learner.profileCompleted) {
      setShowProfileSetup(true);
      return;
    }
    setShowLanding(false);
    playMusic('mainThemeShort', { loop: false, crossfadeMs: 120 });
    introMusicTimerRef.current = window.setTimeout(() => {
      introMusicTimerRef.current = null;
      if (!selectedGameId) playMusic('home');
    }, 15000);
  }

  function handleSelectMode(mode: GameMode) {
    if (mode === 'experience' && !learner.gender) {
      setSelectedGameMode(mode);
      setShowProfileSetup(true);
      return;
    }
    if (mode === 'experience' && learner.gender) {
      const atlas = getCharacterAtlas(resolveCharacterSkin(learner.gender));
      preloadImageUrls([atlas.webp]);
    }
    setSelectedGameMode(mode);
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function renderContent() {
    if (!selectedGame || !selectedGameId) {
      return <HomePage settings={settings} onSettingsChange={handleSettingsChange} onSelectGame={handleSelectGame} />;
    }

    if (isEnteringGame) {
      return <GameEntryTransition game={selectedGame} voiceEnabled={settings.narrationEnabled} onComplete={() => setIsEnteringGame(false)} />;
    }

    if (result) {
      return (
        <SummaryPage
          title={selectedGame.title}
          result={result}
          voiceEnabled={settings.voiceEnabled}
          onPlayAgain={handlePlayAgain}
          onBackHome={handleBackToGamesMenu}
        />
      );
    }

    if (quizGameIds.includes(selectedGameId) && !selectedGameMode) {
      return <GameModeSelector gameId={selectedGameId as ExperienceGameId} title={selectedGame.title} voiceEnabled={settings.voiceEnabled} onSelect={handleSelectMode} onBack={handleBackToGamesMenu} />;
    }

    if (quizGameIds.includes(selectedGameId) && selectedGameMode === 'experience') {
      const characterGender = learner.gender;
      if (!characterGender) return null;
      return (
        <ExperienceGame
          key={playSessionKey}
          gameId={selectedGameId as ExperienceGameId}
          title={selectedGame.title}
          age={settings.age}
          difficulty={settings.difficulty}
          gender={characterGender}
          learnerName={learner.name}
          voiceEnabled={settings.voiceEnabled}
          onBack={handleBackToGamesMenu}
          onFinish={handleFinish}
        />
      );
    }

    if (selectedGameId === 'matching') {
      return <MatchingGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'memory') {
      return <MemoryGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'patterns') {
      return <PatternGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'sorting') {
      return <SortingGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }

    if (quizGameIds.includes(selectedGameId) && isQuizLoading) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')} status="מכינים את המשחק">
          <GameWorldMessage title="טוענים שאלות..." />
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId) && !quizQuestions.length) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
          <GameWorldMessage title="התוכן לא נטען">
            <Button onClick={handleBackToGamesMenu}>חזרה לתפריט</Button>
          </GameWorldMessage>
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId)) {
      return (
        <QuizGame
          key={playSessionKey}
          title={selectedGame.title}
          gameId={selectedGameId as QuizQuestion['category']}
          questions={quizQuestions}
          voiceEnabled={settings.voiceEnabled}
          onBack={handleBackToGamesMenu}
          onFinish={handleFinish}
        />
      );
    }

    return null;
  }

  if (showProfileSetup) {
    return <ProfileSetupPage learner={learner} onSave={handleProfileSave} />;
  }

  if (showLanding) {
    return <LandingPage voiceEnabled={settings.voiceEnabled} onStart={handleStartFromLanding} />;
  }

  return (
    <AppShell
      title={selectedGame?.title ?? 'לומדים בכיף'}
      subtitle={selectedGame ? 'משחקי למידה בעברית' : 'בוחרים משחק, מתנסים ומתקדמים בקצב שלכם.'}
      compact={Boolean(selectedGame && !result)}
      rightSlot={(
        <>
          <Button variant="ghost" className="app-shell__profile-button" onClick={() => setShowProfileSetup(true)}>
            {learner.name ? `הפרופיל של ${learner.name}` : 'עריכת פרופיל'}
          </Button>
          <Button variant="ghost" className="app-shell__lobby-button" onClick={handleBackToLanding} {...getSpeakProps<HTMLButtonElement>('חזרה למסך הפתיחה')}>
            למסך הפתיחה
          </Button>
        </>
      )}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
