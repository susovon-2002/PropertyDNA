"""
generate_dataset.py
-------------------
Generates a realistic synthetic dataset (dataset.csv) for training the
house age and price prediction models.

All prices are in USD. The frontend applies the per-country rate to
convert for display. This keeps the ML model simple: it always predicts in USD.

Realistic USD price formula:
  base_price = size_sqft * base_rate_usd_per_sqft[location]
  material_factor: Stone=1.25, Brick=1.15, Concrete=1.00, Wood=0.85
  room_premium: rooms * 8000
  renovation_boost: +12% if Yes
  age_depreciation: -0.4% per year of age (max -25%)
  noise: +/-10% random variation

Run:  python generate_dataset.py
"""

import random
import csv
import os

random.seed(42)

CURRENT_YEAR = 2026

# Realistic USD per-sqft base rates for each country (normalised to USD)
LOCATION_BASE_USD = {
    'United States':  195,
    'United Kingdom': 220,
    'Germany':        180,
    'Canada':         165,
    'Australia':      210,
    'Japan':          155,
    'India':           45,
    'Brazil':          70,
    'South Africa':    80,
}

MATERIAL_FACTOR = {
    'Stone':    1.25,
    'Brick':    1.15,
    'Concrete': 1.00,
    'Wood':     0.85,
}

MATERIALS   = list(MATERIAL_FACTOR.keys())
LOCATIONS   = list(LOCATION_BASE_USD.keys())
RENOVATIONS = ['Yes', 'No']


def generate_row():
    location   = random.choice(LOCATIONS)
    material   = random.choice(MATERIALS)
    renovation = random.choice(RENOVATIONS)
    year_built = random.randint(1950, 2023)
    rooms      = random.randint(1, 8)
    size_sqft  = round(random.uniform(400, 5000), 1)

    age = CURRENT_YEAR - year_built

    base_rate   = LOCATION_BASE_USD[location]
    mat_factor  = MATERIAL_FACTOR[material]
    room_prem   = rooms * 8000
    reno_boost  = 1.12 if renovation == 'Yes' else 1.00
    age_depr    = max(0.75, 1.0 - age * 0.004)   # capped at -25%

    price = (size_sqft * base_rate * mat_factor + room_prem) * reno_boost * age_depr
    # Add ±10% random noise
    noise = random.uniform(0.90, 1.10)
    price = round(price * noise, 2)

    return {
        'year_built': year_built,
        'rooms':      rooms,
        'size_sqft':  size_sqft,
        'material':   material,
        'location':   location,
        'renovation': renovation,
        'price':      price,
    }


def main(n=5000):
    out_path = os.path.join(os.path.dirname(__file__), 'dataset.csv')
    fieldnames = ['year_built', 'rooms', 'size_sqft', 'material', 'location', 'renovation', 'price']

    with open(out_path, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for _ in range(n):
            writer.writerow(generate_row())

    print(f"Generated {n} rows -> {out_path}")


if __name__ == '__main__':
    main()
