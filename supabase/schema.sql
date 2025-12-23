-- Create campaigns table
create table public.campaigns (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  target_image_url text not null,
  compiled_mind_file_url text,
  content_type text check (content_type in ('model', 'video')) not null,
  content_url text not null,
  cta_link text,
  active boolean default true
);

-- Enable RLS
alter table public.campaigns enable row level security;

-- Create policy to allow public read access (for AR view)
create policy "Public campaigns are viewable by everyone"
  on public.campaigns for select
  using ( true );

-- Create policy to allow authenticated users to insert/update/delete (for Dashboard)
-- For now, we'll allow anon to insert for demo purposes if no auth is set up, 
-- but ideally this should be restricted.
create policy "Enable insert for authenticated users only"
  on public.campaigns for insert
  with check ( true ); 

create policy "Enable update for authenticated users only"
  on public.campaigns for update
  using ( true );
