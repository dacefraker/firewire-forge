-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- ===== User Profiles =====
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  first_name text,
  last_name text,
  email text,
  phone text,
  company_id uuid,
  role text default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

-- ===== Core Business Tables =====

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  phone text,
  email text,
  billing_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index companies_name_key on public.companies (lower(name));
alter table public.companies enable row level security;

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_company_id_idx on public.clients(company_id);
alter table public.clients enable row level security;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  name text not null,
  number text,
  status text not null default 'new',
  -- Address / geo
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  -- Dates
  opened_at date,
  due_at date,
  closed_at date,
  -- Flags
  pe_stamp_required boolean default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, name)
);

create index projects_company_id_idx on public.projects(company_id);
create index projects_client_id_idx on public.projects(client_id);
create index projects_status_idx on public.projects(status);
alter table public.projects enable row level security;

-- ===== Building / System Specs =====

create table public.project_building (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  occupancy text,
  stories smallint,
  area_sqft integer,
  sprinklers boolean,
  sprinkler_notes text,
  elevators boolean,
  elevator_recall text,
  fsae boolean,
  oee boolean,
  two_way_comm boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id)
);

create index project_building_project_id_idx on public.project_building(project_id);
alter table public.project_building enable row level security;

-- ===== Parts / BOM =====

create table public.parts (
  id uuid primary key default gen_random_uuid(),
  manufacturer text,
  model text,
  description text,
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(manufacturer, model)
);

alter table public.parts enable row level security;

create table public.project_parts (
  project_id uuid not null references public.projects(id) on delete cascade,
  part_id uuid not null references public.parts(id) on delete restrict,
  qty numeric(12,2) not null default 1,
  notes text,
  primary key (project_id, part_id)
);

create index project_parts_project_id_idx on public.project_parts(project_id);
create index project_parts_part_id_idx on public.project_parts(part_id);
alter table public.project_parts enable row level security;

-- ===== Files =====

create table public.files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  owner_id uuid references auth.users(id),
  filename text not null,
  mime_type text,
  size_bytes bigint,
  category text,
  storage_bucket text not null default 'project-files',
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

create index files_project_id_idx on public.files(project_id);
create index files_category_idx on public.files(category);
alter table public.files enable row level security;

-- ===== Change Requests / Workflow =====

create table public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open',
  billable boolean not null default false,
  amount_cents integer,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index change_requests_project_id_idx on public.change_requests(project_id);
create index change_requests_status_idx on public.change_requests(status);
alter table public.change_requests enable row level security;

-- ===== Notes / Activity =====

create table public.project_notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references auth.users(id),
  kind text default 'internal',
  body text not null,
  created_at timestamptz not null default now()
);

create index project_notes_project_id_idx on public.project_notes(project_id);
alter table public.project_notes enable row level security;

create table public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  actor_id uuid references auth.users(id),
  event_type text not null,
  data jsonb,
  created_at timestamptz not null default now()
);

create index project_events_project_id_idx on public.project_events(project_id);
create index project_events_event_type_idx on public.project_events(event_type);
alter table public.project_events enable row level security;

-- ===== Billing =====

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  number text not null,
  status text not null default 'draft',
  subtotal_cents integer not null default 0,
  tax_cents integer not null default 0,
  total_cents integer not null default 0,
  issued_at date,
  due_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, number)
);

alter table public.invoices enable row level security;

-- ===== Storage Bucket =====
insert into storage.buckets (id, name, public) values ('project-files', 'project-files', false);

-- ===== Timestamps Triggers =====
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger touch_companies before update on public.companies
for each row execute procedure public.touch_updated_at();

create trigger touch_clients before update on public.clients
for each row execute procedure public.touch_updated_at();

create trigger touch_projects before update on public.projects
for each row execute procedure public.touch_updated_at();

create trigger touch_project_building before update on public.project_building
for each row execute procedure public.touch_updated_at();

create trigger touch_parts before update on public.parts
for each row execute procedure public.touch_updated_at();

create trigger touch_change_requests before update on public.change_requests
for each row execute procedure public.touch_updated_at();

create trigger touch_invoices before update on public.invoices
for each row execute procedure public.touch_updated_at();

-- ===== User Profile Trigger =====
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (new.id, new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===== Row Level Security Policies =====

-- Profiles: Users can view/edit their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Companies: Users can view companies they belong to
create policy "Users can view their company" on public.companies
  for select using (
    id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Users can insert companies" on public.companies
  for insert with check (auth.uid() is not null);

create policy "Users can update their company" on public.companies
  for update using (
    id in (select company_id from public.profiles where id = auth.uid())
  );

-- Clients: Users can view/manage clients for their company
create policy "Users can view company clients" on public.clients
  for select using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Users can insert company clients" on public.clients
  for insert with check (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Users can update company clients" on public.clients
  for update using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

-- Projects: Users can view/manage projects for their company
create policy "Users can view company projects" on public.projects
  for select using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Users can insert company projects" on public.projects
  for insert with check (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Users can update company projects" on public.projects
  for update using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

-- Project Building: Users can view/manage building details for company projects
create policy "Users can view project buildings" on public.project_building
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project buildings" on public.project_building
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can update project buildings" on public.project_building
  for update using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Parts: Everyone can view parts catalog
create policy "Anyone can view parts" on public.parts
  for select using (true);

create policy "Authenticated users can insert parts" on public.parts
  for insert with check (auth.uid() is not null);

-- Project Parts: Users can manage parts for company projects  
create policy "Users can view project parts" on public.project_parts
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project parts" on public.project_parts
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can update project parts" on public.project_parts
  for update using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can delete project parts" on public.project_parts
  for delete using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Files: Users can manage files for company projects
create policy "Users can view project files" on public.files
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project files" on public.files
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can update project files" on public.files
  for update using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can delete project files" on public.files
  for delete using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Change Requests: Users can manage change requests for company projects
create policy "Users can view project change requests" on public.change_requests
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project change requests" on public.change_requests
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can update project change requests" on public.change_requests
  for update using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Project Notes: Users can manage notes for company projects
create policy "Users can view project notes" on public.project_notes
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project notes" on public.project_notes
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Project Events: Users can view events for company projects
create policy "Users can view project events" on public.project_events
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project events" on public.project_events
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Invoices: Users can view invoices for company projects
create policy "Users can view project invoices" on public.invoices
  for select using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can insert project invoices" on public.invoices
  for insert with check (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can update project invoices" on public.invoices
  for update using (
    project_id in (
      select id from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

-- Storage Policies for project-files bucket
create policy "Users can view project files" on storage.objects
  for select using (
    bucket_id = 'project-files' and
    (storage.foldername(name))[1] in (
      select id::text from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can upload project files" on storage.objects
  for insert with check (
    bucket_id = 'project-files' and
    (storage.foldername(name))[1] in (
      select id::text from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Users can delete project files" on storage.objects
  for delete using (
    bucket_id = 'project-files' and
    (storage.foldername(name))[1] in (
      select id::text from public.projects 
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );