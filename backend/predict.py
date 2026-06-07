import os
import joblib
import pandas as pd
from config.feature_mapping import PRICE_FEATURES

CURRENT_YEAR = 2026

BASE_DIR = os.path.dirname(__file__)

PRICE_MODEL = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "model_price.joblib"
    )
)

DNA_MODEL = joblib.load(
    os.path.join(
        BASE_DIR,
        "models",
        "model_dna.joblib"
    )
)


def predict_property(data):
    # Make a copy of data to avoid modifying the caller's input
    data = dict(data)

    year_built = data.get("Year_Built", CURRENT_YEAR)
    age = CURRENT_YEAR - year_built
    data["House_Age"] = age

    # Default categories vs numeric features mapping
    categorical_cols = {
        "Country", "State_Region", "City", "Postal_Code", "Property_Type",
        "Construction_Material", "Roof_Type", "Energy_Rating",
        "Internet_Speed_Availability", "Investment_Rating"
    }

    # Ensure all expected features are present in the dictionary
    for col in PRICE_FEATURES:
        if col not in data:
            if col in categorical_cols:
                data[col] = "Unknown"
            else:
                data[col] = 0.0

    df = pd.DataFrame([data])
    # Ensure correct column order
    df = df[PRICE_FEATURES]

    price = PRICE_MODEL.predict(df)[0]
    dna_score = DNA_MODEL.predict(df)[0]

    return {
        "predicted_age": round(age),
        "predicted_price": round(price, 2),
        "property_dna_score": round(dna_score, 2)
    }