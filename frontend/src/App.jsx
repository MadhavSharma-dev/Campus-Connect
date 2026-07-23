import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CGPACalculator from './pages/CGPACalculator';
import FoodOutlets from './pages/FoodOutlets';
import Resources from './pages/Resources';
import LostAndFound from './pages/LostAndFound';
import Clubs from './pages/Clubs';
import Feedback from './pages/Feedback';
import Events from './pages/Events';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import Timetable from './pages/Timetable';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" />;
};

const StudentRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user?.role === 'admin' ? <Navigate to="/dashboard" /> : children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" /> : children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="cgpa" element={<StudentRoute><CGPACalculator /></StudentRoute>} />
              <Route path="food" element={<FoodOutlets />} />
              <Route path="resources" element={<Resources />} />
              <Route path="lost-found" element={<LostAndFound />} />
              <Route path="clubs" element={<Clubs />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="events" element={<Events />} />
              <Route path="attendance" element={<StudentRoute><Attendance /></StudentRoute>} />
              <Route path="timetable" element={<StudentRoute><Timetable /></StudentRoute>} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
