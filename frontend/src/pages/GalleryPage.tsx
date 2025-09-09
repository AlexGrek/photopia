
import React, { useEffect, useState } from 'react';
import { ChevronLeft, CloudDownload, Loader2, MenuSquare, Sigma } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Gallery, GalleryThumbnail } from '../Models';
import GalleryBrowser from '../components/GalleryBrowser';
import Logo from '../components/Logo';
import { useNotification } from '../contexts/NotificationContext';
import { localStorageKey } from '../components/ApiKeyForm';

const GalleryPage: React.FC = () => {
    const { galleryId } = useParams<{ galleryId: string }>();
    const [gallery, setGallery] = useState<Gallery | null>(null)
    const navigate = useNavigate();

    const location = useLocation();
    const state = location.state as { gallery?: GalleryThumbnail; } | null;

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const isAdmin = localStorage.getItem(localStorageKey) != null

    const { notify } = useNotification();

    const fetchData = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/v1/download_zip/${galleryId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Check the Content-Type header to determine how to handle the response
            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('application/zip')) {
                // Handle ZIP file download
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                // Extract filename from Content-Disposition header, or use a default
                const contentDisposition = response.headers.get('content-disposition');
                const filenameMatch = contentDisposition && contentDisposition.match(/filename="([^"]+)"/);
                const filename = filenameMatch ? filenameMatch[1] : 'download.zip';
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                notify(`Successfully downloaded file: ${filename}`);
            } else if (contentType && contentType.includes('application/json')) {
                // Handle JSON response
                const data = await response.json();
                if (data.result) {
                    notify(`${JSON.stringify(data.result, null, 2)}`);
                } else {
                    notify('JSON received, but no "result" field was found.');
                }
            } else {
                // Fallback for other content types
                notify('Unsupported content type received from server.');
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                notify(`Failed to fetch data: ${error.message}`, 'error');
            } else {
                notify('An unknown error occurred.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

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
                notify(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (galleryId)
            fetchG();
    }, [galleryId, notify]);

    // If the gallery is not found, render a message or redirect.
    if (!gallery && (!state || !state.gallery)) {
        return (<div className='w-full min-h-screen text-white'>
            {loading && <p className='animate-pulse'><Loader2 /></p>}
            {error && <p className='animate-pulse'><Sigma />{error}</p>}
        </div>);
    }

    const stateId = state?.gallery ? state.gallery.id : '';
    const stateCover = state?.gallery ? state.gallery.coverImageUrl : '';
    const stateName = state?.gallery ? state.gallery.name : '';
    const stateAuthor = state?.gallery ? state.gallery.author : '';

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans">
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
                    <div className='absolute fadeInDelayed' style={{ transform: "translate(-1em, -9.5em)" }}><Logo /></div>
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
                        <button
                            id="download-zip"
                            onClick={() => fetchData()}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <CloudDownload size={24} />
                        </button>
                        {isAdmin && <button
                            onClick={() => navigate(`/edit/${galleryId}`)}
                            id="admin-edit"
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <MenuSquare size={24} />
                        </button>}
                        {loading && <span className='animate-spin'><Loader2 size={24} /></span>}
                    </div>
                    <p className="text-lg text-gray-300">
                        by {gallery ? gallery.author : stateAuthor}
                    </p>
                </div>
            </motion.header>

            <main className="container mx-auto p-6 pt-10">
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