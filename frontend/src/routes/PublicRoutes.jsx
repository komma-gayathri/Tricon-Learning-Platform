import { Route } from "react-router-dom";
import LoginPage from "../pages/loginPage/LoginPage";

const PublicRoutes = () => (
  <>
    <Route path="/login" element={<LoginPage />} />
  </>
);

export default PublicRoutes;
