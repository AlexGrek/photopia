export interface GalleryThumbnail {
  id: string; // Unique ID for routing and identification
  name: string;
  author: string;
  coverImageUrl: string;
}

export interface ImageSizes {
  full: string;
  small: string;
  thumb: string;
}

export interface ImageModel {
  id: string;
  filename: string;
  sizes: ImageSizes;
  width?: number;
  height?: number;
}

export interface Gallery {
  id: string;
  name: string;
  author: string;
  lastUpdateDate: string; // ISO 8601 datetime string
  coverImageUrl?: string;
  images: ImageModel[];
}
