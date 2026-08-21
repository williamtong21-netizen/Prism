-- Camp pins move from "one pin per person per festival" to "as many as you
-- want, each tagged with a type" (camp / meetup / other) so someone can
-- drop both their campsite and a separate meetup spot. Existing RLS
-- policies (own pin, crew-shared pin) are untouched — they filter by
-- profile_id/festival_id values, not the primary key shape, so they keep
-- working as-is once the key changes from (profile_id, festival_id) to a
-- plain id.

alter table camp_pins add column if not exists id uuid not null default gen_random_uuid();
alter table camp_pins add column if not exists pin_type text not null default 'camp';

alter table camp_pins drop constraint if exists camp_pins_pin_type_check;
alter table camp_pins add constraint camp_pins_pin_type_check check (pin_type in ('camp', 'meetup', 'other'));

alter table camp_pins drop constraint if exists camp_pins_pkey;
alter table camp_pins add primary key (id);
