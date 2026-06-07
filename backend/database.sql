-- ================================================================
-- PropertyDNA Database Schema v2.0
-- ================================================================

-- Properties table (historical dataset for default ML training)
CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_built INTEGER NOT NULL,
    rooms INTEGER NOT NULL,
    size_sqft REAL NOT NULL,
    material TEXT NOT NULL,
    location TEXT NOT NULL,
    renovation TEXT NOT NULL,
    price REAL NOT NULL
);

-- Users table for login authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Predictions (extended with country/state/city/dna_score)
CREATE TABLE IF NOT EXISTS saved_predictions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    predicted_price REAL    NOT NULL DEFAULT 0,
    predicted_age   INTEGER NOT NULL DEFAULT 0,
    dna_score       REAL             DEFAULT 0,
    country         TEXT             DEFAULT '',
    state           TEXT             DEFAULT '',
    city            TEXT             DEFAULT '',
    year_built      INTEGER          DEFAULT 0,
    rooms           INTEGER          DEFAULT 0,
    size_sqft       REAL             DEFAULT 0,
    material        TEXT             DEFAULT '',
    location        TEXT             DEFAULT '',
    renovation      TEXT             DEFAULT '',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Portfolio — user's tracked properties
CREATE TABLE IF NOT EXISTS portfolio (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    property_name   TEXT    DEFAULT '',
    city            TEXT    DEFAULT '',
    state           TEXT    DEFAULT '',
    country         TEXT    DEFAULT '',
    predicted_price REAL    DEFAULT 0,
    dna_score       REAL    DEFAULT 0,
    notes           TEXT    DEFAULT '',
    property_type   TEXT    DEFAULT '',
    year_built      INTEGER DEFAULT 0,
    house_size_sqft REAL    DEFAULT 0,
    bedrooms        INTEGER DEFAULT 0,
    bathrooms       INTEGER DEFAULT 0,
    predicted_age   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Favorites — user's bookmarked locations
CREATE TABLE IF NOT EXISTS favorites (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    city            TEXT    DEFAULT '',
    state           TEXT    DEFAULT '',
    country         TEXT    DEFAULT '',
    dna_score       REAL    DEFAULT 0,
    predicted_price REAL    DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved Reports — user's generated reports
CREATE TABLE IF NOT EXISTS saved_reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    report_name     TEXT    NOT NULL,
    country         TEXT    DEFAULT '',
    state           TEXT    DEFAULT '',
    city            TEXT    DEFAULT '',
    predicted_price REAL    DEFAULT 0,
    dna_score       REAL    DEFAULT 0,
    predicted_age   INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed properties table (default training records)
INSERT INTO properties (year_built, rooms, size_sqft, material, location, renovation, price) VALUES
(2015, 3, 1200.0, 'Concrete', 'United States', 'No', 397120.0),
(2005, 4, 1800.0, 'Brick', 'United States', 'Yes', 674510.0),
(1990, 5, 2500.0, 'Wood', 'Canada', 'Yes', 734400.0),
(2020, 2, 850.0, 'Concrete', 'United Kingdom', 'No', 222540.0),
(1980, 4, 2200.0, 'Stone', 'Germany', 'No', 659640.0),
(2010, 3, 1500.0, 'Brick', 'Australia', 'Yes', 655500.0),
(2018, 4, 2100.0, 'Concrete', 'Japan', 'No', 24200000.0),
(1995, 3, 1600.0, 'Wood', 'Brazil', 'No', 2246400.0),
(2008, 6, 3200.0, 'Stone', 'South Africa', 'Yes', 9276400.0),
(1970, 3, 1400.0, 'Brick', 'India', 'Yes', 9318400.0),
(2022, 2, 900.0, 'Concrete', 'United States', 'No', 320000.0),
(2012, 4, 2000.0, 'Brick', 'United States', 'No', 635100.0),
(1985, 3, 1300.0, 'Wood', 'Canada', 'No', 356800.0),
(2002, 5, 2400.0, 'Stone', 'United Kingdom', 'Yes', 785600.0),
(1960, 4, 1900.0, 'Brick', 'Germany', 'Yes', 584500.0),
(2016, 3, 1600.0, 'Concrete', 'Australia', 'No', 594000.0),
(2000, 2, 1000.0, 'Wood', 'Japan', 'Yes', 34500000.0),
(1991, 5, 2800.0, 'Stone', 'Brazil', 'No', 4512000.0),
(2011, 4, 1850.0, 'Brick', 'South Africa', 'No', 4241000.0),
(1975, 4, 1700.0, 'Concrete', 'India', 'Yes', 11340000.0),
(2021, 3, 1500.0, 'Concrete', 'United States', 'No', 492000.0),
(2006, 5, 2300.0, 'Stone', 'United States', 'Yes', 916800.0),
(1998, 4, 2000.0, 'Wood', 'Canada', 'No', 506400.0),
(2017, 3, 1400.0, 'Brick', 'United Kingdom', 'No', 356400.0),
(1983, 6, 3000.0, 'Stone', 'Germany', 'Yes', 1056000.0),
(2009, 2, 1100.0, 'Concrete', 'Australia', 'Yes', 511000.0),
(2019, 4, 1950.0, 'Brick', 'Japan', 'No', 73450000.0),
(1993, 3, 1500.0, 'Wood', 'Brazil', 'Yes', 2568000.0),
(2004, 5, 2600.0, 'Stone', 'South Africa', 'No', 7348000.0),
(1978, 3, 1350.0, 'Brick', 'India', 'No', 7245000.0),
(2023, 1, 650.0, 'Concrete', 'United States', 'No', 220000.0),
(2014, 4, 1900.0, 'Brick', 'United States', 'Yes', 736000.0),
(1988, 5, 2200.0, 'Wood', 'Canada', 'Yes', 645000.0),
(2001, 3, 1500.0, 'Concrete', 'United Kingdom', 'No', 382000.0),
(1965, 4, 1750.0, 'Stone', 'Germany', 'No', 512000.0),
(2013, 5, 2500.0, 'Brick', 'Australia', 'Yes', 985000.0),
(2015, 3, 1250.0, 'Wood', 'Japan', 'No', 42800000.0),
(1997, 4, 2100.0, 'Concrete', 'Brazil', 'Yes', 3420000.0),
(2007, 3, 1600.0, 'Stone', 'South Africa', 'No', 4890000.0),
(1972, 5, 2000.0, 'Brick', 'India', 'Yes', 11980000.0);
