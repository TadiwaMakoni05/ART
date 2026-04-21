import os
import joblib

class ViralLoadPredictor:
    """
    Singleton wrapper for loading the Random Forest model and making predictions.
    """
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ViralLoadPredictor, cls).__new__(cls)
            cls._instance.model = None
            cls._instance._load_model()
        return cls._instance

    def _load_model(self):
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            model_path = os.path.join(current_dir, 'viral_model.pkl')
            self.model = joblib.load(model_path)
        except Exception as e:
            print(f"Failed to load viral model: {e}")
            self.model = None

    def predict(self, adherence_rate, missed_doses, time_on_art_months, previous_viral_load):
        if self.model is None:
            raise Exception("Model is not loaded.")
        
        # Order of features must match the training script
        # [adherence_rate, missed_doses, time_on_art_months, previous_viral_load]
        features = [[
            float(adherence_rate),
            float(missed_doses),
            float(time_on_art_months),
            float(previous_viral_load)
        ]]
        
        prediction = self.model.predict(features)
        
        if prediction[0] == 1:
            return "Suppressed"
        return "Not Suppressed"

# Expose a ready-to-use instance or function
predictor = ViralLoadPredictor()

def predict_viral_load(adherence_rate, missed_doses, time_on_art_months, previous_viral_load):
    return predictor.predict(
        adherence_rate=adherence_rate,
        missed_doses=missed_doses,
        time_on_art_months=time_on_art_months,
        previous_viral_load=previous_viral_load
    )
