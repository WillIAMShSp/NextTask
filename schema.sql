CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')) DEFAULT 'todo',
  user_id UUID, 
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
create policy "Task Policy" on "public"."tasks" as PERMISSIVE for ALL to authenticated using (true);


create table public.team_members (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


alter table public.team_members enable row level security;
create policy "Team Policy" on "public"."team_members" as PERMISSIVE for ALL to authenticated using (true);


alter table public.tasks 
add column assignee_id uuid references public.team_members(id) on delete set null;
alter table public.tasks add column description text;

create table public.comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;
create policy "Comments Policy" on "public"."comments" as PERMISSIVE for ALL to authenticated using (true);


create table public.board_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  action text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.board_history enable row level security;
create policy "History Policy" on "public"."board_history" as PERMISSIVE for ALL to authenticated using (true);

alter table public.tasks 
add column labels jsonb default '[]'::jsonb;

alter table public.tasks 
add column due_date timestamp with time zone;

alter table public.tasks add column col_position integer default 0;

