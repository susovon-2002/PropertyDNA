export const PAGE_META = {
  "/dashboard": { title: "Overview", section: "Workspace", parent: null },
  "/dashboard/new-prediction": { title: "New Prediction", section: "Workspace", parent: null },
  "/dashboard/prediction-history": { title: "Prediction History", section: "Workspace", parent: null },
  "/dashboard/property-portfolio": { title: "Property Portfolio", section: "Workspace", parent: null },
  "/dashboard/property-dna-reports": { title: "DNA Analysis", section: "Insights", parent: null },
  "/dashboard/insights": { title: "Market Insights", section: "Insights", parent: null },
  "/dashboard/market-analytics": { title: "Market Insights", section: "Insights", parent: null },
  "/dashboard/country-insights": { title: "Market Insights", section: "Insights", parent: null },
  "/dashboard/investment-advisor": { title: "Market Insights", section: "Insights", parent: null },
  "/dashboard/saved-reports": { title: "My Saved Reports", section: "Library", parent: null },
  "/dashboard/favorites": { title: "Watchlist", section: "Library", parent: null },
  "/dashboard/profile": { title: "My Profile", section: "Account", parent: null },
  "/dashboard/settings": { title: "Settings", section: "Account", parent: null },
};

export function getPageMeta(pathname) {
  const base = pathname.replace(/\/$/, "") || "/dashboard";
  return PAGE_META[base] || { title: "Dashboard", section: "Workspace", parent: null };
}
