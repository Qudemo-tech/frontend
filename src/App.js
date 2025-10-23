import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { getNodeApiUrl } from './config/api';
import { clearAuthTokens } from './utils/tokenRefresh';
import { checkDomainOnLoad } from './utils/domainEnforcer';
// Import components
import Header from './components/Header';
import Sidebar from './components/Sidebar';
// CUSTOMER PAGE COMPONENT - COMMENTED OUT (NOT IN USE)
// import DemoHomePage from './components/DemoHomePage';
import CreateQuDemo from './components/CreateQuDemo';
import Qudemos from './components/Qudemos';
import ViewQudemo from './components/EditQudemo';
import BuyerInteractions from './components/BuyerInteractions';
import InsightsAnalytics from './components/InsightsAnalytics';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import CompanyManagement from './components/CompanyManagement';
import CompanySetup from './components/CompanySetup';
import AuthCallback from './components/AuthCallback';
import OverviewPage from './components/OverviewPage';
import HomePage from './components/HomePage';
import TestRunner from './components/TestRunner';
import PublicQudemoShare from './components/PublicQudemoShare';
import PrivacyPolicy from './components/PrivacyPolicy';
import PricingPage from './components/PricingPage';
import CustomerInteractionsPage from './components/CustomerInteractionsPage';
import BulkUploadsPage from './components/BulkUploadsPage';
import VideoChatPage from './components/VideoChatPage';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { BackendProvider } from './context/BackendContext';
import { NotificationProvider } from './context/NotificationContext';
// Protected Route Component
//test
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      try {
        // First try a simple profile check without automatic refresh
        const response = await fetch(getNodeApiUrl('/api/auth/profile'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setIsAuthenticated(true);
        } else if (response.status === 401 || response.status === 403) {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshResponse = await fetch(getNodeApiUrl('/api/auth/refresh'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
              });
              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success && refreshData.data.accessToken) {
                  localStorage.setItem('accessToken', refreshData.data.accessToken);
                  setIsAuthenticated(true);
                  return;
                }
              }
            } catch (refreshError) {
            }
          }
          clearAuthTokens();
          setIsAuthenticated(false);
        } else {
          clearAuthTokens();
          setIsAuthenticated(false);
        }
      } catch (error) {
        clearAuthTokens();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
// Company Check Component
const CompanyCheck = ({ children }) => {
  const { company, isLoading } = useCompany();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  // If no company exists, show company setup
  if (!company) {
    return <CompanySetup />;
  }
  // If company exists, show the dashboard
  return children;
};
// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWelcomePreview, setShowWelcomePreview] = useState(false);
  const [demoQudemo, setDemoQudemo] = useState(null);

  // Import dynamically to avoid circular dependencies
  const QudemoPreview = React.lazy(() => import('./components/QudemoPreview'));

  // Check for welcome preview flag and show after 5 seconds
  useEffect(() => {
    const shouldShowWelcome = localStorage.getItem('show_welcome_preview');
    
    if (shouldShowWelcome === 'true') {
      // Show welcome preview after 5 seconds
      const timer = setTimeout(async () => {
        const WELCOME_SHARE_TOKEN = 'ca6b5a1b-0764-4e1c-bf6c-3e3c5bc93d1d';
        
        try {
          const welcomeResponse = await fetch(getNodeApiUrl(`/api/qudemos/share/${WELCOME_SHARE_TOKEN}`));
          
          if (welcomeResponse.ok) {
            const welcomeData = await welcomeResponse.json();
            
            if (welcomeData.success && welcomeData.data) {
              setDemoQudemo(welcomeData.data);
              setShowWelcomePreview(true);
              
              // Clear the flag AFTER successfully showing the preview
              localStorage.removeItem('show_welcome_preview');
            }
          }
        } catch (error) {
          // Silently fail - user can still access demo from Qudemos page
        }
      }, 5000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, []);

  const handleCloseWelcomePreview = () => {
    setShowWelcomePreview(false);
    setDemoQudemo(null);
  };

  return (
    <>
      {/* Welcome Preview Modal */}
      {showWelcomePreview && demoQudemo && (
        <React.Suspense fallback={<div>Loading...</div>}>
          <QudemoPreview 
            qudemo={demoQudemo} 
            onClose={handleCloseWelcomePreview}
          />
        </React.Suspense>
      )}
      
      <div className="flex h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 mt-16">
            <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
function App() {
  // Removed aggressive refresh prevention to fix UI refresh issues
  // Check domain on app load to prevent Vercel redirects
  useEffect(() => {
    const wasRedirected = checkDomainOnLoad();
    if (wasRedirected) {
      return;
    }
  }, []);
  // Clean up hash from URL if present
  useEffect(() => {
    if (window.location.hash === '#') {
      window.history.replaceState(null, null, window.location.pathname + window.location.search);
    }
  }, []);
  // Debug: Monitor token changes globally
  useEffect(() => {
    const checkGlobalTokens = () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const user = localStorage.getItem('user');
    };
    // Check tokens on app load
    checkGlobalTokens();
    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'accessToken' || e.key === 'refreshToken' || e.key === 'user') {
        checkGlobalTokens();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  return (
    <Router>
      <BackendProvider>
        <NotificationProvider>
          <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/privacypolicy" element={<PrivacyPolicy />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/share/:shareToken" element={<PublicQudemoShare />} />
              {/* Protected Routes - Wrapped with CompanyProvider */}
              <Route 
                path="/overview" 
                element={
                  <CompanyProvider>
                    <ProtectedRoute>
                      <CompanyCheck>
                        <DashboardLayout>
                          <OverviewPage />
                        </DashboardLayout>
                      </CompanyCheck>
                    </ProtectedRoute>
                  </CompanyProvider>
                } 
              />
            {/* CUSTOMER PAGE ROUTE - COMMENTED OUT (NOT IN USE)
            <Route 
              path="/customers" 
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DemoHomePage />
                  </DashboardLayout>
                </ProtectedRoute>
              } 
            />
            */}
            <Route 
              path="/create" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <CreateQuDemo />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/qudemos" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <Qudemos />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/view-qudemo/:id" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <ViewQudemo />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/interactions" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <BuyerInteractions />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/customer-interactions" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <CustomerInteractionsPage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/bulk-uploads" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <BulkUploadsPage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <ProfilePage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <SettingsPage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/pricing" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <PricingPage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/companies" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <CompanyManagement />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            <Route 
              path="/test-runner" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <TestRunner />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            {/* BETA VERSION ROUTE - COMMENTED OUT */}
            {/*
            <Route 
              path="/beta-version" 
              element={
                <CompanyProvider>
                  <ProtectedRoute>
                    <CompanyCheck>
                      <DashboardLayout>
                        <VideoChatPage />
                      </DashboardLayout>
                    </CompanyCheck>
                  </ProtectedRoute>
                </CompanyProvider>
              } 
            />
            */}
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </div>
        </NotificationProvider>
      </BackendProvider>
    </Router>
  );
}
export default App;
