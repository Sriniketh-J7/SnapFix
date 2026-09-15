import { Outlet } from "react-router-dom";
import { FooterNav } from "../Components/UserDashboards/Footer";
import { Header } from "../Components/UserDashboards/Header";

export const UserLayout = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <div className="flex-grow">
      <Outlet />
    </div>
    <FooterNav />
  </div>
);
