import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ProtectedRoute } from './components/index.js';
import { LoginPage, SalaryManagementPage, EmployeeManagementPage } from './pages/index.js';

export default function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Business Operations Routes */}
          <Route
            path="/salary_management"
            element={
              <ProtectedRoute>
                <SalaryManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee_management"
            element={
              <ProtectedRoute>
                <EmployeeManagementPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback & Root Redirects to /salary_management */}
          <Route path="/" element={<Navigate to="/salary_management" replace />} />
          <Route path="*" element={<Navigate to="/salary_management" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
