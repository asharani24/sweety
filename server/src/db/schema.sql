CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  slot VARCHAR(20) NOT NULL CHECK (slot IN ('morning','after_breakfast','after_lunch','after_dinner')),
  value INT NOT NULL CHECK (value BETWEEN 40 AND 600),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, reading_date, slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date ON readings(user_id, reading_date);