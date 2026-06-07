from city_pricing import get_city_rate


def enrich_features(data):

    city_rate = get_city_rate(
        data["City"]
    )

    data["City_Base_Rate"] = city_rate

    return data