import os
import uuid
import shutil
import zipfile
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, File, UploadFile, FileResponse, BackgroundTasks
from PIL import Image
from aiofiles import open as aio_open

# Local imports from our new file structure
from app.models import Gallery, GalleryThumbnail, ImageModel, GalleryData, ImageSizes
from app.database import galleries_db, save_gallery_metadata
from app.config import GALLERIES_ROOT_DIR, THUMB_SIZE, SMALL_SIZE
from app.utils import generate_readable_id

# Create a new API router
router = APIRouter()


# --- API Endpoints ---
@router.get(
    "/galleries",
    response_model=List[GalleryThumbnail],
    summary="Retrieve all galleries",
)
async def get_all_galleries():
    """
    Returns a list of all available galleries.
    """
    return [GalleryThumbnail.from_gallery(x) for x in list(galleries_db.values())]


@router.get(
    "/gallery",
    response_model=Optional[Gallery],
    summary="Retrieve a single gallery by ID",
)
async def get_gallery(gallery_id: str):
    """
    Returns a specific gallery by its ID.
    """
    gallery = galleries_db.get(gallery_id)
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")
    return gallery


@router.post(
    "/createGallery",
    response_model=Gallery,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new gallery",
)
async def create_gallery(data: GalleryData):
    """
    Creates a new gallery with a readable unique ID and required directory structure.
    """
    # use current keys to detect collisions
    existing_ids = set(galleries_db.keys())
    gallery_id = generate_readable_id(
        data.name or "gallery", existing_ids, GALLERIES_ROOT_DIR, max_len=30
    )
    gallery_path = GALLERIES_ROOT_DIR / gallery_id

    # Create the directory structure
    try:
        gallery_path.mkdir(exist_ok=False, parents=True)
        (gallery_path / "images_full").mkdir(exist_ok=True)
        (gallery_path / "images_small").mkdir(exist_ok=True)
        (gallery_path / "images_thumb").mkdir(exist_ok=True)
    except FileExistsError:
        # Rare race condition: regenerate with a suffix and retry (very defensive)
        gallery_id = generate_readable_id(
            f"{data.name}-{uuid.uuid4().hex[:4]}",
            existing_ids,
            GALLERIES_ROOT_DIR,
            max_len=30,
        )
        gallery_path = GALLERIES_ROOT_DIR / gallery_id
        try:
            gallery_path.mkdir(exist_ok=False, parents=True)
            (gallery_path / "images_full").mkdir(exist_ok=True)
            (gallery_path / "images_small").mkdir(exist_ok=True)
            (gallery_path / "images_thumb").mkdir(exist_ok=True)
        except OSError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create gallery directories after retry: {e}",
            )
    except OSError as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create gallery directories: {e}"
        )

    new_gallery = Gallery(
        id=gallery_id,
        name=data.name,
        author=data.author,
        lastUpdateDate=datetime.now(),
        images=[],
    )
    galleries_db[gallery_id] = new_gallery

    # Save gallery metadata to a YAML file
    save_gallery_metadata(new_gallery)

    return new_gallery


@router.post(
    "/updateGallery", response_model=Gallery, summary="Update an existing gallery"
)
async def update_gallery(gallery_id: str, data: GalleryData):
    """
    Updates the name or description of an existing gallery.
    """
    gallery = galleries_db.get(gallery_id)
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    gallery.name = data.name
    gallery.author = data.author
    gallery.lastUpdateDate = datetime.now()

    # Update gallery metadata in file
    save_gallery_metadata(gallery)

    return gallery


