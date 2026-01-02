-- =============================================================================
-- migration: create flashcards schema
-- description: creates tables, indexes, rls policies, and triggers for 
--              flashcard generation and management system
-- affected tables: generation_sources, flashcards
-- special notes: implements row level security (rls) for multi-tenant isolation,
--                foreign keys cascade from auth.users, includes full-text search
-- =============================================================================

-- -----------------------------------------------------------------------------
-- table: generation_sources
-- purpose: tracks ai generation sessions with telemetry and statistics
-- -----------------------------------------------------------------------------
create table generation_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null check (length(input_text) between 1000 and 10000),
  model_name varchar(100),
  total_generated integer not null check (total_generated >= 0),
  total_accepted integer not null default 0 check (total_accepted >= 0),
  total_accepted_edited integer not null default 0 check (total_accepted_edited >= 0),
  total_rejected integer not null default 0 check (total_rejected >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment describing the purpose of this table
comment on table generation_sources is 'stores ai flashcard generation sessions with kpi metrics for tracking acceptance rates and user engagement';

-- add column comments for clarity
comment on column generation_sources.input_text is 'source text provided by user for ai generation, must be 1000-10000 chars';
comment on column generation_sources.total_generated is 'total number of flashcards generated in this session';
comment on column generation_sources.total_accepted is 'count of flashcards accepted without edits';
comment on column generation_sources.total_accepted_edited is 'count of flashcards accepted after user modifications';
comment on column generation_sources.total_rejected is 'count of flashcards rejected by user';

-- -----------------------------------------------------------------------------
-- table: flashcards
-- purpose: stores user flashcards from ai generation or manual creation
-- -----------------------------------------------------------------------------
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generation_source_id uuid null references generation_sources(id) on delete set null,
  front text not null check (length(trim(front)) > 0 and length(front) <= 200),
  back text not null check (length(trim(back)) > 0 and length(back) <= 500),
  source_type varchar(20) not null check (source_type in ('ai-full', 'ai-edited', 'manual')),
  -- generated column for full-text search across front and back
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(front, '') || ' ' || coalesce(back, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add comment describing the purpose of this table
comment on table flashcards is 'stores all user flashcards with source tracking for ai vs manual creation telemetry';

-- add column comments for clarity
comment on column flashcards.generation_source_id is 'nullable fk to generation source; null if manually created or source deleted';
comment on column flashcards.source_type is 'tracks origin: ai-full (unedited), ai-edited (modified), or manual';
comment on column flashcards.search_vector is 'generated tsvector for full-text search on front and back content';

-- -----------------------------------------------------------------------------
-- indexes: optimize common query patterns
-- -----------------------------------------------------------------------------

-- index for user's generation history sorted by recency
create index idx_generation_sources_user_created 
  on generation_sources(user_id, created_at desc);

comment on index idx_generation_sources_user_created is 'optimizes queries fetching user generation history in reverse chronological order';

-- index for user's flashcards sorted by creation date
create index idx_flashcards_user_created 
  on flashcards(user_id, created_at desc);

comment on index idx_flashcards_user_created is 'optimizes queries fetching user flashcards by creation date';

-- index for user's flashcards sorted by last update
create index idx_flashcards_user_updated 
  on flashcards(user_id, updated_at desc nulls last);

comment on index idx_flashcards_user_updated is 'optimizes queries fetching recently modified flashcards';

-- gin index for full-text search
create index idx_flashcards_search 
  on flashcards using gin(search_vector);

comment on index idx_flashcards_search is 'enables fast full-text search across flashcard content';

-- -----------------------------------------------------------------------------
-- row level security: enable rls on all user tables
-- -----------------------------------------------------------------------------

alter table generation_sources enable row level security;
alter table flashcards enable row level security;

-- -----------------------------------------------------------------------------
-- rls policies: generation_sources
-- purpose: ensure users can only access their own generation sessions
-- -----------------------------------------------------------------------------

-- policy: authenticated users can select their own generation sources
create policy generation_sources_select_own
  on generation_sources
  for select
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy generation_sources_select_own on generation_sources is 
  'allows authenticated users to view only their own generation sessions';

-- policy: authenticated users can insert generation sources for themselves
create policy generation_sources_insert_own
  on generation_sources
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

comment on policy generation_sources_insert_own on generation_sources is 
  'allows authenticated users to create generation sessions only with their own user_id';

-- policy: authenticated users can update their own generation sources
create policy generation_sources_update_own
  on generation_sources
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on policy generation_sources_update_own on generation_sources is 
  'allows authenticated users to modify only their own generation sessions and prevents changing user_id';

-- policy: authenticated users can delete their own generation sources
create policy generation_sources_delete_own
  on generation_sources
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy generation_sources_delete_own on generation_sources is 
  'allows authenticated users to delete only their own generation sessions';

-- policy: service role bypass (for backend operations)
create policy generation_sources_service_role_all
  on generation_sources
  for all
  to service_role
  using (true)
  with check (true);

comment on policy generation_sources_service_role_all on generation_sources is 
  'allows service_role to perform any operation for backend maintenance and migrations';

-- -----------------------------------------------------------------------------
-- rls policies: flashcards
-- purpose: ensure users can only access their own flashcards
-- -----------------------------------------------------------------------------

-- policy: authenticated users can select their own flashcards
create policy flashcards_select_own
  on flashcards
  for select
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy flashcards_select_own on flashcards is 
  'allows authenticated users to view only their own flashcards';

-- policy: authenticated users can insert flashcards for themselves
create policy flashcards_insert_own
  on flashcards
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

comment on policy flashcards_insert_own on flashcards is 
  'allows authenticated users to create flashcards only with their own user_id';

-- policy: authenticated users can update their own flashcards
create policy flashcards_update_own
  on flashcards
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

comment on policy flashcards_update_own on flashcards is 
  'allows authenticated users to modify only their own flashcards and prevents changing user_id';

-- policy: authenticated users can delete their own flashcards
create policy flashcards_delete_own
  on flashcards
  for delete
  to authenticated
  using (user_id = (select auth.uid()));

comment on policy flashcards_delete_own on flashcards is 
  'allows authenticated users to delete only their own flashcards';

-- policy: service role bypass (for backend operations)
create policy flashcards_service_role_all
  on flashcards
  for all
  to service_role
  using (true)
  with check (true);

comment on policy flashcards_service_role_all on flashcards is 
  'allows service_role to perform any operation for backend maintenance and migrations';

-- -----------------------------------------------------------------------------
-- triggers: automatically update updated_at timestamp
-- purpose: maintain data freshness tracking for both tables
-- -----------------------------------------------------------------------------

-- function to update the updated_at column
-- security: set search_path to prevent search_path manipulation attacks
create or replace function update_updated_at_column()
returns trigger
security invoker
set search_path = ''
language plpgsql
as $$
begin
  new.updated_at = clock_timestamp();
  return new;
end;
$$;

comment on function update_updated_at_column() is 
  'trigger function to automatically set updated_at to current timestamp on row updates';

-- trigger for generation_sources table
create trigger set_generation_sources_updated_at
  before update on generation_sources
  for each row
  execute function update_updated_at_column();

comment on trigger set_generation_sources_updated_at on generation_sources is 
  'automatically updates updated_at timestamp whenever a generation_source row is modified';

-- trigger for flashcards table
create trigger set_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

comment on trigger set_flashcards_updated_at on flashcards is 
  'automatically updates updated_at timestamp whenever a flashcard row is modified';

-- -----------------------------------------------------------------------------
-- migration complete
-- summary: created generation_sources and flashcards tables with full rls,
--          indexes for performance, and automatic timestamp maintenance
-- -----------------------------------------------------------------------------

