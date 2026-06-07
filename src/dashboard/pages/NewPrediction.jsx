import { Sparkles } from "lucide-react";
import Predictor from "../../sections/Predictor.jsx";
import { useUser } from "../../utils/UserContext";
import { usePredictor } from "../../utils/usePredictor.js";
import { useDashboard } from "../context/DashboardContext";
import EmptyState from "../components/EmptyState.jsx";

export default function NewPrediction() {
  const { user } = useUser();
  const { addNotification } = useDashboard();

  const predictor = usePredictor(user, {
    onNotify: (message, type) => addNotification(message, type),
  });

  if (!user) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Sign in to make predictions"
        description="Create an account to run Price, Age, and DNA analysis."
        actionLabel="Sign in"
        actionTo="/#login"
      />
    );
  }

  return (
    <div className="dashboard-predict-page">
      <div className="page-header">
        <div>
          <p className="page-kicker">
            <Sparkles size={14} />
            Prediction workflow
          </p>
          <h2 className="page-title">New Property Prediction</h2>
          <p className="page-subtitle">
            Run Price, Age, and DNA predictions without leaving your dashboard.
          </p>
        </div>
      </div>

      <section className="dashboard-predictor-wrap">
        <Predictor
          form={predictor.form}
          setValue={predictor.setValue}
          predictedAge={predictor.predictedAge}
          predictedPrice={predictor.predictedPrice}
          predictedDNA={predictor.predictedDNA}
          loadingAge={predictor.loadingAge}
          loadingPrice={predictor.loadingPrice}
          loadingDNA={predictor.loadingDNA}
          activeTab={predictor.activeTab}
          setActiveTab={predictor.setActiveTab}
          isAgeStale={predictor.isAgeStale}
          isPriceStale={predictor.isPriceStale}
          locationLoading={predictor.locationLoading}
          onGetLocation={predictor.handleGetLocation}
          onPredictAge={predictor.handlePredictAge}
          onPredictPrice={predictor.handlePredictPrice}
          onPredictDNA={predictor.handlePredictDNA}
          user={user}
          onSignInClick={() => {}}
          savedPredictions={predictor.savedPredictions}
          onSavePrediction={predictor.handleSavePrediction}
          onSaveProperty={predictor.handleSaveProperty}
          onUploadCsv={predictor.handleUploadCsv}
          isTraining={predictor.isTraining}
        />
      </section>
    </div>
  );
}
