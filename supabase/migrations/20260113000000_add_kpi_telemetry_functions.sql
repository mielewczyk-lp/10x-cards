-- =============================================================================
-- migration: add kpi telemetry functions
-- description: creates sql functions for calculating key product metrics
--              - ai acceptance rate (us-011)
--              - ai flashcard share (us-011)
-- affected tables: generation_sources, flashcards (read-only)
-- special notes: functions use security invoker to enforce row level security
-- =============================================================================

-- -----------------------------------------------------------------------------
-- function: calculate_ai_acceptance_rate
-- purpose: calculates the percentage of ai-generated flashcards accepted by current user
-- us-011 target: 75% acceptance rate
-- security: uses security invoker with auth.uid() to enforce rls
-- -----------------------------------------------------------------------------

create or replace function calculate_ai_acceptance_rate(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  total_generated bigint,
  total_accepted bigint,
  total_accepted_edited bigint,
  total_rejected bigint,
  acceptance_rate numeric
)
language plpgsql
security invoker
stable
set search_path = public
as $$
begin
  return query
  select
    coalesce(sum(gs.total_generated), 0)::bigint as total_generated,
    coalesce(sum(gs.total_accepted), 0)::bigint as total_accepted,
    coalesce(sum(gs.total_accepted_edited), 0)::bigint as total_accepted_edited,
    coalesce(sum(gs.total_rejected), 0)::bigint as total_rejected,
    case
      when coalesce(sum(gs.total_generated), 0) = 0 then 0
      else round(
        (coalesce(sum(gs.total_accepted), 0) + coalesce(sum(gs.total_accepted_edited), 0)) * 100.0 
        / nullif(coalesce(sum(gs.total_generated), 0), 0),
        2
      )
    end as acceptance_rate
  from generation_sources gs
  where
    -- enforce row level security: only current user's data
    gs.user_id = auth.uid()
    -- filter by date range if provided
    and (p_start_date is null or gs.created_at >= p_start_date)
    and (p_end_date is null or gs.created_at <= p_end_date)
    -- only include successful generations (no errors)
    and gs.error_message is null;
end;
$$;

comment on function calculate_ai_acceptance_rate is 
  'calculates ai flashcard acceptance rate for current user only (us-011). uses security invoker with auth.uid() filter';

-- -----------------------------------------------------------------------------
-- function: calculate_ai_flashcard_share
-- purpose: calculates the percentage of current user's flashcards created using ai
-- us-011 target: 75% of flashcards created with ai
-- security: uses security invoker with auth.uid() to enforce rls
-- -----------------------------------------------------------------------------

create or replace function calculate_ai_flashcard_share(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  total_flashcards bigint,
  ai_flashcards bigint,
  manual_flashcards bigint,
  ai_share_percentage numeric
)
language plpgsql
security invoker
stable
set search_path = public
as $$
begin
  return query
  select
    count(*)::bigint as total_flashcards,
    count(*) filter (where f.source_type in ('ai-full', 'ai-edited'))::bigint as ai_flashcards,
    count(*) filter (where f.source_type = 'manual')::bigint as manual_flashcards,
    case
      when count(*) = 0 then 0
      else round(
        count(*) filter (where f.source_type in ('ai-full', 'ai-edited')) * 100.0 
        / nullif(count(*), 0),
        2
      )
    end as ai_share_percentage
  from flashcards f
  where
    -- enforce row level security: only current user's data
    f.user_id = auth.uid()
    -- filter by date range if provided
    and (p_start_date is null or f.created_at >= p_start_date)
    and (p_end_date is null or f.created_at <= p_end_date);
end;
$$;

comment on function calculate_ai_flashcard_share is 
  'calculates percentage of flashcards created with ai for current user only (us-011). uses security invoker with auth.uid() filter';

-- -----------------------------------------------------------------------------
-- function: get_kpi_summary
-- purpose: returns comprehensive kpi summary for current user combining both metrics
-- security: uses security invoker and calls functions that enforce auth.uid()
-- -----------------------------------------------------------------------------

create or replace function get_kpi_summary(
  p_start_date timestamptz default null,
  p_end_date timestamptz default null
)
returns table (
  metric_name text,
  metric_value numeric,
  target_value numeric,
  meets_target boolean,
  details jsonb
)
language plpgsql
security invoker
stable
set search_path = public
as $$
declare
  v_acceptance_rate record;
  v_ai_share record;
begin
  -- get ai acceptance rate for current user
  select * into v_acceptance_rate
  from calculate_ai_acceptance_rate(p_start_date, p_end_date)
  limit 1;

  -- get ai flashcard share for current user
  select * into v_ai_share
  from calculate_ai_flashcard_share(p_start_date, p_end_date)
  limit 1;

  -- return ai acceptance rate metric
  return query
  select
    'ai_acceptance_rate'::text as metric_name,
    v_acceptance_rate.acceptance_rate as metric_value,
    75.0 as target_value,
    v_acceptance_rate.acceptance_rate >= 75.0 as meets_target,
    jsonb_build_object(
      'total_generated', v_acceptance_rate.total_generated,
      'total_accepted', v_acceptance_rate.total_accepted,
      'total_accepted_edited', v_acceptance_rate.total_accepted_edited,
      'total_rejected', v_acceptance_rate.total_rejected
    ) as details;

  -- return ai flashcard share metric
  return query
  select
    'ai_flashcard_share'::text as metric_name,
    v_ai_share.ai_share_percentage as metric_value,
    75.0 as target_value,
    v_ai_share.ai_share_percentage >= 75.0 as meets_target,
    jsonb_build_object(
      'total_flashcards', v_ai_share.total_flashcards,
      'ai_flashcards', v_ai_share.ai_flashcards,
      'manual_flashcards', v_ai_share.manual_flashcards
    ) as details;
end;
$$;

comment on function get_kpi_summary is 
  'returns comprehensive kpi summary for current user only (us-011). uses security invoker';

-- -----------------------------------------------------------------------------
-- note: kpi_dashboard view removed for security reasons
-- reason: view would bypass row level security and show all users' data
-- solution: users call calculate_ai_acceptance_rate() and 
--           calculate_ai_flashcard_share() directly which enforce auth.uid()
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- grant permissions
-- purpose: allow authenticated users to query their own metrics
-- -----------------------------------------------------------------------------

-- grant execute permissions on functions to authenticated users
grant execute on function calculate_ai_acceptance_rate to authenticated;
grant execute on function calculate_ai_flashcard_share to authenticated;
grant execute on function get_kpi_summary to authenticated;

-- -----------------------------------------------------------------------------
-- migration complete
-- summary: created secure kpi calculation functions for us-011 telemetry
--          - calculate_ai_acceptance_rate: measures ai acceptance (target: 75%)
--          - calculate_ai_flashcard_share: measures ai usage (target: 75%)
--          - get_kpi_summary: comprehensive kpi report
--          security: all functions use security invoker with auth.uid() filter
--                    to enforce row level security and prevent data leaks
-- -----------------------------------------------------------------------------
