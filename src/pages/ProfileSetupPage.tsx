import { FormEvent, useState } from 'react';
import type { LearnerGender, LocalLearnerState } from '../types';
import { isValidHebrewName, normalizeHebrewName } from '../utils/hebrew';
import { BrandLogo } from '../components/common/BrandLogo';

interface ProfileSetupPageProps {
  learner: LocalLearnerState;
  onSave: (name: string, gender: LearnerGender) => void;
}

export function ProfileSetupPage({ learner, onSave }: ProfileSetupPageProps) {
  const [name, setName] = useState(learner.name);
  const [gender, setGender] = useState<LearnerGender | null>(learner.gender);
  const [showErrors, setShowErrors] = useState(false);
  const normalizedName = normalizeHebrewName(name);
  const nameIsValid = isValidHebrewName(normalizedName);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nameIsValid || !gender) {
      setShowErrors(true);
      return;
    }
    onSave(normalizedName, gender);
  }

  return (
    <main className="profile-setup" dir="rtl">
      <form className="profile-setup__card" onSubmit={handleSubmit} noValidate>
        <BrandLogo variant="mark" className="profile-setup__logo" decorative />
        <span className="profile-setup__eyebrow">נעים להכיר</span>
        <h1>מי מצטרף אלינו להרפתקה?</h1>
        <p>הפרטים נשמרים רק במכשיר הזה.</p>

        <label className="profile-setup__field" htmlFor="learner-name">
          <span>איך קוראים לך?</span>
          <input
            id="learner-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            inputMode="text"
            maxLength={30}
            placeholder="השם שלי"
            aria-invalid={showErrors && !nameIsValid}
            autoFocus
          />
        </label>
        {showErrors && !nameIsValid ? <p className="profile-setup__error" role="alert">נא לכתוב שם בעברית.</p> : null}

        <fieldset className="profile-setup__gender">
          <legend>איך לפנות אליך?</legend>
          <button type="button" className={gender === 'boy' ? 'is-selected' : ''} aria-pressed={gender === 'boy'} onClick={() => setGender('boy')}>
            <span aria-hidden="true">👦</span>
            אני בן
          </button>
          <button type="button" className={gender === 'girl' ? 'is-selected' : ''} aria-pressed={gender === 'girl'} onClick={() => setGender('girl')}>
            <span aria-hidden="true">👧</span>
            אני בת
          </button>
        </fieldset>
        {showErrors && !gender ? <p className="profile-setup__error" role="alert">נא לבחור איך לפנות אליך.</p> : null}

        <button className="profile-setup__submit" type="submit">יאללה, מתחילים!</button>
      </form>
    </main>
  );
}
