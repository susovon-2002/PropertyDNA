const BASE = import.meta.env.VITE_API_BASE_URL || "https://propertydna.onrender.com";

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

// Local helper to compute stats from localStorage caches
function getLocalStats(email) {
  const predictions = JSON.parse(localStorage.getItem(`predictions_${email}`) || "[]");
  const portfolio = JSON.parse(localStorage.getItem(`portfolio_${email}`) || "[]");
  const favorites = JSON.parse(localStorage.getItem(`favorites_${email}`) || "[]");
  const reports = JSON.parse(localStorage.getItem(`reports_${email}`) || "[]");

  const prices = predictions.map(p => p.predicted_price).filter(p => p != null);
  const dnas = predictions.map(p => p.dna_score).filter(d => d != null);
  const countriesList = [...new Set(predictions.map(p => p.country).filter(Boolean))];

  return {
    total_predictions: predictions.length,
    avg_price: prices.length ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)) : 0,
    avg_dna_score: dnas.length ? Number((dnas.reduce((a, b) => a + b, 0) / dnas.length).toFixed(2)) : 0,
    countries_analyzed: countriesList.length,
    saved_reports: reports.length,
    favorites: favorites.length,
    portfolio_count: portfolio.length,
  };
}

// User - by ID (legacy - redirected to email-based internally or using a dummy)
export const getUser = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return Promise.resolve({ id: uid, name: parsed.name, email: parsed.email });
  }
  return apiFetch(`/api/user/${uid}`);
};

export const getUserStats = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return getUserStatsByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/stats`);
};

// User - by email (new)
export const getUserByEmail = async (email) => {
  try {
    const data = await apiFetch(`/api/user/by-email/${email}`);
    if (data && data.user) {
      localStorage.setItem(`user_${email}`, JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    console.warn("getUserByEmail failed, using localStorage cache:", err);
    const cached = localStorage.getItem(`user_${email}`);
    if (cached) {
      return { success: true, user: JSON.parse(cached) };
    }
    const name = email.split('@')[0].toUpperCase();
    return { success: true, user: { name, email } };
  }
};

export const getUserStatsByEmail = async (email) => {
  try {
    const data = await apiFetch(`/api/user/by-email/${email}/stats`);
    localStorage.setItem(`kpi_stats_${email}`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn("getUserStatsByEmail failed, computing locally:", err);
    const localStats = getLocalStats(email);
    localStorage.setItem(`kpi_stats_${email}`, JSON.stringify(localStats));
    return localStats;
  }
};

// Predictions - by ID (legacy - redirect to email)
export const getPredictions = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return getPredictionsByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/predictions`);
};

export const savePrediction = (uid, body) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return savePredictionByEmail(parsed.email, body);
  }
  return apiFetch(`/api/user/${uid}/predictions`, { method: "POST", body: JSON.stringify(body) });
};

// Helper for Background Syncing of missing records
async function syncLocalToRemote(email, type, localItems) {
  if (!localItems || localItems.length === 0) return;
  console.log(`[SYNC] Restoring ${localItems.length} cached ${type} items to server for ${email}`);
  for (const item of localItems) {
    try {
      const { id, created_at, ...payload } = item;
      const urlMap = {
        predictions: `/api/user/by-email/${email}/predictions`,
        portfolio: `/api/user/by-email/${email}/portfolio`,
        favorites: `/api/user/by-email/${email}/favorites`,
        reports: `/api/user/by-email/${email}/reports`
      };
      await fetch(`${BASE}${urlMap[type]}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error(`[SYNC] Failed to restore ${type} item:`, e);
    }
  }
}

// Predictions - by email (new)
export const getPredictionsByEmail = async (email) => {
  try {
    const serverData = await apiFetch(`/api/user/by-email/${email}/predictions`);
    const localKey = `predictions_${email}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

    if (serverData.length === 0 && localData.length > 0) {
      await syncLocalToRemote(email, "predictions", localData);
      const freshData = await apiFetch(`/api/user/by-email/${email}/predictions`);
      localStorage.setItem(localKey, JSON.stringify(freshData));
      return freshData;
    }

    localStorage.setItem(localKey, JSON.stringify(serverData));
    return serverData;
  } catch (err) {
    console.warn("getPredictionsByEmail failed, using cache:", err);
    return JSON.parse(localStorage.getItem(`predictions_${email}`) || "[]");
  }
};

export const savePredictionByEmail = async (email, body) => {
  const localKey = `predictions_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

  const tempItem = {
    id: `local_${Date.now()}`,
    predicted_price: body.predicted_price,
    predicted_age: body.predicted_age,
    dna_score: body.dna_score,
    country: body.country,
    state: body.state,
    city: body.city,
    year_built: body.year_built,
    rooms: body.rooms,
    size_sqft: body.size_sqft,
    material: body.material,
    location: body.location,
    renovation: body.renovation,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(localKey, JSON.stringify([tempItem, ...localData]));

  try {
    const res = await apiFetch(`/api/user/by-email/${email}/predictions`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    const serverData = await apiFetch(`/api/user/by-email/${email}/predictions`);
    localStorage.setItem(localKey, JSON.stringify(serverData));
    return res;
  } catch (err) {
    console.warn("savePredictionByEmail remote call failed, saved locally:", err);
    return { status: "success", prediction_id: tempItem.id, message: "Saved locally." };
  }
};

// Portfolio - by ID (legacy)
export const getPortfolio = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return getPortfolioByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/portfolio`);
};

export const addPortfolio = (uid, body) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return addPortfolioByEmail(parsed.email, body);
  }
  return apiFetch(`/api/user/${uid}/portfolio`, { method: "POST", body: JSON.stringify(body) });
};

