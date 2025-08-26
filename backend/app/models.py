from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

# --- Pydantic Models for Gallery Metadata ---


class ImageSizes(BaseModel):
    full: str
    small: str
    thumb: str


class ImageModel(BaseModel):
    id: str
    filename: str
    sizes: ImageSizes
    width: Optional[int] = None
    height: Optional[int] = None


class Gallery(BaseModel):
    id: str
    name: str
    author: str
    lastUpdateDate: datetime = Field(default_factory=datetime.now)
    coverImageUrl: Optional[str] = None
    images: List[ImageModel] = []


class GalleryThumbnail(BaseModel):
    id: str
    name: str
    author: str
    coverImageUrl: Optional[str] = None

    @classmethod
    def from_gallery(cls, gallery: Gallery):
        return GalleryThumbnail(
            id=gallery.id,
            name=gallery.name,
            coverImageUrl=gallery.coverImageUrl,
            author=gallery.author,
        )


class GalleryData(BaseModel):
    name: str
    author: str
