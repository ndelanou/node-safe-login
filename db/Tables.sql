DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, login TEXT NOT NULL, pwd_hash TEXT NOT NULL, pwd_salt TEXT NOT NULL, date_last_connection TIMESTAMP default current_timestamp, date_inscription TIMESTAMP default current_timestamp);

INSERT INTO users (login, pwd_hash, pwd_salt) VALUES ('Michel', '046ebc99225dcb265c15c3b195c1adec', '123')