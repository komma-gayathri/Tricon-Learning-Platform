import { Route } from "react-router-dom";
import RequireRole from "./RequireRole";

import TrainerCoursesPage from "../pages/trainerPages/TrainerCoursesPage";
import TrainerAssignmentsPage from "../pages/trainerPages/TrainerAssignmentsPage";
import TrainerDoubtsPage from "../pages/trainerPages/TrainerDoubtsPage";
import InternSchedulePage from "../pages/internPages/InternSchedulePage";

const TrainerRoutes = () => (
  <>
    <Route path="/trainer/courses" element={<RequireRole allowed={["TRAINER"]}><TrainerCoursesPage /></RequireRole>} />
    <Route path="/trainer/assignments" element={<RequireRole allowed={["TRAINER"]}><TrainerAssignmentsPage /></RequireRole>} />
    <Route path="/trainer/doubts" element={<RequireRole allowed={["TRAINER"]}><TrainerDoubtsPage /></RequireRole>} />
    <Route path="/trainer/schedule" element={<RequireRole allowed={["TRAINER"]}><InternSchedulePage /></RequireRole>} />
  </>
);

export default TrainerRoutes;
