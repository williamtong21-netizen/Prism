-- Attachments for DMs: a private storage bucket plus matching metadata
-- columns on dm_messages. Storage access reuses is_dm_participant() (from
-- 005_fix_recursive_policies.sql) so the access rule lives in one place
-- instead of being re-implemented for storage.objects.

alter table dm_messages
  add column if not exists attachment_path text,
  add column if not exists attachment_type text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dm-attachments', 'dm-attachments', false, 10485760,
  array['image/jpeg','image/png','image/gif','image/webp','image/heic','application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upload path convention is "{thread_id}/{uuid}-{filename}" — the first
-- path segment is the thread id, so is_dm_participant() gates access the
-- same way it already gates dm_messages/dm_participants rows. The thread
-- (and this user's participant row) already exists by the time an upload
-- happens, since you can only attach from inside an existing thread.
drop policy if exists "dm participants can read attachments" on storage.objects;
create policy "dm participants can read attachments"
  on storage.objects for select
  using (
    bucket_id = 'dm-attachments'
    and is_dm_participant((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "dm participants can upload attachments" on storage.objects;
create policy "dm participants can upload attachments"
  on storage.objects for insert
  with check (
    bucket_id = 'dm-attachments'
    and is_dm_participant((storage.foldername(name))[1]::uuid)
  );
