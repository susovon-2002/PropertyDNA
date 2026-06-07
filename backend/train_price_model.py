import os
import time
import joblib
import pandas.api.types as ptypes
import pandas as pd

from xgboost import XGBRegressor

from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import OneHotEncoder

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

from sklearn.model_selection import train_test_split

from sklearn.metrics import mean_absolute_error
from sklearn.metrics import r2_score

from utils.preprocessing import clean_data
from utils.feature_engineering import create_features

from config.feature_mapping import PRICE_FEATURES
from config.feature_mapping import PRICE_TARGET


BASE_DIR = os.path.dirname(__file__)

DATASET_PATH = os.path.join(
    BASE_DIR,
    "data",
    "raw",
    "dataset.csv"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

os.makedirs(MODEL_DIR, exist_ok=True)

print("Loading dataset...")
df = pd.read_csv(
    DATASET_PATH,
    sep="\t"
)
print(f"  Rows: {len(df):,}  Cols: {len(df.columns)}")

print("Cleaning data...")
df = clean_data(df)

print("Engineering features...")
df = create_features(df)

X = df[PRICE_FEATURES]
y = df[PRICE_TARGET]

# Use ptypes to avoid Pandas4Warning with select_dtypes
categorical_cols = [
    c for c in X.columns
    if ptypes.is_string_dtype(X[c]) or ptypes.is_object_dtype(X[c])
]

numeric_cols = [
    c for c in X.columns
    if ptypes.is_numeric_dtype(X[c])
]

print(f"  Numeric features : {len(numeric_cols)}")
print(f"  Categorical features: {len(categorical_cols)}")

preprocessor = ColumnTransformer(
    [
        (
            "num",
            StandardScaler(),
            numeric_cols
        ),
        (
            "cat",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=False
            ),
            categorical_cols
        )
    ]
)

models = {
    "linear":
        LinearRegression(),

    "decision_tree":
        DecisionTreeRegressor(
            random_state=42
        ),

    # n_jobs=-1 uses all CPU cores — much faster on large datasets
    "random_forest":
        RandomForestRegressor(
            n_estimators=100,
            n_jobs=-1,
            random_state=42
        ),

    # Reduced depth & estimators for speed; still accurate
    "xgboost":
        XGBRegressor(
            n_estimators=200,
            learning_rate=0.1,
            max_depth=6,
            n_jobs=-1,
            tree_method="hist",   # fast histogram-based method
            random_state=42,
            verbosity=0
        )
}

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print(f"\nTraining on {len(X_train):,} samples, testing on {len(X_test):,} samples\n")

best_score = -999
best_model = None
results = {}

for name, model in models.items():

    print(f"\nStarting {name}...", flush=True)
    t0 = time.time()

    pipe = Pipeline(
        [
            ("prep", preprocessor),
            ("model", model)
        ]
    )

    pipe.fit(
        X_train,
        y_train
    )
    print(f"{name} training completed  ({time.time()-t0:.1f}s)", flush=True)

    pred = pipe.predict(X_test)
    print(f"{name} prediction completed", flush=True)

    r2 = r2_score(
        y_test,
        pred
    )

    mae = mean_absolute_error(
        y_test,
        pred
    )

    elapsed = time.time() - t0
    results[name] = {"R2": r2, "MAE": mae}

    print(f"[{name}]  R2={r2:.4f}  MAE={mae:,.0f}  ({elapsed:.1f}s)\n", flush=True)

    if r2 > best_score:
        best_score = r2
        best_model = pipe
        best_name = name

print("=" * 50)
print(f"Best model: {best_name}  (R2={best_score:.4f})")
print("=" * 50)

out_path = os.path.join(MODEL_DIR, "model_price.joblib")
joblib.dump(best_model, out_path)
print(f"Saved to: {out_path}")