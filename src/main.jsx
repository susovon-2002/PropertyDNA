import React, { useState, useEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import Navbar from './sections/Navbar.jsx';
import AuthModal from './components/AuthModal.jsx';
import Hero from './sections/Hero.jsx';
import HowItWorks from './sections/HowItWorks.jsx';
import Predictor from './sections/Predictor.jsx';
import WhyItMatters from './sections/WhyItMatters.jsx';
import Footer from './sections/Footer.jsx';
import HouseAISection from './sections/HouseAISection.jsx';
import HouseAIPage from './sections/HouseAIPage.jsx';
import { CURRENT_YEAR, countries } from './utils/constants.js';
import { notifyBackendRefresh } from './utils/useBackendRefresh.js';
import { addPortfolioByEmail, savePredictionByEmail } from './utils/api.js';
import { getCurrentUserEmail, getCurrentUser } from './utils/userHelpers.js';
import { ArrowLeft } from 'lucide-react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './dashboard/Dashboard.jsx';
import './styles.css';

const API = import.meta.env.VITE_API_BASE_URL || "https://propertydna.onrender.com";

// ──────────────────────────────────────────────
// Default form — all 37 model features
// ──────────────────────────────────────────────
const DEFAULT_FORM = {
  // Section 1: Location
  Country:                    'India',
  State_Region:               'West Bengal',
  City:                       'Kolkata',
  Property_Name:              '',
  Postal_Code:                700001,
  Latitude:                   22.5726,
  Longitude:                  88.3639,

  // Section 2: Property
  Year_Built:                 2010,
  Property_Type:              'Single Family',
  House_Size_sqft:            2000,
  Lot_Size_sqft:              5000,
  Bedrooms:                   3,
  Bathrooms:                  2,
  Floors:                     2,
  Garage_Size:                1,
  Garden_Area:                500,
  Swimming_Pool:              'No',
  Elevator:                   'No',

  // Section 3: Construction
  Construction_Material:      'Brick',
  Roof_Type:                  'Asphalt Shingle',
  Energy_Rating:              'B',
  Renovation_Year:            2018,
  Renovation_Count:           1,

  // Section 4: Accessibility
  Distance_to_School_km:      1.5,
  Distance_to_Hospital_km:    3.0,
  Distance_to_City_Center_km: 8.0,
  Public_Transport_Score:     6.5,

  // Section 5: Market & Environment
  Crime_Index:                25.0,
  Market_Demand_Score:        7.0,
  Neighborhood_Rating:        7.5,
  Internet_Speed_Availability:200,
  Flood_Risk:                 2.0,
  Earthquake_Risk:            1.5,
  Air_Quality_Index:          45.0,
  Noise_Level:                50.0,
  Future_Growth_Score:        7.0,
  Investment_Rating:          'Good',
};

// Fallback price computation (used when backend is unavailable)
function getLocalPrice(formVal) {
  const country = countries.find(c => c.name === formVal.Country) || countries[0];
  const size = Number(formVal.House_Size_sqft || 0);
  const rooms = Number(formVal.Bedrooms || 0);
  const age = Math.max(0, CURRENT_YEAR - Number(formVal.Year_Built || CURRENT_YEAR));
  const renovation = Number(formVal.Renovation_Count || 0) > 0 ? 1.08 : 1.0;
  const pool = formVal.Swimming_Pool === 'Yes' ? 1.05 : 1.0;
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

// Build 37-feature payload for backend
function buildPayload(form) {
  return {
    Country:                    form.Country,
    State_Region:               form.State_Region,
    City:                       form.City,
    Postal_Code:                Number(form.Postal_Code),
    Latitude:                   Number(form.Latitude),
    Longitude:                  Number(form.Longitude),
    Year_Built:                 Number(form.Year_Built),
    Property_Type:              form.Property_Type,
    House_Size_sqft:            Number(form.House_Size_sqft),
    Lot_Size_sqft:              Number(form.Lot_Size_sqft),
    Bedrooms:                   Number(form.Bedrooms),
    Bathrooms:                  Number(form.Bathrooms),
    Floors:                     Number(form.Floors),
    Garage_Size:                Number(form.Garage_Size),
    Garden_Area:                Number(form.Garden_Area),
    Swimming_Pool:              form.Swimming_Pool === 'Yes' ? 1 : 0,
    Elevator:                   form.Elevator === 'Yes' ? 1 : 0,
    Construction_Material:      form.Construction_Material,
    Roof_Type:                  form.Roof_Type,
    Energy_Rating:              form.Energy_Rating,
    Renovation_Year:            Number(form.Renovation_Year),
    Renovation_Count:           Number(form.Renovation_Count),
    Distance_to_School_km:      Number(form.Distance_to_School_km),
    Distance_to_Hospital_km:    Number(form.Distance_to_Hospital_km),
    Distance_to_City_Center_km: Number(form.Distance_to_City_Center_km),
    Public_Transport_Score:     Number(form.Public_Transport_Score),
    Crime_Index:                Number(form.Crime_Index),
    Market_Demand_Score:        Number(form.Market_Demand_Score),
    Neighborhood_Rating:        Number(form.Neighborhood_Rating),
    Internet_Speed_Availability:Number(form.Internet_Speed_Availability),
    Flood_Risk:                 Number(form.Flood_Risk),
    Earthquake_Risk:            Number(form.Earthquake_Risk),
    Air_Quality_Index:          Number(form.Air_Quality_Index),
    Noise_Level:                Number(form.Noise_Level),
    Future_Growth_Score:        Number(form.Future_Growth_Score),
    Investment_Rating:          form.Investment_Rating,
    House_Age:                  Math.max(0, CURRENT_YEAR - Number(form.Year_Built || CURRENT_YEAR)),
  };
}

function App() {
  const [isAuthOpen, setIsAuthOpen] = useState(() => {
    return window.location.hash === '#login' || window.location.hash === '#signin';
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('property_dna_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const hash = window.location.hash;
    const saved = localStorage.getItem('property_dna_user');
    return saved && (hash === '#predict' || hash === '#predictor') ? 'predict' : 'home';
  });

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#login' || hash === '#signin') {
        setCurrentPage('home');
        setIsAuthOpen(true);
        return;
      }
      if (hash === '#predict' || hash === '#predictor') {
        if (user) {
          setCurrentPage('predict');
        } else {
          setCurrentPage('home');
          setIsAuthOpen(true);
          window.history.replaceState(null, '', '#login');
        }
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  const [savedPredictions, setSavedPredictions] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [form, setForm] = useState(DEFAULT_FORM);

  const [predictedAge,   setPredictedAge]   = useState(null);
  const [predictedPrice, setPredictedPrice] = useState(null);
  const [predictedDNA,   setPredictedDNA]   = useState(null);

  const [loadingAge,   setLoadingAge]   = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [loadingDNA,   setLoadingDNA]   = useState(false);

  const [activeTab,    setActiveTab]    = useState('age');
  const [isAgeStale,   setIsAgeStale]   = useState(false);
  const [isPriceStale, setIsPriceStale] = useState(false);

  const savePredictionSnapshot = async ({
    predictedPriceValue = predictedPrice?.value ?? 0,
    predictedAgeValue = predictedAge ?? 0,
    predictedDNAValue = predictedDNA ?? 0,
    silent = true,
  } = {}) => {
    if (!user || !user.email) return false;

    const body = {
      predicted_price: Number(predictedPriceValue) || 0,
      predicted_age:   Number(predictedAgeValue) || 0,
      dna_score:       Number(predictedDNAValue) || 0,
      country:         form.Country,
      state:           form.State_Region,
      city:            form.City,
      year_built:      Number(form.Year_Built),
      rooms:           Number(form.Bedrooms),
      size_sqft:       Number(form.House_Size_sqft),
      material:        form.Construction_Material,
      location:        form.Country,
      renovation:      Number(form.Renovation_Count) > 0 ? 'Yes' : 'No',
    };

    // savePredictionByEmail writes to localStorage first (offline-safe)
    // then syncs to server – works for ALL users regardless of DB state
    await savePredictionByEmail(user.email, body);

    fetchPredictions(user.email);
    notifyBackendRefresh();
    if (!silent) alert('Prediction saved!');
    return true;
  };

  const age = useMemo(
    () => Math.max(0, CURRENT_YEAR - Number(form.Year_Built || CURRENT_YEAR)),
    [form.Year_Built]
  );

  // ── Polling for training status ──
  const pollTrainingStatus = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/train/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'idle') {
            setIsTraining(false);
            clearInterval(interval);
            alert('ML Models successfully retrained on the new dataset!');
            if (user) fetchPredictions(user.email);
          }
        }
      } catch (err) {
        console.error('Error polling status:', err);
      }
    }, 2000);
  };

  // ── Fetch saved predictions ──
  const fetchPredictions = async (userEmail) => {
    console.log('[DEBUG] fetchPredictions called with email:', userEmail);
    try {
      const res = await fetch(`${API}/api/user/by-email/${userEmail}/predictions`);
      console.log('[DEBUG] fetchPredictions response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('[DEBUG] fetchPredictions data:', data);
        setSavedPredictions(data);
      } else {
        const errorData = await res.json();
        console.log('[DEBUG] fetchPredictions error:', errorData);
      }
    } catch (err) {
      console.error('[DEBUG] Failed to fetch predictions:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPredictions(user.email);
      fetch(`${API}/api/train/status`)
        .then(r => r.json())
        .then(d => { if (d.status === 'training') { setIsTraining(true); pollTrainingStatus(); } })
        .catch(console.error);
    } else {
      setSavedPredictions([]);
    }
  }, [user]);

  useEffect(() => {
    if (!user && currentPage === 'predict') {
      setCurrentPage('home');
      setIsAuthOpen(true);
      window.history.replaceState(null, '', '#login');
    }
  }, [user, currentPage]);

  // ── Startup verification ──
  useEffect(() => {
    try {
      const currentUser = getCurrentUser();
      console.log('[STARTUP] Current user object:', currentUser);
      const currentEmail = getCurrentUserEmail();
      console.log('[STARTUP] Current user email:', currentEmail);
      console.log('[STARTUP] API endpoint:', API);
      console.log('[STARTUP] Email-based endpoints should use:', `/api/user/by-email/${currentEmail}/...`);
      
      // Verify API endpoint returns data
      fetch(`${API}/api/user/by-email/${currentEmail}`)
        .then(res => {
          if (res.ok) {
            console.log('[STARTUP] API endpoint verification: SUCCESS');
          } else {
            console.warn('[STARTUP] API endpoint verification: FAILED with status', res.status);
          }
        })
        .catch(err => {
          console.warn('[STARTUP] API endpoint verification: ERROR', err);
        });
    } catch (err) {
      console.warn('[STARTUP] User not logged in or email missing:', err.message);
    }
  }, []);

  // ── Form value setter ──
  const setValue = (key) => (event) => {
    const val = event.target.value;
    setForm(cur => ({ ...cur, [key]: val }));
    if (key === 'Property_Name') return;
    if (key === 'Year_Built') {
      const calculatedAge = Math.max(0, CURRENT_YEAR - Number(val || CURRENT_YEAR));
      setPredictedAge(calculatedAge);
      setIsAgeStale(false);
    } else {
      setIsAgeStale(true);
    }
    setIsPriceStale(true);
  };

  // ── Auto-fill location from browser GPS ──
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          // Map Nominatim country name to our supported countries list
          const COUNTRY_MAP = {
            'United States': 'United States',
            'USA': 'United States',
            'United Kingdom': 'United Kingdom',
            'UK': 'United Kingdom',
            'Germany': 'Germany',
            'Canada': 'Canada',
            'Australia': 'Australia',
            'Japan': 'Japan',
            'India': 'India',
            'Brazil': 'Brazil',
            'South Africa': 'South Africa',
          };
          const rawCountry = addr.country || 'United States';
          const mappedCountry = COUNTRY_MAP[rawCountry] || 'United States';

          const state  = addr.state || addr.region || '';
          const city   = addr.city || addr.town || addr.village || addr.county || '';
          const postal = addr.postcode || '';

          setForm(cur => ({
            ...cur,
            Country:    mappedCountry,
            State_Region: state,
            City:       city,
            Postal_Code: postal ? Number(postal.replace(/\D/g, '')) || 0 : cur.Postal_Code,
            Latitude:   parseFloat(latitude.toFixed(4)),
            Longitude:  parseFloat(longitude.toFixed(4)),
          }));
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          // At minimum fill lat/lng
          setForm(cur => ({
            ...cur,
            Latitude:  parseFloat(latitude.toFixed(4)),
            Longitude: parseFloat(longitude.toFixed(4)),
          }));
          alert('Location detected but address lookup failed. Coordinates filled in.');
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);
        if (err.code === 1) alert('Location access denied. Please allow location in your browser.');
        else alert('Unable to detect location. Please fill in manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Predict Age ──
  const handlePredictAge = async () => {
    setLoadingAge(true);
    setActiveTab('age');
    try {
      const res = await fetch(`${API}/api/predict/age`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rooms:      Number(form.Bedrooms),
          size:       Number(form.House_Size_sqft),
          material:   form.Construction_Material,
          location:   form.Country,
          renovation: Number(form.Renovation_Count) > 0 ? 'Yes' : 'No',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextAge = data.predictedAge;
        setPredictedAge(nextAge);
        setForm(cur => ({ ...cur, Year_Built: CURRENT_YEAR - nextAge }));
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
  };

  // ── Predict Price (full 37-feature model) ──
  const handlePredictPrice = async () => {
    setLoadingPrice(true);
    setActiveTab('price');
    const country = countries.find(c => c.name === form.Country) || countries[0];
    try {
      const payload = buildPayload(form);
      const res = await fetch(`${API}/api/predict/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const nextPrice = {
          value:    data.value,
          symbol:   data.symbol   || country.symbol,
          currency: data.currency || country.currency,
          rate:     data.rate     || country.rate,
        };
        setPredictedPrice(nextPrice);
        setIsPriceStale(false);
        await savePredictionSnapshot({
          predictedPriceValue: nextPrice.value,
          predictedAgeValue: predictedAge ?? 0,
          predictedDNAValue: predictedDNA ?? 0,
        });
      } else throw new Error(data.detail);
    } catch (err) {
      console.warn('Backend price prediction failed, using local fallback:', err.message);
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
  };

  // ── Predict PropertyDNA ──
  const handlePredictDNA = async () => {
    setLoadingDNA(true);
    setActiveTab('dna');
    try {
      const payload = buildPayload(form);
      const res = await fetch(`${API}/api/predict/dna`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    } catch (err) {
      console.warn('DNA prediction failed:', err.message);
      // Compute a local approximation
      const local = (
        Number(form.Neighborhood_Rating) * 4 +
        Number(form.Market_Demand_Score)  * 3 +
        Number(form.Future_Growth_Score)  * 3
      ) / 10 * 10;
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
  };

  // ── Save prediction ──
  const handleSavePrediction = async () => {
    if (!user) { alert('Please sign in first.'); setIsAuthOpen(true); return; }
    try {
      await savePredictionSnapshot({ silent: false });
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleSaveProperty = async () => {
    if (!user) { alert('Please sign in first.'); setIsAuthOpen(true); return; }
    const propertyName = String(form.Property_Name || '').trim();
    if (!propertyName) {
      alert('Property name required.');
      return;
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
      alert('Property saved to portfolio!');
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };


  // ── Upload CSV for retraining ──
  const handleUploadCsv = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setIsTraining(true);
    try {
      const res = await fetch(`${API}/api/train/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) { alert('CSV uploaded! Retraining in background...'); pollTrainingStatus(); }
      else { alert(`Upload failed: ${data.detail}`); setIsTraining(false); }
    } catch (err) {
      alert(`Upload error: ${err.message}`);
      setIsTraining(false);
    }
  };

  const handleAuthSuccess = (authUser) => {
    // Store only name and email, ignore id field if present
    const userToStore = {
      name: authUser.name,
      email: authUser.email
    };
    setUser(userToStore);
    localStorage.setItem('property_dna_user', JSON.stringify(userToStore));
  };

  const openAuth = () => {
    setIsAuthOpen(true);
    if (window.location.hash !== '#login') {
      window.history.pushState(null, '', '#login');
    }
  };

  const closeAuth = () => {
    setIsAuthOpen(false);
    if (window.location.hash === '#login' || window.location.hash === '#signin') {
      window.history.pushState(null, '', currentPage === 'predict' ? '#predict' : '#home');
    }
  };

  const handleSignOut = () => {
    setUser(null);
    setSavedPredictions([]);
    localStorage.removeItem('property_dna_user');
  };

  const currencySymbol = countries.find(c => c.name === form.Country)?.symbol || '$';

  return (
    <div className="site">
      <Navbar onSignInClick={openAuth} user={user} onSignOutClick={handleSignOut} />
      <main>
        {currentPage === 'predict' ? (
          <div className="predict-page-container">
            <div className="predict-page-header" style={{ padding: '24px 56px 0', maxWidth: '1200px', margin: '0 auto' }}>
              <a href="#home" className="back-btn">
                <ArrowLeft size={16} /> Back to Homepage
              </a>
            </div>
            <section className="contentGrid" aria-label="PropertyDNA Predictor">
              <Predictor
                form={form}
                setValue={setValue}
                predictedAge={predictedAge}
                predictedPrice={predictedPrice}
                predictedDNA={predictedDNA}
                loadingAge={loadingAge}
                loadingPrice={loadingPrice}
                loadingDNA={loadingDNA}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isAgeStale={isAgeStale}
                isPriceStale={isPriceStale}
                locationLoading={locationLoading}
                onGetLocation={handleGetLocation}
                onPredictAge={handlePredictAge}
                onPredictPrice={handlePredictPrice}
                onPredictDNA={handlePredictDNA}
                user={user}
                onSignInClick={openAuth}
                savedPredictions={savedPredictions}
                onSavePrediction={handleSavePrediction}
                onSaveProperty={handleSaveProperty}
                onUploadCsv={handleUploadCsv}
                isTraining={isTraining}
              />
            </section>
          </div>
        ) : (
          <>
            <Hero age={age} year={form.Year_Built} />
            <section className="contentGrid" aria-label="PropertyDNA Predictor">
              <HouseAISection user={user} onSignInClick={openAuth} />
              <HowItWorks currencySymbol={currencySymbol} />
              <WhyItMatters />
            </section>
          </>
        )}
      </main>
      <Footer />
      <AuthModal isOpen={isAuthOpen} onClose={closeAuth} onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}

const Root = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/*" element={<App />} />
      <Route path="/dashboard/*" element={<Dashboard />} />
    </Routes>
  </BrowserRouter>
);

createRoot(document.getElementById('root')).render(<Root />);
