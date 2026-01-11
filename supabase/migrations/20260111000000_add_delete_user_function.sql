-- =============================================================================
-- migration: add delete user function
-- description: creates a function for users to delete their own account
--              along with all associated data (flashcards, generation_sources)
-- security: function is security definer to allow deletion of auth.users
-- =============================================================================

-- -----------------------------------------------------------------------------
-- function: delete_current_user
-- purpose: allows authenticated users to delete their own account and all data
-- security: security definer to access auth schema, validates caller identity
-- -----------------------------------------------------------------------------
create or replace function delete_current_user()
returns void
security definer
set search_path = public, auth
language plpgsql
as $$
declare
  current_user_id uuid;
begin
  -- get the current authenticated user id
  current_user_id := auth.uid();
  
  -- ensure user is authenticated
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- delete user's flashcards (will cascade from generation_sources if needed)
  delete from public.flashcards where user_id = current_user_id;
  
  -- delete user's generation sources
  delete from public.generation_sources where user_id = current_user_id;
  
  -- delete the auth user (this is why we need security definer)
  delete from auth.users where id = current_user_id;
  
end;
$$;

comment on function delete_current_user() is 
  'allows authenticated users to permanently delete their own account and all associated data';

-- grant execute permission to authenticated users
grant execute on function delete_current_user() to authenticated;

-- revoke from public to ensure only authenticated users can call it
revoke execute on function delete_current_user() from public;

-- -----------------------------------------------------------------------------
-- migration complete
-- summary: created delete_current_user function with proper security controls
-- -----------------------------------------------------------------------------
