import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Moodboard, MoodboardImage, MoodboardSection } from '../Models';

const IMAGE_PLACEHOLDER = "https://placehold.co/600x600/1f2937/d1d5db?text=Image+Not+Found";

const onImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = IMAGE_PLACEHOLDER;
    e.currentTarget.onerror = null;
};

interface MoodboardImagesSectionProps {
    section: MoodboardSection;
    onImageClick: (image: MoodboardImage) => void;
}

const MoodboardImagesSection: React.FC<MoodboardImagesSectionProps> = ({ section, onImageClick }) => {
    const images = section.images || [];
    const view = section.view || 'grid';

    if (images.length === 0) return null;

    if (view === 'list') {
        return (
            <div className="flex flex-col gap-6">
                {images.map((image) => (
                    <div key={image.id} className="flex flex-col gap-2">
                        <img
                            src={image.url}
                            alt={image.description || ''}
                            onClick={() => onImageClick(image)}
                            onError={onImgError}
                            className="w-full max-h-[70vh] object-contain rounded-lg bg-gray-900 cursor-pointer"
                        />
                        {image.description && (
                            <p className="text-gray-400 text-sm">{image.description}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    if (view === 'horizontalScroller') {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                {images.map((image) => (
                    <div key={image.id} className="flex-shrink-0 w-56 sm:w-72 flex flex-col gap-2">
                        <img
                            src={image.url}
                            alt={image.description || ''}
                            onClick={() => onImageClick(image)}
                            onError={onImgError}
                            className="w-56 h-56 sm:w-72 sm:h-72 object-cover rounded-lg cursor-pointer"
                        />
                        {image.description && (
                            <p className="text-gray-400 text-sm truncate">{image.description}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    if (view === 'masonry') {
        return (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 [column-fill:_balance]">
                {images.map((image) => (
                    <div key={image.id} className="mb-4 break-inside-avoid flex flex-col gap-2">
                        <img
                            src={image.url}
                            alt={image.description || ''}
                            onClick={() => onImageClick(image)}
                            onError={onImgError}
                            className="w-full rounded-lg cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                        />
                        {image.description && (
                            <p className="text-gray-400 text-sm">{image.description}</p>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // grid (default)
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
                <div key={image.id} className="flex flex-col gap-2">
                    <img
                        src={image.url}
                        alt={image.description || ''}
                        onClick={() => onImageClick(image)}
                        onError={onImgError}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105"
                    />
                    {image.description && (
                        <p className="text-gray-400 text-sm truncate">{image.description}</p>
                    )}
                </div>
            ))}
        </div>
    );
};

interface LightboxProps {
    image: MoodboardImage;
    onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ image, onClose }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [onClose]);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm p-4"
        >
            <button
                onClick={onClose}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
                <X size={24} />
            </button>
            <motion.img
                key={image.id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.2 }}
                src={image.url}
                alt={image.description || ''}
                onError={onImgError}
                onClick={(e) => e.stopPropagation()}
                className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-2xl"
            />
            {image.description && (
                <p className="mt-4 text-gray-300 text-sm text-center max-w-2xl">
                    {image.description}
                </p>
            )}
        </motion.div>,
        document.body
    );
};

interface MoodboardViewerProps {
    moodboard: Moodboard;
}

const MoodboardViewer: React.FC<MoodboardViewerProps> = ({ moodboard }) => {
    const [expandedImage, setExpandedImage] = useState<MoodboardImage | null>(null);

    return (
        <div className="flex flex-col gap-10">
            {moodboard.sections.map((section, index) => (
                <div key={index}>
                    {section.type === 'text' && (
                        <div className="prose prose-invert max-w-none text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
                            {section.text}
                        </div>
                    )}
                    {section.type === 'images' && (
                        <MoodboardImagesSection section={section} onImageClick={setExpandedImage} />
                    )}
                </div>
            ))}

            <AnimatePresence>
                {expandedImage && (
                    <Lightbox image={expandedImage} onClose={() => setExpandedImage(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MoodboardViewer;
