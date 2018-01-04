DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, login TEXT NOT NULL, password TEXT NOT NULL, date_last_connection TIMESTAMP default current_timestamp, date_inscription TIMESTAMP default current_timestamp);