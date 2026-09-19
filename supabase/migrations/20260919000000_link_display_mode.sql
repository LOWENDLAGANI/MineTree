-- Featured link display mode
-- Run in Supabase SQL Editor (or supabase db push).
-- Adds per-link display mode (classic row vs. big featured card with thumbnail)
-- and an optional thumbnail image URL for the featured card.

alter table public.links
  add column if not exists display_mode text not null default 'classic'
    check (display_mode in ('classic', 'featured'));

alter table public.links
  add column if not exists thumbnail_url text;
