import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import { UsersIcon, CalendarIcon, UserGroupIcon, ChatBubbleLeftIcon, BookOpenIcon, MagnifyingGlassIcon, ShoppingBagIcon, PlusIcon, TrashIcon, PencilSquareIcon, TableCellsIcon } from '@heroicons/react/24/outline';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [pwModal, setPwModal] = useState(null); // userId
  const [newPw, setNewPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/feedback'),
      api.get('/orders'),
    ]).then(([s, u, f, o]) => {
      setStats(s.data.data);
      setUsers(u.data.data);
      setFeedbacks(f.data.data);
      setOrders(o.data.data);
    }).catch(() => toast.error('Failed to load admin data')).finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted');
    } catch { toast.error('Failed'); }
  };

  const handleResetPassword = async () => {
    if (!newPw || newPw.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.put(`/admin/users/${pwModal}/password`, { newPassword: newPw });
      toast.success('Password updated');
      setPwModal(null);
      setNewPw('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSavingPw(false); }
  };

  const handleFeedbackResponse = async (id, status, adminResponse) => {
    try {
      const { data } = await api.put(`/feedback/${id}`, { status, adminResponse });
      setFeedbacks(feedbacks.map(f => f._id === id ? data.data : f));
      toast.success('Response saved');
    } catch { toast.error('Failed'); }
  };

  const handleOrderStatus = async (id, status) => {
    try {
      const { data } = await api.put(`/orders/${id}/status`, { status });
      setOrders(orders.map(o => o._id === id ? data.data : o));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  const statCards = [
    { label: 'Total Users', value: stats?.users, icon: UsersIcon, color: 'bg-blue-500' },
    { label: 'Events', value: stats?.events, icon: CalendarIcon, color: 'bg-indigo-500' },
    { label: 'Clubs', value: stats?.clubs, icon: UserGroupIcon, color: 'bg-purple-500' },
    { label: 'Feedbacks', value: stats?.feedbacks, icon: ChatBubbleLeftIcon, color: 'bg-pink-500' },
    { label: 'Resources', value: stats?.resources, icon: BookOpenIcon, color: 'bg-green-500' },
    { label: 'Lost & Found', value: stats?.lostFound, icon: MagnifyingGlassIcon, color: 'bg-yellow-500' },
  ];

  const statusColor = {
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
    delivered: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <div className={`w-10 h-10 ${color} rounded flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {['overview', 'users', 'orders', 'feedback', 'timetable'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === 'users' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 pr-4">Name</th>
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Branch / Sem</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map(u => (
                <tr key={u._id}>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{u.branch || '—'} / Sem {u.semester}</td>
                  <td className="py-3 pr-4">
                    <span className={`badge ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span>
                  </td>
                  <td className="py-3 flex gap-2">
                    <button onClick={() => { setPwModal(u._id); setNewPw(''); }} className="text-blue-500 hover:text-blue-700 text-xs">Change Password</button>
                    <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orders tab */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-center py-8">No orders yet.</p>}
          {orders.map(order => (
            <div key={order._id} className="card text-sm">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{order.outlet?.name}</span>
                  <span className="text-gray-400 ml-2">by {order.user?.name} ({order.user?.email})</span>
                </div>
                <span className={`badge ${statusColor[order.status]}`}>{order.status}</span>
              </div>
              <div className="text-gray-500 dark:text-gray-400 mb-2">
                {order.items.map((item, i) => <span key={i} className="mr-3">{item.name} x{item.quantity}</span>)}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">₹{order.total}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                  <select
                    value={order.status}
                    onChange={e => handleOrderStatus(order._id, e.target.value)}
                    className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {['pending','confirmed','ready','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback tab */}
      {tab === 'feedback' && (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <FeedbackCard key={fb._id} fb={fb} onRespond={handleFeedbackResponse} />
          ))}
          {!feedbacks.length && <p className="text-gray-500 dark:text-gray-400 text-center py-8">No feedback yet.</p>}
        </div>
      )}

      {tab === 'overview' && (
        <div className="card">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Use the tabs above to manage users, orders, feedback and timetables.</p>
        </div>
      )}

      {tab === 'timetable' && <TimetableManager />}

      {/* Change password modal */}
      <Modal open={!!pwModal} onClose={() => setPwModal(null)} title="Change User Password">
        <div className="space-y-3">
          <input
            type="password"
            className="input-field"
            placeholder="New password (min 6 characters)"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
          />
          <button onClick={handleResetPassword} disabled={savingPw} className="btn-primary w-full">
            {savingPw ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function FeedbackCard({ fb, onRespond }) {
  const [response, setResponse] = useState(fb.adminResponse || '');
  const [status, setStatus] = useState(fb.status);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-medium text-gray-900 dark:text-white">{fb.subject}</span>
          <span className="ml-2 badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">{fb.category}</span>
        </div>
        <span className="text-xs text-gray-400">{new Date(fb.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{fb.message}</p>
      <p className="text-xs text-gray-400 mb-3">By: {fb.isAnonymous ? 'Anonymous' : fb.submittedBy?.name || 'Unknown'}</p>
      <div className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Admin response..."
          value={response}
          onChange={e => setResponse(e.target.value)}
        />
        <select className="input-field w-32 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
        <button onClick={() => onRespond(fb._id, status, response)} className="btn-primary text-sm">Save</button>
      </div>
    </div>
  );
}

/* ─── TIMETABLE MANAGER ─────────────────────────────────────────────────── */
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BRANCHES = ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AIDS', 'AIML'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const SLOT_TYPES = ['lecture', 'lab', 'tutorial'];

const emptySlot = () => ({
  day: 'Monday', startTime: '09:00', endTime: '10:00',
  subject: '', subjectCode: '', faculty: '', room: '', type: 'lecture',
});

function TimetableManager() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTT, setEditTT] = useState(null); // timetable being edited (slot management)
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editSlot, setEditSlot] = useState(null); // { slot, slotId } or null for new
  const [slotForm, setSlotForm] = useState(emptySlot());
  const [saving, setSaving] = useState(false);
  const [ttForm, setTtForm] = useState({ semester: 1, branch: 'CSE', academicYear: '' });

  const fetchTimetables = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timetable');
      setTimetables(data.data);
    } catch { toast.error('Failed to load timetables'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTimetables(); }, [fetchTimetables]);

  const handleCreateTT = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post('/timetable', ttForm);
      setTimetables([data.data, ...timetables]);
      setShowCreate(false);
      setTtForm({ semester: 1, branch: 'CSE', academicYear: '' });
      toast.success('Timetable created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteTT = async (id) => {
    if (!window.confirm('Delete this timetable?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      setTimetables(timetables.filter(t => t._id !== id));
      if (editTT?._id === id) setEditTT(null);
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const handleToggleActive = async (tt) => {
    try {
      const { data } = await api.put(`/timetable/${tt._id}`, { isActive: !tt.isActive });
      setTimetables(timetables.map(t => t._id === tt._id ? data.data : t));
    } catch { toast.error('Failed'); }
  };

  const openSlotModal = (slot = null) => {
    setEditSlot(slot);
    setSlotForm(slot ? { ...slot } : emptySlot());
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!editTT) return;
    setSaving(true);
    try {
      let data;
      if (editSlot) {
        const res = await api.put(`/timetable/${editTT._id}/slots/${editSlot._id}`, slotForm);
        data = res.data;
      } else {
        const res = await api.post(`/timetable/${editTT._id}/slots`, slotForm);
        data = res.data;
      }
      setEditTT(data.data);
      setTimetables(timetables.map(t => t._id === data.data._id ? data.data : t));
      setShowSlotModal(false);
      toast.success(editSlot ? 'Slot updated' : 'Slot added');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!editTT) return;
    try {
      const { data } = await api.delete(`/timetable/${editTT._id}/slots/${slotId}`);
      setEditTT(data.data);
      setTimetables(timetables.map(t => t._id === data.data._id ? data.data : t));
      toast.success('Slot removed');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  // Show slot editor if a timetable is selected
  if (editTT) {
    const slotsByDay = DAYS.reduce((acc, d) => {
      acc[d] = editTT.slots.filter(s => s.day === d).sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <button onClick={() => setEditTT(null)} className="text-sm text-blue-500 hover:text-blue-700 mb-1">← Back to timetables</button>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sem {editTT.semester} · {editTT.branch}
              {editTT.academicYear && ` · ${editTT.academicYear}`}
            </h2>
            <p className="text-xs text-gray-400">{editTT.slots.length} slots total · You can add multiple classes per day</p>
          </div>
          <button onClick={() => openSlotModal()} className="btn-primary flex items-center gap-2 text-sm">
            <PlusIcon className="w-4 h-4" /> Add Slot
          </button>
        </div>

        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{day}</p>
                <span className="text-xs text-gray-400">{slotsByDay[day].length} class{slotsByDay[day].length !== 1 ? 'es' : ''}</span>
              </div>
              {slotsByDay[day].length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 italic">No classes — <button onClick={() => { setSlotForm({ ...emptySlot(), day }); setEditSlot(null); setShowSlotModal(true); }} className="text-blue-500 hover:underline">Add one</button></div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {slotsByDay[day].map(slot => (
                    <div key={slot._id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-20 text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
                        {slot.startTime}<br />{slot.endTime}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900 dark:text-white">{slot.subject}</span>
                          {slot.subjectCode && <span className="text-xs text-gray-400 font-mono">{slot.subjectCode}</span>}
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{slot.type}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 flex gap-3 flex-wrap">
                          {slot.faculty && <span>{slot.faculty}</span>}
                          {slot.room && <span>Room {slot.room}</span>}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => openSlotModal(slot)} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors rounded">
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteSlot(slot._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Slot form modal */}
        <Modal open={showSlotModal} onClose={() => setShowSlotModal(false)} title={editSlot ? 'Edit Slot' : 'Add Slot'}>
          <form onSubmit={handleSaveSlot} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Day</label>
                <select className="input-field" value={slotForm.day} onChange={e => setSlotForm({ ...slotForm, day: e.target.value })}>
                  {DAYS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input-field" value={slotForm.type} onChange={e => setSlotForm({ ...slotForm, type: e.target.value })}>
                  {SLOT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input-field" value={slotForm.startTime} onChange={e => setSlotForm({ ...slotForm, startTime: e.target.value })} required />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input-field" value={slotForm.endTime} onChange={e => setSlotForm({ ...slotForm, endTime: e.target.value })} required />
              </div>
            </div>
            <div>
              <label className="label">Subject Name *</label>
              <input className="input-field" placeholder="e.g. Data Structures" value={slotForm.subject} onChange={e => setSlotForm({ ...slotForm, subject: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Subject Code</label>
                <input className="input-field" placeholder="e.g. CS301" value={slotForm.subjectCode} onChange={e => setSlotForm({ ...slotForm, subjectCode: e.target.value })} />
              </div>
              <div>
                <label className="label">Room</label>
                <input className="input-field" placeholder="e.g. LH-5" value={slotForm.room} onChange={e => setSlotForm({ ...slotForm, room: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Faculty</label>
              <input className="input-field" placeholder="e.g. Dr. Smith" value={slotForm.faculty} onChange={e => setSlotForm({ ...slotForm, faculty: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full">
              {saving ? 'Saving...' : editSlot ? 'Update Slot' : 'Add Slot'}
            </button>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{timetables.length} timetable{timetables.length !== 1 ? 's' : ''} configured</p>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <PlusIcon className="w-4 h-4" /> New Timetable
        </button>
      </div>

      {timetables.length === 0 ? (
        <div className="card text-center py-12">
          <TableCellsIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No timetables yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a timetable and add class slots for each semester/branch</p>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map(tt => (
            <div key={tt._id} className="card">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Semester {tt.semester} · {tt.branch}
                    </h3>
                    {tt.academicYear && <span className="text-xs text-gray-400">{tt.academicYear}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tt.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                      {tt.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{tt.slots.length} slots · Created {new Date(tt.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleToggleActive(tt)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                    {tt.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setEditTT(tt)} className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-1">
                    <PencilSquareIcon className="w-3.5 h-3.5" /> Manage Slots
                  </button>
                  <button onClick={() => handleDeleteTT(tt._id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create timetable modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Timetable" size="sm">
        <form onSubmit={handleCreateTT} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Semester *</label>
              <select className="input-field" value={ttForm.semester} onChange={e => setTtForm({ ...ttForm, semester: +e.target.value })}>
                {SEMESTERS.map(s => <option key={s} value={s}>Sem {s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Branch *</label>
              <select className="input-field" value={ttForm.branch} onChange={e => setTtForm({ ...ttForm, branch: e.target.value })}>
                {BRANCHES.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Academic Year</label>
            <input className="input-field" placeholder="2024-25" value={ttForm.academicYear} onChange={e => setTtForm({ ...ttForm, academicYear: e.target.value })} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Creating...' : 'Create Timetable'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
