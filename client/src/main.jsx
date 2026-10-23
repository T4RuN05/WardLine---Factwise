import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './app/router.jsx';
import { AuthProvider } from './state/AuthContext.jsx';
import { AppDataProvider } from './state/AppDataContext.jsx';
import { Toaster } from 'sonner';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AppDataProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          theme="light"
          richColors
          closeButton
          expand
          visibleToasts={5}
          duration={5000}
          style={{ zIndex: 100000 }}
          toastOptions={{
            className: 'font-sans',
          }}
        />
      </AppDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
