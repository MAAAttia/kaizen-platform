import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';
import IdeaCard from '../components/IdeaCard.jsx';
import Loading from '../components/Loading.jsx';

export default function Dashboard({ mineOnly = false }) {
  const { t } = useTranslation();
  const [ideas, setIdeas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', departmentId: '', categoryId: '', search: '', sort: 'new' });

  const STATUS_OPTIONS = [
    { value: '', label: t('status.ALL') },
    { value: 'SUBMITTED',    label: t('status.SUBMITTED') },
    { value: 'UNDER_REVIEW', label: t('status.UNDER_REVIEW') },
    { value: 'IN_PROGRESS',  label: t('status.IN_PROGRESS') },
    { value: 'IMPLEMENTED',  label: t('status.IMPLEMENTED') },
    { value: 'REJECTED',     label: t('status.REJECTED') },
    { value: 'CLOSED',       label: t('status.CLOSED') },
  ];

  useEffect(() => {
    client.get('/departments').then(({ data }) => setDepartments(data.departments)).catch(() => {});
    client.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      if (mineOnly) params.mine = 'true';
      const { data } = await client.get('/ideas', { params });
      setIdeas(data.items);
    } finally {
      setLoading(false);
    }
  }, [filters, mineOnly]);

  useEffect(() => { load(); }, [load]);

  const handleVote = async (id, value) => {
    const { data } = await client.post(`/ideas/${id}/vote`, { value });
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, score: data.score, myVote: data.myVote } : i)));
  };

  const update = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {mineOnly ? t('feed.myTitle') : t('feed.title')}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {mineOnly ? t('feed.mySubtitle') : t('feed.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <input
          placeholder={t('common.search')}
          value={filters.search}
          onChange={update('search')}
          className="flex-1 min-w-[180px] rounded-md border border-mist px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-evergreen/30"
        />
        <select value={filters.status} onChange={update('status')} className="rounded-md border border-mist px-3 py-2 text-sm bg-white">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filters.departmentId} onChange={update('departmentId')} className="rounded-md border border-mist px-3 py-2 text-sm bg-white">
          <option value="">{t('feed.allDepts')}</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select value={filters.categoryId} onChange={update('categoryId')} className="rounded-md border border-mist px-3 py-2 text-sm bg-white">
          <option value="">{t('feed.allCats')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filters.sort} onChange={update('sort')} className="rounded-md border border-mist px-3 py-2 text-sm bg-white">
          <option value="new">{t('feed.newest')}</option>
          <option value="top">{t('feed.topVoted')}</option>
        </select>
      </div>

      {loading ? (
        <Loading label={t('common.loading')} />
      ) : ideas.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="font-medium text-ink mb-1">{t('feed.noMatch')}</p>
          <p className="text-sm">{t('feed.noMatchSub')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} onVote={handleVote} />)}
        </div>
      )}
    </div>
  );
}
