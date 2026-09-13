import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { billingService } from './services/billingService';
import { auditService } from './services/auditService';

// Initialize mock data layer on app start
billingService.initialize();
auditService.initialize();

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster 
            position="top-right" 
            toastOptions={{
              className: 'bg-[#1b1d26] text-white border border-white/10',
              style: { background: '#1b1d26', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} 
          />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
