import os
import shutil
import yaml
from pathlib import Path
from typing import Dict
import copy
from app.models import Gallery
from app.config import GALLERIES_ROOT_DIR

# Cache: gallery_id -> (Gallery, last_mtime)
galleries_db: Dict[str, Gallery] = {}
galleries_mtime: Dict[str, float] = {}


def load_galleries_from_filesystem():
    """
    Loads or refreshes gallery metadata from metadata.yaml files in each gallery directory,
    using a cache to avoid re-parsing unchanged files.
    """
    seen_ids = set()

    for gallery_dir in GALLERIES_ROOT_DIR.iterdir():
        if gallery_dir.is_dir():
            metadata_path = gallery_dir / "metadata.yaml"
            if metadata_path.exists():
                mtime = metadata_path.stat().st_mtime
                try:
                    # If not in cache or updated
                    if (
                        gallery_dir.name not in galleries_mtime
                        or galleries_mtime[gallery_dir.name] < mtime
                    ):
                        with open(metadata_path, "r") as f:
                            data = yaml.safe_load(f)
                            gallery = Gallery(**data)
                            galleries_db[gallery.id] = gallery
                            galleries_mtime[gallery.id] = mtime
                    seen_ids.add(gallery_dir.name)
                except (yaml.YAMLError, ValueError) as e:
                    print(f"Error loading gallery from {metadata_path}: {e}")

    # Remove galleries that no longer exist on disk
    removed = set(galleries_db.keys()) - seen_ids
    for gid in removed:
        galleries_db.pop(gid, None)
        galleries_mtime.pop(gid, None)

def remove_leading_slash(input_string):
    if input_string.startswith('/'):
        return input_string[1:]
    else:
        return input_string
    
def remove_leading_parts(input_path):
    # Normalize the path to handle cases where input is relative or contains '.' or '..'
    normalized_path = os.path.normpath(input_path)
    
    # Split the normalized path into its components
    parts = normalized_path.split(os.sep)
    
    # If there are fewer than 2 parts, it means we don't have a valid path to remove parts from
    if len(parts) < 2:
        return input_path
    
    # Join the parts back up to the second slash (excluding the first part which is usually empty or '.' and the second part which might be an actual segment)
    new_path = os.path.join(*parts[2:])
    
    return new_path

def save_gallery_metadata(gallery: Gallery):
    """
    Saves a gallery object to its metadata.yaml file and updates cache.
    """
    gallery_dir = GALLERIES_ROOT_DIR / gallery.id
    gallery_dir.mkdir(parents=True, exist_ok=True)

    metadata_path = gallery_dir / "metadata.yaml"
    yaml_data = gallery.model_dump(by_alias=False, exclude_none=True)
    # Convert datetime objects to string for YAML serialization
    if "lastUpdateDate" in yaml_data and hasattr(
        yaml_data["lastUpdateDate"], "isoformat"
    ):
        yaml_data["lastUpdateDate"] = yaml_data["lastUpdateDate"].isoformat()

    with open(metadata_path, "w") as f:
        yaml.dump(yaml_data, f, sort_keys=False)

    # Update cache + mtime
    galleries_db[gallery.id] = gallery
    galleries_mtime[gallery.id] = metadata_path.stat().st_mtime


def delete_gallery_image(gallery: Gallery, image_id: str):
    result = next((item for item in gallery.images if item.id == image_id), None)
    if result:
        os.remove(GALLERIES_ROOT_DIR / remove_leading_parts(result.sizes.full))
        os.remove(GALLERIES_ROOT_DIR / remove_leading_parts(result.sizes.thumb))
        os.remove(GALLERIES_ROOT_DIR / remove_leading_parts(result.sizes.small))
        gallery.images.remove(result)
        return True
    
    return False


def purge_gallery(gallery: Gallery):
    gallery_dir = GALLERIES_ROOT_DIR / gallery.id
    if os.path.exists(gallery_dir) and os.path.isdir(gallery_dir):
        shutil.rmtree(gallery_dir)
        print(f"Removed: {gallery_dir}")
    else:
        print("Directory does not exist")
    del galleries_db[gallery.id]


def update_gallery_meta(gallery: Gallery):
    save_gallery_metadata(gallery)


# Load any existing galleries on startup
load_galleries_from_filesystem()
