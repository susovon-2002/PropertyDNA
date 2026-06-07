CURRENT_YEAR = 2026


def calculate_age(year_built):
    return CURRENT_YEAR - year_built


def calculate_property_dna_score(
    market_demand_score,
    neighborhood_rating,
    year_built
):
    house_age = calculate_age(year_built)

    age_component = max(
        0,
        100 - min(house_age, 100)
    )

    score = (
        0.4 * market_demand_score +
        0.4 * neighborhood_rating +
        0.2 * age_component
    )

    return round(score, 2)