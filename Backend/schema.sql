CREATE TABLE IF NOT EXISTS users (
    user_id        INT8 PRIMARY KEY DEFAULT unique_rowid(),
    username       VARCHAR(50)  NOT NULL UNIQUE,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    first_name     VARCHAR(100),
    last_name      VARCHAR(100),
    created_at     TIMESTAMP NOT NULL DEFAULT current_timestamp()
);
