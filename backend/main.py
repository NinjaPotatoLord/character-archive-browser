#!/usr/bin/env python3
"""
Lightweight Character Archive Browser
A minimal FastAPI backend for browsing character cards without Meilisearch.
"""
import os
import zlib
import json
import base64
import io
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

import psycopg
from PIL import Image
from PIL.PngImagePlugin import PngInfo
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# Configuration
DATABASE_HOST = os.environ.get("DATABASE_HOST", "localhost")
DATABASE_PORT = os.environ.get("DATABASE_PORT", "5432")
DATABASE_NAME = os.environ.get("DATABASE_NAME", "char_archive")
DATABASE_USER = os.environ.get("DATABASE_USER", "char_archive")
DATABASE_PASSWORD = os.environ.get("DATABASE_PASSWORD", "char_archive_local")
ARCHIVE_PATH = Path(os.environ.get("ARCHIVE_PATH", "/archive"))

DATABASE_URL = f"postgresql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}:{DATABASE_PORT}/{DATABASE_NAME}"

# Database pool
pool: Optional[AsyncConnectionPool] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global pool
    pool = AsyncConnectionPool(DATABASE_URL, min_size=2, max_size=10)
    await pool.open()
    yield
    await pool.close()


app = FastAPI(
    title="Character Archive Browser",
    description="Lightweight local browser for character cards",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Sources configuration - based on actual database schema
SOURCES = {
    "chub": {
        "def_table": "chub_character_def",
        "main_table": "chub_character",
        "id_field": "id",
        "id_type": "int",
        "has_tagline": False,
        "has_author": True,
        "name": "Chub.ai",
    },
    "booru": {
        "def_table": "booru_character_def",
        "main_table": None,
        "id_field": "id",
        "id_type": "text",
        "has_tagline": True,
        "has_author": True,
        "name": "Booru",
    },
    "char_tavern": {
        "def_table": "char_tavern_character_def",
        "main_table": "char_tavern_character",
        "id_field": "path",
        "id_type": "text",
        "has_tagline": False,
        "has_author": True,
        "name": "Character Tavern",
    },
    "risuai": {
        "def_table": "risuai_character_def",
        "main_table": "risuai_character",
        "id_field": "id",
        "id_type": "text",
        "has_tagline": False,
        "has_author": True,
        "name": "RisuAI",
    },
    "nyaime": {
        "def_table": "nyaime_character_def",
        "main_table": "nyaime_character",
        "id_field": "id",
        "id_type": "int",
        "has_tagline": False,
        "has_author": True,
        "name": "Nyaime",
    },
    "webring": {
        "def_table": "webring_character_def",
        "main_table": None,
        "id_field": "card_data_hash",
        "id_type": "text",
        "has_tagline": True,
        "has_author": True,
        "name": "Webring",
    },
    "generic": {
        "def_table": "generic_character_def",
        "main_table": None,
        "id_field": "card_data_hash",
        "id_type": "text",
        "has_tagline": True,
        "has_author": False,  # generic doesn't have author column
        "name": "Generic",
    },
}


def get_image_path(image_hash: str) -> Path:
    """Convert image hash to file path."""
    return ARCHIVE_PATH / image_hash[0] / image_hash[1] / image_hash[2] / image_hash[3:]


def build_select_query(source_key: str, config: dict, extra_where: str = "", order_by: str = "added DESC") -> str:
    """Build SELECT query based on source configuration."""
    def_table = config["def_table"]
    id_field = config["id_field"]
    has_tagline = config["has_tagline"]
    has_author = config["has_author"]

    # Build column list based on what's available
    columns = [
        f"{id_field} as id",
        "name",
    ]

    if has_author:
        columns.append("author")
    else:
        columns.append("'Unknown' as author")

    columns.append("image_hash")

    if has_tagline:
        columns.append("tagline")
    else:
        columns.append("NULL as tagline")

    columns.append("added")
    columns.append("metadata->>'totalTokens' as tokens")
    columns.append(f"'{source_key}' as source")

    query = f"""
        SELECT {', '.join(columns)}
        FROM {def_table}
        {extra_where}
        ORDER BY {order_by}
    """
    return query


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/sources")
async def list_sources():
    """List available character sources."""
    return {"sources": {k: v["name"] for k, v in SOURCES.items()}}


@app.get("/api/stats")
async def get_stats():
    """Get statistics about the archive."""
    stats = {}
    async with pool.connection() as conn:
        for source_key, source_config in SOURCES.items():
            def_table = source_config["def_table"]
            try:
                async with conn.cursor() as cur:
                    await cur.execute(f"SELECT COUNT(*) FROM {def_table}")
                    result = await cur.fetchone()
                    stats[source_key] = {"count": result[0], "name": source_config["name"]}
            except Exception as e:
                stats[source_key] = {"count": 0, "name": source_config["name"], "error": str(e)}
    return {"stats": stats}


@app.get("/api/characters")
async def get_characters(
    q: Optional[str] = Query(default=None, description="Search query for name/author"),
    tag: Optional[str] = Query(default=None, description="Filter by tag name"),
    source: Optional[str] = Query(default=None, description="Filter by source"),
    order_by: str = Query(default="latest", description="Order by: latest, oldest, random, tokens_asc, tokens_desc"),
    min_tokens: Optional[int] = Query(default=None, description="Minimum token count"),
    max_tokens: Optional[int] = Query(default=None, description="Maximum token count"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """
    Unified endpoint to get characters with various filters.
    Supports combining search, tags, and source filters.
    """
    result = await _get_characters_internal(
        q=q,
        tag=tag,
        source=source,
        order_by=order_by,
        min_tokens=min_tokens,
        max_tokens=max_tokens,
        limit=limit,
        offset=offset
    )
    return result




async def _get_characters_internal(
    q: Optional[str] = None,
    tag: Optional[str] = None,
    source: Optional[str] = None,
    order_by: str = "latest",
    min_tokens: Optional[int] = None,
    max_tokens: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
):
    """
    Internal helper function to get characters with various filters.
    Used by both the unified endpoint and wrapper functions.
    """
    results = []
    sources_to_query = [source] if source and source in SOURCES else list(SOURCES.keys())

    async with pool.connection() as conn:
        for src in sources_to_query:
            config = SOURCES[src]

            # Check if we need to use the tag join query
            if tag is not None and tag.strip():  # Check for None and empty string
                # First get the tag ID
                async with conn.cursor(row_factory=dict_row) as tag_cur:
                    await tag_cur.execute(
                        "SELECT id FROM tags WHERE LOWER(name) = LOWER(%s)",
                        (tag,)
                    )
                    tag_row = await tag_cur.fetchone()
                    if not tag_row:
                        # If tag doesn't exist, skip this source
                        continue

                    tag_id = tag_row["id"]

                    # Use JOIN query for tag filtering
                    id_field = config["id_field"]
                    def_table = config["def_table"]

                    # Build column list based on what's available
                    columns = [
                        f"d.{id_field} as id",
                        "d.name",
                    ]

                    if config["has_author"]:
                        columns.append("d.author")
                    else:
                        columns.append("'Unknown' as author")

                    columns.append("d.image_hash")

                    if config["has_tagline"]:
                        columns.append("d.tagline")
                    else:
                        columns.append("NULL as tagline")

                    columns.append("d.added")
                    columns.append("d.metadata->>'totalTokens' as tokens")
                    columns.append(f"'{src}' as source")

                    # Build WHERE clause for the joined query
                    where_clause_parts = []
                    params = []

                    # Add search filter to the joined query
                    if q:
                        search_term = q.replace("'", "''").replace("\\", "\\\\")
                        pattern = f"%{search_term}%"
                        if config["has_author"]:
                            where_clause_parts.append("(d.name ILIKE %s OR d.author ILIKE %s)")
                            params.extend([pattern, pattern])
                        else:
                            where_clause_parts.append("d.name ILIKE %s")
                            params.append(pattern)

                    # Add tag filter
                    where_clause_parts.append("ct.tag_id = %s")
                    params.append(tag_id)

                    # Add source filter
                    where_clause_parts.append("ct.source = %s")
                    params.append(src)

                    if min_tokens is not None:
                        where_clause_parts.append("CAST(d.metadata->>'totalTokens' AS INTEGER) >= %s")
                        params.append(min_tokens)

                    if max_tokens is not None:
                        where_clause_parts.append("CAST(d.metadata->>'totalTokens' AS INTEGER) <= %s")
                        params.append(max_tokens)

                    where_clause = "WHERE " + " AND ".join(where_clause_parts)

                    # Determine order
                    order_map = {
                        "latest": "d.added DESC",
                        "oldest": "d.added ASC",
                        "random": "RANDOM()",
                        "tokens_asc": "CAST(d.metadata->>'totalTokens' AS INTEGER) ASC",
                        "tokens_desc": "CAST(d.metadata->>'totalTokens' AS INTEGER) DESC"
                    }
                    order_by_clause = order_map.get(order_by, "d.added DESC")

                    # Build the joined query
                    query = f"""
                        SELECT {', '.join(columns)}
                        FROM {def_table} d
                        JOIN character_tags ct ON ct.character_id = d.{id_field}::text
                        {where_clause}
                        ORDER BY {order_by_clause}
                        LIMIT %s OFFSET %s
                    """
                    final_params = params + [limit, offset]

                    try:
                        async with conn.cursor(row_factory=dict_row) as cur:
                            await cur.execute(query, final_params)
                            rows = await cur.fetchall()
                            for row in rows:
                                row["added"] = row["added"].isoformat() if row["added"] else None
                                row["id"] = str(row["id"])
                                results.append(row)
                    except Exception as e:
                        print(f"Error querying {src} with tag: {e}")
                        continue
            else:
                # Use the original query logic without tags
                where_parts = []
                params = []

                # Add search filter if present
                if q:
                    search_term = q.replace("'", "''").replace("\\", "\\\\")
                    pattern = f"%{search_term}%"
                    if config["has_author"]:
                        where_parts.append("(name ILIKE %s OR author ILIKE %s)")
                        params.extend([pattern, pattern])
                    else:
                        where_parts.append("name ILIKE %s")
                        params.append(pattern)

                if min_tokens is not None:
                    where_parts.append("CAST(metadata->>'totalTokens' AS INTEGER) >= %s")
                    params.append(min_tokens)

                if max_tokens is not None:
                    where_parts.append("CAST(metadata->>'totalTokens' AS INTEGER) <= %s")
                    params.append(max_tokens)

                # Combine WHERE conditions
                where_clause = ""
                if where_parts:
                    where_clause = "WHERE " + " AND ".join(where_parts)

                # Determine order
                order_map = {
                    "latest": "added DESC",
                    "oldest": "added ASC",
                    "random": "RANDOM()",
                    "tokens_asc": "CAST(metadata->>'totalTokens' AS INTEGER) ASC",
                    "tokens_desc": "CAST(metadata->>'totalTokens' AS INTEGER) DESC"
                }
                order_by_clause = order_map.get(order_by, "added DESC")

                query = build_select_query(src, config, where_clause, order_by=order_by_clause)
                query += " LIMIT %s OFFSET %s"
                params.extend([limit, offset])

                try:
                    async with conn.cursor(row_factory=dict_row) as cur:
                        await cur.execute(query, params)
                        rows = await cur.fetchall()
                        for row in rows:
                            row["added"] = row["added"].isoformat() if row["added"] else None
                            row["id"] = str(row["id"])
                            results.append(row)
                except Exception as e:
                    print(f"Error querying {src}: {e}")
                    continue

    # Apply final ordering and limit
    if order_by == "latest":
        results.sort(key=lambda x: x["added"] or "", reverse=True)
    elif order_by == "oldest":
        results.sort(key=lambda x: x["added"] or "")
    elif order_by == "random":
        import random
        random.shuffle(results)

    return {"characters": results[:limit], "query": q, "tag": tag}

# NOTE: More specific routes must come BEFORE the generic {character_id:path} route
# because :path is greedy and would match /card.png, /card, /tags as part of the ID

@app.get("/api/character/{source}/{character_id:path}/card.png")
async def get_character_card_png(source: str, character_id: str):
    """
    Get character card as PNG image with embedded metadata.

    The character data is embedded in the PNG as a tEXt chunk named "chara"
    containing base64-encoded JSON - the standard format for AI character cards.
    """
    if source not in SOURCES:
        raise HTTPException(status_code=404, detail="Unknown source")

    config = SOURCES[source]
    def_table = config["def_table"]
    id_field = config["id_field"]
    id_type = config["id_type"]

    # Convert ID to proper type
    if id_type == "int":
        try:
            typed_id = int(character_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
    else:
        typed_id = character_id

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            # Get definition and image hash
            await cur.execute(
                f"SELECT definition, raw, image_hash, name FROM {def_table} WHERE {id_field} = %s ORDER BY added DESC LIMIT 1",
                (typed_id,)
            )
            result = await cur.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Character not found")

            # Get card data - prefer raw if available
            card_data = None
            if result["raw"]:
                try:
                    raw_bytes = bytes(result["raw"]) if isinstance(result["raw"], memoryview) else result["raw"]
                    decompressed = zlib.decompress(raw_bytes)
                    card_data = json.loads(decompressed.decode())
                except Exception as e:
                    print(f"Error decompressing raw: {e}")

            if card_data is None:
                card_data = result["definition"]

            if not card_data:
                raise HTTPException(status_code=404, detail="No card data available")

            # Get image
            image_hash = result["image_hash"]
            if not image_hash or len(image_hash) < 4:
                raise HTTPException(status_code=404, detail="No image available")

            image_path = get_image_path(image_hash)
            if not image_path.exists():
                raise HTTPException(status_code=404, detail="Image file not found")

            # Load image with Pillow
            try:
                img = Image.open(image_path)

                # Convert to PNG if needed
                if img.format != 'PNG':
                    # Convert to RGBA for transparency support, or RGB
                    if img.mode in ('RGBA', 'LA', 'P'):
                        img = img.convert('RGBA')
                    else:
                        img = img.convert('RGB')

                # Prepare character data as base64-encoded JSON
                card_json = json.dumps(card_data, ensure_ascii=False)
                card_base64 = base64.b64encode(card_json.encode('utf-8')).decode('ascii')

                # Create PNG metadata
                png_info = PngInfo()
                png_info.add_text("chara", card_base64)

                # Save to buffer
                buffer = io.BytesIO()
                img.save(buffer, format='PNG', pnginfo=png_info)
                buffer.seek(0)

                # Generate filename
                name = result["name"] or character_id
                safe_name = "".join(c if c.isalnum() or c in ' -_' else '_' for c in str(name))[:50]

                return Response(
                    content=buffer.read(),
                    media_type="image/png",
                    headers={
                        "Content-Disposition": f'attachment; filename="{safe_name}.png"'
                    }
                )
            except Exception as e:
                print(f"Error creating PNG card: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to create card: {str(e)}")


@app.get("/api/character/{source}/{character_id:path}/card")
async def get_character_card(source: str, character_id: str, raw: bool = False):
    """Get character card JSON definition."""
    if source not in SOURCES:
        raise HTTPException(status_code=404, detail="Unknown source")

    config = SOURCES[source]
    def_table = config["def_table"]
    id_field = config["id_field"]
    id_type = config["id_type"]

    # Convert ID to proper type
    if id_type == "int":
        try:
            typed_id = int(character_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
    else:
        typed_id = character_id

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            await cur.execute(
                f"SELECT definition, raw FROM {def_table} WHERE {id_field} = %s ORDER BY added DESC LIMIT 1",
                (typed_id,)
            )
            result = await cur.fetchone()

            if not result:
                raise HTTPException(status_code=404, detail="Character not found")

            if raw and result["raw"]:
                # Decompress raw data
                try:
                    raw_bytes = bytes(result["raw"]) if isinstance(result["raw"], memoryview) else result["raw"]
                    decompressed = zlib.decompress(raw_bytes)
                    return json.loads(decompressed.decode())
                except Exception as e:
                    print(f"Error decompressing raw: {e}")

            return result["definition"]


@app.get("/api/character/{source}/{character_id:path}/tags")
async def get_character_tags(source: str, character_id: str):
    """Get tags for a specific character."""
    if source not in SOURCES:
        raise HTTPException(status_code=404, detail="Unknown source")

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            try:
                await cur.execute("""
                    SELECT t.id, t.name, t.count
                    FROM tags t
                    JOIN character_tags ct ON ct.tag_id = t.id
                    WHERE ct.source = %s AND ct.character_id = %s
                    ORDER BY t.count DESC
                """, (source, character_id))
                tags = await cur.fetchall()
                return {"tags": list(tags), "source": source, "character_id": character_id}
            except Exception as e:
                return {"tags": [], "error": str(e)}


@app.get("/api/character/{source}/{character_id:path}")
async def get_character(source: str, character_id: str):
    """Get character details by source and ID."""
    if source not in SOURCES:
        raise HTTPException(status_code=404, detail="Unknown source")

    config = SOURCES[source]
    def_table = config["def_table"]
    id_field = config["id_field"]
    id_type = config["id_type"]

    # Convert ID to proper type
    if id_type == "int":
        try:
            typed_id = int(character_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid ID format")
    else:
        typed_id = character_id

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            # Get definition
            await cur.execute(
                f"SELECT * FROM {def_table} WHERE {id_field} = %s ORDER BY added DESC LIMIT 1",
                (typed_id,)
            )
            definition = await cur.fetchone()

            if not definition:
                raise HTTPException(status_code=404, detail="Character not found")

            # Convert datetime and bytes fields
            result_def = {}
            for key, value in definition.items():
                if hasattr(value, 'isoformat'):
                    result_def[key] = value.isoformat()
                elif isinstance(value, (bytes, memoryview)):
                    result_def[key] = None  # Skip raw bytes in response
                else:
                    result_def[key] = value

            # Get main character data if available
            main_table = config["main_table"]
            character_data = None
            if main_table:
                try:
                    if source == "char_tavern":
                        await cur.execute(
                            f"SELECT * FROM {main_table} WHERE path = %s",
                            (typed_id,)
                        )
                    else:
                        await cur.execute(
                            f"SELECT * FROM {main_table} WHERE id = %s",
                            (typed_id,)
                        )
                    row = await cur.fetchone()
                    if row:
                        character_data = {}
                        for key, value in row.items():
                            if hasattr(value, 'isoformat'):
                                character_data[key] = value.isoformat()
                            elif isinstance(value, (bytes, memoryview)):
                                character_data[key] = None
                            else:
                                character_data[key] = value
                except Exception as e:
                    print(f"Error fetching main table: {e}")

            return {
                "source": source,
                "definition": result_def,
                "character": character_data,
            }


@app.get("/api/image/{image_hash}")
async def get_image(image_hash: str):
    """Get character image by hash."""
    if len(image_hash) < 4:
        raise HTTPException(status_code=400, detail="Invalid image hash")

    image_path = get_image_path(image_hash)

    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    content = image_path.read_bytes()

    # Detect content type
    content_type = "image/png"
    if content[:3] == b"\xff\xd8\xff":
        content_type = "image/jpeg"
    elif content[:4] == b"GIF8":
        content_type = "image/gif"
    elif content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        content_type = "image/webp"

    return Response(content=content, media_type=content_type)


@app.get("/api/users/{source}/{username}")
async def get_user(source: str, username: str):
    """Get user information and their characters."""
    if source not in SOURCES:
        raise HTTPException(status_code=404, detail="Unknown source")

    config = SOURCES[source]

    if not config["has_author"]:
        raise HTTPException(status_code=400, detail="This source doesn't have author information")

    def_table = config["def_table"]

    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            # Get user's characters
            query = build_select_query(source, config, "WHERE author = %s")

            await cur.execute(query, (username,))
            characters = await cur.fetchall()

            for char in characters:
                if char["added"]:
                    char["added"] = char["added"].isoformat()
                char["id"] = str(char["id"])

            # Try to get user profile if available
            user_tables = {
                "chub": "chub_user",
                "risuai": "risuai_user",
                "char_tavern": "char_tavern_user",
            }

            user_data = None
            if source in user_tables:
                user_table = user_tables[source]
                try:
                    await cur.execute(
                        f"SELECT * FROM {user_table} WHERE username = %s",
                        (username,)
                    )
                    row = await cur.fetchone()
                    if row:
                        user_data = {}
                        for key, value in row.items():
                            if hasattr(value, 'isoformat'):
                                user_data[key] = value.isoformat()
                            else:
                                user_data[key] = value
                except Exception as e:
                    print(f"Error fetching user: {e}")

            return {
                "username": username,
                "source": source,
                "user": user_data,
                "characters": characters,
                "count": len(characters),
            }


# ============== TAG ENDPOINTS ==============

@app.get("/api/tags")
async def get_tags(
    q: Optional[str] = Query(default=None, description="Search query for tag names"),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort: str = Query(default="count", description="Sort by: count, name"),
):
    """Get list of tags, optionally filtered by search query."""
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            # Check if tags table exists
            await cur.execute("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'tags'
                )
            """)
            result = await cur.fetchone()
            if not result["exists"]:
                return {"tags": [], "total": 0, "error": "Tags table not found. Run migrations first."}

            # Build query
            if q:
                pattern = f"%{q.lower()}%"
                count_query = "SELECT COUNT(*) as cnt FROM tags WHERE LOWER(name) LIKE %s"
                await cur.execute(count_query, (pattern,))
                total = (await cur.fetchone())["cnt"]

                order = "count DESC" if sort == "count" else "name ASC"
                query = f"""
                    SELECT id, name, count
                    FROM tags
                    WHERE LOWER(name) LIKE %s
                    ORDER BY {order}
                    LIMIT %s OFFSET %s
                """
                await cur.execute(query, (pattern, limit, offset))
            else:
                await cur.execute("SELECT COUNT(*) as cnt FROM tags")
                total = (await cur.fetchone())["cnt"]

                order = "count DESC" if sort == "count" else "name ASC"
                query = f"""
                    SELECT id, name, count
                    FROM tags
                    ORDER BY {order}
                    LIMIT %s OFFSET %s
                """
                await cur.execute(query, (limit, offset))

            tags = await cur.fetchall()
            return {"tags": list(tags), "total": total}


@app.get("/api/tags/popular")
async def get_popular_tags(
    limit: int = Query(default=50, ge=1, le=200),
):
    """Get most popular tags."""
    async with pool.connection() as conn:
        async with conn.cursor(row_factory=dict_row) as cur:
            try:
                await cur.execute("""
                    SELECT id, name, count
                    FROM tags
                    WHERE count > 0
                    ORDER BY count DESC
                    LIMIT %s
                """, (limit,))
                tags = await cur.fetchall()
                return {"tags": list(tags)}
            except Exception as e:
                return {"tags": [], "error": str(e)}


@app.get("/api/tags/{tag_name}/characters")
async def get_characters_by_tag(
    tag_name: str,
    source: Optional[str] = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Get characters that have a specific tag."""
    # Call the internal helper function
    result = await _get_characters_internal(
        tag=tag_name,
        source=source,
        limit=limit,
        offset=offset,
        order_by="latest"
    )
    # Adjust the response to match the original format
    result["tag"] = tag_name
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
