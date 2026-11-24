-- Private member media is uploaded only by the authenticated workspace Edge Function.
-- The function creates short-lived signed URLs; the bucket must never be public.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'jr-pheef-member-media',
  'jr-pheef-member-media',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
