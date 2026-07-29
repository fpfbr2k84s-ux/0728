-- Lotto draw history table for Supabase
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.lotto_draws (
  id uuid primary key default gen_random_uuid(),
  birth_date date not null,
  zodiac_sign text not null,
  lucky_numbers integer[] not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

create index if not exists lotto_draws_created_at_idx
  on public.lotto_draws (created_at desc);

create index if not exists lotto_draws_birth_date_idx
  on public.lotto_draws (birth_date);

create index if not exists lotto_draws_zodiac_sign_idx
  on public.lotto_draws (zodiac_sign);

alter table public.lotto_draws enable row level security;

drop policy if exists lotto_draws_insert_anon on public.lotto_draws;

create policy lotto_draws_insert_anon
  on public.lotto_draws
  for insert
  to anon
  with check (true);
