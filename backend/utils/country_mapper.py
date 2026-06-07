COUNTRY_CODES = {

    "India": "IN",
    "USA": "US",
    "Germany": "DE",
    "France": "FR",
    "Italy": "IT",
    "Russia": "RU"
}


def get_country_code(country):

    return COUNTRY_CODES.get(
        country,
        "US"
    )