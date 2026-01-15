-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION char_archive;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.char_tavern_char_def_increment_seq;

CREATE SEQUENCE public.char_tavern_char_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.chub_character_def_increment_seq;

CREATE SEQUENCE public.chub_character_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.chub_lorebook_def_increment_seq;

CREATE SEQUENCE public.chub_lorebook_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.generic_character_def_increment_seq;

CREATE SEQUENCE public.generic_character_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.nyai_user_id_seq;

CREATE SEQUENCE public.nyai_user_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.nyaime_character_def_increment_seq;

CREATE SEQUENCE public.nyaime_character_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.risuai_character_def_increment_seq;

CREATE SEQUENCE public.risuai_character_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.webring_character_def_increment_seq;

CREATE SEQUENCE public.webring_character_def_increment_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.aicg_chronicles definition

-- Drop table

-- DROP TABLE public.aicg_chronicles;

CREATE TABLE public.aicg_chronicles (
	id_hash text NOT NULL,
	"text" text NOT NULL,
	url text NOT NULL,
	"timestamp" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT aicg_chronicles_pkey PRIMARY KEY (id_hash)
);


-- public.booru_character_def definition

-- Drop table

-- DROP TABLE public.booru_character_def;

CREATE TABLE public.booru_character_def (
	author text NOT NULL,
	"name" text NOT NULL,
	id text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	"comments" jsonb NOT NULL,
	tags _text NOT NULL,
	image_hash text NOT NULL,
	tagline text NULL,
	summary text NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	created timestamptz NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" text DEFAULT 'booru'::text NOT NULL,
	hidden bool DEFAULT false NOT NULL,
	CONSTRAINT booru_character_def_pkey PRIMARY KEY (id)
);


-- public.char_tavern_character definition

-- Drop table

-- DROP TABLE public.char_tavern_character;

CREATE TABLE public.char_tavern_character (
	author text NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"data" jsonb NOT NULL,
	reviews jsonb NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	metadata jsonb DEFAULT '{}'::json NOT NULL,
	CONSTRAINT char_tavern_char_pkey PRIMARY KEY (path)
);


-- public.char_tavern_character_def definition

-- Drop table

-- DROP TABLE public.char_tavern_character_def;

CREATE TABLE public.char_tavern_character_def (
	author text NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	original_card_hash text NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"increment" int8 DEFAULT nextval('char_tavern_char_def_increment_seq'::regclass) NOT NULL,
	CONSTRAINT char_tavern_char_def_pkey PRIMARY KEY (increment)
);


-- public.char_tavern_user definition

-- Drop table

-- DROP TABLE public.char_tavern_user;

CREATE TABLE public.char_tavern_user (
	username text NOT NULL,
	"views" int4 NOT NULL,
	downloads int4 NOT NULL,
	bio text NULL,
	image_hash text NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT char_tavern_user_pkey PRIMARY KEY (username)
);


-- public.chub_character definition

-- Drop table

-- DROP TABLE public.chub_character;

CREATE TABLE public.chub_character (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	"data" jsonb NOT NULL,
	chats jsonb NOT NULL,
	ratings jsonb NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	added timestamptz NOT NULL,
	"source" text DEFAULT 'chub'::text NOT NULL,
	metadata jsonb DEFAULT '{}'::json NOT NULL,
	hidden bool DEFAULT false NOT NULL,
	CONSTRAINT characters_pkey PRIMARY KEY (id)
);
COMMENT ON TABLE public.chub_character IS 'Unversioned data from the Chub platform but not card definitions.';


-- public.chub_character_def definition

-- Drop table

-- DROP TABLE public.chub_character_def;

CREATE TABLE public.chub_character_def (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	full_path text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	original_card_hash text NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" text DEFAULT 'chub'::text NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT chub_character_def_pkey PRIMARY KEY (increment)
);
COMMENT ON TABLE public.chub_character_def IS 'Versioned character card definitions.';


-- public.chub_lorebook definition

-- Drop table

-- DROP TABLE public.chub_lorebook;

CREATE TABLE public.chub_lorebook (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	"data" jsonb NOT NULL,
	ratings jsonb NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	added timestamptz NOT NULL,
	"source" text DEFAULT 'chub'::text NOT NULL,
	hidden bool DEFAULT false NOT NULL,
	CONSTRAINT chub_lorebook_pkey PRIMARY KEY (id)
);


-- public.chub_lorebook_def definition

-- Drop table

-- DROP TABLE public.chub_lorebook_def;

CREATE TABLE public.chub_lorebook_def (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	full_path text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	metadata jsonb DEFAULT '{}'::json NOT NULL,
	"source" text DEFAULT 'chub'::text NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT chub_lorebook_def_pkey PRIMARY KEY (increment)
);


-- public.chub_user definition

-- Drop table

-- DROP TABLE public.chub_user;

CREATE TABLE public.chub_user (
	username text NOT NULL,
	id int4 NOT NULL,
	"data" jsonb NOT NULL,
	image_hash text NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	added timestamptz NOT NULL,
	"source" text DEFAULT 'chub'::text NOT NULL,
	CONSTRAINT chub_user_pkey PRIMARY KEY (id)
);


-- public.embedding_summaries definition

-- Drop table

-- DROP TABLE public.embedding_summaries;

