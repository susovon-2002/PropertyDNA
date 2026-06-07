COUNTRY_PROFILES = {

    "India": {
        "currency": "INR",
        "base_rate": 180
    },

    "USA": {
        "currency": "USD",
        "base_rate": 350
    },

    "Germany": {
        "currency": "EUR",
        "base_rate": 280
    },

    "France": {
        "currency": "EUR",
        "base_rate": 300
    },

    "Italy": {
        "currency": "EUR",
        "base_rate": 260
    },

    "Russia": {
        "currency": "RUB",
        "base_rate": 150
    }
}


def get_country_profile(country):

    return COUNTRY_PROFILES.get(
        country,
        COUNTRY_PROFILES["USA"]
    )