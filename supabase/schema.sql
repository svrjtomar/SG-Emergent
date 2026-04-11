create extension if not exists "pgcrypto";

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price integer not null default 0,
  original_price integer,
  images jsonb not null default '[]'::jsonb,
  category text not null,
  type text not null,
  sizes jsonb not null default '[]'::jsonb,
  stock integer not null default 0,
  description text default '',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table if not exists cart (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  items jsonb not null default '[]'::jsonb,
  total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  order_number text unique,
  user_email text,
  user_name text,
  items jsonb not null default '[]'::jsonb,
  address jsonb not null default '{}'::jsonb,
  payment_method text,
  total integer not null default 0,
  status text not null default 'pending',
  payment_status text,
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists orders_razorpay_order_id_idx on orders(razorpay_order_id);

create table if not exists wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table if not exists settings (
  id text primary key,
  supabase jsonb not null default '{}'::jsonb,
  razorpay jsonb not null default '{}'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  store jsonb not null default '{}'::jsonb,
  cms jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table products disable row level security;
alter table users disable row level security;
alter table cart disable row level security;
alter table orders disable row level security;
alter table wishlist disable row level security;
alter table settings disable row level security;