export const deletePortfolio = (uid, id) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return deletePortfolioByEmail(parsed.email, id);
  }
  return apiFetch(`/api/user/${uid}/portfolio/${id}`, { method: "DELETE" });
};

// Portfolio - by email (new)
export const getPortfolioByEmail = async (email) => {
  try {
    const serverData = await apiFetch(`/api/user/by-email/${email}/portfolio`);
    const localKey = `portfolio_${email}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

    if (serverData.length === 0 && localData.length > 0) {
      await syncLocalToRemote(email, "portfolio", localData);
      const freshData = await apiFetch(`/api/user/by-email/${email}/portfolio`);
      localStorage.setItem(localKey, JSON.stringify(freshData));
      return freshData;
    }

    localStorage.setItem(localKey, JSON.stringify(serverData));
    return serverData;
  } catch (err) {
    console.warn("getPortfolioByEmail failed, using cache:", err);
    return JSON.parse(localStorage.getItem(`portfolio_${email}`) || "[]");
  }
};

export const addPortfolioByEmail = async (email, body) => {
  const localKey = `portfolio_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

  const tempItem = {
    id: `local_${Date.now()}`,
    ...body,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(localKey, JSON.stringify([tempItem, ...localData]));

  try {
    const res = await apiFetch(`/api/user/by-email/${email}/portfolio`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    const serverData = await apiFetch(`/api/user/by-email/${email}/portfolio`);
    localStorage.setItem(localKey, JSON.stringify(serverData));
    return res;
  } catch (err) {
    console.warn("addPortfolioByEmail remote call failed, saved locally:", err);
    return { status: "success", id: tempItem.id };
  }
};

export const deletePortfolioByEmail = async (email, id) => {
  const localKey = `portfolio_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");
  localStorage.setItem(localKey, JSON.stringify(localData.filter(item => item.id !== id)));

  try {
    return await apiFetch(`/api/user/by-email/${email}/portfolio/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("deletePortfolioByEmail remote call failed, updated locally:", err);
    return { status: "success", message: "Deleted locally." };
  }
};

// Favorites - by ID (legacy)
export const getFavorites = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return getFavoritesByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/favorites`);
};

export const addFavorite = (uid, body) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return addFavoriteByEmail(parsed.email, body);
  }
  return apiFetch(`/api/user/${uid}/favorites`, { method: "POST", body: JSON.stringify(body) });
};

export const deleteFavorite = (uid, id) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return deleteFavoriteByEmail(parsed.email, id);
  }
  return apiFetch(`/api/user/${uid}/favorites/${id}`, { method: "DELETE" });
};

// Favorites - by email (new)
export const getFavoritesByEmail = async (email) => {
  try {
    const serverData = await apiFetch(`/api/user/by-email/${email}/favorites`);
    const localKey = `favorites_${email}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

    if (serverData.length === 0 && localData.length > 0) {
      await syncLocalToRemote(email, "favorites", localData);
      const freshData = await apiFetch(`/api/user/by-email/${email}/favorites`);
      localStorage.setItem(localKey, JSON.stringify(freshData));
      return freshData;
    }

    localStorage.setItem(localKey, JSON.stringify(serverData));
    return serverData;
  } catch (err) {
    console.warn("getFavoritesByEmail failed, using cache:", err);
    return JSON.parse(localStorage.getItem(`favorites_${email}`) || "[]");
  }
};

