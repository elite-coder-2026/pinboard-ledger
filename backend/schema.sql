-- Schema for journaling/note-taking app
-- PostgreSQL

create database pinboard;

create schema pl;

create table pl.users
(
    id             uuid primary key     default gen_random_uuid(),
    email          text        not null,
    pass_hash      text        not null,
    display_name   text,
    account_status varchar(5) check (account_status in ('active', 'inactive')),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz
);

create table pl.user_profiles
(
    user_id     uuid primary key references pl.users (id),
    bio         text,
    avatar_url  text,
    preferences jsonb       not null default '{}'::jsonb,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz
);

create table pl.notebooks
(
    id          uuid primary key     default gen_random_uuid(),
    user_id     uuid references pl.users (id),
    title       text        not null,
    description text,
    sort_order  integer,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table pl.notes
(
    id             uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id        uuid        NOT NULL REFERENCES pl.users (id) ON DELETE CASCADE,
    notebook_id    uuid        REFERENCES pl.notebooks (id) ON DELETE SET NULL,
    title          text,
    content        text,
    content_format text        NOT NULL DEFAULT 'markdown',
    pinned         boolean     NOT NULL DEFAULT false,
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

create table pl.note_versions
(
    id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    note_id    uuid        NOT NULL REFERENCES pl.notes (id) ON DELETE CASCADE,
    version_no int         NOT NULL,
    title      text,
    content    text,
    created_at timestamptz NOT NULL DEFAULT now(),
    unique (note_id, version_no)
);

create table pl.tags
(
    id         uuid primary key     default gen_random_uuid(),
    user_id    uuid references pl.users (id),
    note_id    uuid references pl.notes (id),
    tag_name   text        not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table pl.note_tags
(
    note_id uuid references pl.notes (id),
    tag_id  uuid references pl.tags (id),
    primary key (note_id, tag_id)
);

create table pl.attachments
(
    id         uuid primary key     default gen_random_uuid(),
    note_id    uuid references pl.notes (id),
    file_name  text        not null,
    file_type  text        not null,
    file_size  bigint      not null,
    created_at timestamptz not null default now()
);
alter table pl.attachments
    add column file_data bytea;

alter table pl.attachments
    add column mime_type text;

create table pl.entries
(
    id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES pl.users (id) ON DELETE CASCADE,
    note_id    uuid        REFERENCES pl.notes (id) ON DELETE SET NULL,
    entry_date date        NOT NULL,
    mood       text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    unique (user_id, entry_date)
);

create table pl.reminders
(
    id         uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_id    uuid        NOT NULL REFERENCES pl.users (id) ON DELETE CASCADE,
    note_id    uuid        REFERENCES pl.notes (id) ON DELETE SET NULL,
    remind_at  timestamptz NOT NULL,
    status     text        NOT NULL DEFAULT 'scheduled',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

create index idx_notebooks_user_id on pl.notebooks (user_id);
create index idx_notes_user_id on pl.notes (user_id);
create index idx_tags_user_id on pl.tags (user_id);
create index idx_entries_user_id on pl.entries (user_id);
create index idx_reminders_user_id on pl.reminders (user_id);
create index idx_notes_notebook_id on pl.notes (notebook_id);
create index idx_note_versions_note_id on pl.note_versions (note_id);
create index idx_note_tags_note_id on pl.note_tags (note_id);
create index idx_attachments_note_id on pl.attachments (note_id);
create index idx_entries_note_id on pl.entries (note_id);
create index idx_reminders_remind_at on pl.reminders (remind_at);;
