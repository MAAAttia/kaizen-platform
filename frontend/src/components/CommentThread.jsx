import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload.jsx';
import Attachments from './Attachments.jsx';

function CommentForm({ onSubmit, onCancel, isReply = false, autoFocus = false }) {
  const { t } = useTranslation();
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    await onSubmit(body.trim(), isAnonymous, files);
    setSubmitting(false);
    setBody('');
    setIsAnonymous(false);
    setFiles([]);
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        autoFocus={autoFocus}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isReply ? t('comment.replyPlaceholder') : t('comment.placeholder')}
        rows={3}
        className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30"
      />
      <FileUpload files={files} onChange={setFiles} />
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-500">
          <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
          {t('comment.postAnon')}
        </label>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" onClick={onCancel} className="text-sm px-3 py-1.5 text-slate-500 hover:text-ink">
              {t('common.cancel')}
            </button>
          )}
          <button type="submit" disabled={submitting || !body.trim()}
            className="text-sm px-3 py-1.5 rounded-md bg-evergreen text-canvas font-medium hover:bg-evergreen-dark disabled:opacity-50">
            {submitting ? t('comment.posting') : t('comment.post')}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentNode({ comment, isAdmin, currentUserId, deletableIds, onReply, onDelete, onHide, depth }) {
  const { t } = useTranslation();
  const [replying, setReplying] = useState(false);
  const canSelfDelete = deletableIds.has(comment.id) || (currentUserId && comment.authorId === currentUserId);

  return (
    <div className={depth > 0 ? 'ps-5 border-s border-mist mt-3' : 'mt-4'}>
      <div className="flex items-baseline gap-2 text-sm">
        <span className="font-semibold text-ink">{comment.authorName}</span>
        <span className="text-xs text-slate-500 font-mono">{new Date(comment.createdAt).toLocaleString()}</span>
        {comment.isHidden && <span className="text-xs text-brick">{t('comment.hiddenLabel')}</span>}
      </div>

      <p className="text-sm text-ink/90 mt-0.5 whitespace-pre-wrap">{comment.body}</p>
      <Attachments attachments={comment.attachments} onDelete={null} />

      <div className="flex gap-3 mt-1.5 text-xs text-slate-500">
        <button onClick={() => setReplying((r) => !r)} className="hover:text-evergreen font-medium">
          {t('comment.reply')}
        </button>
        {(isAdmin || canSelfDelete) && (
          <button onClick={() => onDelete(comment.id)} className="hover:text-brick font-medium">
            {t('comment.delete')}
          </button>
        )}
        {isAdmin && (
          <button onClick={() => onHide(comment.id, !comment.isHidden)} className="hover:text-spark font-medium">
            {comment.isHidden ? t('comment.unhide') : t('comment.hide')}
          </button>
        )}
      </div>

      {replying && (
        <div className="mt-2 max-w-md">
          <CommentForm
            autoFocus
            isReply
            onCancel={() => setReplying(false)}
            onSubmit={async (body, anon, files) => {
              await onReply(comment.id, body, anon, files);
              setReplying(false);
            }}
          />
        </div>
      )}

      {comment.replies?.map((child) => (
        <CommentNode key={child.id} comment={child} isAdmin={isAdmin} currentUserId={currentUserId}
          deletableIds={deletableIds} onReply={onReply} onDelete={onDelete} onHide={onHide} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function CommentThread({
  comments, isAdmin, currentUserId, deletableIds,
  onReply, onDelete, onHide, onNewTopLevel,
}) {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="font-display text-lg font-semibold mb-2">{t('comment.title')}</h3>
      <div className="max-w-lg mb-4">
        <CommentForm onSubmit={(body, anon, files) => onNewTopLevel(body, anon, files)} />
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500 mt-4">{t('comment.noComments')}</p>
      ) : (
        comments.map((c) => (
          <CommentNode key={c.id} comment={c} isAdmin={isAdmin} currentUserId={currentUserId}
            deletableIds={deletableIds} onReply={onReply} onDelete={onDelete} onHide={onHide} depth={0} />
        ))
      )}
    </div>
  );
}