export const addFavoriteByEmail = async (email, body) => {
  const localKey = `favorites_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

  const tempItem = {
    id: `local_${Date.now()}`,
    ...body,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(localKey, JSON.stringify([tempItem, ...localData]));

  try {
    const res = await apiFetch(`/api/user/by-email/${email}/favorites`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    const serverData = await apiFetch(`/api/user/by-email/${email}/favorites`);
    localStorage.setItem(localKey, JSON.stringify(serverData));
    return res;
  } catch (err) {
    console.warn("addFavoriteByEmail remote call failed, saved locally:", err);
    return { status: "success", id: tempItem.id };
  }
};

export const deleteFavoriteByEmail = async (email, id) => {
  const localKey = `favorites_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");
  localStorage.setItem(localKey, JSON.stringify(localData.filter(item => item.id !== id)));

  try {
    return await apiFetch(`/api/user/by-email/${email}/favorites/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("deleteFavoriteByEmail remote call failed, updated locally:", err);
    return { status: "success", message: "Deleted locally." };
  }
};

// Reports - by ID (legacy)
export const getReports = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return getReportsByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/reports`);
};

export const saveReport = (uid, body) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return saveReportByEmail(parsed.email, body);
  }
  return apiFetch(`/api/user/${uid}/reports`, { method: "POST", body: JSON.stringify(body) });
};

export const deleteReport = (uid, id) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return deleteReportByEmail(parsed.email, id);
  }
  return apiFetch(`/api/user/${uid}/reports/${id}`, { method: "DELETE" });
};

// Reports - by email (new)
export const getReportsByEmail = async (email) => {
  try {
    const serverData = await apiFetch(`/api/user/by-email/${email}/reports`);
    const localKey = `reports_${email}`;
    const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

    if (serverData.length === 0 && localData.length > 0) {
      await syncLocalToRemote(email, "reports", localData);
      const freshData = await apiFetch(`/api/user/by-email/${email}/reports`);
      localStorage.setItem(localKey, JSON.stringify(freshData));
      return freshData;
    }

    localStorage.setItem(localKey, JSON.stringify(serverData));
    return serverData;
  } catch (err) {
    console.warn("getReportsByEmail failed, using cache:", err);
    return JSON.parse(localStorage.getItem(`reports_${email}`) || "[]");
  }
};

export const saveReportByEmail = async (email, body) => {
  const localKey = `reports_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");

  const tempItem = {
    id: `local_${Date.now()}`,
    ...body,
    created_at: new Date().toISOString()
  };

  localStorage.setItem(localKey, JSON.stringify([tempItem, ...localData]));

  try {
    const res = await apiFetch(`/api/user/by-email/${email}/reports`, {
      method: "POST",
      body: JSON.stringify(body)
    });
    const serverData = await apiFetch(`/api/user/by-email/${email}/reports`);
    localStorage.setItem(localKey, JSON.stringify(serverData));
    return res;
  } catch (err) {
    console.warn("saveReportByEmail remote call failed, saved locally:", err);
    return { status: "success", id: tempItem.id };
  }
};

export const deleteReportByEmail = async (email, id) => {
  const localKey = `reports_${email}`;
  const localData = JSON.parse(localStorage.getItem(localKey) || "[]");
  localStorage.setItem(localKey, JSON.stringify(localData.filter(item => item.id !== id)));

  try {
    return await apiFetch(`/api/user/by-email/${email}/reports/${id}`, { method: "DELETE" });
  } catch (err) {
    console.warn("deleteReportByEmail remote call failed, updated locally:", err);
    return { status: "success", message: "Deleted locally." };
  }
};

// Reset - by ID (legacy)
export const resetUserData = (uid) => {
  const storedUser = localStorage.getItem('property_dna_user');
  if (storedUser) {
    const parsed = JSON.parse(storedUser);
    return resetUserDataByEmail(parsed.email);
  }
  return apiFetch(`/api/user/${uid}/reset`, { method: "DELETE" });
};

// Reset - by email (new)
export const resetUserDataByEmail = async (email) => {
  localStorage.removeItem(`user_${email}`);
  localStorage.removeItem(`kpi_stats_${email}`);
  localStorage.removeItem(`predictions_${email}`);
  localStorage.removeItem(`portfolio_${email}`);
  localStorage.removeItem(`favorites_${email}`);
  localStorage.removeItem(`reports_${email}`);

  try {
    return await apiFetch(`/api/user/by-email/${email}/reset`, { method: "DELETE" });
  } catch (err) {
    console.warn("resetUserDataByEmail remote call failed, cleared locally:", err);
    return { status: "success", message: "Data reset locally." };
  }
};
