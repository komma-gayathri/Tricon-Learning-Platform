import { Routes, Route, Navigate } from "react-router-dom";

import PublicRoutes from "./PublicRoutes";
import ProtectedLayout from "./ProtectedLayout";
import InternRoutes from "./InternRoutes";
import HrRoutes from "./HrRoutes";
import TrainerRoutes from "./TrainerRoutes";

import DashboardPage from "../pages/DashboardPage";
import CoursesPage from "../pages/coursePage/CoursesPage";
import CourseDetailPage from "../pages/coursePage/CourseDetailPage";
import QuizPage from "../pages/quizPage/QuizPage";
import QuizPreviewPage from "../pages/quizPage/QuizPreview";

const AppRoutes = () => (
  <Routes>
    {PublicRoutes()}

    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/quiz/:id" element={<QuizPage />} />
      <Route path="/quiz/:id/preview" element={<QuizPreviewPage />} />

      {InternRoutes()}
      {HrRoutes()}
      {TrainerRoutes()}
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
