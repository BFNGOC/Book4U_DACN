import { Navigate, Outlet } from "react-router-dom";

import DefaultLayout from "../components/layouts/DefaultLayout";

function PrivateRoute() {
  const token = localStorage.getItem("token");
  return token ? (
    <DefaultLayout>
      <Outlet />
    </DefaultLayout>
  ) : (
    <Navigate to="/login" />
  );
}

export default PrivateRoute;
