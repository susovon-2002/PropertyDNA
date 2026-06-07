import sqlite3
import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

# Paths
BASE_DIR = os.path.dirname(__file__)
DB_PATH = os.path.join(BASE_DIR, "property_dna.db")
CSV_PATH = os.path.join(BASE_DIR, "dataset.csv")
PRICE_MODEL_PATH = os.path.join(BASE_DIR, "models", "model_price.joblib")
AGE_MODEL_PATH = os.path.join(BASE_DIR, "models", "model_age.joblib")

CURRENT_YEAR = 2026

def load_data():
    # Priority 1: dataset.csv (allows up to 1,000,000 rows upload)
    if os.path.exists(CSV_PATH):
        print(f"Loading data from CSV file: {CSV_PATH}")
        df = pd.read_csv(CSV_PATH)
        # Verify required columns exist
        required_cols = {'year_built', 'rooms', 'size_sqft', 'material', 'location', 'renovation', 'price'}
        if not required_cols.issubset(df.columns):
            missing = required_cols - set(df.columns)
            print(f"Warning: CSV is missing columns {missing}. Falling back to database...")
        else:
            df['age'] = CURRENT_YEAR - df['year_built']
            return df

    # Priority 2: SQLite database properties table
    if os.path.exists(DB_PATH):
        print(f"Loading data from database: {DB_PATH}")
        conn = sqlite3.connect(DB_PATH)
        query = "SELECT year_built, rooms, size_sqft, material, location, renovation, price FROM properties"
        df = pd.read_sql_query(query, conn)
        conn.close()
        df['age'] = CURRENT_YEAR - df['year_built']
        return df

    raise FileNotFoundError("No training data found. Provide backend/dataset.csv or run setup_db.py first.")

def train():
    try:
        os.makedirs(os.path.dirname(PRICE_MODEL_PATH), exist_ok=True)
        print("Loading data for training...")
        df = load_data()
        print(f"Successfully loaded {len(df):,} records.")
        
        # Keep features and target separate
        X_price = df[['year_built', 'rooms', 'size_sqft', 'material', 'location', 'renovation']]
        y_price = df['price']
        
        # Test split (use small test size or none if dataset is extremely small)
        test_size = 0.2 if len(df) > 5 else 0.0
        
        if test_size > 0:
            X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(X_price, y_price, test_size=test_size, random_state=42)
        else:
            X_train_p, y_train_p = X_price, y_price
            X_test_p, y_test_p = X_price, y_price
            
        # Preprocessor for price model
        categorical_features = ['material', 'location', 'renovation']
        numeric_features_price = ['year_built', 'rooms', 'size_sqft']
        
        preprocessor_price = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features_price),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ]
        )
        
        # Using RandomForestRegressor.
        # For huge datasets (e.g. 1M rows), n_jobs=-1 enables parallel CPU usage.
        # max_depth and min_samples_split can be adjusted to save memory on huge data.
        print("Training Price Predictor (Random Forest)...")
        regressor_price = RandomForestRegressor(
            n_estimators=50 if len(df) > 10000 else 100, 
            max_depth=15 if len(df) > 100000 else None,
            n_jobs=-1, 
            random_state=42
        )
        
        price_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor_price),
            ('regressor', regressor_price)
        ])
        
        price_pipeline.fit(X_train_p, y_train_p)
        
        y_pred_p = price_pipeline.predict(X_test_p)
        mae_p = mean_absolute_error(y_test_p, y_pred_p)
        r2_p = r2_score(y_test_p, y_pred_p)
        print(f"Price Model - MAE: {mae_p:.2f}, R2 Score: {r2_p:.4f}")
        
        joblib.dump(price_pipeline, PRICE_MODEL_PATH)
        print(f"Saved price model pipeline to {PRICE_MODEL_PATH}")
        
        # Age model training (omitting year_built from inputs)
        print("\nTraining Age Predictor...")
        X_age = df[['rooms', 'size_sqft', 'material', 'location', 'renovation']]
        y_age = df['age']
        
        if test_size > 0:
            X_train_a, X_test_a, y_train_a, y_test_a = train_test_split(X_age, y_age, test_size=test_size, random_state=42)
        else:
            X_train_a, y_train_a = X_age, y_age
            X_test_a, y_test_a = X_age, y_age
            
        numeric_features_age = ['rooms', 'size_sqft']
        preprocessor_age = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), numeric_features_age),
                ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
            ]
        )
        
        regressor_age = RandomForestRegressor(
            n_estimators=50 if len(df) > 10000 else 100, 
            max_depth=15 if len(df) > 100000 else None,
            n_jobs=-1, 
            random_state=42
        )
        
        age_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor_age),
            ('regressor', regressor_age)
        ])
        
        age_pipeline.fit(X_train_a, y_train_a)
        
        y_pred_a = age_pipeline.predict(X_test_a)
        mae_a = mean_absolute_error(y_test_a, y_pred_a)
        r2_a = r2_score(y_test_a, y_pred_a)
        print(f"Age Model - MAE: {mae_a:.2f} years, R2 Score: {r2_a:.4f}")
        
        joblib.dump(age_pipeline, AGE_MODEL_PATH)
        print(f"Saved age model pipeline to {AGE_MODEL_PATH}")
        print("Training complete successfully!")
        
    except Exception as e:
        print(f"Error during model training: {e}")
        raise e

if __name__ == "__main__":
    train()
