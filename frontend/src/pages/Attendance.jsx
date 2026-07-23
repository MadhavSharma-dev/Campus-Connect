import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import {
  CalendarDaysIcon, ClockIcon, ChartBarIcon,
  CheckCircleIcon, XCircleIcon, MinusCircleIcon,
  ExclamationTriangleIcon, ArrowPathIcon,
  UserIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid, XCircleIcon as XSolid } from '@heroicons/react/24/solid';

const TABS = ['Today', 'Tracker'];

const pctColor = (pct) => {
  if (pct >= 85) return 'text-green-500';
  if (pct >= 75) return 'text-yellow-500';
  return 'text-red-500';
};
const barColor = (pct) => {
  if (pct >= 85) return 'bg-green-500';
  if (pct >= 75) return 'bg-yellow-500';
  return 'bg-red-500';
};
const badgeBg = (pct) => {
  if (pct >= 85) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  if (pct >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
  return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
};

const calcBunk = (attended, total, target = 75) => {
  if (total === 0) return null;
  const pct = (attended / total) * 100;
  if (pct >= target) {
    return { safe: true, value: Math.max(0, Math.floor((attended * 100) / target - total)) };
  }
  return { safe: false, value: Math.max(0, Math.ceil(((target / 100) * total - attended) / (1 - target / 100))) };
};

const formatTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const typeColor = (type) => {
  if (type === 'lab') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
  if (type === 'tutorial') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
  return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
};

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('Today');
  const [todayData, setTodayData] = useState(null);
  const [hasTimetable, setHasTimetable] = useState(true);
  const [stats, setStats] = useState([]);
  const [calendarSessions, setCalendarSessions] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [todayRes, ttRes, statsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/timetable/my'),
        api.get('/attendance/stats'),
      ]);
      setTodayData(todayRes.data);
      setHasTimetable(!!ttRes.data.data);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCalendar = useCallback(async (month) => {
    try {
      const { data } = await api.get(`/attendance/calendar?month=${month}`);
      setCalendarSessions(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { fetchCalendar(calendarMonth); }, [calendarMonth, fetchCalendar]);

  const handleMark = async (slot, status) => {
    const key = `${slot.slotId}-${status}`;
    setMarking((m) => ({ ...m, [key]: true }));
    try {
      await api.post('/attendance/mark', {
        date: todayData.date,
        slotId: slot.slotId,
        status,
        subject: slot.subject,
        subjectCode: slot.subjectCode,
        startTime: slot.startTime,
        endTime: slot.endTime,
        faculty: slot.faculty,
        type: slot.type,
      });
      const [todayRes, statsRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/stats'),
      ]);
      setTodayData(todayRes.data);
      setStats(statsRes.data.data);
      fetchCalendar(calendarMonth);
      toast.success(
        status === 'present' ? '✅ Marked Present' :
        status === 'absent' ? '❌ Marked Absent' : '🚫 Marked Cancelled'
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark');
    } finally {
      setMarking((m) => ({ ...m, [key]: false }));
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {todayData?.day}, {todayData?.date}
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {!hasTimetable && (
        <div className="card border-l-4 border-yellow-400 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No timetable assigned</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your admin hasn't set up a timetable for your semester/branch yet.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'Today' && (
        <TodayTab todayData={todayData} handleMark={handleMark} marking={marking} />
      )}
      {activeTab === 'Tracker' && (
        <TrackerTab
          stats={stats}
          calendarSessions={calendarSessions}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          selectedSubject={selectedSubject}
          setSelectedSubject={setSelectedSubject}
        />
      )}
    </div>
  );
}

/* ─── TODAY TAB ─────────────────────────────────────────────────────────── */
function TodayTab({ todayData, handleMark, marking }) {
  const schedule = todayData?.data || [];
  const marked = schedule.filter((s) => s.status !== null).length;
  const present = schedule.filter((s) => s.status === 'present').length;

  if (schedule.length === 0) {
    return (
      <div className="card text-center py-12">
        <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No classes today</p>
        <p className="text-sm text-gray-400 mt-1">Enjoy your free day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{schedule.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total Classes</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-green-500">{present}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Present</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-2xl font-bold text-gray-500 dark:text-gray-400">{schedule.length - marked}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pending</p>
        </div>
      </div>

      <div className="space-y-3">
        {schedule.map((slot) => (
          <SlotCard key={slot.slotId} slot={slot} handleMark={handleMark} marking={marking} />
        ))}
      </div>
    </div>
  );
}

function SlotCard({ slot, handleMark, marking }) {
  const statusConfig = {
    present: { label: 'Present', border: 'border-l-green-500' },
    absent: { label: 'Absent', border: 'border-l-red-500' },
    cancelled: { label: 'Cancelled', border: 'border-l-gray-400' },
  };
  const cfg = slot.status ? statusConfig[slot.status] : null;

  return (
    <div className={`card border-l-4 ${cfg ? cfg.border : 'border-l-indigo-400'} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white">{slot.subject}</h3>
            {slot.subjectCode && <span className="text-xs text-gray-400 font-mono">{slot.subjectCode}</span>}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(slot.type)}`}>{slot.type}</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            {slot.faculty && <span className="flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" />{slot.faculty}</span>}
            {slot.room && <span className="flex items-center gap-1"><BookOpenIcon className="w-3.5 h-3.5" />{slot.room}</span>}
          </div>
        </div>
        {cfg && (
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">{cfg.label}</span>
        )}
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <MarkBtn label="Present" active={slot.status === 'present'} onClick={() => handleMark(slot, 'present')} loading={marking[`${slot.slotId}-present`]}
          colorActive="bg-green-600 hover:bg-green-700 text-white"
          colorInactive="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400" />
        <MarkBtn label="Absent" active={slot.status === 'absent'} onClick={() => handleMark(slot, 'absent')} loading={marking[`${slot.slotId}-absent`]}
          colorActive="bg-red-600 hover:bg-red-700 text-white"
          colorInactive="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400" />
        <MarkBtn label="Cancelled" active={slot.status === 'cancelled'} onClick={() => handleMark(slot, 'cancelled')} loading={marking[`${slot.slotId}-cancelled`]}
          colorActive="bg-gray-500 hover:bg-gray-600 text-white"
          colorInactive="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400" />
      </div>
    </div>
  );
}

function MarkBtn({ label, active, onClick, loading, colorActive, colorInactive }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 ${active ? colorActive : colorInactive}`}
    >
      {loading ? '...' : label}
    </button>
  );
}

/* ─── TRACKER TAB ───────────────────────────────────────────────────────── */
function TrackerTab({ stats, calendarSessions, calendarMonth, setCalendarMonth, selectedSubject, setSelectedSubject }) {
  const overall = stats.reduce((acc, s) => {
    acc.total += s.totalClasses;
    acc.attended += s.attended;
    return acc;
  }, { total: 0, attended: 0 });
  const overallPct = overall.total === 0 ? 0 : Math.round((overall.attended / overall.total) * 100);

  const safe = stats.filter((s) => s.totalClasses > 0 && (s.attended / s.totalClasses) * 100 >= 75).length;
  const atRisk = stats.filter((s) => s.totalClasses > 0 && (s.attended / s.totalClasses) * 100 < 75).length;

  const monthDate = new Date(calendarMonth + '-01');
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const prevMonth = () => { const d = new Date(calendarMonth + '-01'); d.setMonth(d.getMonth() - 1); setCalendarMonth(d.toISOString().slice(0, 7)); };
  const nextMonth = () => { const d = new Date(calendarMonth + '-01'); d.setMonth(d.getMonth() + 1); setCalendarMonth(d.toISOString().slice(0, 7)); };

  const firstDay = new Date(calendarMonth + '-01').getDay();
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const calStart = firstDay === 0 ? 6 : firstDay - 1;

  const daySummary = {};
  calendarSessions.forEach((s) => {
    if (!daySummary[s.date]) daySummary[s.date] = { present: 0, absent: 0, cancelled: 0 };
    if (s.status === 'present') daySummary[s.date].present++;
    else if (s.status === 'absent') daySummary[s.date].absent++;
    else if (s.status === 'cancelled') daySummary[s.date].cancelled++;
  });

  const calDays = [];
  for (let i = 0; i < calStart; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calendarMonth}-${String(d).padStart(2, '0')}`;
    calDays.push({ d, dateStr, summary: daySummary[dateStr] || null });
  }

  const filteredStats = selectedSubject ? stats.filter((s) => s.subject === selectedSubject) : stats;

  return (
    <div className="space-y-5">
      {/* Overall */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Overall Attendance</p>
            <p className={`text-5xl font-bold mt-1 ${pctColor(overallPct)}`}>{overallPct}%</p>
            <p className="text-xs text-gray-400 mt-1">{overall.attended} of {overall.total} classes attended</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{safe}</p>
              <p className="text-xs text-gray-500 mt-0.5">Safe</p>
            </div>
            <div className="text-center bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{atRisk}</p>
              <p className="text-xs text-gray-500 mt-0.5">At Risk</p>
            </div>
            <div className="text-center bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-3">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Subjects</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all duration-700 ${barColor(overallPct)}`} style={{ width: `${Math.min(overallPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>0%</span><span className="text-yellow-500 font-medium">75% min</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Subject filter */}
      {stats.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedSubject(null)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${!selectedSubject ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>All Subjects</button>
          {stats.map((s) => (
            <button key={s.subject} onClick={() => setSelectedSubject(s.subject === selectedSubject ? null : s.subject)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${selectedSubject === s.subject ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'}`}>
              {s.subject}
            </button>
          ))}
        </div>
      )}

      {/* Subject stats */}
      {filteredStats.length === 0 ? (
        <div className="card text-center py-10">
          <ChartBarIcon className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No attendance data yet</p>
          <p className="text-sm text-gray-400 mt-1">Start marking classes in the Today tab</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredStats.map((s) => {
            const pct = s.totalClasses === 0 ? 0 : Math.round((s.attended / s.totalClasses) * 100);
            const bunk = calcBunk(s.attended, s.totalClasses);
            return (
              <div key={s.subject} className="card">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{s.subject}</h3>
                      {s.subjectCode && <span className="text-xs text-gray-400 font-mono">{s.subjectCode}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeBg(pct)}`}>{pct}%</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{s.attended} present · {s.totalClasses - s.attended} absent · {s.totalClasses} total</p>
                  </div>
                  <div className={`text-xs font-medium flex items-center gap-1 ${bunk?.safe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {bunk === null ? <span className="text-gray-400">No classes yet</span>
                      : bunk.safe ? <><CheckCircleIcon className="w-4 h-4" />Can miss {bunk.value} more</>
                      : <><ExclamationTriangleIcon className="w-4 h-4" />Need {bunk.value} more to reach 75%</>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all duration-500 ${barColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Monthly View</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">‹</button>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32 text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calDays.map((cell, i) => {
            if (!cell) return <div key={`e-${i}`} />;
            const { d, dateStr, summary } = cell;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const allPresent = summary && summary.absent === 0 && summary.present > 0;
            const allAbsent = summary && summary.present === 0 && summary.absent > 0;
            return (
              <div key={dateStr} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium ${isToday ? 'ring-2 ring-indigo-400' : ''} ${allPresent ? 'bg-green-100 dark:bg-green-900/30 text-green-700' : allAbsent ? 'bg-red-100 dark:bg-red-900/30 text-red-700' : summary ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700' : 'text-gray-600 dark:text-gray-400'}`}>
                {d}
                {summary && (
                  <div className="flex gap-0.5 mt-0.5">
                    {summary.present > 0 && <span className="w-1 h-1 rounded-full bg-green-500" />}
                    {summary.absent > 0 && <span className="w-1 h-1 rounded-full bg-red-500" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap justify-center text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/50" />All Present</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900/50" />Mixed</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/50" />All Absent</span>
        </div>
      </div>
    </div>
  );
}
