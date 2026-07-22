import { useTranslation } from 'react-i18next';

export default function VoteControl({ score, myVote, votingOpen, onVote, size = 'md' }) {
  const { t } = useTranslation();
  const disabled = !votingOpen;
  const btnBase =
    'w-8 h-8 flex items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex flex-col items-center gap-1" aria-label="Vote on this idea">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote('UP')}
        className={`${btnBase} ${myVote === 'UP' ? 'bg-evergreen text-canvas' : 'bg-mist/60 text-ink hover:bg-mist'}`}
        aria-pressed={myVote === 'UP'}
        title={disabled ? t('idea.votingClosed') : t('idea.upvote')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 4 L20 16 L4 16 Z" fill="currentColor" />
        </svg>
      </button>

      <span className={`font-mono text-sm font-semibold ${size === 'sm' ? 'text-xs' : ''}`}>{score}</span>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote('DOWN')}
        className={`${btnBase} ${myVote === 'DOWN' ? 'bg-brick text-canvas' : 'bg-mist/60 text-ink hover:bg-mist'}`}
        aria-pressed={myVote === 'DOWN'}
        title={disabled ? t('idea.votingClosed') : t('idea.downvote')}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 20 L4 8 L20 8 Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