@router.post(
    "/uploadImageToGallery",
    status_code=status.HTTP_201_CREATED,
    summary="Upload an image to a gallery",
)
async def upload_image_to_gallery(gallery_id: str, image_file: UploadFile = File(...)):
    """
    Uploads an image file to a specified gallery, resizing it for different sizes.
    """
    gallery = galleries_db.get(gallery_id)
    if not gallery:
        raise HTTPException(status_code=404, detail="Gallery not found")

    image_id = str(uuid.uuid4())
    original_filename = Path(image_file.filename).stem

    def generate_filename(size_name: str, size: tuple, filename_base: str, suffix: str):
        """Generates a filename with size suffix, handling collisions."""
        size_str = f"__{size[0]}x{size[1]}" if size else ""
        collision_counter = 0
        final_filename = f"{filename_base}{size_str}.{suffix}"

        # Check for filename collisions
        # Note: In a real app, this should check the database or gallery's file list
        while (GALLERIES_ROOT_DIR / gallery_id / size_name / final_filename).exists():
            collision_counter += 1
            final_filename = (
                f"{filename_base}_{collision_counter:03d}{size_str}.{suffix}"
            )
        return final_filename

    # Save the original image to the full-size directory
    full_path_dir = GALLERIES_ROOT_DIR / gallery_id / "images_full"
    full_filename = generate_filename("images_full", None, original_filename, "jpg")
    full_path = full_path_dir / full_filename

    async with aio_open(full_path, "wb") as out_file:
        content = await image_file.read()
        await out_file.write(content)

    # Use Pillow to process and resize the image
    try:
        with Image.open(full_path) as img:
            # Get dimensions of the original image
            width, height = img.size

            # --- Resize and save small image ---
            small_filename = generate_filename(
                "images_small", SMALL_SIZE, original_filename, "jpg"
            )
            small_path = (
                GALLERIES_ROOT_DIR / gallery_id / "images_small" / small_filename
            )
            small_img = img.copy()
            small_img.thumbnail(SMALL_SIZE)
            small_img.save(small_path, "JPEG", quality=85)

            # --- Resize and save thumbnail image ---
            thumb_filename = generate_filename(
                "images_thumb", THUMB_SIZE, original_filename, "jpg"
            )
            thumb_path = (
                GALLERIES_ROOT_DIR / gallery_id / "images_thumb" / thumb_filename
            )
            thumb_img = img.copy()
            thumb_img.thumbnail(THUMB_SIZE)
            thumb_img.save(thumb_path, "JPEG", quality=85)

    except Exception as e:
        # In case the uploaded file is not a valid image, remove it and raise an error
        os.remove(full_path)
        raise HTTPException(
            status_code=400, detail=f"Invalid image file or processing error: {e}"
        )

    # Add the new image metadata to the gallery
    image_data = ImageModel(
        id=image_id,
        filename=original_filename,
        sizes=ImageSizes(
            full=f"/galleries/{gallery_id}/images_full/{full_filename}",
            small=f"/galleries/{gallery_id}/images_small/{small_filename}",
            thumb=f"/galleries/{gallery_id}/images_thumb/{thumb_filename}",
        ),
        width=width,
        height=height,
    )
    gallery.images.append(image_data)

    # Update the cover image URL if it's not set
    if not gallery.coverImageUrl:
        gallery.coverImageUrl = image_data.sizes.thumb

    gallery.lastUpdateDate = datetime.now()

    # Update the gallery metadata file
    save_gallery_metadata(gallery)

    return {
        "message": f"Image '{original_filename}' uploaded to gallery '{gallery.name}'",
        "image_id": image_id,
    }

zip_creation_locks = {}

def create_gallery_zip(gallery_id: str, gallery_path: Path, zip_path: Path):
    """Create zip file with all original images from gallery."""
    try:
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for img_path in gallery_path.glob("images/*"):  # original images assumed in images/
                if img_path.is_file():
                    zipf.write(img_path, arcname=img_path.name)
    finally:
        # Mark creation as done
        zip_creation_locks.pop(gallery_id, None)


@router.get("/download_zip/{gallery_id}")
async def download_zip(gallery_id: str, background_tasks: BackgroundTasks):
    gallery_path = GALLERIES_ROOT_DIR / gallery_id
    if not gallery_path.exists():
        raise HTTPException(status_code=404, detail="Gallery not found")

    zip_path = gallery_path / f"{gallery_id}.zip"

    # If zip already exists → return it
    if zip_path.exists():
        return FileResponse(zip_path, media_type="application/zip", filename=f"{gallery_id}.zip")

    # If zip creation is in progress → return message
    if zip_creation_locks.get(gallery_id):
        return {"result": "zip creation already in progress"}

    # Otherwise → schedule background task
    zip_creation_locks[gallery_id] = True
    background_tasks.add_task(create_gallery_zip, gallery_id, gallery_path, zip_path)

    return {"result": "zip creation initiated"}
