def validate_input(data):
    
    required_fields = [

        "Country",
        "City",
        "Year_Built",
        "Bedrooms",
        "House_Size_sqft",
        "Construction_Material"

    ]

    for field in required_fields:

        if field not in data:

            raise ValueError(
                f"{field} missing"
            )

    return True