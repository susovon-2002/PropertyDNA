CITY_COUNTRY = {

    "Mumbai": "India",
    "Delhi": "India",

    "New York": "USA",
    "Los Angeles": "USA",

    "Berlin": "Germany",

    "Paris": "France",

    "Rome": "Italy",

    "Moscow": "Russia"
}


def get_country(city):

    return CITY_COUNTRY.get(
        city,
        "USA"
    )