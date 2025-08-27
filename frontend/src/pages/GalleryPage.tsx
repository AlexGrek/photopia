
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2, Sigma } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Gallery, GalleryThumbnail } from '../Models';
import GalleryBrowser from '../components/GalleryBrowser';
import Logo from '../components/Logo';

const GalleryPage: React.FC = () => {
    const { galleryId } = useParams<{ galleryId: string }>();
    const [gallery, setGallery] = useState<Gallery | null>(null)
    const navigate = useNavigate();

    const location = useLocation();
    const state = location.state as { gallery?: GalleryThumbnail; };

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchG = async () => {
            try {
                const response = await fetch(`/api/v1/gallery?gallery_id=${galleryId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch galleries: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                if (data) {
                    setGallery(data as Gallery);
                } else {
                    throw new Error("Invalid data format received from server");
                }
            } catch (err: any) {
                console.error("Error fetching galleries:", err);
                setError(err.message || "Unexpected error occurred");
            } finally {
                setLoading(false);
            }
        };
        if (galleryId)
            fetchG();
    }, [galleryId]);

    // If the gallery is not found, render a message or redirect.
    if (!gallery && (!state || !state.gallery)) {
        return (<div className='w-full min-h-screen text-white fadeIn'>
            {loading && <p className='animate-pulse'><Loader2 /></p>}
            {error && <p className='animate-pulse'><Sigma />{error}</p>}
        </div>);
    }

    const stateId = state.gallery ? state.gallery.id : '';
    const stateCover = state.gallery ? state.gallery.coverImageUrl : '';
    const stateName = state.gallery ? state.gallery.name : '';
    const stateAuthor = state.gallery ? state.gallery.author : '';

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans fadeIn">
            <motion.header
                layoutId={`gallery-card-${gallery ? gallery.id : stateId}`}
                className="relative w-full h-64 overflow-hidden"
            >
                <img
                    src={gallery ? gallery.coverImageUrl : stateCover}
                    alt={`Cover for ${gallery ? gallery.name : stateName}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1920x1080/1f2937/d1d5db?text=Image+Not+Found";
                        e.currentTarget.onerror = null;
                    }}
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col justify-end p-6 md:p-10">
                    <div className='absolute' style={{ transform: "translate(-1em, -9.5em)" }}><Logo /></div>
                    <div className="flex items-center space-x-4 mb-4">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <h1 className="text-4xl font-semibold">
                            {gallery ? gallery.name : stateName}
                        </h1>
                    </div>
                    <p className="text-lg text-gray-300">
                        by {gallery ? gallery.author : stateAuthor}
                    </p>
                </div>
            </motion.header>

            <main className="container mx-auto p-6 pt-10">
                {loading && <p className='animate-spin'><Loader2 /></p>}
                {gallery && gallery.images.length > 0 && <GalleryBrowser images={gallery.images} />}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-gray-500 text-sm mt-10">
                <p>by Unknown Desires, 2025</p>
            </footer>
        </div>
    );
};

export default GalleryPage;