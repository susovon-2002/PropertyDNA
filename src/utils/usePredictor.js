import { useState, useEffect, useMemo, useCallback } from "react";
import { CURRENT_YEAR, countries } from "./constants.js";
import { notifyBackendRefresh } from "./useBackendRefresh.js";
import { addPortfolioByEmail } from "./api.js";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const DEFAULT_FORM = {
  Country: "India",
  State_Region: "West Bengal",
  City: "Kolkata",
  Property_Name: "",
  Postal_Code: 700001,
  Latitude: 22.5726,
  Longitude: 88.3639,
  Year_Built: 2010,
  Property_Type: "Single Family",
  House_Size_sqft: 2000,
  Lot_Size_sqft: 5000,
  Bedrooms: 3,
  Bathrooms: 2,
  Floors: 2,
  Garage_Size: 1,
  Garden_Area: 500,
  Swimming_Pool: "No",
  Elevator: "No",
  Construction_Material: "Brick",
  Roof_Type: "Asphalt Shingle",
  Energy_Rating: "B",
  Renovation_Year: 2018,
  Renovation_Count: 1,
  Distance_to_School_km: 1.5,
  Distance_to_Hospital_km: 3.0,
  Distance_to_City_Center_km: 8.0,
  Public_Transport_Score: 6.5,
  Crime_Index: 25.0,
  Market_Demand_Score: 7.0,
  Neighborhood_Rating: 7.5,
  Internet_Speed_Availability: 200,
  Flood_Risk: 2.0,
  Earthquake_Risk: 1.5,
  Air_Quality_Index: 45.0,
  Noise_Level: 50.0,
  Future_Growth_Score: 7.0,
  Investment_Rating: "Good",
};

function getLocalPrice(formVal) {
  const country = countries.find((c) => c.name === formVal.Country) || countries[0];
  const size = Number(formVal.House_Size_sqft || 0);
  const rooms = Number(formVal.Bedrooms || 0);
  const age = Math.max(0, CURRENT_YEAR - Number(formVal.Year_Built || CURRENT_YEAR));
  const renovation = Number(formVal.Renovation_Count || 0) > 0 ? 1.08 : 1.0;
  const pool = formVal.Swimming_Pool === "Yes" ? 1.05 : 1.0;
  const materialMult = { Brick: 1.15, Wood: 0.85, Concrete: 1.0, Stone: 1.25, Steel: 1.1, Mixed: 0.95 };
  const mult = materialMult[formVal.Construction_Material] || 1.0;
  const depreciation = Math.min(0.5, age * 0.006 * (Number(formVal.Renovation_Count || 0) > 0 ? 0.7 : 1.0));
  const base = (size * country.rate * mult + rooms * 25000 + Number(formVal.Garden_Area || 0) * 80) * renovation * pool;
  return {
    value: Math.round(base * (1 - depreciation)),
    symbol: country.symbol,
    currency: country.currency,
    rate: country.rate,
  };
}

