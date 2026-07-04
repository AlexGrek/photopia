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


# --- Pydantic Models for Moodboard Metadata ---


class MoodboardImage(BaseModel):
    id: str
    url: str
    description: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class MoodboardSection(BaseModel):
    type: str  # "text" or "images"
    view: Optional[str] = None  # "list" | "grid" | "horizontalScroller" (images only)
    text: Optional[str] = None  # for text sections
    images: List[MoodboardImage] = []  # for images sections


class Moodboard(BaseModel):
    id: str
    name: str
    headerColor: str = "#111827"
    lastUpdateDate: datetime = Field(default_factory=datetime.now)
    coverImageUrl: Optional[str] = None
    sections: List[MoodboardSection] = []


class MoodboardThumbnail(BaseModel):
    id: str
    name: str
    headerColor: str
    coverImageUrl: Optional[str] = None

    @classmethod
    def from_moodboard(cls, mb: Moodboard):
        return MoodboardThumbnail(
            id=mb.id,
            name=mb.name,
            headerColor=mb.headerColor,
            coverImageUrl=mb.coverImageUrl,
        )


class MoodboardData(BaseModel):
    name: str
    headerColor: Optional[str] = "#111827"
