# Character Archive Browser

A lightweight local browser for Character Archive. 

## 🚀 Features

- Search functionality to find specific characters.
- View character details and associated images.
- Filter by sources, authors and tag.
- Download character card.

## ⚠️ Warnings

- Yes, I used AI to make some parts of it.
- It is meant to run locally, no cache, minimal setup.
- I have no idea how to run it on Windows.

## 📋 Requirements

- Docker
- ~4 GB RAM (PostgreSQL will use ~2-4 GB)
- ~500 GB of disk space at peak
- Downloaded torrent of Character Archive (char-archive.evulid.cc)

## 🛠️ Setup (Linux)

1. Download archive of char-archive.evulid.cc (~200GB).
    Folder structure should looks like:
    ```
    character-archive-final-torrent/
    ├── docker-compose.yml 
    ├── archive.7z.001
    ├── ...
    ├── archive.7z.020
    ├── char-archive-scraper.zip	
    ├── char-archive-server.zip
    ├── database.dump
    ├── README.md
    ```
2. Extract **archive.7z.001**, this will take several minutes.
3. Now you have **archive** directory in character-archive-final-torrent.
4. archive.7z files can be deleted to save disk space.
5. Clone or download the repository into character-archive-final-torrent.
6. Navigate to the **browser** directory.
7. Start the application:
   ```bash
   docker compose up
   ```
> **Note:** On first run, the database will be imported automatically, this will take several minutes.

8. Open your browser and go to: **http://localhost:3000**

## 🔧 Development Mode

To run in development mode with live reloading of frontend application:
```bash
docker compose -f docker-compose.dev.yml up
```

## 📁 Project Structure

```
browser/
├── docker-compose.yml          # Production compose file
├── docker-compose.dev.yml      # Development compose file
├── backend/                    # Backend application
├── frontend/                   # Frontend application
└── scripts/                    # Database scripts
```

## ⚙️ Configuration

### Ports

| Port | Service | Description |
|------|---------|-------------|
| 3000 | Frontend | Main browser interface |
| 8000 | Backend | API server (accessible internally) |
| 5432 | PostgreSQL | Database server |

### Memory Limits

You can adjust memory limits in `docker-compose.yml`:

```yaml
postgres:
  deploy:
    resources:
      limits:
        memory: 4G  # Reduce if you have limited RAM
```

And PostgreSQL parameters:

```yaml
command: >
  postgres
  -c shared_buffers=512MB      # Adjust based on available RAM
  -c effective_cache_size=1GB
  -c maintenance_work_mem=256MB
  -c work_mem=32MB
  -c max_connections=50
  -c max_wal_size=2GB
  -c checkpoint_timeout=15min
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The Character Archive dataset itself remains copyrighted by Cyberes.