CREATE TABLE public.embedding_summaries (
	id text NOT NULL,
	summary text NOT NULL,
	CONSTRAINT embedding_summaries_pkey PRIMARY KEY (id)
);


-- public.generic_character_def definition

-- Drop table

-- DROP TABLE public.generic_character_def;

CREATE TABLE public.generic_character_def (
	card_data_hash text NOT NULL, -- A hash of a tuple containing the card's PNG bytes and it's definition.
	"name" text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	summary text NULL,
	tagline text NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text NOT NULL,
	source_url text NULL,
	hidden bool DEFAULT false NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT characters_pkey1 PRIMARY KEY (card_data_hash)
);

-- Column comments

COMMENT ON COLUMN public.generic_character_def.card_data_hash IS 'A hash of a tuple containing the card''s PNG bytes and it''s definition.';


-- public.hidden definition

-- Drop table

-- DROP TABLE public.hidden;

CREATE TABLE public.hidden (
	"table" text NOT NULL,
	id text NOT NULL
);


-- public.nyaime_character definition

-- Drop table

-- DROP TABLE public.nyaime_character;

CREATE TABLE public.nyaime_character (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	node jsonb NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	"source" text DEFAULT 'nyaime'::text NULL,
	hidden bool DEFAULT false NULL,
	CONSTRAINT nyaime_character_pkey PRIMARY KEY (id)
);


-- public.nyaime_character_def definition

-- Drop table

-- DROP TABLE public.nyaime_character_def;

CREATE TABLE public.nyaime_character_def (
	author text NOT NULL,
	"name" text NOT NULL,
	id int4 NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	original_card_hash text NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" text DEFAULT 'nyaime'::text NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT nyaime_character_def_pkey PRIMARY KEY (increment)
);


-- public.nyaime_user definition

-- Drop table

-- DROP TABLE public.nyaime_user;

CREATE TABLE public.nyaime_user (
	"name" text NOT NULL,
	id int8 DEFAULT nextval('nyai_user_id_seq'::regclass) NOT NULL,
	bio text NOT NULL,
	discussions jsonb NOT NULL,
	questions jsonb NOT NULL,
	prompts jsonb NOT NULL,
	requests jsonb NOT NULL,
	meta jsonb NOT NULL,
	is_guest bool DEFAULT false NOT NULL,
	added timetz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated timetz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT nyai_user_pkey PRIMARY KEY (name, id)
);


-- public.risuai_character definition

-- Drop table

-- DROP TABLE public.risuai_character;

CREATE TABLE public.risuai_character (
	author text NOT NULL,
	"name" text NOT NULL,
	id text NOT NULL,
	node jsonb NOT NULL,
	"comments" jsonb DEFAULT '[]'::jsonb NULL,
	metadata jsonb DEFAULT '{}'::jsonb NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
	"source" text DEFAULT 'risuai'::text NULL,
	hidden bool DEFAULT false NULL,
	CONSTRAINT risuai_character_pkey PRIMARY KEY (id)
);


-- public.risuai_character_def definition

-- Drop table

-- DROP TABLE public.risuai_character_def;

CREATE TABLE public.risuai_character_def (
	author text NOT NULL,
	"name" text NOT NULL,
	id text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	original_card_hash text NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"source" text DEFAULT 'risuai'::text NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT risuai_character_def_pkey PRIMARY KEY (increment)
);


-- public.risuai_user definition

-- Drop table

-- DROP TABLE public.risuai_user;

CREATE TABLE public.risuai_user (
	username text NOT NULL,
	description text NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	updated timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT risuai_user_pkey PRIMARY KEY (username)
);


-- public.stored_rentry_links definition

-- Drop table

-- DROP TABLE public.stored_rentry_links;

CREATE TABLE public.stored_rentry_links (
	url text NOT NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT stored_rentry_links_pkey PRIMARY KEY (url)
);


-- public.webring_character_def definition

-- Drop table

-- DROP TABLE public.webring_character_def;

CREATE TABLE public.webring_character_def (
	card_data_hash text NOT NULL,
	"name" text NOT NULL,
	author text NOT NULL,
	definition jsonb NOT NULL,
	raw bytea NOT NULL,
	image_hash text NOT NULL,
	tagline text NULL,
	summary text NULL,
	added timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
	metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
	"source" text DEFAULT 'webring'::text NULL,
	source_url text NULL,
	hidden bool DEFAULT false NOT NULL,
	"increment" int4 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START 1 CACHE 1 NO CYCLE) NOT NULL,
	CONSTRAINT webring_character_def_pkey PRIMARY KEY (card_data_hash)
);


-- public.aicg_chronicles foreign keys

-- public.booru_character_def foreign keys

-- public.char_tavern_character foreign keys

-- public.char_tavern_character_def foreign keys

-- public.char_tavern_user foreign keys

-- public.chub_character foreign keys

-- public.chub_character_def foreign keys

-- public.chub_lorebook foreign keys

-- public.chub_lorebook_def foreign keys

-- public.chub_user foreign keys

-- public.embedding_summaries foreign keys

-- public.generic_character_def foreign keys

-- public.hidden foreign keys

-- public.nyaime_character foreign keys

-- public.nyaime_character_def foreign keys

-- public.nyaime_user foreign keys

-- public.risuai_character foreign keys

-- public.risuai_character_def foreign keys

-- public.risuai_user foreign keys

-- public.stored_rentry_links foreign keys

-- public.webring_character_def foreign keys;