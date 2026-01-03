import { Route } from "react-router-dom";
import RequireRole from "./RequireRole";

import HrBatchesPage from "../pages/hrPages/HrBatchesPage";
import HrSchedulePage from "../pages/hrPages/HrSchedulePage";
import HrPerformancePage from "../pages/hrPages/HrPerformancePage";
import HrInterns from "../pages/hrPages/HrInterns";
import HrTrainers from "../pages/hrPages/HrTrainers";
import HRInternProfile from "../pages/hrPages/HRInternProfile";
import HRTrainerProfile from "../pages/hrPages/HRTrainerProfile";
import HRBatchDetails from "../pages/hrPages/HRBatchDetails";

const HrRoutes = () => (
  <>
    {/* MAIN HR PAGES (ROLE-PROTECTED) */}
    <Route
      path="/hr/batches"
      element={<RequireRole allowed={["HR"]}><HrBatchesPage /></RequireRole>}
    />
    <Route
      path="/hr/batches/:id"
      element={<RequireRole allowed={["HR"]}><HRBatchDetails /></RequireRole>}
    />
    <Route
      path="/hr/schedule"
      element={<RequireRole allowed={["HR"]}><HrSchedulePage /></RequireRole>}
    />
    <Route
      path="/hr/performance"
      element={<RequireRole allowed={["HR"]}><HrPerformancePage /></RequireRole>}
    />
    <Route
      path="/hr/interns"
      element={<RequireRole allowed={["HR"]}><HrInterns /></RequireRole>}
    />
    <Route
      path="/hr/trainers"
      element={<RequireRole allowed={["HR"]}><HrTrainers /></RequireRole>}
    />


    <Route path="/hr/interns/:id" element={<HRInternProfile />} />
    <Route path="/hr/trainers/:id" element={<HRTrainerProfile />} />
  </>
);

export default HrRoutes;
