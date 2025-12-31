import { Route } from "react-router-dom";
import RequireRole from "./RequireRole";

import InternSchedulePage from "../pages/internPages/InternSchedulePage";
import InternAssignmentsPage from "../pages/internPages/InternAssignmentsPage";
import InternDoubtsPage from "../pages/internPages/InternDoubtsPage";

const InternRoutes = () => (
  <>
    <Route
      path="/intern/schedule"
      element={
        <RequireRole allowed={["Intern"]}>
          <InternSchedulePage />
        </RequireRole>
      }
    />
    <Route
      path="/intern/assignments"
      element={
        <RequireRole allowed={["Intern"]}>
          <InternAssignmentsPage />
        </RequireRole>
      }
    />
    <Route
      path="/intern/doubts"
      element={
        <RequireRole allowed={["Intern"]}>
          <InternDoubtsPage />
        </RequireRole>
      }
    />
  </>
);

export default InternRoutes;
