import os
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, File, UploadFile
from PIL import Image
from aiofiles import open as aio_open

# Local imports from our new file structure
from app.models import Moodboard, MoodboardThumbnail, MoodboardData
from app.moodboard_db import (
    moodboards_db,
    purge_moodboard,
    save_moodboard_metadata,
)
from app.database import remove_leading_parts
from app.config import MOODBOARDS_ROOT_DIR
from app.utils import generate_readable_id

# Create a new API router
router = APIRouter()

MAX_IMAGE_SIZE = (1920, 1920)


# --- API Endpoints ---
@router.get(
    "/moodboards",
    response_model=List[MoodboardThumbnail],
    summary="Retrieve all moodboards",
)
async def get_all_moodboards():
    """
    Returns a list of all available moodboards.
    """
    return [MoodboardThumbnail.from_moodboard(x) for x in list(moodboards_db.values())]


@router.get(
    "/moodboard",
    response_model=Optional[Moodboard],
    summary="Retrieve a single moodboard by ID",
)
async def get_moodboard(moodboard_id: str):
    """
    Returns a specific moodboard by its ID.
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    return moodboard


@router.post(
    "/createMoodboard",
    response_model=Moodboard,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new moodboard",
)
async def create_moodboard(data: MoodboardData):
    """
    Creates a new moodboard with a readable unique ID and required directory structure.
    """
    # use current keys to detect collisions
    existing_ids = set(moodboards_db.keys())
    moodboard_id = generate_readable_id(
        data.name or "moodboard", existing_ids, MOODBOARDS_ROOT_DIR, max_len=40
    )
    moodboard_path = MOODBOARDS_ROOT_DIR / moodboard_id

    # Create the directory structure
    try:
        moodboard_path.mkdir(exist_ok=False, parents=True)
        (moodboard_path / "attached_photos").mkdir(exist_ok=True)
    except FileExistsError:
        # Rare race condition: regenerate with a suffix and retry (very defensive)
        moodboard_id = generate_readable_id(
            f"{data.name}-{uuid.uuid4().hex[:4]}",
            existing_ids,
            MOODBOARDS_ROOT_DIR,
            max_len=40,
        )
        moodboard_path = MOODBOARDS_ROOT_DIR / moodboard_id
        try:
            moodboard_path.mkdir(exist_ok=False, parents=True)
            (moodboard_path / "attached_photos").mkdir(exist_ok=True)
        except OSError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create moodboard directories after retry: {e}",
            )
    except OSError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create moodboard directories: {e}"
        )

    new_moodboard = Moodboard(
        id=moodboard_id,
        name=data.name,
        headerColor=data.headerColor or "#111827",
        lastUpdateDate=datetime.now(),
        sections=[],
    )
    moodboards_db[moodboard_id] = new_moodboard

    # Save moodboard metadata to a YAML file
    save_moodboard_metadata(new_moodboard)

    return new_moodboard


def _prune_unused_moodboard_images(moodboard_id: str, sections) -> None:
    """
    Deletes physical files in the moodboard's `attached_photos` directory that
    are no longer referenced by any image in `sections`. Called after a full
    save so that images removed from lists (or lists removed entirely) don't
    leave orphaned files behind.
    """
    attached_dir = MOODBOARDS_ROOT_DIR / moodboard_id / "attached_photos"
    if not attached_dir.is_dir():
        return

    # Resolve every still-referenced image URL to an absolute file path.
    referenced_paths = set()
    for section in sections:
        if getattr(section, "type", None) == "images" and section.images:
            for img in section.images:
                if img.url:
                    referenced_paths.add(
                        (MOODBOARDS_ROOT_DIR / remove_leading_parts(img.url)).resolve()
                    )

    for file_path in attached_dir.iterdir():
        if file_path.is_file() and file_path.resolve() not in referenced_paths:
            try:
                os.remove(file_path)
            except OSError:
                # Best-effort cleanup; don't fail the save on a stray file.
                pass


@router.post(
    "/updateMoodboard",
    response_model=Moodboard,
    summary="Update an existing moodboard (full save, including sections)",
)
async def update_moodboard(moodboard_id: str, data: Moodboard):
    """
    Overwrites name, headerColor and sections of an existing moodboard. This is
    how the editor persists the whole board (including all its sections).
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")

    moodboard.name = data.name
    moodboard.headerColor = data.headerColor
    moodboard.sections = data.sections
    moodboard.lastUpdateDate = datetime.now()

    # Update moodboard metadata in file
    save_moodboard_metadata(moodboard)

    # Garbage-collect image files no longer referenced by any section.
    _prune_unused_moodboard_images(moodboard_id, moodboard.sections)

    return moodboard


