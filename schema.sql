-- SQL schema for B-Ready Assessment Platform
-- This script creates all required tables with the exact schemas specified

CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE pillars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pillar_id INTEGER NOT NULL
);

CREATE TABLE categories (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pillar_id INTEGER REFERENCES pillars(id)
);

CREATE TABLE subcategories (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(10) REFERENCES categories(id)
);

-- This table links Topics and Pillars in a many-to-many relationship
CREATE TABLE topic_pillars (
    topic_id INTEGER REFERENCES topics(id),
    pillar_id INTEGER REFERENCES pillars(id),
    PRIMARY KEY (topic_id, pillar_id)
);

CREATE TABLE b_ready_questions (
    question_id INTEGER PRIMARY KEY,
    question_text TEXT NOT NULL,
    indicator_name TEXT NOT NULL,
    is_scored BOOLEAN NOT NULL,
    good_practice_answer VARCHAR(3),
    ffp_value DECIMAL(5, 2) NOT NULL,
    sbp_value DECIMAL(5, 2) NOT NULL,
    group_logic VARCHAR(20),
    subcategory_id VARCHAR(10) REFERENCES subcategories(id),
    saudi_entity_responsible TEXT
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL, -- e.g., 'In Progress', 'Completed'
    final_ffp_score DECIMAL,
    final_sbp_score DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_answers (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES assessments(id),
    question_id INTEGER REFERENCES b_ready_questions(question_id),
    user_answer TEXT NOT NULL -- 'Y' or 'N'
);