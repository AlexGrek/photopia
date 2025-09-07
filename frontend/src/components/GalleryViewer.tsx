import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MoreVertical,
  Download,
  Image as ImageIcon,
  Trash2,
  Star,
} from "lucide-react";
import type { Gallery, ImageModel } from "../Models";

interface GalleryViewerProps {
  gallery: Gallery;
  onBatchDelete: (images: ImageModel[]) => void;
  onImageSetAsCover: (image: ImageModel) => void;
  onAuthorChange: (author: string) => void;
}

export const GalleryViewer: React.FC<GalleryViewerProps> = ({
  gallery,
  onBatchDelete,
  onImageSetAsCover,
  onAuthorChange,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [authorDraft, setAuthorDraft] = useState(gallery.author);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectedImages = gallery.images.filter((img) =>
    selectedIds.has(img.id)
  );

  return (
    <div className="text-gray-200 p-4">
      {/* Author Editable */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={authorDraft}
          onChange={(e) => setAuthorDraft(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-sm text-gray-200 focus:outline-none focus:ring focus:ring-gray-600"
        />
        <button
          onClick={() => onAuthorChange(authorDraft)}
          className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1 rounded-md"
        >
          Update
        </button>
        <span className="text-xs text-gray-500 ml-2">
          Updated {new Date(gallery.lastUpdateDate).toLocaleString()}
        </span>
      </div>

      {/* Batch Delete Button */}
      {selectedImages.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => {
              onBatchDelete(selectedImages);
              setSelectedIds(new Set());
            }}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-md text-sm font-semibold"
          >
            Delete Selected ({selectedImages.length})
          </button>
        </div>
      )}

      {/* Images */}
      <div className="flex flex-wrap gap-4">
        {gallery.images.map((image) => (
          <motion.div
            key={image.id}
            className="relative group w-48 h-48 rounded-lg overflow-hidden shadow-md bg-black/60"
            whileHover={{ scale: 1.05 }}
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selectedIds.has(image.id)}
              onChange={() => toggleSelection(image.id)}
              className="absolute top-2 left-2 w-4 h-4 accent-red-500 cursor-pointer z-10"
            />

            <img
              src={image.sizes.thumb}
              alt={image.filename}
              className="w-full h-full object-cover"
            />

            {/* Top-right menu button */}
            <button
              onClick={() =>
                setMenuOpenId(menuOpenId === image.id ? null : image.id)
              }
              className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-black/90"
            >
              <MoreVertical className="w-4 h-4 text-gray-200" />
            </button>

            {/* Context Menu */}
            {menuOpenId === image.id && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-8 right-2 bg-black/90 border border-gray-700 rounded-md shadow-lg z-10 p-2 flex flex-col text-sm"
              >
                <button
                  onClick={() => {
                    onBatchDelete([image]);
                    setMenuOpenId(null);
                    setSelectedIds((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(image.id);
                      return newSet;
                    });
                  }}
                  className="flex items-center gap-2 hover:bg-gray-800 p-1 rounded-md"
                >
                  <Trash2 className="w-4 h-4 text-red-400" /> Delete
                </button>
                <button
                  onClick={() => {
                    onImageSetAsCover(image);
                    setMenuOpenId(null);
                  }}
                  className="flex items-center gap-2 hover:bg-gray-800 p-1 rounded-md"
                >
                  <Star className="w-4 h-4 text-yellow-400" /> Set as Cover
                </button>
                <button
                  onClick={() =>
                    handleDownload(image.sizes.full, image.filename + ".jpg")
                  }
                  className="flex items-center gap-2 hover:bg-gray-800 p-1 rounded-md"
                >
                  <Download className="w-4 h-4 text-green-400" /> Download Full
                </button>
                <button
                  onClick={() =>
                    handleDownload(
                      image.sizes.thumb,
                      image.filename + "_thumb.jpg"
                    )
                  }
                  className="flex items-center gap-2 hover:bg-gray-800 p-1 rounded-md"
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" /> Download Thumb
                </button>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
