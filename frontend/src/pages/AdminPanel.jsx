import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';
import Loading from '../components/Loading.jsx';

function PendingApprovals() {
  const { t } = useTranslation();
  const [users, setUsers] = useState(null);

  const load = useCallback(async () => {
    const { data } = await client.get('/admin/users', { params: { status: 'PENDING' } });
    setUsers(data.users);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id) => { await client.post(`/admin/users/${id}/approve`); load(); };
  const reject = async (id) => {
    const reason = window.prompt('Reason for rejection (optional):') || undefined;
    await client.post(`/admin/users/${id}/reject`, { reason });
    load();
  };

  if (!users) return <Loading />;
  if (users.length === 0) return <p className="text-sm text-slate-500">{t('admin.noPending')}</p>;

  return (
    <div className="space-y-2">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between bg-white border border-mist rounded-card p-4">
          <div>
            <p className="font-medium text-ink">{u.name}</p>
            <p className="text-sm text-slate-500">{u.email} · {u.departmentName || t('admin.noDept')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => approve(u.id)} className="text-sm font-medium text-evergreen hover:underline">
              {t('common.approve')}
            </button>
            <button onClick={() => reject(u.id)} className="text-sm font-medium text-brick hover:underline">
              {t('common.reject')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function AllUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const STATUS_OPTS = [
    { value: '', label: t('admin.statuses.ALL') },
    { value: 'APPROVED',  label: t('admin.statuses.APPROVED') },
    { value: 'PENDING',   label: t('admin.statuses.PENDING') },
    { value: 'REJECTED',  label: t('admin.statuses.REJECTED') },
    { value: 'SUSPENDED', label: t('admin.statuses.SUSPENDED') },
  ];

  const load = useCallback(async () => {
    const { data } = await client.get('/admin/users', {
      params: statusFilter ? { status: statusFilter } : {},
    });
    setUsers(data.users);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const suspend = async (id) => { await client.post(`/admin/users/${id}/suspend`); load(); };
  const reinstate = async (id) => { await client.post(`/admin/users/${id}/reinstate`); load(); };

  return (
    <div>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-md border border-mist px-3 py-2 text-sm bg-white mb-3">
        {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {!users ? <Loading /> : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-white border border-mist rounded-card p-4">
              <div>
                <p className="font-medium text-ink">
                  {u.name} <span className="text-xs text-slate-400 font-normal">({u.role})</span>
                </p>
                <p className="text-sm text-slate-500">
                  {u.email} · {u.departmentName || t('admin.noDept')} · {t(`admin.statuses.${u.status}`)}
                </p>
              </div>
              {u.role !== 'ADMIN' && (
                u.status === 'SUSPENDED'
                  ? <button onClick={() => reinstate(u.id)} className="text-sm font-medium text-evergreen hover:underline">{t('common.reinstate')}</button>
                  : u.status === 'APPROVED'
                  ? <button onClick={() => suspend(u.id)} className="text-sm font-medium text-brick hover:underline">{t('common.suspend')}</button>
                  : null
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaxonomyManager() {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newDept, setNewDept] = useState('');
  const [newCat, setNewCat] = useState('');

  const load = useCallback(async () => {
    const [d, c] = await Promise.all([client.get('/departments'), client.get('/categories')]);
    setDepartments(d.data.departments);
    setCategories(c.data.categories);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addDept = async (e) => { e.preventDefault(); if (!newDept.trim()) return; await client.post('/departments', { name: newDept.trim() }); setNewDept(''); load(); };
  const removeDept = async (id) => { await client.delete(`/departments/${id}`); load(); };
  const addCat = async (e) => { e.preventDefault(); if (!newCat.trim()) return; await client.post('/categories', { name: newCat.trim() }); setNewCat(''); load(); };
  const removeCat = async (id) => { await client.delete(`/categories/${id}`); load(); };

  return (
    <div className="grid grid-cols-2 gap-6">
      {[
        { label: t('admin.departments'), items: departments, newVal: newDept, setNew: setNewDept, onAdd: addDept, onRemove: removeDept, placeholder: t('admin.newDept') },
        { label: t('admin.categories'),  items: categories,  newVal: newCat,  setNew: setNewCat,  onAdd: addCat,  onRemove: removeCat,  placeholder: t('admin.newCat') },
      ].map(({ label, items, newVal, setNew, onAdd, onRemove, placeholder }) => (
        <div key={label}>
          <h3 className="font-display text-lg font-semibold mb-2">{label}</h3>
          <form onSubmit={onAdd} className="flex gap-2 mb-3">
            <input value={newVal} onChange={(e) => setNew(e.target.value)} placeholder={placeholder}
              className="flex-1 rounded-md border border-mist px-3 py-2 text-sm" />
            <button className="bg-evergreen text-canvas text-sm font-medium rounded-md px-3 hover:bg-evergreen-dark">
              {t('common.add')}
            </button>
          </form>
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between bg-white border border-mist rounded-md px-3 py-2 text-sm">
                {item.name}
                <button onClick={() => onRemove(item.id)} className="text-brick hover:underline text-xs">
                  {t('common.remove')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Analytics() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => { client.get('/admin/analytics').then(({ data }) => setData(data)); }, []);

  if (!data) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          [t('admin.totalIdeas'),    data.totalIdeas,                           '#1F4D3D'],
          [t('admin.avgDays'),       data.avgResolutionDays ?? '—',             '#2D6E8E'],
          [t('admin.topContributor'),data.topContributors[0]?.name || '—',      '#D97B29'],
        ].map(([label, val, color]) => (
          <div key={label} className="bg-white border border-mist rounded-card p-4">
            <p className="text-xs uppercase text-slate-500 font-semibold">{label}</p>
            <p className="font-display text-3xl mt-1" style={{ color }}>{val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold text-ink mb-2">{t('admin.byStatus')}</h4>
          {data.byStatus.map((s) => (
            <div key={s.status} className="flex justify-between text-sm border-b border-mist py-1.5">
              <span>{t(`status.${s.status}`, { defaultValue: s.status })}</span>
              <span className="font-mono">{s.count}</span>
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-semibold text-ink mb-2">{t('admin.byDept')}</h4>
          {data.byDepartment.map((d) => (
            <div key={d.department} className="flex justify-between text-sm border-b border-mist py-1.5">
              <span>{d.department}</span><span className="font-mono">{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-ink mb-2">{t('admin.topContributors')}</h4>
        <p className="text-xs text-slate-500 mb-2">{t('admin.anonNote')}</p>
        {data.topContributors.map((c) => (
          <div key={c.name} className="flex justify-between text-sm border-b border-mist py-1.5">
            <span>{c.name}</span><span className="font-mono">{c.ideaCount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditLog() {
  const [entries, setEntries] = useState(null);
  useEffect(() => { client.get('/admin/audit-log').then(({ data }) => setEntries(data.entries)); }, []);
  if (!entries) return <Loading />;
  return (
    <div className="space-y-1">
      {entries.map((e) => (
        <div key={e.id} className="flex justify-between text-sm bg-white border border-mist rounded-md px-3 py-2">
          <span><span className="font-medium text-ink">{e.actorName}</span> — {e.action.replace(/_/g,' ').toLowerCase()}</span>
          <span className="font-mono text-xs text-slate-500">{new Date(e.createdAt).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('pending');

  const TABS = [
    { key: 'pending',   label: t('admin.tabs.pending') },
    { key: 'users',     label: t('admin.tabs.users') },
    { key: 'taxonomy',  label: t('admin.tabs.taxonomy') },
    { key: 'analytics', label: t('admin.tabs.analytics') },
    { key: 'audit',     label: t('admin.tabs.audit') },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink mb-4">{t('admin.title')}</h1>
      <div className="flex gap-1 mb-6 border-b border-mist overflow-x-auto">
        {TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap ${
              tab === tb.key ? 'border-evergreen text-evergreen' : 'border-transparent text-slate-500 hover:text-ink'
            }`}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'pending'   && <PendingApprovals />}
      {tab === 'users'     && <AllUsers />}
      {tab === 'taxonomy'  && <TaxonomyManager />}
      {tab === 'analytics' && <Analytics />}
      {tab === 'audit'     && <AuditLog />}
    </div>
  );
}
