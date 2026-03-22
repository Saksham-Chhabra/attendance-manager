import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClassDetail from './pages/teacher/ClassDetail';
import TakeAttendance from './pages/teacher/TakeAttendance';
import AdminDashboard from './pages/admin/Dashboard';
import FaceDemo from './pages/ml/FaceDemo';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="faculty/classes" element={<TeacherDashboard />} />
          <Route path="faculty/class/:id" element={<TeacherClassDetail />} />
          <Route path="faculty/class/:id/attendance" element={<TakeAttendance />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="ml/demo" element={<FaceDemo />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
