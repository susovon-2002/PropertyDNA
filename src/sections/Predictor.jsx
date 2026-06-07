import {
  Activity, AlertTriangle, BarChart3, BedDouble, BookmarkPlus, BrickWall, Building2,
  CalendarDays, Car, ChevronUp, Clock3, Coins, Droplets,
  Globe2, Hammer, House, Layers, Lightbulb, LocateFixed, MapPin,
  Navigation, Ruler, Shield, Sparkles, Train, TreePine,
  TrendingUp, UploadCloud, Waves, Wifi, Wind, Zap
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect.jsx';
import Field from '../components/Field.jsx';
import { CURRENT_YEAR } from '../utils/constants.js';

const PROPERTY_TYPES   = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Villa', 'Apartment'];
const MATERIALS        = ['Brick', 'Wood', 'Concrete', 'Stone', 'Steel', 'Mixed'];
const ROOF_TYPES       = ['Asphalt Shingle', 'Metal', 'Tile', 'Flat', 'Wood Shake', 'Slate'];
const ENERGY_RATINGS   = ['A+', 'A', 'B', 'C', 'D', 'E', 'F'];
const INVESTMENT_RTGS  = ['Excellent', 'Good', 'Fair', 'Poor'];
const YES_NO           = ['Yes', 'No'];
const COUNTRIES        = [
  'United States', 'United Kingdom', 'Germany', 'Canada',
  'Australia', 'Japan', 'India', 'Brazil', 'South Africa'
];

function SectionHeader({ icon: Icon, number, title, color = '#0e9a6b' }) {
  return (
    <div className="dnaSection-header">
      <div className="dnaSection-num" style={{ background: color + '18', color }}>
        <Icon size={18} />
      </div>
      <div>
        <span className="dnaSection-label">Section {number}</span>
        <h3 className="dnaSection-title">{title}</h3>
      </div>
    </div>
  );
}

export default function Predictor({
  form, setValue,
  predictedAge, predictedPrice, predictedDNA,
  loadingAge, loadingPrice, loadingDNA,
  locationLoading, onGetLocation,
  activeTab, setActiveTab,
  isAgeStale, isPriceStale,
  onPredictAge, onPredictPrice, onPredictDNA,
  user, onSignInClick,
  savedPredictions, onSavePrediction,
  onSaveProperty,
  onUploadCsv, isTraining
}) {
  const age = CURRENT_YEAR - Number(form.Year_Built || 2010);
  const progress = Math.min(100, Math.max(8, age * 4));
  const anyLoading = loadingAge || loadingPrice || loadingDNA;
  const propertyName = String(form.Property_Name || '').trim();
  const hasAllPredictions = predictedAge !== null && predictedPrice !== null && predictedDNA !== null;
  const snapshotFresh = !isAgeStale && !isPriceStale;
  const canSaveProperty = Boolean(propertyName) && hasAllPredictions && snapshotFresh;

  return (
    <article id="predictor" className="panel predictor dnaPredictor">
      <div className="predictorIntro">
        <div className="introIcon"><House size={38} /></div>
        <div>
          <h2>Predict House Price &amp; House Age with PropertyDNA</h2>
        </div>
      </div>

      <div className="propertyNameCard">
        <div>
          <span className="propertyNameLabel">Property Name</span>
        </div>
        <div className="propertyNameField">
          <House size={16} />
          <input
            value={form.Property_Name}
            onChange={setValue('Property_Name')}
            placeholder="e.g. Sunset Villa"
            aria-label="Property name"
          />
        </div>
      </div>

      <div className="dnaLayout">
        {/* ── LEFT: FORM ── */}
        <div className="dnaFormCol">

          {/* SECTION 1: Location */}
          <div className="dnaSection">
            <div className="dnaSection-headerRow">
              <SectionHeader icon={MapPin} number={1} title="Location Information" color="#3b82f6" />
              <button
                type="button"
                className={`gpsBtn ${locationLoading ? 'gpsBtn--loading' : ''}`}
                onClick={onGetLocation}
                disabled={locationLoading}
                title="Auto-fill from my current location"
              >
                {locationLoading
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Detecting...</>
                  : <><LocateFixed size={14} /> Use My Location</>}
              </button>
            </div>
            <div className="dnaGrid3">
              <Field label="Country" icon={Globe2}>
                <CustomSelect ariaLabel="Country" value={form.Country} options={COUNTRIES} onChange={setValue('Country')} />
              </Field>
              <Field label="State / Region" icon={MapPin}>
                <input value={form.State_Region} onChange={setValue('State_Region')} placeholder="e.g. California" />
              </Field>
              <Field label="City" icon={Navigation}>
                <input value={form.City} onChange={setValue('City')} placeholder="e.g. Los Angeles" />
              </Field>
              <Field label="Postal Code" icon={MapPin}>
                <input value={form.Postal_Code} onChange={setValue('Postal_Code')} type="number" placeholder="90001" />
              </Field>
              <Field label="Latitude" icon={Navigation}>
                <input value={form.Latitude} onChange={setValue('Latitude')} type="number" step="0.0001" placeholder="34.0522" />
              </Field>
              <Field label="Longitude" icon={Navigation}>
                <input value={form.Longitude} onChange={setValue('Longitude')} type="number" step="0.0001" placeholder="-118.2437" />
              </Field>
            </div>
          </div>

          {/* SECTION 2: Property Information */}
          <div className="dnaSection">
            <SectionHeader icon={House} number={2} title="Property Information" color="#0e9a6b" />
            <div className="dnaGrid3">
              <Field label="Year Built" icon={CalendarDays}>
                <input value={form.Year_Built} onChange={setValue('Year_Built')} type="number" min="1800" max={CURRENT_YEAR} />
              </Field>
              <Field label="Property Type" icon={Building2}>
                <CustomSelect ariaLabel="Property type" value={form.Property_Type} options={PROPERTY_TYPES} onChange={setValue('Property_Type')} />
              </Field>
              <Field label="House Size (sqft)" icon={Ruler}>
                <input value={form.House_Size_sqft} onChange={setValue('House_Size_sqft')} type="number" min="100" />
                <span className="inputSuffix">sqft</span>
              </Field>
              <Field label="Lot Size (sqft)" icon={Ruler}>
                <input value={form.Lot_Size_sqft} onChange={setValue('Lot_Size_sqft')} type="number" min="0" />
                <span className="inputSuffix">sqft</span>
              </Field>
              <Field label="Bedrooms" icon={BedDouble}>
                <input value={form.Bedrooms} onChange={setValue('Bedrooms')} type="number" min="1" max="20" />
              </Field>
              <Field label="Bathrooms" icon={Droplets}>
                <input value={form.Bathrooms} onChange={setValue('Bathrooms')} type="number" min="1" max="20" />
              </Field>
              <Field label="Floors" icon={Layers}>
                <input value={form.Floors} onChange={setValue('Floors')} type="number" min="1" max="100" />
              </Field>
              <Field label="Garage Size (cars)" icon={Car}>
                <input value={form.Garage_Size} onChange={setValue('Garage_Size')} type="number" min="0" max="10" />
              </Field>
              <Field label="Garden Area (sqft)" icon={TreePine}>
                <input value={form.Garden_Area} onChange={setValue('Garden_Area')} type="number" min="0" />
                <span className="inputSuffix">sqft</span>
              </Field>
              <Field label="Swimming Pool" icon={Waves}>
                <CustomSelect ariaLabel="Swimming pool" value={form.Swimming_Pool} options={YES_NO} onChange={setValue('Swimming_Pool')} />
              </Field>
              <Field label="Elevator" icon={ChevronUp}>
                <CustomSelect ariaLabel="Elevator" value={form.Elevator} options={YES_NO} onChange={setValue('Elevator')} />
              </Field>
            </div>
          </div>

          {/* SECTION 3: Construction Details */}
          <div className="dnaSection">
            <SectionHeader icon={BrickWall} number={3} title="Construction Details" color="#8b5cf6" />
            <div className="dnaGrid3">
              <Field label="Construction Material" icon={BrickWall}>
                <CustomSelect ariaLabel="Material" value={form.Construction_Material} options={MATERIALS} onChange={setValue('Construction_Material')} />
              </Field>
              <Field label="Roof Type" icon={House}>
                <CustomSelect ariaLabel="Roof type" value={form.Roof_Type} options={ROOF_TYPES} onChange={setValue('Roof_Type')} />
              </Field>
              <Field label="Energy Rating" icon={Zap}>
                <CustomSelect ariaLabel="Energy rating" value={form.Energy_Rating} options={ENERGY_RATINGS} onChange={setValue('Energy_Rating')} />
              </Field>
              <Field label="Renovation Year" icon={Hammer}>
                <input value={form.Renovation_Year} onChange={setValue('Renovation_Year')} type="number" min="1900" max={CURRENT_YEAR} />
              </Field>
              <Field label="Renovation Count" icon={Hammer}>
                <input value={form.Renovation_Count} onChange={setValue('Renovation_Count')} type="number" min="0" max="20" />
              </Field>
            </div>
          </div>

          {/* SECTION 4: Accessibility & Infrastructure */}
          <div className="dnaSection">
            <SectionHeader icon={Train} number={4} title="Accessibility &amp; Infrastructure" color="#f59e0b" />
            <div className="dnaGrid3">
              <Field label="Distance to School (km)" icon={Navigation}>
                <input value={form.Distance_to_School_km} onChange={setValue('Distance_to_School_km')} type="number" step="0.1" min="0" />
                <span className="inputSuffix">km</span>
              </Field>
              <Field label="Distance to Hospital (km)" icon={Navigation}>
                <input value={form.Distance_to_Hospital_km} onChange={setValue('Distance_to_Hospital_km')} type="number" step="0.1" min="0" />
                <span className="inputSuffix">km</span>
              </Field>
              <Field label="Distance to City Center (km)" icon={Navigation}>
                <input value={form.Distance_to_City_Center_km} onChange={setValue('Distance_to_City_Center_km')} type="number" step="0.1" min="0" />
                <span className="inputSuffix">km</span>
              </Field>
              <Field label="Public Transport Score" icon={Train}>
                <input value={form.Public_Transport_Score} onChange={setValue('Public_Transport_Score')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
            </div>
          </div>

          {/* SECTION 5: Market & Environment */}
          <div className="dnaSection">
            <SectionHeader icon={TrendingUp} number={5} title="Market &amp; Environment" color="#ef4444" />
            <div className="dnaGrid3">
              <Field label="Crime Index" icon={Shield}>
                <input value={form.Crime_Index} onChange={setValue('Crime_Index')} type="number" step="0.1" min="0" max="100" />
                <span className="inputSuffix">/ 100</span>
              </Field>
              <Field label="Market Demand Score" icon={TrendingUp}>
                <input value={form.Market_Demand_Score} onChange={setValue('Market_Demand_Score')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
              <Field label="Neighborhood Rating" icon={BarChart3}>
                <input value={form.Neighborhood_Rating} onChange={setValue('Neighborhood_Rating')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
              <Field label="Internet Speed (Mbps)" icon={Wifi}>
                <input value={form.Internet_Speed_Availability} onChange={setValue('Internet_Speed_Availability')} type="number" step="1" min="0" />
                <span className="inputSuffix">Mbps</span>
              </Field>
              <Field label="Flood Risk" icon={Waves}>
                <input value={form.Flood_Risk} onChange={setValue('Flood_Risk')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
              <Field label="Earthquake Risk" icon={AlertTriangle}>
                <input value={form.Earthquake_Risk} onChange={setValue('Earthquake_Risk')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
              <Field label="Air Quality Index" icon={Wind}>
                <input value={form.Air_Quality_Index} onChange={setValue('Air_Quality_Index')} type="number" step="0.1" min="0" max="500" />
              </Field>
              <Field label="Noise Level (dB)" icon={Activity}>
                <input value={form.Noise_Level} onChange={setValue('Noise_Level')} type="number" step="0.1" min="0" max="120" />
                <span className="inputSuffix">dB</span>
              </Field>
              <Field label="Future Growth Score" icon={TrendingUp}>
                <input value={form.Future_Growth_Score} onChange={setValue('Future_Growth_Score')} type="number" step="0.1" min="0" max="10" />
                <span className="inputSuffix">/ 10</span>
              </Field>
              <Field label="Investment Rating" icon={BarChart3}>
                <CustomSelect ariaLabel="Investment rating" value={form.Investment_Rating} options={INVESTMENT_RTGS} onChange={setValue('Investment_Rating')} />
              </Field>
            </div>
          </div>


          {/* ACTION BUTTONS */}
          <div className="predictActions dnaActions">
            <div className="actionBtnWrapper">
              <button
                className={`predictBtn ageBtn ${anyLoading ? 'disabled' : ''}`}
                type="button"
                onClick={onPredictAge}
                disabled={anyLoading}
              >
                {loadingAge ? <><span className="spinner" /> Calculating...</> : <><Sparkles size={18} /> Predict House Age</>}
              </button>
              {isAgeStale && <span className="staleBadge">● Change detected</span>}
            </div>

            <div className="actionBtnWrapper">
              <button
                className={`predictBtn priceBtn ${anyLoading ? 'disabled' : ''}`}
                type="button"
                onClick={onPredictPrice}
                disabled={anyLoading}
              >
                {loadingPrice ? <><span className="spinner" /> Calculating...</> : <><Coins size={18} /> Predict Price</>}
              </button>
              {isPriceStale && <span className="staleBadge">● Change detected</span>}
            </div>

            <div className="actionBtnWrapper">
              <button
                className={`predictBtn dnaBtn ${anyLoading ? 'disabled' : ''}`}
                type="button"
                onClick={onPredictDNA}
                disabled={anyLoading}
              >
                {loadingDNA ? <><span className="spinner" /> Calculating...</> : <><Zap size={18} /> PropertyDNA Score</>}
              </button>
            </div>
          </div>

          <div className="savePropertyPanel">
            <div>
              <span className="savePropertyLabel">Portfolio</span>
              <h4>Save Property</h4>
            </div>
            <button
              type="button"
              className="savePropertyBtn"
              onClick={onSaveProperty}
              disabled={!user || anyLoading || !canSaveProperty}
            >
              <BookmarkPlus size={16} />
              Save Property
            </button>
          </div>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <aside className="resultCard dnaResultCard">
          <div className="resultTabs">
            <button className={`tabBtn ${activeTab === 'age' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('age')}>
              <Clock3 size={15} /> Age
            </button>
            <button className={`tabBtn ${activeTab === 'price' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('price')}>
              <Coins size={15} /> Price
            </button>
            <button className={`tabBtn ${activeTab === 'dna' ? 'active' : ''}`} type="button" onClick={() => setActiveTab('dna')}>
              <Zap size={15} /> DNA
            </button>
          </div>

          <div className="tabContent">
            {anyLoading ? (
              <div className="tabLoader">
                <div className="loaderPulse">
                  <Sparkles className="spinningIcon" size={32} />
                  <span>Analyzing Property Details...</span>
                  <p>Running XGBoost regression model</p>
                </div>
              </div>

            ) : activeTab === 'age' && predictedAge === null ? (
              <div className="emptyState">
                <Sparkles size={38} className="emptyState-icon" />
                <h4>No Prediction Yet</h4>
                <p>Age result will appear here.</p>
              </div>

            ) : activeTab === 'price' && predictedPrice === null ? (
              <div className="emptyState">
                <Coins size={38} className="emptyState-icon" />
                <h4>No Valuation Yet</h4>
                <p>Price result will appear here.</p>
              </div>

            ) : activeTab === 'dna' && predictedDNA === null ? (
              <div className="emptyState">
                <Zap size={38} className="emptyState-icon" />
                <h4>No DNA Score Yet</h4>
                <p>DNA score will appear here.</p>
              </div>

            ) : activeTab === 'age' ? (
              <div className="fadeContent">
                <div className="resultHeader">
                  <span><TrendingUp size={20} /></span>
                  <h3>Predicted Age</h3>
                </div>
                <div className="ageDial" style={{ '--progress': `${progress}%` }}>
                  <div>
                    <strong key={predictedAge}>{predictedAge}</strong>
                    <b>Years</b>
                  </div>
                </div>
                <div className="resultFacts">
                  <p><CalendarDays size={22} /> Built in: <b>{form.Year_Built || 2010}</b></p>
                  <p><Clock3 size={22} /> Current Year: <b>{CURRENT_YEAR}</b></p>
                </div>
              </div>

            ) : activeTab === 'price' ? (
              <div className="fadeContent">
                <div className="resultHeader priceHeader">
                  <span><Coins size={20} /></span>
                  <h3>Estimated Value</h3>
                </div>
                <div className="priceDisplay">
                  <span className="priceCurrency">{predictedPrice.symbol}</span>
                  <strong className="priceValue" key={predictedPrice.value}>
                    {predictedPrice.value.toLocaleString()}
                  </strong>
                  <span className="priceCode">{predictedPrice.currency}</span>
                </div>
                <div className="priceRange">
                  <span>Valuation Range:</span>
                  <strong>
                    {predictedPrice.symbol}{Math.round(predictedPrice.value * 0.92).toLocaleString()} –&nbsp;
                    {predictedPrice.symbol}{Math.round(predictedPrice.value * 1.08).toLocaleString()}
                  </strong>
                </div>
                <div className="breakdownBox">
                  <h4>Key Inputs</h4>
                  <div className="breakdownList">
                    <div className="breakdownItem"><span>Location:</span><strong>{form.Country}, {form.City}</strong></div>
                    <div className="breakdownItem"><span>Size:</span><strong>{Number(form.House_Size_sqft || 0).toLocaleString()} sqft</strong></div>
                    <div className="breakdownItem"><span>Bedrooms:</span><strong>{form.Bedrooms}</strong></div>
                    <div className="breakdownItem"><span>Material:</span><strong>{form.Construction_Material}</strong></div>
                    <div className="breakdownItem"><span>Energy Rating:</span><strong>{form.Energy_Rating}</strong></div>
                    <div className="breakdownItem"><span>Neighborhood:</span><strong>{form.Neighborhood_Rating} / 10</strong></div>
                  </div>
                </div>
              </div>

            ) : activeTab === 'dna' ? (
              <div className="fadeContent">
                <div className="resultHeader dnaHeader">
                  <span><Zap size={20} /></span>
                  <h3>PropertyDNA™ Score</h3>
                </div>
                <div className="dnaScoreRing" style={{ '--dna-pct': `${Math.min(100, predictedDNA)}%` }}>
                  <div className="dnaScoreInner">
                    <strong key={predictedDNA}>{predictedDNA.toFixed(1)}</strong>
                    <b>/ 100</b>
                  </div>
                </div>
                <div className="dnaRating">
                  {predictedDNA >= 80 ? '🏆 Excellent' : predictedDNA >= 60 ? '✅ Good' : predictedDNA >= 40 ? '⚠️ Fair' : '❌ Poor'}
                </div>
                <div className="dnaBreakdown">
                  <h4>Score Components</h4>
                  <div className="dnaBar"><span>Location</span><div className="dnaBarFill" style={{ width: `${Math.min(100, form.Neighborhood_Rating * 10)}%` }} /></div>
                  <div className="dnaBar"><span>Infrastructure</span><div className="dnaBarFill" style={{ width: `${Math.min(100, form.Public_Transport_Score * 10)}%` }} /></div>
                  <div className="dnaBar"><span>Safety</span><div className="dnaBarFill" style={{ width: `${Math.max(0, 100 - form.Crime_Index)}%` }} /></div>
                  <div className="dnaBar"><span>Growth Potential</span><div className="dnaBarFill" style={{ width: `${Math.min(100, form.Future_Growth_Score * 10)}%` }} /></div>
                </div>
              </div>

            ) : null}
          </div>
        </aside>

      </div>
    </article>
  );
}