export function buildPayload(form) {
  return {
    Country: form.Country,
    State_Region: form.State_Region,
    City: form.City,
    Postal_Code: Number(form.Postal_Code),
    Latitude: Number(form.Latitude),
    Longitude: Number(form.Longitude),
    Year_Built: Number(form.Year_Built),
    Property_Type: form.Property_Type,
    House_Size_sqft: Number(form.House_Size_sqft),
    Lot_Size_sqft: Number(form.Lot_Size_sqft),
    Bedrooms: Number(form.Bedrooms),
    Bathrooms: Number(form.Bathrooms),
    Floors: Number(form.Floors),
    Garage_Size: Number(form.Garage_Size),
    Garden_Area: Number(form.Garden_Area),
    Swimming_Pool: form.Swimming_Pool === "Yes" ? 1 : 0,
    Elevator: form.Elevator === "Yes" ? 1 : 0,
    Construction_Material: form.Construction_Material,
    Roof_Type: form.Roof_Type,
    Energy_Rating: form.Energy_Rating,
    Renovation_Year: Number(form.Renovation_Year),
    Renovation_Count: Number(form.Renovation_Count),
    Distance_to_School_km: Number(form.Distance_to_School_km),
    Distance_to_Hospital_km: Number(form.Distance_to_Hospital_km),
    Distance_to_City_Center_km: Number(form.Distance_to_City_Center_km),
    Public_Transport_Score: Number(form.Public_Transport_Score),
    Crime_Index: Number(form.Crime_Index),
    Market_Demand_Score: Number(form.Market_Demand_Score),
    Neighborhood_Rating: Number(form.Neighborhood_Rating),
    Internet_Speed_Availability: Number(form.Internet_Speed_Availability),
    Flood_Risk: Number(form.Flood_Risk),
    Earthquake_Risk: Number(form.Earthquake_Risk),
    Air_Quality_Index: Number(form.Air_Quality_Index),
    Noise_Level: Number(form.Noise_Level),
    Future_Growth_Score: Number(form.Future_Growth_Score),
    Investment_Rating: form.Investment_Rating,
    House_Age: Math.max(0, CURRENT_YEAR - Number(form.Year_Built || CURRENT_YEAR)),
  };
}

