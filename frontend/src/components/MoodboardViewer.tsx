import React, { useState } from 'react';
import type { Moodboard, MoodboardImage, MoodboardSection } from '../Models';
import Modal from './Modal';

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

            <Modal
                isOpen={expandedImage != null}
                onClose={() => setExpandedImage(null)}
                title={expandedImage?.description || 'Image'}
                size="large"
            >
                {expandedImage && (
                    <img
                        src={expandedImage.url}
                        alt={expandedImage.description || ''}
                        onError={onImgError}
                        className="w-full max-h-[75vh] object-contain rounded-lg"
                    />
                )}
            </Modal>
        </div>
    );
};

export default MoodboardViewer;
