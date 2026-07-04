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

export interface MoodboardImage {
  id: string;
  url: string;
  description?: string;
  width?: number;
  height?: number;
}

export type MoodboardSectionType = 'text' | 'images';
export type MoodboardImageView = 'list' | 'grid' | 'horizontalScroller';

export interface MoodboardSection {
  type: MoodboardSectionType;
  view?: MoodboardImageView;
  text?: string;
  images?: MoodboardImage[];
}

export interface Moodboard {
  id: string;
  name: string;
  headerColor: string;
  lastUpdateDate?: string;
  coverImageUrl?: string;
  sections: MoodboardSection[];
}

export interface MoodboardThumbnail {
  id: string;
  name: string;
  headerColor: string;
  coverImageUrl?: string;
}
