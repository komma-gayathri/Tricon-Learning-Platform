import { Route } from "react-router-dom";
import RequireRole from "./RequireRole";

import TrainerCoursesPage from "../pages/trainerPages/TrainerCoursesPage";
import TrainerAssignmentsPage from "../pages/trainerPages/TrainerAssignmentsPage";
import TrainerDoubtsPage from "../pages/trainerPages/TrainerDoubtsPage";
import TrainerSchedulePage from "../pages/trainerPages/TrainerSchedulePage";

const TrainerRoutes = () => (
  <>
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

    {/* ✅ ONLY THIS ROUTE */}
    <Route
      path="/trainer/schedule"
      element={
        <RequireRole allowed={["TRAINER"]}>
          <TrainerSchedulePage />
        </RequireRole>
      }
    />
  </>
);

export default TrainerRoutes;
