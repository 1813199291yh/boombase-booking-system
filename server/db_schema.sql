-- Run this in your Supabase SQL Editor to set up the tables

-- Create Bookings Table
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  customer_name text,
  email text,
  court_type text,
  date text,
  time text,
  price numeric,
  status text default 'Pending Payment',
  stripe_payment_id text,
  waiver_signed boolean default false,
  waiver_name text,
  waiver_signature text,
  recurring_group_id text,
  color text
);

-- Create Payouts Table
create table public.payouts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  amount numeric,
  status text,
  stripe_payout_id text
);

-- Enable Row Level Security (RLS) - Optional: Disable if you want public access for now
alter table public.bookings enable row level security;
alter table public.payouts enable row level security;

-- Policy to allow anyone to insert bookings (for public booking form)
create policy "Enable insert for all users" on public.bookings for insert with check (true);

-- Policy to allow reading bookings (You might want to restrict this in production)
create policy "Enable read for all users" on public.bookings for select using (true);
create policy "Enable update for all users" on public.bookings for update using (true);

-- Policy for Payouts (Ideally restricted to admins, but open for demo)
create policy "Enable all access for payouts" on public.payouts for all using (true);
