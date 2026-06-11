import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import BasicLayout from './layouts/BasicLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/Users';
import OrgList from './pages/Organizations';
import MailList from './pages/Mail';
import StaticPages from './pages/StaticPages';
import ProjectList from './pages/Projects';
import WorkRecords from './pages/WorkRecords';
import SystemLogs from './pages/SystemLogs';
import WorkRecordLogs from './pages/WorkRecordLogs';
import { useUserStore } from './store/userStore';

// Protected Route Component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useUserStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <BasicLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserList />} />
            <Route path="organizations" element={<OrgList />} />
            <Route path="projects" element={<ProjectList />} />
            <Route path="mail" element={<MailList />} />
            <Route path="static-pages" element={<StaticPages />} />
            <Route path="work-records" element={<WorkRecords />} />
            <Route path="system-logs" element={<SystemLogs />} />
            <Route path="work-record-logs" element={<WorkRecordLogs />} />
          </Route>
        </Routes>
      </Router>
    </ConfigProvider>
  );
};

export default App;
