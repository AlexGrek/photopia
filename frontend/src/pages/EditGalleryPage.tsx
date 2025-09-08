
import React, { useEffect, useState } from 'react';
import { ChevronLeft, FolderPen, Loader2, MenuSquare, Save, Sigma, Trash2, UploadCloud } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Gallery, ImageModel } from '../Models';
import Logo from '../components/Logo';
import { useNotification } from '../contexts/NotificationContext';
import { localStorageKey } from '../components/ApiKeyForm';
import { GalleryViewer } from '../components/GalleryViewer';
import ConfirmationModal from '../components/ConfirmationModal';

const EditGalleryPage: React.FC = () => {
    const { galleryId } = useParams<{ galleryId: string }>();
    const [gallery, setGallery] = useState<Gallery | null>(null)
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [deleteOpen, setDeleteOpen] = useState(false);

    const { notify } = useNotification();

    const handleDeleteGallery = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/v1/gallery?gallery_id=${galleryId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }


            // Handle JSON response
            const data = await response.json();
            if (data.result) {
                notify(`${JSON.stringify(data.result, null, 2)}`);
            } else {
                notify('Ok.');
            }
            navigate("/")

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

    const handleRenameGallery = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/gallery?gallery_id=${galleryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
                body: JSON.stringify({ "name": gallery?.name || "no name" })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.result) {
                notify(`${JSON.stringify(data.result, null, 2)}`);
            } else {
                notify('Done.');
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

    const handleDeleteImages = async (images: ImageModel[]) => {
        for (const image of images) {
            await handleDeleteImage(image.id);
        }
    }

    const handleDeleteImage = async (image_id: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/image?gallery_id=${galleryId}&image_id=${image_id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.result) {
                notify(`${JSON.stringify(data.result, null, 2)}`);
            } else {
                notify('Done.');
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

    const handleRenameGalleryAuthor = async (author: string) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/gallery?gallery_id=${galleryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
                body: JSON.stringify({ "author": author })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (gallery)
                setGallery({ ...gallery, author })

            const data = await response.json();
            if (data.result) {
                notify(`${JSON.stringify(data.result, null, 2)}`);
            } else {
                notify('Done.');
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

    const handleChangeCover = async (cover: ImageModel) => {
        setLoading(true);
        try {
            const coverImageUrl = cover.sizes.thumb
            const response = await fetch(`/api/v1/gallery?gallery_id=${galleryId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
                body: JSON.stringify({ coverImageUrl })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (gallery)
                setGallery({ ...gallery, coverImageUrl })

            const data = await response.json();
            if (data.result) {
                notify(`${JSON.stringify(data.result, null, 2)}`);
            } else {
                notify('Done.');
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
    if (!gallery) {
        return (<div className='w-full min-h-screen text-white'>
            {loading && <p className='animate-pulse'><Loader2 /></p>}
            {error && <p className='animate-pulse'><Sigma />{error}</p>}
        </div>);
    }

    return (
        <div className="bg-gray-950 text-white min-h-screen font-sans">
            <ConfirmationModal
                isVisible={deleteOpen}
                onConfirm={handleDeleteGallery}
                onCancel={() => setDeleteOpen(false)}
                title={`Delete '${gallery.name}'?`}
                confirmText="Delete"
                cancelText="Cancel"
                message="This action cannot be undone. Are you sure you want to delete this item?" />
            <motion.header
                layoutId={`gallery-card-${gallery ? gallery.id : ''}`}
                className="relative w-full h-64 overflow-hidden"
            >
                <img
                    src={gallery ? gallery.coverImageUrl : ''}
                    alt={`Cover for ${gallery ? gallery.name : ''}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1920x1080/1f2937/d1d5db?text=Image+Not+Found";
                        e.currentTarget.onerror = null;
                    }}
                />
                <div className="absolute inset-0 bg-black/50 backdrop-blur-md flex flex-col justify-end p-6 md:p-10">
                    <div className='absolute' style={{ transform: "translate(-1em, -9.5em)" }}><Logo /></div>
                    <div className="flex flex-wrap items-center space-x-4 mb-4">
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <input className="text-4xl font-semibold" value={gallery ? gallery.name : ''} onChange={(e) => setGallery({ ...gallery, name: e.target.value })}>
                        </input>
                        <button
                            onClick={() => handleRenameGallery()}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        ><FolderPen size={24} /></button>
                        <button
                            onClick={() => navigate(`/upload-images?galleryid=${galleryId}`)}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <UploadCloud size={24} />
                        </button>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="bg-gray-800/50 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                            <Trash2 size={24} />
                        </button>
                        {loading && <span className='animate-spin'><Loader2 size={24} /></span>}
                    </div>
                    <p className="text-lg text-gray-300">
                        by {gallery ? gallery.author : ''}
                    </p>
                </div>
            </motion.header>

            <main className="container mx-auto p-6 pt-10 fadeIn">
                {gallery && gallery.images.length > 0 && <GalleryViewer
                    gallery={gallery}
                    onBatchDelete={handleDeleteImages}
                    onImageSetAsCover={handleChangeCover}
                    onAuthorChange={handleRenameGalleryAuthor} />}
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-gray-500 text-sm mt-10">
                <p>by Unknown Desires, 2025</p>
            </footer>
        </div>
    );
};

export default EditGalleryPage;