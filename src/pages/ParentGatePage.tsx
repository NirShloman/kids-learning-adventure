import { FormEvent, useMemo, useState } from 'react';
import { Button } from '../components/common/Button';
import { hasParentCode, isValidParentCode, normalizeParentCode, resetParentCode, setParentCode, verifyParentCode } from '../services/parentAccessService';

interface ParentGatePageProps {
  onBack: () => void;
  onUnlocked: () => void;
}

export function ParentGatePage({ onBack, onUnlocked }: ParentGatePageProps) {
  const [isSetupMode, setIsSetupMode] = useState(() => !hasParentCode());
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [message, setMessage] = useState('');
  const title = isSetupMode ? 'הגדרת קוד הורה' : 'כניסה לאזור ההורים';
  const isSubmitDisabled = useMemo(() => {
    if (!isValidParentCode(code)) return true;
    return isSetupMode && code !== confirmCode;
  }, [code, confirmCode, isSetupMode]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSetupMode) {
      if (!isValidParentCode(code)) {
        setMessage('בחרו קוד בן 4 ספרות.');
        return;
      }

      if (code !== confirmCode) {
        setMessage('שני הקודים לא תואמים. נסו שוב.');
        return;
      }

      setParentCode(code);
      onUnlocked();
      return;
    }

    if (verifyParentCode(code)) {
      onUnlocked();
      return;
    }

    setMessage('הקוד לא תואם. נסו שוב.');
  }

  function handleResetCode() {
    resetParentCode();
    setCode('');
    setConfirmCode('');
    setMessage('הקוד אופס. הגדירו קוד חדש כדי להיכנס לאזור ההורים.');
    setIsSetupMode(true);
  }

  return (
    <section className="parent-gate" dir="rtl">
      <form className="parent-gate__card" onSubmit={handleSubmit}>
        <span className="question-card__tag">אזור מוגן להורים</span>
        <h2>{title}</h2>
        <p>הקוד מונע שינוי בטעות של נתוני התקדמות. הוא נשמר רק במכשיר הזה.</p>

        <label>
          קוד בן 4 ספרות
          <input
            autoComplete="off"
            inputMode="numeric"
            maxLength={4}
            pattern="\d{4}"
            value={code}
            onChange={(event) => setCode(normalizeParentCode(event.target.value))}
            placeholder="0000"
          />
        </label>

        {isSetupMode ? (
          <label>
            אימות קוד
            <input
              autoComplete="off"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              value={confirmCode}
              onChange={(event) => setConfirmCode(normalizeParentCode(event.target.value))}
              placeholder="0000"
            />
          </label>
        ) : null}

        {message ? <p className="parent-gate__message">{message}</p> : null}

        <div className="parent-gate__actions">
          <Button type="submit" disabled={isSubmitDisabled}>{isSetupMode ? 'שמירת קוד וכניסה' : 'כניסה'}</Button>
          <Button type="button" variant="ghost" onClick={onBack}>חזרה</Button>
        </div>

        {!isSetupMode ? (
          <button className="parent-gate__reset" type="button" onClick={handleResetCode}>
            איפוס קוד במכשיר הזה
          </button>
        ) : null}
      </form>
    </section>
  );
}
