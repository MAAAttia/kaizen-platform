import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatusBadge from './StatusBadge.jsx';
import VoteControl from './VoteControl.jsx';

export default function IdeaCard({ idea, onVote }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-4 bg-white border border-mist rounded-card p-5 hover:border-evergreen/40 transition-colors">
      <VoteControl
        score={idea.score}
        myVote={idea.myVote}
        votingOpen={idea.votingOpen}
        onVote={(value) => onVote(idea.id, value)}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <Link
            to={`/ideas/${idea.id}`}
            className="font-display text-lg font-semibold text-ink hover:text-evergreen leading-snug"
          >
            {idea.title}
          </Link>
          <StatusBadge status={idea.status} size="sm" />
        </div>

        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{idea.description}</p>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-medium text-ink">
            {idea.isAnonymous ? t('common.anonymous') : idea.authorName}
          </span>
          {idea.departmentName && (
            <span className="px-2 py-0.5 bg-canvas border border-mist rounded-full">{idea.departmentName}</span>
          )}
          {idea.categoryName && (
            <span className="px-2 py-0.5 bg-canvas border border-mist rounded-full">{idea.categoryName}</span>
          )}
          <span className="font-mono">
            {t('feed.commentCount', { count: idea.commentCount })}
          </span>
          <span className="font-mono">{new Date(idea.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
