import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import useAuthStore from './store/useAuthStore';

// Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
import StudentDashboard from './pages/student/Dashboard';
import StudentClassDetail from './pages/student/ClassDetail';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClassDetail from './pages/teacher/ClassDetail';
import TakeAttendance from './pages/teacher/TakeAttendance';
import AdminDashboard from './pages/admin/Dashboard';
import FaceDemo from './pages/ml/FaceDemo';
import Settings from './pages/Settings';
import RoleProtectedRoute from './components/RoleProtectedRoute';

// Smart Index Redirector
const IndexRedirect = () => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'teacher') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* PROTECTED ROUTES */}
        <Route path="/" element={<RootLayout />}>
          <Route index element={<IndexRedirect />} />
          
          <Route element={<RoleProtectedRoute allowedRoles={['student']} />}>
            <Route path="student/dashboard" element={<StudentDashboard />} />
            <Route path="student/class/:id" element={<StudentClassDetail />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="faculty/dashboard" element={<TeacherDashboard />} />
            <Route path="faculty/class/:id" element={<TeacherClassDetail />} />
            <Route path="faculty/class/:id/attendance" element={<TakeAttendance />} />
          </Route>

          <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
          </Route>
          
          {/* Developer Tools / ML Overrides */}
          <Route element={<RoleProtectedRoute allowedRoles={['admin', 'teacher']} />}>
             <Route path="ml/demo" element={<FaceDemo />} />
          </Route>

          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
