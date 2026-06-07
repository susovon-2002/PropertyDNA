import pandas as pd
import numpy as np

CURRENT_YEAR = 2026


def create_features(df):
    # Rename columns from dataset.csv if they exist in lowercase
    rename_dict = {
        "year_built": "Year_Built",
        "rooms": "Bedrooms",
        "size_sqft": "House_Size_sqft",
        "material": "Construction_Material",
        "location": "Country",
        "price": "House_Price"
    }

    # Apply rename to copy/original dataframe
    for old_col, new_col in rename_dict.items():
        if old_col in df.columns and new_col not in df.columns:
            df[new_col] = df[old_col]

    # Calculate House_Age
    if "Year_Built" in df.columns:
        df["House_Age"] = CURRENT_YEAR - df["Year_Built"]
    else:
        df["House_Age"] = 0

    # Derive Renovation features from raw renovation column if present
    if "renovation" in df.columns:
        df["Renovation_Year"] = df["renovation"].apply(
            lambda x: 2020 if str(x).strip().lower() == "yes" else 0
        )
        df["Renovation_Count"] = df["renovation"].apply(
            lambda x: 1 if str(x).strip().lower() == "yes" else 0
        )
    else:
        if "Renovation_Year" not in df.columns:
            df["Renovation_Year"] = 0
        if "Renovation_Count" not in df.columns:
            df["Renovation_Count"] = 0

    # Categorical and numerical lists of columns to ensure all 38 columns exist
    categorical_cols = [
        "Country",
        "State_Region",
        "City",
        "Postal_Code",
        "Property_Type",
        "Construction_Material",
        "Roof_Type",
        "Energy_Rating",
        "Internet_Speed_Availability",
        "Investment_Rating",
    ]

    numerical_cols = [
        "Latitude",
        "Longitude",
        "Year_Built",
        "House_Age",
        "House_Size_sqft",
        "Lot_Size_sqft",
        "Bedrooms",
        "Bathrooms",
        "Floors",
        "Garage_Size",
        "Garden_Area",
        "Swimming_Pool",
        "Elevator",
        "Renovation_Year",
        "Renovation_Count",
        "Distance_to_School_km",
        "Distance_to_Hospital_km",
        "Distance_to_City_Center_km",
        "Crime_Index",
        "Market_Demand_Score",
        "Neighborhood_Rating",
        "Public_Transport_Score",
        "Flood_Risk",
        "Earthquake_Risk",
        "Air_Quality_Index",
        "Noise_Level",
        "Future_Growth_Score",
    ]

    # Fill in default values for any missing columns
    for col in categorical_cols:
        if col not in df.columns:
            df[col] = "Unknown"

    for col in numerical_cols:
        if col not in df.columns:
            df[col] = 0.0

    # Calculate PropertyDNA_Score target for the DNA model
    if "PropertyDNA_Score" not in df.columns:
        # Score calculation out of 100
        scores = []
        for _, row in df.iterrows():
            score = 50.0
            # Size contribution
            size = row.get("House_Size_sqft", 0)
            score += min(15.0, (float(size) / 5000.0) * 15.0)
            # Rooms contribution
            rooms = row.get("Bedrooms", 0)
            score += min(10.0, float(rooms) * 1.5)
            # Age depreciation (newer is better)
            age = row.get("House_Age", 0)
            score += max(0.0, 15.0 - (float(age) * 0.2))
            # Material premium
            material = str(row.get("Construction_Material", ""))
            mat_scores = {
                "Stone": 10.0,
                "Brick": 8.0,
                "Concrete": 5.0,
                "Wood": 2.0,
            }
            score += mat_scores.get(material, 0.0)
            # Renovation bonus
            if row.get("Renovation_Count", 0) > 0:
                score += 10.0
            scores.append(min(100.0, max(0.0, score)))
        df["PropertyDNA_Score"] = scores

    return df