const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function apiFetch(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  return data;
}

// User - by ID (legacy, kept for backward compatibility)
export const getUser = (uid) => apiFetch(`/api/user/${uid}`);
export const getUserStats = (uid) => apiFetch(`/api/user/${uid}/stats`);

// User - by email (new)
export const getUserByEmail = (email) => apiFetch(`/api/user/by-email/${email}`);
export const getUserStatsByEmail = (email) => apiFetch(`/api/user/by-email/${email}/stats`);

// Predictions - by ID (legacy)
export const getPredictions = (uid) => apiFetch(`/api/user/${uid}/predictions`);
export const savePrediction = (uid, body) =>
  apiFetch(`/api/user/${uid}/predictions`, { method: "POST", body: JSON.stringify(body) });

// Predictions - by email (new)
export const getPredictionsByEmail = (email) => apiFetch(`/api/user/by-email/${email}/predictions`);

// Portfolio - by ID (legacy)
export const getPortfolio = (uid) => apiFetch(`/api/user/${uid}/portfolio`);
export const addPortfolio = (uid, body) =>
  apiFetch(`/api/user/${uid}/portfolio`, { method: "POST", body: JSON.stringify(body) });
export const deletePortfolio = (uid, id) =>
  apiFetch(`/api/user/${uid}/portfolio/${id}`, { method: "DELETE" });

// Portfolio - by email (new)
export const getPortfolioByEmail = (email) => apiFetch(`/api/user/by-email/${email}/portfolio`);
export const addPortfolioByEmail = (email, body) =>
  apiFetch(`/api/user/by-email/${email}/portfolio`, { method: "POST", body: JSON.stringify(body) });
export const deletePortfolioByEmail = (email, id) =>
  apiFetch(`/api/user/by-email/${email}/portfolio/${id}`, { method: "DELETE" });

// Favorites - by ID (legacy)
export const getFavorites = (uid) => apiFetch(`/api/user/${uid}/favorites`);
export const addFavorite = (uid, body) =>
  apiFetch(`/api/user/${uid}/favorites`, { method: "POST", body: JSON.stringify(body) });
export const deleteFavorite = (uid, id) =>
  apiFetch(`/api/user/${uid}/favorites/${id}`, { method: "DELETE" });

// Favorites - by email (new)
export const getFavoritesByEmail = (email) => apiFetch(`/api/user/by-email/${email}/favorites`);
export const addFavoriteByEmail = (email, body) =>
  apiFetch(`/api/user/by-email/${email}/favorites`, { method: "POST", body: JSON.stringify(body) });
export const deleteFavoriteByEmail = (email, id) =>
  apiFetch(`/api/user/by-email/${email}/favorites/${id}`, { method: "DELETE" });

// Reports - by ID (legacy)
export const getReports = (uid) => apiFetch(`/api/user/${uid}/reports`);
export const saveReport = (uid, body) =>
  apiFetch(`/api/user/${uid}/reports`, { method: "POST", body: JSON.stringify(body) });
export const deleteReport = (uid, id) =>
  apiFetch(`/api/user/${uid}/reports/${id}`, { method: "DELETE" });

// Reports - by email (new)
export const getReportsByEmail = (email) => apiFetch(`/api/user/by-email/${email}/reports`);
export const saveReportByEmail = (email, body) =>
  apiFetch(`/api/user/by-email/${email}/reports`, { method: "POST", body: JSON.stringify(body) });
export const deleteReportByEmail = (email, id) =>
  apiFetch(`/api/user/by-email/${email}/reports/${id}`, { method: "DELETE" });

// Reset - by ID (legacy)
export const resetUserData = (uid) =>
  apiFetch(`/api/user/${uid}/reset`, { method: "DELETE" });

// Reset - by email (new)
export const resetUserDataByEmail = (email) =>
  apiFetch(`/api/user/by-email/${email}/reset`, { method: "DELETE" });
