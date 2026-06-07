import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import BottomNav from "./components/BottomNav";
import { UserProvider } from "../utils/UserContext";
import { DashboardProvider } from "./context/DashboardContext";
import "./dashboard.css";

export default function DashboardLayout() {
  return (
    <UserProvider>
      <DashboardProvider>
        <div className="dashboard-layout">
          <Sidebar />
          <div className="dashboard-main">
            <Topbar />
            <div className="dashboard-content">
              <Outlet />
            </div>
          </div>
          <BottomNav />
        </div>
      </DashboardProvider>
    </UserProvider>
  );
}