@router.put(
    "/moodboard",
    response_model=Optional[Moodboard],
    summary="Update some props on a single moodboard by ID",
)
async def modify_moodboard(moodboard_id: str, data: Dict[str, Any]):
    """
    Patches name/headerColor on a specific moodboard by its ID.
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    if "name" in data:
        moodboard.name = data["name"]
    if "headerColor" in data:
        moodboard.headerColor = data["headerColor"]
    moodboard.lastUpdateDate = datetime.now()
    save_moodboard_metadata(moodboard)
    return moodboard


@router.delete(
    "/moodboard",
    response_model=Optional[Moodboard],
    summary="Delete a single moodboard by ID",
)
async def delete_moodboard(moodboard_id: str):
    """
    Deletes a specific moodboard by its ID.
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")
    purge_moodboard(moodboard)
    return moodboard


@router.post(
    "/uploadMoodboardImage",
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image to attach to a moodboard",
)
async def upload_moodboard_image(
    moodboard_id: str, image_file: UploadFile = File(...)
):
    """
    Uploads an image file for a moodboard, downscaling it if needed. The
    moodboard's sections are NOT modified here - the frontend editor adds the
    returned image to a section and calls updateMoodboard.
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")

    image_id = str(uuid.uuid4())
    original_filename = Path(image_file.filename).stem
    attached_dir = MOODBOARDS_ROOT_DIR / moodboard_id / "attached_photos"
    attached_dir.mkdir(parents=True, exist_ok=True)

    def generate_filename(filename_base: str, suffix: str):
        """Generates a filename, handling collisions."""
        collision_counter = 0
        final_filename = f"{filename_base}.{suffix}"

        while (attached_dir / final_filename).exists():
            collision_counter += 1
            final_filename = f"{filename_base}_{collision_counter:03d}.{suffix}"
        return final_filename

    filename = generate_filename(original_filename, "jpg")
    file_path = attached_dir / filename

    async with aio_open(file_path, "wb") as out_file:
        content = await image_file.read()
        await out_file.write(content)

    # Use Pillow to process and resize the image
    try:
        with Image.open(file_path) as img:
            if max(img.size) > 1920:
                img.thumbnail(MAX_IMAGE_SIZE)
            width, height = img.size
            img.save(file_path, "JPEG", quality=85)
    except Exception as e:
        # In case the uploaded file is not a valid image, remove it and raise an error
        os.remove(file_path)
        raise HTTPException(
            status_code=400, detail=f"Invalid image file or processing error: {e}"
        )

    return {
        "id": image_id,
        "url": f"/moodboard-media/{moodboard_id}/attached_photos/{filename}",
        "width": width,
        "height": height,
    }


@router.delete(
    "/moodboardImage",
    response_model=Optional[Moodboard],
    summary="Delete an attached image from a moodboard",
)
async def delete_moodboard_image(moodboard_id: str, url: str):
    """
    Deletes the physical file referenced by `url` and removes any matching
    MoodboardImage entries from all sections.
    """
    moodboard = moodboards_db.get(moodboard_id)
    if not moodboard:
        raise HTTPException(status_code=404, detail="Moodboard not found")

    file_path = MOODBOARDS_ROOT_DIR / remove_leading_parts(url)
    if file_path.exists():
        os.remove(file_path)

    for section in moodboard.sections:
        if section.type == "images" and section.images:
            section.images = [img for img in section.images if img.url != url]

    moodboard.lastUpdateDate = datetime.now()
    save_moodboard_metadata(moodboard)

    return moodboard
