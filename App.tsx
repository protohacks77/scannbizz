
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { Layout, PageWrapper } from './components/Layout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { StockPage } from './pages/StockPage';
import { SellPage } from './pages/SellPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isPinVerified, loading } = useApp();
    const location = useLocation();
    
    if(loading) {
        return <div className="h-screen w-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }
    
    if (!isAuthenticated || !isPinVerified) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <Layout>
                            <PageWrapper>
                                <Routes>
                                    <Route path="/" element={<DashboardPage />} />
                                    <Route path="/stock" element={<StockPage />} />
                                    <Route path="/sell" element={<SellPage />} />
                                    <Route path="/analytics" element={<AnalyticsPage />} />
                                    <Route path="/settings" element={<SettingsPage />} />
                                    <Route path="*" element={<Navigate to="/" />} />
                                </Routes>
                            </PageWrapper>
                        </Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
        <HashRouter>
            <AppRoutes />
        </HashRouter>
    </AppProvider>
  );
}

export default App;
