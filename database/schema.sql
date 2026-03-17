create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  created_at timestamptz default now()
);

create table if not exists divination_session (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  question text not null,
  hexagram text,
  changed_hexagram text,
  moving_lines int[],
  ai_result jsonb,
  created_at timestamptz default now()
);

create table if not exists hexagrams (
  id smallint primary key,
  name text not null,
  upper_trigram text not null,
  lower_trigram text not null,
  general_meaning text,
  career_meaning text,
  relationship_meaning text,
  risk_hint text
);

create table if not exists line_interpretations (
  id bigserial primary key,
  hexagram_id smallint references hexagrams(id),
  line_position smallint not null,
  meaning text,
  trend text,
  warning text
);
