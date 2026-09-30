-- Persist live gallery positioning and zoom controls from the visual editor.
alter table public.business_media
  add column if not exists object_position_x integer not null default 50,
  add column if not exists object_position_y integer not null default 50,
  add column if not exists object_scale numeric not null default 1;
