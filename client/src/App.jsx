import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import RecruiterJobs from './pages/RecruiterJobs';
import CandidateJobs from './pages/CandidateJobs';
import JobDetail from './pages/JobDetail';
import CandidateApplications from './pages/CandidateApplications';
import JobApplicants from './pages/JobApplicants';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';

function AuthenticatedPage({ role, children }) {
  return (
    <ProtectedRoute role={role}>
      <AppShell>{children}</AppShell>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <AuthenticatedPage>
              <Dashboard />
            </AuthenticatedPage>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <AuthenticatedPage role="recruiter">
              <RecruiterJobs />
            </AuthenticatedPage>
          }
        />
        <Route
          path="/candidate/jobs"
          element={
            <AuthenticatedPage role="candidate">
              <CandidateJobs />
            </AuthenticatedPage>
          }
        />
        <Route
          path="/candidate/jobs/:id"
          element={
            <AuthenticatedPage role="candidate">
              <JobDetail />
            </AuthenticatedPage>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <AuthenticatedPage role="candidate">
              <CandidateApplications />
            </AuthenticatedPage>
          }
        />
        <Route
          path="/recruiter/jobs/:id"
          element={
            <AuthenticatedPage role="recruiter">
              <JobApplicants />
            </AuthenticatedPage>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
