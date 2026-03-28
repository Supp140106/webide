import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Ide from './Ide';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster theme="dark" position="top-center" richColors />
        <ProjectProvider>
          <div className="w-screen h-screen">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/ide" element={<Ide />} />
                <Route path="/project/:id" element={<Ide />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </ProjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;