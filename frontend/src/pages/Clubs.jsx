import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  MegaphoneIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  PencilSquareIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'General'];

const CATEGORY_COLORS = {
  Technical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Cultural: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Sports: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Social: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Academic: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  General: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const CATEGORY_ICONS = {
  Technical: '💻', Cultural: '🎭', Sports: '⚽',
  Social: '🤝', Academic: '📚', General: '🏫',
};

const EMPTY_FORM = {
  name: '', description: '', tagline: '', category: 'General',
  email: '', instagram: '', website: '', coordinator: '', isActive: true,
};

export default function Clubs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('about');
  const [showCreate, setShowCreate] = useState(false);
  const [editingClub, setEditingClub] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [annText, setAnnText] = useState('');
  const [postingAnn, setPostingAnn] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchClubs = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (catFilter) params.set('category', catFilter);
    api
      .get(`/clubs?${params}`)
      .then(({ data }) => setClubs(data.data))
      .catch(() => toast.error('Failed to load clubs'))
      .finally(() => setLoading(false));
  }, [search, catFilter]);

  useEffect(() => {
    setLoading(true);
    fetchClubs();
  }, [fetchClubs]);

  // Refresh selected club detail after any action
  const refreshSelected = async (id) => {
    try {
      const { data } = await api.get(`/clubs/${id}`);
      setSelected(data.data);
    } catch {}
  };

  const handleJoin = async (id) => {
    try {
      await api.post(`/clubs/${id}/join`);
      toast.success('Join request sent!');
      fetchClubs();
      if (selected?._id === id) refreshSelected(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleLeave = async (id) => {
    try {
      await api.post(`/clubs/${id}/leave`);
      toast.success('Left the club');
      fetchClubs();
      if (selected?._id === id) refreshSelected(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave');
    }
  };

  const handleApprove = async (clubId, userId) => {
    try {
      await api.post(`/clubs/${clubId}/approve/${userId}`);
      toast.success('Member approved');
      fetchClubs();
      refreshSelected(clubId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReject = async (clubId, userId) => {
    try {
      await api.post(`/clubs/${clubId}/reject/${userId}`);
      toast.success('Request rejected');
      fetchClubs();
      refreshSelected(clubId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/clubs', form);
      toast.success('Club created!');
      setShowCreate(false);
      setForm(EMPTY_FORM);
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/clubs/${editingClub._id}`, form);
      toast.success('Club updated!');
      setEditingClub(null);
      setForm(EMPTY_FORM);
      fetchClubs();
      if (selected?._id === editingClub._id) refreshSelected(editingClub._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/clubs/${id}`);
      toast.success('Club deleted');
      setDeleteConfirm(null);
      setSelected(null);
      fetchClubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handlePostAnnouncement = async (clubId) => {
    if (!annText.trim()) return;
    setPostingAnn(true);
    try {
      await api.post(`/clubs/${clubId}/announcements`, { text: annText });
      toast.success('Announcement posted');
      setAnnText('');
      refreshSelected(clubId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setPostingAnn(false);
    }
  };

  const handleDeleteAnn = async (clubId, annId) => {
    try {
      await api.delete(`/clubs/${clubId}/announcements/${annId}`);
      toast.success('Announcement deleted');
      refreshSelected(clubId);
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  const openEdit = (club) => {
    setForm({
      name: club.name,
      description: club.description,
      tagline: club.tagline || '',
      category: club.category,
      email: club.email || '',
      instagram: club.instagram || '',
      website: club.website || '',
      coordinator: club.coordinator || '',
      isActive: club.isActive !== false,
    });
    setEditingClub(club);
  };

  const openDetail = async (club) => {
    setDetailTab('about');
    setSelected(club);
    // fetch full detail with populated join requests
    try {
      const { data } = await api.get(`/clubs/${club._id}`);
      setSelected(data.data);
    } catch {}
  };

  const setF = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const isMember = (club) =>
    club.members?.some((m) => (m._id || m)?.toString() === user?._id);
  const hasRequested = (club) =>
    club.joinRequests?.some((r) => (r._id || r)?.toString() === user?._id);

  const pendingTotal = clubs.reduce((sum, c) => sum + (c.joinRequests?.length || 0), 0);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bennett Clubs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {clubs.length} club{clubs.length !== 1 ? 's' : ''} · Find your community
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            {pendingTotal > 0 && (
              <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-semibold px-2.5 py-1 rounded-full">
                {pendingTotal} pending request{pendingTotal !== 1 ? 's' : ''}
              </span>
            )}
            <button
              onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" /> New Club
            </button>
          </div>
        )}
      </div>

      {/* Search + Category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search clubs by name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-full sm:w-44"
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_ICONS[c]} {c}
            </option>
          ))}
        </select>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCatFilter('')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            catFilter === ''
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((c) => {
          const count = clubs.filter((cl) => cl.category === c).length;
          if (!catFilter && count === 0) return null;
          return (
            <button
              key={c}
              onClick={() => setCatFilter(catFilter === c ? '' : c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                catFilter === c
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {CATEGORY_ICONS[c]} {c}
              {count > 0 && (
                <span className="ml-1 opacity-60">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Club grid */}
      {clubs.length === 0 ? (
        <div className="text-center py-16">
          <UserGroupIcon className="w-14 h-14 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No clubs found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {clubs.map((club) => {
            const member = isMember(club);
            const requested = hasRequested(club);
            const pendingCount = club.joinRequests?.length || 0;

            return (
              <div
                key={club._id}
                className="card hover:shadow-lg transition-all duration-200 flex flex-col cursor-pointer group"
                onClick={() => openDetail(club)}
              >
                {/* Card top accent */}
                <div
                  className={`-mx-6 -mt-6 mb-4 h-2 rounded-t-lg ${
                    club.isActive === false ? 'bg-gray-300' : 'bg-gradient-to-r from-blue-500 to-purple-600'
                  }`}
                />

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                    {CATEGORY_ICONS[club.category]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{club.name}</h3>
                      {club.isActive === false && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">Inactive</span>
                      )}
                    </div>
                    <span className={`badge text-xs mt-0.5 ${CATEGORY_COLORS[club.category]}`}>
                      {club.category}
                    </span>
                  </div>
                </div>

                {club.tagline && (
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 italic">"{club.tagline}"</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 flex-1 mb-4">
                  {club.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <UserGroupIcon className="w-3.5 h-3.5" />
                      {club.members?.length || 0} members
                    </span>
                    {isAdmin && pendingCount > 0 && (
                      <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 font-semibold">
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {member ? (
                      <span className="text-xs text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                        <CheckIcon className="w-3.5 h-3.5" /> Member
                      </span>
                    ) : requested ? (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pending...</span>
                    ) : club.isActive !== false ? (
                      <button
                        onClick={() => handleJoin(club._id)}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition-colors"
                      >
                        Join
                      </button>
                    ) : null}
                    <button
                      onClick={() => openDetail(club)}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-0.5 transition-colors"
                    >
                      Details <ChevronRightIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Club Detail Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name} size="lg">
        {selected && (
          <div className="space-y-4">
            {/* Category + Status */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`badge ${CATEGORY_COLORS[selected.category]}`}>
                {CATEGORY_ICONS[selected.category]} {selected.category}
              </span>
              {selected.isActive === false && (
                <span className="badge bg-gray-200 dark:bg-gray-600 text-gray-500">Inactive</span>
              )}
              {isAdmin && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => openEdit(selected)}
                    className="text-xs btn-secondary flex items-center gap-1 py-1"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(selected._id)}
                    className="text-xs btn-danger flex items-center gap-1 py-1"
                  >
                    <TrashIcon className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
              {['about', 'members', 'announcements', ...(isAdmin ? ['requests'] : [])].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    detailTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {tab}
                  {tab === 'requests' && selected.joinRequests?.length > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                      {selected.joinRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* About Tab */}
            {detailTab === 'about' && (
              <div className="space-y-4">
                {selected.tagline && (
                  <p className="text-blue-600 dark:text-blue-400 italic text-sm">"{selected.tagline}"</p>
                )}
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selected.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.coordinator && (
                    <InfoRow label="Coordinator" value={selected.coordinator} />
                  )}
                  {selected.email && (
                    <InfoRow
                      label="Email"
                      value={
                        <a href={`mailto:${selected.email}`} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <EnvelopeIcon className="w-3.5 h-3.5" /> {selected.email}
                        </a>
                      }
                    />
                  )}
                  {selected.instagram && (
                    <InfoRow label="Instagram" value={`@${selected.instagram}`} />
                  )}
                  {selected.website && (
                    <InfoRow
                      label="Website"
                      value={
                        <a href={selected.website} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                          <GlobeAltIcon className="w-3.5 h-3.5" /> Visit
                        </a>
                      }
                    />
                  )}
                </div>
                {/* Action buttons */}
                <div className="pt-2">
                  {isMember(selected) ? (
                    <button
                      onClick={() => handleLeave(selected._id)}
                      className="btn-danger flex items-center gap-2 text-sm"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" /> Leave Club
                    </button>
                  ) : hasRequested(selected) ? (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Your join request is pending review.</p>
                  ) : selected.isActive !== false ? (
                    <button
                      onClick={() => handleJoin(selected._id)}
                      className="btn-primary flex items-center gap-2 text-sm"
                    >
                      <PlusIcon className="w-4 h-4" /> Request to Join
                    </button>
                  ) : (
                    <p className="text-sm text-gray-400">This club is not currently accepting members.</p>
                  )}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {detailTab === 'members' && (
              <div>
                {selected.members?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No members yet.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selected.members.map((m) => (
                      <li key={m._id || m} className="py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(m.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name || 'Unknown'}</p>
                          {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Announcements Tab */}
            {detailTab === 'announcements' && (
              <div className="space-y-3">
                {isAdmin && (
                  <div className="flex gap-2">
                    <input
                      className="input-field flex-1 text-sm"
                      placeholder="Post an announcement..."
                      value={annText}
                      onChange={(e) => setAnnText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handlePostAnnouncement(selected._id); }}
                    />
                    <button
                      onClick={() => handlePostAnnouncement(selected._id)}
                      disabled={postingAnn || !annText.trim()}
                      className="btn-primary text-sm px-4"
                    >
                      {postingAnn ? '...' : 'Post'}
                    </button>
                  </div>
                )}
                {(!selected.announcements || selected.announcements.length === 0) ? (
                  <div className="text-center py-8">
                    <MegaphoneIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm text-gray-400">No announcements yet.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {selected.announcements.map((ann) => (
                      <li key={ann._id} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-800 dark:text-gray-200 flex-1">{ann.text}</p>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteAnn(selected._id, ann._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {ann.postedBy?.name || 'Admin'} · {new Date(ann.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Requests Tab (admin only) */}
            {detailTab === 'requests' && isAdmin && (
              <div>
                {(!selected.joinRequests || selected.joinRequests.length === 0) ? (
                  <p className="text-sm text-gray-400 text-center py-6">No pending requests.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {selected.joinRequests.map((r) => (
                      <li key={r._id || r} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {(r.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{r.name || r._id}</p>
                            {r.email && <p className="text-xs text-gray-400">{r.email}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(selected._id, r._id || r)}
                            className="flex items-center gap-1 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded font-medium"
                          >
                            <CheckIcon className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(selected._id, r._id || r)}
                            className="flex items-center gap-1 text-xs bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-1.5 rounded font-medium"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Create / Edit Club Modal ── */}
      <Modal
        open={showCreate || !!editingClub}
        onClose={() => { setShowCreate(false); setEditingClub(null); setForm(EMPTY_FORM); }}
        title={editingClub ? `Edit: ${editingClub.name}` : 'Create New Club'}
        size="md"
      >
        <form onSubmit={editingClub ? handleUpdate : handleCreate} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Club Name *</label>
              <input className="input-field" placeholder="e.g. Robotics Club" value={form.name} onChange={setF('name')} required />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Tagline</label>
              <input className="input-field" placeholder="A short catchy line..." value={form.tagline} onChange={setF('tagline')} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Description *</label>
              <textarea className="input-field" placeholder="What does this club do?" rows={3} value={form.description} onChange={setF('description')} required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Category</label>
              <select className="input-field" value={form.category} onChange={setF('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Coordinator</label>
              <input className="input-field" placeholder="Coordinator name" value={form.coordinator} onChange={setF('coordinator')} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Email</label>
              <input type="email" className="input-field" placeholder="club@bennett.edu.in" value={form.email} onChange={setF('email')} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Instagram</label>
              <input className="input-field" placeholder="handle (without @)" value={form.instagram} onChange={setF('instagram')} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Website</label>
              <input type="url" className="input-field" placeholder="https://..." value={form.website} onChange={setF('website')} />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={setF('isActive')} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                Active (accepting new members)
              </label>
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full mt-2">
            {saving ? (editingClub ? 'Saving...' : 'Creating...') : (editingClub ? 'Save Changes' : 'Create Club')}
          </button>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Club" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this club? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => handleDelete(deleteConfirm)} className="btn-danger flex-1">Delete</button>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Small helper component
function InfoRow({ label, value }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
