-- Kodaryum Pazarlama — Aşama B veri modeli (Supabase / PostgreSQL)
-- Strateji Planı Bölüm 8 "Çekirdek veri modeli"nin Supabase karşılığı. Çok kiracılı: her tablo workspace_id taşır ve
-- satır düzeyinde güvenlik (RLS) ile yalnızca üyesi olunan çalışma alanı okunur/yazılır.
-- Kurulum: Supabase SQL düzenleyicide çalıştırın. Sonra src/marketing/repo.js içindeki load/save/clear arayüzünü
-- Supabase istemcisiyle uygulayın (bkz. docs/PAZARLAMA-MODULU.md, "Aşama B").
-- Not: pgvector, marka hafızası aramasında (RAG) kullanılır.

create extension if not exists "pgcrypto";
create extension if not exists vector;

-- ── Hesap ─────────────────────────────────────────────────────────────────────────────────────────────
create table workspace (id uuid primary key default gen_random_uuid(), name text not null, sector text, city text, created_at timestamptz default now());
create type member_role as enum ('owner', 'editor', 'viewer', 'brand', 'legal');
create table membership (workspace_id uuid references workspace on delete cascade, user_id uuid references auth.users on delete cascade, role member_role not null default 'viewer', primary key (workspace_id, user_id));
create table subscription (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, plan text not null, status text not null, started_at timestamptz default now());
create table usage_meter (id bigserial primary key, workspace_id uuid references workspace on delete cascade, at timestamptz default now(), kind text, tokens_in int default 0, tokens_out int default 0, cost_try numeric(12,4) default 0);

-- yardımcı: oturumdaki kullanıcının rolü (RLS içinde kullanılır)
create or replace function public.role_in(ws uuid) returns member_role language sql stable security definer set search_path = public as
$$ select role from membership where workspace_id = ws and user_id = auth.uid() $$;
create or replace function public.is_member(ws uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from membership where workspace_id = ws and user_id = auth.uid()) $$;

-- ── Marka ─────────────────────────────────────────────────────────────────────────────────────────────
create table brand (workspace_id uuid primary key references workspace on delete cascade, card jsonb not null default '{}', tone jsonb default '{}', updated_at timestamptz default now(), version int default 1);
create table brand_fact (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, key text, text text not null, verified boolean default true, source text, embedding vector(768), created_at timestamptz default now());
create table persona (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, name text, detail jsonb);
create table product (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, name text not null, price numeric(12,2), note text);
create table brand_asset (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, kind text, path text, license text);
create table forbidden_term (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, term text not null);
create table learning (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, kind text check (kind in ('tercih','performans')), text text not null, source text, created_at timestamptz default now());

-- ── Planlama ve içerik ───────────────────────────────────────────────────────────────────────────────
create table goal (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, kind text, target numeric, budget numeric(12,2), created_at timestamptz default now());
create table plan (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, goal_id uuid references goal, status text default 'draft', start_on date, end_on date, payload jsonb, created_at timestamptz default now());
create table plan_version (id uuid primary key default gen_random_uuid(), plan_id uuid references plan on delete cascade, version int, payload jsonb, reason text, created_at timestamptz default now());
create table campaign (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, name text, channel text, status text, budget numeric(12,2), daily_cap numeric(12,2), starts_on date, ends_on date, payload jsonb);
create table calendar_slot (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, plan_id uuid references plan, day date, format text, channel text, theme text);
create table task (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, agent text, title text, status text, progress int default 0, created_at timestamptz default now());

create type content_status as enum ('draft','review','ready','scheduled','published','rejected');
create table content_item (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, slot_id uuid references calendar_slot, format text, channel text, theme text, status content_status default 'draft', scheduled_at timestamptz, chosen_variant uuid, agent text, why text, created_at timestamptz default now());
create table content_variant (id uuid primary key default gen_random_uuid(), item_id uuid references content_item on delete cascade, workspace_id uuid references workspace on delete cascade, label text, body text not null, edited boolean default false);
create table creative (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, item_id uuid references content_item, path text, kind text, ai_generated boolean default false);
create table review_flag (id uuid primary key default gen_random_uuid(), variant_id uuid references content_variant on delete cascade, workspace_id uuid references workspace on delete cascade, verdict text, checks jsonb, explain text, by text, at timestamptz default now());
create table approval (id uuid primary key default gen_random_uuid(), item_id uuid references content_item on delete cascade, workspace_id uuid references workspace on delete cascade, user_id uuid references auth.users, decision text check (decision in ('approve','reject','edit')), reason text, at timestamptz default now());
create table publish_job (id uuid primary key default gen_random_uuid(), item_id uuid references content_item, workspace_id uuid references workspace on delete cascade, idempotency_key text unique, run_at timestamptz, state text default 'queued', attempts int default 0, error text, external_id text);

-- ── Kanal ─────────────────────────────────────────────────────────────────────────────────────────────
create table connector_account (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, provider text, mode text default 'yardimci', status text, scopes text[], token_ref text /* Vault/KMS referansı; token düz metin tutulmaz */, connected_at timestamptz);
create table channel_profile (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, provider text, handle text, profile jsonb);
create table webhook_event (id bigserial primary key, workspace_id uuid references workspace on delete cascade, provider text, payload jsonb, received_at timestamptz default now());

