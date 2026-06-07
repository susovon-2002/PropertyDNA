CITY_BASE_RATE = {

    "New York": 450,
    "Los Angeles": 400,
    "Chicago": 300,

    "Mumbai": 250,
    "Delhi": 220,
    "Bangalore": 230,

    "Berlin": 280,
    "Munich": 320,

    "Paris": 380,
    "Lyon": 300,

    "Rome": 280,
    "Milan": 350,

    "Moscow": 220,
    "Saint Petersburg": 210
}


def get_city_rate(city):

    return CITY_BASE_RATE.get(
        city,
        200
    )