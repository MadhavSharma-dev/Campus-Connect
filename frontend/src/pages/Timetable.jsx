import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Spinner from '../components/Spinner';
import {
  AcademicCapIcon, ExclamationTriangleIcon, ArrowPathIcon,
  ClockIcon, UserIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

export default function Timetable() {
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/timetable/my');
      setTimetable(data.data);
    } catch {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTimetable(); }, [fetchTimetable]);

  if (loading) return <Spinner />;

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

  const slotsByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable
      ? timetable.slots.filter((s) => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime))
      : [];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Timetable</h1>
          {timetable && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Semester {timetable.semester} · {timetable.branch}
              {timetable.academicYear ? ` · ${timetable.academicYear}` : ''}
            </p>
          )}
        </div>
        <button
          onClick={fetchTimetable}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {!timetable ? (
        <div className="card border-l-4 border-yellow-400 flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">No timetable assigned</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Your admin hasn't set up a timetable for your semester/branch yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => {
            const slots = slotsByDay[day];
            const isToday = day === today;
            return (
              <div
                key={day}
                className={`card overflow-hidden ${isToday ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}`}
              >
                <div className={`px-4 py-2.5 flex items-center justify-between ${
                  isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
                }`}>
                  <p className={`text-sm font-semibold ${isToday ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day} {isToday && <span className="text-xs font-normal opacity-70 ml-1">Today</span>}
                  </p>
                  <span className="text-xs text-gray-400">{slots.length} class{slots.length !== 1 ? 'es' : ''}</span>
                </div>

                {slots.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400 italic">No classes</div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {slots.map((slot) => (
                      <div key={slot._id} className="px-4 py-3 flex items-center gap-4">
                        <div className="w-24 flex-shrink-0 text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {formatTime(slot.startTime)}<br />{formatTime(slot.endTime)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">{slot.subject}</span>
                            {slot.subjectCode && <span className="text-xs text-gray-400 font-mono">{slot.subjectCode}</span>}
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${typeColor(slot.type)}`}>{slot.type}</span>
                          </div>
                          <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                            {slot.faculty && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{slot.faculty}</span>}
                            {slot.room && <span className="flex items-center gap-1"><BookOpenIcon className="w-3 h-3" />Room {slot.room}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
