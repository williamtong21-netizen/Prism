-- Fixes "permission denied for table X" errors on every table in
-- schema.sql. RLS policies only filter *which rows* a role can see/touch —
-- they don't work at all without the underlying table-level GRANT, which
-- Supabase's dashboard table editor sets automatically but the SQL editor
-- does not. Run this once, same way as schema.sql.

grant usage on schema public to authenticated, anon;

grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;

grant usage, select on all sequences in schema public to authenticated;

-- Make sure tables created *after* this point (if any) get the same grants.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;
