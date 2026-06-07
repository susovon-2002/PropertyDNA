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

// User
export const getUser = (uid) => apiFetch(`/api/user/${uid}`);
export const getUserStats = (uid) => apiFetch(`/api/user/${uid}/stats`);

// Predictions
export const getPredictions = (uid) => apiFetch(`/api/user/${uid}/predictions`);
export const savePrediction = (uid, body) =>
  apiFetch(`/api/user/${uid}/predictions`, { method: "POST", body: JSON.stringify(body) });

// Portfolio
export const getPortfolio = (uid) => apiFetch(`/api/user/${uid}/portfolio`);
export const addPortfolio = (uid, body) =>
  apiFetch(`/api/user/${uid}/portfolio`, { method: "POST", body: JSON.stringify(body) });
export const deletePortfolio = (uid, id) =>
  apiFetch(`/api/user/${uid}/portfolio/${id}`, { method: "DELETE" });

// Favorites
export const getFavorites = (uid) => apiFetch(`/api/user/${uid}/favorites`);
export const addFavorite = (uid, body) =>
  apiFetch(`/api/user/${uid}/favorites`, { method: "POST", body: JSON.stringify(body) });
export const deleteFavorite = (uid, id) =>
  apiFetch(`/api/user/${uid}/favorites/${id}`, { method: "DELETE" });

// Reports
export const getReports = (uid) => apiFetch(`/api/user/${uid}/reports`);
export const saveReport = (uid, body) =>
  apiFetch(`/api/user/${uid}/reports`, { method: "POST", body: JSON.stringify(body) });
export const deleteReport = (uid, id) =>
  apiFetch(`/api/user/${uid}/reports/${id}`, { method: "DELETE" });

export const resetUserData = (uid) =>
  apiFetch(`/api/user/${uid}/reset`, { method: "DELETE" });
