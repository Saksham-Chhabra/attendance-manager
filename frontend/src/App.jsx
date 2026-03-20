import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="student/dashboard" element={<StudentDashboard />} />
          <Route path="teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
