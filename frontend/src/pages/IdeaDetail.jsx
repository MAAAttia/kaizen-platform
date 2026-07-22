import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import VoteControl from '../components/VoteControl.jsx';
import CommentThread from '../components/CommentThread.jsx';
import Attachments from '../components/Attachments.jsx';
import FileUpload from '../components/FileUpload.jsx';
import Loading from '../components/Loading.jsx';

const ALL_STATUSES = ['SUBMITTED','UNDER_REVIEW','IN_PROGRESS','IMPLEMENTED','REJECTED','CLOSED'];

export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editFiles, setEditFiles] = useState([]);
  const [anonToken, setAnonToken] = useState('');
  const [anonCommentTokens, setAnonCommentTokens] = useState({});
  const [statusForm, setStatusForm] = useState({ status: '', adminResponse: '' });

  const isAdmin = user?.role === 'ADMIN';
  const isNamedOwner = Boolean(user && idea && !idea.isAnonymous && idea.authorId === user.id);

  const loadIdea = useCallback(async () => {
    const { data } = await client.get(`/ideas/${id}`);
    setIdea(data.idea);
    setStatusForm({ status: data.idea.status, adminResponse: data.idea.adminResponse || '' });
  }, [id]);

  const loadComments = useCallback(async () => {
    const { data } = await client.get(`/ideas/${id}/comments`);
    setComments(data.comments);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadIdea(), loadComments()])
      .catch(() => setError('Could not load this idea.'))
      .finally(() => setLoading(false));
  }, [loadIdea, loadComments]);

  const handleVote = async (value) => {
    const { data } = await client.post(`/ideas/${id}/vote`, { value });
    setIdea((i) => ({ ...i, score: data.score, myVote: data.myVote }));
  };

  const startEdit = () => {
    setEditForm({
      title: idea.title,
      description: idea.description,
      rootCause: idea.rootCause || '',
      proposedSolution: idea.proposedSolution || '',
      expectedBenefit: idea.expectedBenefit || '',
    });
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(editForm).forEach(([k, v]) => fd.append(k, v));
    editFiles.forEach((f) => fd.append('files', f));
    if (idea.isAnonymous && !isAdmin) fd.append('anonymousEditToken', anonToken);
    try {
      const { data } = await client.put(`/ideas/${id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIdea(data.idea);
      setEditing(false);
      setEditFiles([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not save changes.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Remove this idea? This cannot be undone.')) return;
    const payload = {};
    if (idea.isAnonymous && !isAdmin) payload.anonymousEditToken = anonToken;
    try {
      await client.delete(`/ideas/${id}`, { data: payload });
      navigate('/');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not remove this idea.');
    }
  };

  const saveStatus = async (e) => {
    e.preventDefault();
    const { data } = await client.post(`/ideas/${id}/status`, statusForm);
    setIdea(data.idea);
  };

  const deleteAttachment = async (attId) => {
    if (!window.confirm(t('idea.removeAttachment'))) return;
    await client.delete(`/ideas/${id}/attachments/${attId}`);
    setIdea((prev) => ({ ...prev, attachments: prev.attachments.filter((a) => a.id !== attId) }));
  };

  const postComment = async (parentId, body, isAnonymous, files = []) => {
    const fd = new FormData();
    fd.append('body', body);
    fd.append('isAnonymous', isAnonymous);
    if (parentId) fd.append('parentId', parentId);
    files.forEach((f) => fd.append('files', f));
    const { data } = await client.post(`/ideas/${id}/comments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (data.anonymousDeleteToken) {
      setAnonCommentTokens((m) => ({ ...m, [data.comment.id]: data.anonymousDeleteToken }));
    }
    await loadComments();
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    const token = anonCommentTokens[commentId];
    await client.delete(`/comments/${commentId}`, { data: token ? { anonymousDeleteToken: token } : {} });
    await loadComments();
  };

  const hideComment = async (commentId, hidden) => {
    await client.post(`/comments/${commentId}/hide`, { hidden });
    await loadComments();
  };

  if (loading) return <Loading label={t('common.loading')} />;
  if (error || !idea) return <p className="text-brick">{error || 'Idea not found.'}</p>;

  const canManage = isAdmin || (idea.status === 'SUBMITTED' && (isNamedOwner || idea.isAnonymous));
  const FIELD_LABELS = {
    rootCause: t('idea.rootCause'),
    proposedSolution: t('idea.solution'),
    expectedBenefit: t('idea.benefit'),
  };

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-sm text-slate-500 hover:text-ink mb-4">
        {t('common.back')}
      </button>

      <div className="bg-white border border-mist rounded-card p-6">
        <div className="flex gap-4">
          <VoteControl score={idea.score} myVote={idea.myVote} votingOpen={idea.votingOpen} onVote={handleVote} />

          <div className="flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="font-display text-2xl font-semibold text-ink">{idea.title}</h1>
              <StatusBadge status={idea.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-4">
              <span className="font-medium text-ink">
                {idea.isAnonymous ? t('common.anonymous') : idea.authorName}
              </span>
              {idea.departmentName && (
                <span className="px-2 py-0.5 bg-canvas border border-mist rounded-full">{idea.departmentName}</span>
              )}
              {idea.categoryName && (
                <span className="px-2 py-0.5 bg-canvas border border-mist rounded-full">{idea.categoryName}</span>
              )}
              <span className="font-mono">{new Date(idea.createdAt).toLocaleString()}</span>
            </div>

            {!editing ? (
              <>
                <p className="text-ink/90 whitespace-pre-wrap mb-4">{idea.description}</p>
                {['rootCause','proposedSolution','expectedBenefit'].map((key) =>
                  idea[key] ? (
                    <div key={key} className="mb-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                        {FIELD_LABELS[key]}
                      </h4>
                      <p className="text-sm text-ink/90 whitespace-pre-wrap">{idea[key]}</p>
                    </div>
                  ) : null
                )}
                {idea.adminResponse && (
                  <div className="mt-4 bg-canvas border border-mist rounded-md p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                      {t('idea.adminResponse')}
                    </h4>
                    <p className="text-sm text-ink/90 whitespace-pre-wrap">{idea.adminResponse}</p>
                  </div>
                )}
                <Attachments
                  attachments={idea.attachments}
                  onDelete={isAdmin || isNamedOwner ? deleteAttachment : null}
                />
              </>
            ) : (
              <form onSubmit={saveEdit} className="space-y-3 mb-4">
                {[
                  ['title', t('idea.titleLabel')],
                  ['description', t('idea.descLabel')],
                  ['rootCause', t('idea.rootCause')],
                  ['proposedSolution', t('idea.solution')],
                  ['expectedBenefit', t('idea.benefit')],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
                    <textarea rows={field === 'title' ? 1 : 2} value={editForm[field]}
                      onChange={(e) => setEditForm((f) => ({ ...f, [field]: e.target.value }))}
                      className="w-full rounded-md border border-mist px-3 py-2 text-sm" />
                  </div>
                ))}
                <div>
                  <p className="text-xs font-medium text-ink mb-1">{t('idea.addMoreFiles')}</p>
                  <FileUpload files={editFiles} onChange={setEditFiles} />
                </div>
                <div className="flex gap-2">
                  <button type="submit"
                    className="bg-evergreen text-canvas text-sm font-medium rounded-md px-4 py-2 hover:bg-evergreen-dark">
                    {t('common.save')}
                  </button>
                  <button type="button" onClick={() => setEditing(false)}
                    className="text-sm px-4 py-2 text-slate-500 hover:text-ink">
                    {t('common.cancel')}
                  </button>
                </div>
              </form>
            )}

            {canManage && !editing && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {idea.isAnonymous && !isAdmin && (
                  <input value={anonToken} onChange={(e) => setAnonToken(e.target.value)}
                    placeholder={t('idea.anonTokenPlaceholder')}
                    className="rounded-md border border-mist px-3 py-1.5 text-xs font-mono w-56" />
                )}
                <button onClick={startEdit} className="text-sm font-medium text-evergreen hover:underline">
                  {t('common.edit')}
                </button>
                <button onClick={handleDelete} className="text-sm font-medium text-brick hover:underline">
                  {t('common.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <form onSubmit={saveStatus} className="bg-white border border-mist rounded-card p-5 mt-4 space-y-3">
          <h3 className="font-display text-lg font-semibold text-ink">{t('idea.adminControls')}</h3>
          <select value={statusForm.status}
            onChange={(e) => setStatusForm((f) => ({ ...f, status: e.target.value }))}
            className="rounded-md border border-mist px-3 py-2 text-sm bg-white">
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{t(`status.${s}`)}</option>
            ))}
          </select>
          <textarea rows={2} placeholder={t('idea.officialResponse')} value={statusForm.adminResponse}
            onChange={(e) => setStatusForm((f) => ({ ...f, adminResponse: e.target.value }))}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm" />
          <button type="submit"
            className="bg-evergreen text-canvas text-sm font-medium rounded-md px-4 py-2 hover:bg-evergreen-dark">
            {t('idea.updateStatus')}
          </button>
        </form>
      )}

      <div className="bg-white border border-mist rounded-card p-5 mt-4">
        <CommentThread
          comments={comments}
          isAdmin={isAdmin}
          currentUserId={user?.id}
          deletableIds={new Set(Object.keys(anonCommentTokens))}
          onReply={postComment}
          onDelete={deleteComment}
          onHide={hideComment}
          onNewTopLevel={(body, anon, files) => postComment(null, body, anon, files)}
        />
      </div>
    </div>
  );
}
