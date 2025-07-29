-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enums
create type user_role as enum ('CONTRACTOR', 'PROJECT_MANAGER', 'ADMIN', 'INSURANCE_AGENT');
create type report_type as enum ('DAILY', 'WEEKLY', 'MONTHLY', 'INSURANCE_CLAIM', 'CUSTOM');
create type report_status as enum ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED');
create type alert_type as enum ('WEATHER_WARNING', 'DELAY_DETECTED', 'DELAY_ENDED', 'THRESHOLD_APPROACHING', 'REPORT_READY');
create type severity as enum ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Create users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  company text,
  phone text,
  role user_role default 'CONTRACTOR',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create projects table
create table projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id),
  name text not null,
  description text,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone,
  active boolean default true,
  weather_thresholds jsonb default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for projects
create index idx_projects_user_id on projects(user_id);
create index idx_projects_location on projects(latitude, longitude);

-- Create weather_readings table
create table weather_readings (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  timestamp timestamp with time zone not null,
  temperature double precision,
  wind_speed double precision,
  precipitation double precision,
  humidity integer,
  pressure double precision,
  visibility double precision,
  conditions text,
  source text not null,
  raw_data jsonb not null,
  created_at timestamp with time zone default now()
);

-- Create indexes for weather_readings
create index idx_weather_readings_project_timestamp on weather_readings(project_id, timestamp);
create index idx_weather_readings_timestamp on weather_readings(timestamp);

-- Create delay_events table
create table delay_events (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  weather_condition text not null,
  threshold_violated jsonb not null,
  affected_activities text[] default '{}',
  estimated_cost double precision,
  labor_hours_lost double precision,
  crew_size integer,
  auto_generated boolean default true,
  verified boolean default false,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for delay_events
create index idx_delay_events_project_start on delay_events(project_id, start_time);

-- Create reports table
create table reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id),
  report_type report_type not null,
  period_start timestamp with time zone not null,
  period_end timestamp with time zone not null,
  document_url text,
  metadata jsonb,
  total_delay_hours double precision,
  total_cost double precision,
  status report_status default 'PENDING',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create indexes for reports
create index idx_reports_project_period on reports(project_id, period_start, period_end);
create index idx_reports_user_id on reports(user_id);

-- Create alerts table
create table alerts (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id),
  type alert_type not null,
  severity severity not null,
  message text not null,
  weather_data jsonb,
  sent boolean default false,
  sent_at timestamp with time zone,
  read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Create indexes for alerts
create index idx_alerts_project_sent on alerts(project_id, sent);
create index idx_alerts_user_read on alerts(user_id, read);

-- Enable Row Level Security
alter table users enable row level security;
alter table projects enable row level security;
alter table weather_readings enable row level security;
alter table delay_events enable row level security;
alter table reports enable row level security;
alter table alerts enable row level security;

-- Create RLS policies
-- Users can only see their own profile
create policy "Users can view own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update own profile" on users
  for update using (auth.uid() = id);

-- Projects policies
create policy "Users can view own projects" on projects
  for select using (auth.uid() = user_id);

create policy "Users can create own projects" on projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on projects
  for update using (auth.uid() = user_id);

create policy "Users can delete own projects" on projects
  for delete using (auth.uid() = user_id);

-- Weather readings policies (tied to project ownership)
create policy "Users can view weather readings for own projects" on weather_readings
  for select using (
    exists (
      select 1 from projects
      where projects.id = weather_readings.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Delay events policies
create policy "Users can view delay events for own projects" on delay_events
  for select using (
    exists (
      select 1 from projects
      where projects.id = delay_events.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Reports policies
create policy "Users can view own reports" on reports
  for select using (auth.uid() = user_id);

create policy "Users can create own reports" on reports
  for insert with check (auth.uid() = user_id);

-- Alerts policies
create policy "Users can view own alerts" on alerts
  for select using (auth.uid() = user_id);

create policy "Users can update own alerts" on alerts
  for update using (auth.uid() = user_id);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on projects
  for each row execute function update_updated_at_column();

create trigger update_delay_events_updated_at before update on delay_events
  for each row execute function update_updated_at_column();

create trigger update_reports_updated_at before update on reports
  for each row execute function update_updated_at_column();