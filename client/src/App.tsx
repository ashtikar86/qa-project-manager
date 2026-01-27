import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import Projects from './pages/Projects';
import CreateProject from './pages/CreateProject';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';
import Inspections from './pages/Inspections';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import KnowledgeBank from './pages/KnowledgeBank';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Layout /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Protected Routes wrapped in ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/create" element={<CreateProject />} />
          <Route path="/projects/:id" element={<ProjectDetails />} />
          <Route path="/users" element={<Users />} />
          <Route path="/inspections" element={<Inspections />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/knowledge-bank" element={<KnowledgeBank />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
