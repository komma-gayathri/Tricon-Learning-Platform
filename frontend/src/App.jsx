import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import QuizPage from "./pages/QuizPage";
import QuizPreviewPage from "./pages/QuizPreview"
import HrBatchesPage from "./pages/HrBatchesPage";
import HrSchedulePage from "./pages/HrSchedulePage";
import HrPerformancePage from "./pages/HrPerformancePage";
import HrInterns from "./pages/HrInterns";      
import HrTrainers from "./pages/HrTrainers";  
import InternSchedulePage from "./pages/InternSchedulePage";
import InternAssignmentsPage from "./pages/InternAssignmentsPage";
import InternDoubtsPage from "./pages/InternDoubtsPage";
import TrainerCoursesPage from "./pages/TrainerCoursesPage";
import TrainerAssignmentsPage from "./pages/TrainerAssignmentsPage";
import TrainerDoubtsPage from "./pages/TrainerDoubtsPage";
import TrainerSchedulePage from "./pages/TrainerSchedulePage";
 
const RequireRole = ({ allowed, children }) => {
  const { user } = useAuth();
  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};
 
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading…
      </div>
    );
  }
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
 
const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
 
          {/* Protected */}
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
 
            {/* Quiz routes */}
            <Route path="/quiz/:id" element={<QuizPage />} />                
            <Route path="/quiz/:id/preview" element={<QuizPreviewPage />} />  
 
            {/* HR - EXISTING */}
            <Route
              path="/hr/batches"
              element={
                <RequireRole allowed={["HR"]}>
                  <HrBatchesPage />
                </RequireRole>
              }
            />
            <Route
              path="/hr/schedule"
              element={
                <RequireRole allowed={["HR"]}>
                  <HrSchedulePage />
                </RequireRole>
              }
            />
           
            {/* HR - NEW INTERN & TRAINER MANAGEMENT */}
            <Route
              path="/hr/interns"
              element={
                <RequireRole allowed={["HR"]}>
                  <HrInterns />
                </RequireRole>
              }
            />
            <Route
              path="/hr/trainers"
              element={
                <RequireRole allowed={["HR"]}>
                  <HrTrainers />
                </RequireRole>
              }
            />
           
            <Route
              path="/hr/performance"
              element={
                <RequireRole allowed={["HR"]}>
                  <HrPerformancePage />
                </RequireRole>
              }
            />
 
            {/* TRAINER */}
            <Route
              path="/trainer/courses"
              element={
                <RequireRole allowed={["TRAINER"]}>
                  <TrainerCoursesPage />
                </RequireRole>
              }
            />
            <Route
              path="/trainer/assignments"
              element={
                <RequireRole allowed={["TRAINER"]}>
                  <TrainerAssignmentsPage />
                </RequireRole>
              }
            />
            <Route
              path="/trainer/doubts"
              element={
                <RequireRole allowed={["TRAINER"]}>
                  <TrainerDoubtsPage />
                </RequireRole>
              }
            />
            <Route
              path="/trainer/schedule"
              element={
                <InternSchedulePage />
              }
            />
 
            {/* INTERN */}
            <Route path="/schedule" element={<InternSchedulePage />} />
            <Route path="/assignments" element={<InternAssignmentsPage />} />
            <Route path="/doubts" element={<InternDoubtsPage />} />
          </Route>
 
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
 
export default App;