export function usePredictor(user, { onNotify } = {}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [savedPredictions, setSavedPredictions] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [predictedAge, setPredictedAge] = useState(null);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [predictedDNA, setPredictedDNA] = useState(null);
  const [loadingAge, setLoadingAge] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingDNA, setLoadingDNA] = useState(false);
  const [activeTab, setActiveTab] = useState("age");
  const [isAgeStale, setIsAgeStale] = useState(false);
  const [isPriceStale, setIsPriceStale] = useState(false);

  const age = useMemo(
    () => Math.max(0, CURRENT_YEAR - Number(form.Year_Built || CURRENT_YEAR)),
    [form.Year_Built],
  );

  const fetchPredictions = useCallback(async (userEmail) => {
    try {
      const res = await fetch(`${API}/api/user/by-email/${userEmail}/predictions`);
      if (res.ok) setSavedPredictions(await res.json());
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
    }
  }, []);

  const pollTrainingStatus = useCallback(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/train/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "idle") {
            setIsTraining(false);
            clearInterval(interval);
            onNotify?.("ML models retrained successfully!", "success");
            if (user) fetchPredictions(user.email);
          }
        }
      } catch (err) {
        console.error("Error polling status:", err);
      }
    }, 2000);
  }, [user, fetchPredictions, onNotify]);

  useEffect(() => {
    if (user) {
      fetchPredictions(user.email);
      fetch(`${API}/api/train/status`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "training") {
            setIsTraining(true);
            pollTrainingStatus();
          }
        })
        .catch(console.error);
    } else {
      setSavedPredictions([]);
    }
  }, [user, fetchPredictions, pollTrainingStatus]);

  const savePredictionSnapshot = useCallback(
    async ({
      predictedPriceValue = predictedPrice?.value ?? 0,
      predictedAgeValue = predictedAge ?? 0,
      predictedDNAValue = predictedDNA ?? 0,
      silent = true,
    } = {}) => {
      if (!user) return false;

      const res = await fetch(`${API}/api/user/by-email/${user.email}/predictions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predicted_price: Number(predictedPriceValue) || 0,
          predicted_age: Number(predictedAgeValue) || 0,
          dna_score: Number(predictedDNAValue) || 0,
          country: form.Country,
          state: form.State_Region,
          city: form.City,
          year_built: Number(form.Year_Built),
          rooms: Number(form.Bedrooms),
          size_sqft: Number(form.House_Size_sqft),
          material: form.Construction_Material,
          location: form.Country,
          renovation: Number(form.Renovation_Count) > 0 ? "Yes" : "No",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Unable to save prediction.");

      fetchPredictions(user.email);
      notifyBackendRefresh();
      if (!silent) onNotify?.("Prediction saved!", "success");
      return true;
    },
    [user, form, predictedPrice, predictedAge, predictedDNA, fetchPredictions, onNotify],
  );

  const setValue = useCallback(
    (key) => (event) => {
      const val = event.target.value;
      setForm((cur) => ({ ...cur, [key]: val }));
      if (key === "Property_Name") return;
      if (key === "Year_Built") {
        const calculatedAge = Math.max(0, CURRENT_YEAR - Number(val || CURRENT_YEAR));
        setPredictedAge(calculatedAge);
        setIsAgeStale(false);
      } else {
        setIsAgeStale(true);
      }
      setIsPriceStale(true);
    },
    [],
  );

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      onNotify?.("Geolocation is not supported by your browser.", "error");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } },
          );
          const data = await res.json();
          const addr = data.address || {};
          const COUNTRY_MAP = {
            "United States": "United States",
            USA: "United States",
            "United Kingdom": "United Kingdom",
            UK: "United Kingdom",
            Germany: "Germany",
            Canada: "Canada",
            Australia: "Australia",
            Japan: "Japan",
            India: "India",
            Brazil: "Brazil",
            "South Africa": "South Africa",
          };
          const rawCountry = addr.country || "United States";
          const mappedCountry = COUNTRY_MAP[rawCountry] || "United States";
          const state = addr.state || addr.region || "";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const postal = addr.postcode || "";

          setForm((cur) => ({
            ...cur,
            Country: mappedCountry,
            State_Region: state,
            City: city,
            Postal_Code: postal ? Number(postal.replace(/\D/g, "")) || 0 : cur.Postal_Code,
            Latitude: parseFloat(latitude.toFixed(4)),
            Longitude: parseFloat(longitude.toFixed(4)),
          }));
        } catch {
          setForm((cur) => ({
            ...cur,
            Latitude: parseFloat(latitude.toFixed(4)),
            Longitude: parseFloat(longitude.toFixed(4)),
          }));
          onNotify?.("Coordinates filled; address lookup failed.", "info");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        onNotify?.(err.code === 1 ? "Location access denied." : "Unable to detect location.", "error");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }, [onNotify]);

  const handlePredictAge = useCallback(async () => {
    setLoadingAge(true);
    setActiveTab("age");
    try {
      const res = await fetch(`${API}/api/predict/age`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: Number(form.Bedrooms),
          size: Number(form.House_Size_sqft),
          material: form.Construction_Material,
          location: form.Country,
          renovation: Number(form.Renovation_Count) > 0 ? "Yes" : "No",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextAge = data.predictedAge;
        setPredictedAge(nextAge);
        setForm((cur) => ({ ...cur, Year_Built: CURRENT_YEAR - nextAge }));
        setIsAgeStale(false);
        setIsPriceStale(true);
        await savePredictionSnapshot({
          predictedAgeValue: nextAge,
          predictedPriceValue: predictedPrice?.value ?? 0,
          predictedDNAValue: predictedDNA ?? 0,
        });
      } else throw new Error(data.detail);
    } catch {
      setPredictedAge(age);
      setIsAgeStale(false);
    } finally {
      setLoadingAge(false);
    }
  }, [form, age, predictedPrice, predictedDNA, savePredictionSnapshot]);

  const handlePredictPrice = useCallback(async () => {
    setLoadingPrice(true);
    setActiveTab("price");
    const country = countries.find((c) => c.name === form.Country) || countries[0];
    try {
      const payload = buildPayload(form);
      const res = await fetch(`${API}/api/predict/price`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const nextPrice = {
          value: data.value,
          symbol: data.symbol || country.symbol,
          currency: data.currency || country.currency,
          rate: data.rate || country.rate,
        };
        setPredictedPrice(nextPrice);
        setIsPriceStale(false);
        await savePredictionSnapshot({
          predictedPriceValue: nextPrice.value,
          predictedAgeValue: predictedAge ?? 0,
          predictedDNAValue: predictedDNA ?? 0,
        });
      } else throw new Error(data.detail);
    } catch {
      const fallback = getLocalPrice(form);
      setPredictedPrice(fallback);
      setIsPriceStale(false);
      await savePredictionSnapshot({
        predictedPriceValue: fallback.value,
        predictedAgeValue: predictedAge ?? 0,
        predictedDNAValue: predictedDNA ?? 0,
      });
    } finally {
      setLoadingPrice(false);
    }
  }, [form, predictedAge, predictedDNA, savePredictionSnapshot]);

  const handlePredictDNA = useCallback(async () => {
    setLoadingDNA(true);
    setActiveTab("dna");
    try {
      const payload = buildPayload(form);
      const res = await fetch(`${API}/api/predict/dna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const nextDNA = data.PropertyDNA_Score;
        setPredictedDNA(nextDNA);
        await savePredictionSnapshot({
          predictedPriceValue: predictedPrice?.value ?? 0,
          predictedAgeValue: predictedAge ?? 0,
          predictedDNAValue: nextDNA,
        });
      } else throw new Error(data.detail);
    } catch {
      const local =
        (Number(form.Neighborhood_Rating) * 4 +
          Number(form.Market_Demand_Score) * 3 +
          Number(form.Future_Growth_Score) * 3) /
        10 *
        10;
      const nextDNA = Math.min(100, Math.max(0, local));
      setPredictedDNA(nextDNA);
      await savePredictionSnapshot({
        predictedPriceValue: predictedPrice?.value ?? 0,
        predictedAgeValue: predictedAge ?? 0,
        predictedDNAValue: nextDNA,
      });
    } finally {
      setLoadingDNA(false);
    }
  }, [form, predictedPrice, predictedAge, savePredictionSnapshot]);

  const handleSavePrediction = useCallback(async () => {
    if (!user) return false;
    try {
      await savePredictionSnapshot({ silent: false });
      return true;
    } catch (err) {
      onNotify?.(err.message, "error");
      return false;
    }
  }, [user, savePredictionSnapshot, onNotify]);

  const handleSaveProperty = useCallback(async () => {
    if (!user) return false;
    const propertyName = String(form.Property_Name || "").trim();
    if (!propertyName) {
      onNotify?.("Property name required.", "error");
      return false;
    }
    try {
      await addPortfolioByEmail(user.email, {
        property_name: propertyName,
        city: form.City,
        state: form.State_Region,
        country: form.Country,
        predicted_price: Number(predictedPrice?.value ?? 0) || 0,
        dna_score: Number(predictedDNA ?? 0) || 0,
        notes: "",
        property_type: form.Property_Type,
        year_built: Number(form.Year_Built) || 0,
        house_size_sqft: Number(form.House_Size_sqft) || 0,
        bedrooms: Number(form.Bedrooms) || 0,
        bathrooms: Number(form.Bathrooms) || 0,
        predicted_age: Number(predictedAge ?? 0) || 0,
      });
      notifyBackendRefresh();
      onNotify?.("Property saved to portfolio!", "success");
      return true;
    } catch (err) {
      onNotify?.(err.message, "error");
      return false;
    }
  }, [user, form, predictedPrice, predictedDNA, predictedAge, onNotify]);

  const handleUploadCsv = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      setIsTraining(true);
      try {
        const res = await fetch(`${API}/api/train/upload`, { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok) {
          onNotify?.("CSV uploaded — retraining in background.", "info");
          pollTrainingStatus();
        } else {
          onNotify?.(data.detail || "Upload failed", "error");
          setIsTraining(false);
        }
      } catch (err) {
        onNotify?.(err.message, "error");
        setIsTraining(false);
      }
    },
    [pollTrainingStatus, onNotify],
  );

  return {
    form,
    setForm,
    savedPredictions,
    isTraining,
    locationLoading,
    predictedAge,
    predictedPrice,
    predictedDNA,
    loadingAge,
    loadingPrice,
    loadingDNA,
    activeTab,
    setActiveTab,
    isAgeStale,
    isPriceStale,
    age,
    setValue,
    handleGetLocation,
    handlePredictAge,
    handlePredictPrice,
    handlePredictDNA,
    handleSavePrediction,
    handleSaveProperty,
    handleUploadCsv,
  };
}