-- ── Reklam ────────────────────────────────────────────────────────────────────────────────────────────
create table ad_account (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, provider text, external_id text);
create table ad_campaign (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, ad_account_id uuid references ad_account, campaign_id uuid references campaign, external_id text, status text);
create table ad_set (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, ad_campaign_id uuid references ad_campaign, audience jsonb, budget numeric(12,2));
create table ad (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, ad_set_id uuid references ad_set, creative_id uuid references creative, status text);
create table budget_rule (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, kind text, params jsonb, hard_cap boolean default true);
create table experiment (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, campaign_id uuid references campaign, variants jsonb, winner text, started_at timestamptz default now());

-- ── Müşteri (CRM · WhatsApp · izin) ───────────────────────────────────────────────────────────────────
create table contact (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, name text, phone text, email text, source text, stage text default 'yeni', value numeric(12,2) default 0, tags text[] default '{}', note text, created_at timestamptz default now());
create table conversation (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, contact_id uuid references contact on delete cascade, channel text default 'whatsapp', handoff boolean default false, last_at timestamptz default now());
create table message (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, conversation_id uuid references conversation on delete cascade, from_who text, body text, intent text, at timestamptz default now());
create table consent (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, contact_id uuid references contact on delete cascade, channel text, how text, granted_at timestamptz default now(), revoked_at timestamptz);
create table segment (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, name text, filter jsonb);
create table lead_source (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, contact_id uuid references contact, source text, utm jsonb, declared boolean default false);
create table review (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, source text default 'Google', author text, rating int check (rating between 1 and 5), body text, reply text, reply_draft text, replied_at timestamptz, posted_on date);

-- ── Ölçüm ─────────────────────────────────────────────────────────────────────────────────────────────
create table metric_daily (workspace_id uuid references workspace on delete cascade, day date, spend numeric(12,2) default 0, impressions int default 0, clicks int default 0, leads int default 0, appts int default 0, sales int default 0, revenue numeric(12,2) default 0, profile_views int default 0, calls int default 0, directions int default 0, primary key (workspace_id, day));
create table attribution_event (id bigserial primary key, workspace_id uuid references workspace on delete cascade, contact_id uuid references contact, source text, utm jsonb, amount numeric(12,2), at timestamptz default now());
create table report (id uuid primary key default gen_random_uuid(), workspace_id uuid references workspace on delete cascade, week_from date, week_to date, payload jsonb, created_at timestamptz default now());

-- ── Güvenlik / izlenebilirlik ─────────────────────────────────────────────────────────────────────────
create table run_log (id bigserial primary key, workspace_id uuid references workspace on delete cascade, at timestamptz default now(), kind text, model text, prompt_version text, source text, ms int, tokens_in int, tokens_out int, cost_try numeric(12,4), quality numeric);
create table audit_log (id bigserial primary key, workspace_id uuid references workspace on delete cascade, at timestamptz default now(), actor uuid, action text, detail text, meta jsonb);
create table prompt_version (id uuid primary key default gen_random_uuid(), name text, version text, body text, eval_pass boolean default false, created_at timestamptz default now());
create table eval_case (id uuid primary key default gen_random_uuid(), sector text, brief jsonb, golden text);
create table eval_result (id uuid primary key default gen_random_uuid(), prompt_version_id uuid references prompt_version, case_id uuid references eval_case, score numeric, detail jsonb, at timestamptz default now());

-- ── Satır düzeyinde güvenlik: çalışma alanı üyeliği ──────────────────────────────────────────────────
do $$
declare t text;
begin
  for t in select c.table_name from information_schema.columns c join information_schema.tables x on x.table_name = c.table_name and x.table_schema = c.table_schema
           where c.table_schema = 'public' and c.column_name = 'workspace_id' and x.table_type = 'BASE TABLE' and c.table_name not in ('workspace','membership')
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for select using (public.is_member(workspace_id))', t || '_sel', t);
    execute format('create policy %I on %I for insert with check (public.role_in(workspace_id) in (''owner'',''editor''))', t || '_ins', t);
    execute format('create policy %I on %I for update using (public.role_in(workspace_id) in (''owner'',''editor'')) with check (public.role_in(workspace_id) in (''owner'',''editor''))', t || '_upd', t);
    execute format('create policy %I on %I for delete using (public.role_in(workspace_id) = ''owner'')', t || '_del', t);
  end loop;
end $$;
alter table workspace enable row level security;
create policy workspace_sel on workspace for select using (public.is_member(id));
create policy workspace_upd on workspace for update using (public.role_in(id) = 'owner');
alter table membership enable row level security;
create policy membership_sel on membership for select using (user_id = auth.uid() or public.role_in(workspace_id) = 'owner');
-- audit_log yalnızca eklenir (değiştirilemez): güncelleme/silme ilkeleri kaldırılır
drop policy if exists audit_log_upd on audit_log;
drop policy if exists audit_log_del on audit_log;

-- Dizinler
create index on content_item (workspace_id, status, scheduled_at);
create index on metric_daily (workspace_id, day desc);
create index on contact (workspace_id, stage);
create index on brand_fact using ivfflat (embedding vector_cosine_ops) with (lists = 100);
