import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';
import FileUpload from '../components/FileUpload.jsx';

export default function SubmitIdea() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', rootCause: '', proposedSolution: '',
    expectedBenefit: '', departmentId: '', categoryId: '', isAnonymous: false,
  });
  const [files, setFiles] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedToken, setSavedToken] = useState(null);
  const [createdIdeaId, setCreatedIdeaId] = useState(null);

  useEffect(() => {
    client.get('/departments').then(({ data }) => setDepartments(data.departments)).catch(() => {});
    client.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('files', f));
      const { data } = await client.post('/ideas', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.anonymousEditToken) {
        setSavedToken(data.anonymousEditToken);
        setCreatedIdeaId(data.idea.id);
      } else {
        navigate(`/ideas/${data.idea.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (savedToken) {
    return (
      <div className="max-w-lg">
        <div className="bg-spark/10 border border-spark/40 rounded-card p-5">
          <h2 className="font-display text-lg font-semibold text-ink mb-2">{t('idea.saveTokenTitle')}</h2>
          <p className="text-sm text-slate-500 mb-3">{t('idea.saveTokenBody')}</p>
          <code className="block bg-white border border-mist rounded-md px-3 py-2 font-mono text-sm break-all mb-4">
            {savedToken}
          </code>
          <button onClick={() => navigate(`/ideas/${createdIdeaId}`)}
            className="bg-evergreen text-canvas font-medium rounded-md px-4 py-2 text-sm hover:bg-evergreen-dark">
            {t('idea.savedContinue')}
          </button>
        </div>
      </div>
    );
  }

  const labelOpt = <span className="text-slate-400 font-normal">({t('common.optional')})</span>;

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-ink mb-1">{t('idea.submitTitle')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('idea.submitSubtitle')}</p>

      <form onSubmit={submit} className="space-y-4 bg-white border border-mist rounded-card p-6">
        {error && (
          <p className="text-sm text-brick bg-brick/10 border border-brick/30 rounded-md px-3 py-2">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('idea.titleLabel')}</label>
          <input required value={form.title} onChange={update('title')}
            placeholder={t('idea.titlePlaceholder')}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('idea.descLabel')}</label>
          <textarea required rows={3} value={form.description} onChange={update('description')}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('idea.rootCause')} {labelOpt}</label>
          <textarea rows={2} value={form.rootCause} onChange={update('rootCause')}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('idea.solution')} {labelOpt}</label>
          <textarea rows={2} value={form.proposedSolution} onChange={update('proposedSolution')}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('idea.benefit')} {labelOpt}</label>
          <textarea rows={2} value={form.expectedBenefit} onChange={update('expectedBenefit')}
            placeholder={t('idea.benefitPlaceholder')}
            className="w-full rounded-md border border-mist px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-evergreen/30" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('idea.dept')}</label>
            <select value={form.departmentId} onChange={update('departmentId')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm bg-white">
              <option value="">{t('common.none')}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('idea.cat')}</label>
            <select value={form.categoryId} onChange={update('categoryId')}
              className="w-full rounded-md border border-mist px-3 py-2 text-sm bg-white">
              <option value="">{t('common.none')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink bg-canvas border border-mist rounded-md px-3 py-2">
          <input type="checkbox" checked={form.isAnonymous} onChange={update('isAnonymous')} />
          {t('idea.anonLabel')}
        </label>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">
            {t('idea.attachments')} {labelOpt}
          </label>
          <FileUpload files={files} onChange={setFiles} />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-evergreen text-canvas font-medium rounded-md py-2.5 hover:bg-evergreen-dark disabled:opacity-50">
          {submitting ? t('idea.submitting') : t('idea.submit')}
        </button>
      </form>
    </div>
  );
}
