import { Routes, Route, Navigate } from "react-router-dom";

import DashboardLayout from "./DashboardLayout";

import DashboardHome from "./pages/DashboardHome";
import NewPrediction from "./pages/NewPrediction";
import PropertyPortfolio from "./pages/PropertyPortfolio";
import PropertyDNAReports from "./pages/PropertyDNAReports";
import InsightsHub from "./pages/InsightsHub";
import PredictionHistory from "./pages/PredictionHistory";
import SavedReports from "./pages/SavedReports";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

export default function Dashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="new-prediction" element={<NewPrediction />} />
        <Route path="property-portfolio" element={<PropertyPortfolio />} />
        <Route path="property-dna-reports" element={<PropertyDNAReports />} />
        <Route path="insights" element={<InsightsHub />} />
        <Route path="market-analytics" element={<Navigate to="/dashboard/insights?tab=overview" replace />} />
        <Route path="country-insights" element={<Navigate to="/dashboard/insights?tab=country" replace />} />
        <Route path="investment-advisor" element={<Navigate to="/dashboard/insights?tab=advisor" replace />} />
        <Route path="prediction-history" element={<PredictionHistory />} />
        <Route path="saved-reports" element={<SavedReports />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
