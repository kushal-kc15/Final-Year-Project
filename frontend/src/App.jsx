import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import OrganizationSetup from './pages/OrganizationSetup'
import AcceptInvitation from './pages/AcceptInvitation'
import TeamManagement from './pages/TeamManagement'
import ApprovalQueue from './pages/ApprovalQueue'
import BudgetManagement from './pages/BudgetManagement'
import VendorManagement from './pages/VendorManagement'
import Reports from './pages/Reports'
import ActivityCenter from './pages/ActivityCenter'
import Settings from './pages/Settings'
import authService from './services/authService'
import { AuthProvider } from './context/AuthContext'

// Protected Route Component
function ProtectedRoute({ children }) {
  return authService.isAuthenticated() ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/invite" element={<AcceptInvitation />} />
          <Route 
            path="/setup" 
            element={
              <ProtectedRoute>
                <OrganizationSetup />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/team" 
            element={
              <ProtectedRoute>
                <TeamManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/approvals" 
            element={
              <ProtectedRoute>
                <ApprovalQueue />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/budgets" 
            element={
              <ProtectedRoute>
                <BudgetManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/vendors" 
            element={
              <ProtectedRoute>
                <VendorManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activity" 
            element={
              <ProtectedRoute>
                <ActivityCenter />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
