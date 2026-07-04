import os
import shutil
import yaml
from typing import Dict

from app.models import Moodboard
from app.config import MOODBOARDS_ROOT_DIR
from app.database import remove_leading_parts

# Cache: moodboard_id -> (Moodboard, last_mtime)
moodboards_db: Dict[str, Moodboard] = {}
moodboards_mtime: Dict[str, float] = {}


def load_moodboards_from_filesystem():
    """
    Loads or refreshes moodboard metadata from moodboard.yaml files in each moodboard
    directory, using a cache to avoid re-parsing unchanged files.
    """
    seen_ids = set()

    for moodboard_dir in MOODBOARDS_ROOT_DIR.iterdir():
        if moodboard_dir.is_dir():
            metadata_path = moodboard_dir / "moodboard.yaml"
            if metadata_path.exists():
                mtime = metadata_path.stat().st_mtime
                try:
                    # If not in cache or updated
                    if (
                        moodboard_dir.name not in moodboards_mtime
                        or moodboards_mtime[moodboard_dir.name] < mtime
                    ):
                        with open(metadata_path, "r") as f:
                            data = yaml.safe_load(f)
                            moodboard = Moodboard(**data)
                            moodboards_db[moodboard.id] = moodboard
                            moodboards_mtime[moodboard.id] = mtime
                    seen_ids.add(moodboard_dir.name)
                except (yaml.YAMLError, ValueError) as e:
                    print(f"Error loading moodboard from {metadata_path}: {e}")

    # Remove moodboards that no longer exist on disk
    removed = set(moodboards_db.keys()) - seen_ids
    for mid in removed:
        moodboards_db.pop(mid, None)
        moodboards_mtime.pop(mid, None)


def _recompute_cover_image_url(mb: Moodboard):
    """
    Sets coverImageUrl to the url of the first image found in the first images
    section that has images, else None.
    """
    for section in mb.sections:
        if section.type == "images" and section.images:
            mb.coverImageUrl = section.images[0].url
            return
    mb.coverImageUrl = None


def save_moodboard_metadata(mb: Moodboard):
    """
    Saves a moodboard object to its moodboard.yaml file and updates cache.
    """
    moodboard_dir = MOODBOARDS_ROOT_DIR / mb.id
    moodboard_dir.mkdir(parents=True, exist_ok=True)
    (moodboard_dir / "attached_photos").mkdir(exist_ok=True)

    _recompute_cover_image_url(mb)

    metadata_path = moodboard_dir / "moodboard.yaml"
    yaml_data = mb.model_dump(exclude_none=True)
    # Convert datetime objects to string for YAML serialization
    if "lastUpdateDate" in yaml_data and hasattr(
        yaml_data["lastUpdateDate"], "isoformat"
    ):
        yaml_data["lastUpdateDate"] = yaml_data["lastUpdateDate"].isoformat()

    with open(metadata_path, "w") as f:
        yaml.dump(yaml_data, f, sort_keys=False)

    # Update cache + mtime
    moodboards_db[mb.id] = mb
    moodboards_mtime[mb.id] = metadata_path.stat().st_mtime


def purge_moodboard(mb: Moodboard):
    moodboard_dir = MOODBOARDS_ROOT_DIR / mb.id
    if os.path.exists(moodboard_dir) and os.path.isdir(moodboard_dir):
        shutil.rmtree(moodboard_dir)
        print(f"Removed: {moodboard_dir}")
    else:
        print("Directory does not exist")
    moodboards_db.pop(mb.id, None)
    moodboards_mtime.pop(mb.id, None)


# Load any existing moodboards on startup
load_moodboards_from_filesystem()
