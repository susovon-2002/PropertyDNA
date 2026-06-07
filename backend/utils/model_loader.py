import os
import joblib

BASE_DIR = os.path.dirname(
    os.path.dirname(__file__)
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)


def load_price_model():

    return joblib.load(
        os.path.join(
            MODELS_DIR,
            "model_price.joblib"
        )
    )


def load_dna_model():

    return joblib.load(
        os.path.join(
            MODELS_DIR,
            "model_dna.joblib"
        )
    )