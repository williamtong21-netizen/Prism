-- 002_grants.sql granted anon/authenticated but missed service_role — the
-- role edge functions use specifically to bypass RLS. Without a base
-- GRANT, service_role hits "permission denied" the same way anon/
-- authenticated did, even though it's meant to have full access.
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
