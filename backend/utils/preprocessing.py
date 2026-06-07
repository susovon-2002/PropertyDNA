import pandas as pd
import pandas.api.types as ptypes


def clean_data(df):

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Fill missing values
    for col in df.columns:

        # Treat object dtype AND any string dtype (e.g. arrow-backed StringDtype)
        # as categorical — fill with mode.
        if ptypes.is_string_dtype(df[col]) or ptypes.is_object_dtype(df[col]):

            mode_vals = df[col].mode()
            if not mode_vals.empty:
                df[col] = df[col].fillna(mode_vals[0])

        elif ptypes.is_numeric_dtype(df[col]):

            df[col] = df[col].fillna(df[col].median())

        # For any other dtype (bool, datetime, etc.) skip filling

    return df