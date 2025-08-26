import React, { useState } from 'react';
import { localStorageKey } from '../components/ApiKeyForm';
import { useNavigate } from 'react-router';
import Logo from '../components/Logo';

// Define the shape of the gallery data.
interface GalleryData {
    name: string;
    author: string;
}

const CreateGalleryPage: React.FC = () => {
    const [gallery, setGallery] = useState<GalleryData>({
        name: '',
        author: '',
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

    // Handle form input changes, updating the state in real-time.
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setGallery(prevGallery => ({
            ...prevGallery,
            [name]: value,
        }));
    };

    // Handle the form submission.
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            // Send a POST request to the specified API endpoint.
            const response = await fetch('/api/v1/createGallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
                body: JSON.stringify(gallery),
            });

            if (!response.ok) {
                throw new Error('Failed to create gallery. Please check your network and try again.');
            }

            const { id } = await response.json();
            setSuccess(true);
            navigate(`/upload-images?galleryid=${id}`);
            setGallery({ name: '', author: '' });
        } catch (err: unknown) {
            setError(JSON.stringify(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='fadeIn'>
            <div className='absolute' style={{transform: "translate(1.5em, 1.5em)"}}><Logo /></div>
        <div className="flex items-center justify-center min-h-screen bg-neutral-900 text-neutral-200 p-4">
            <div className="w-full max-w-lg p-8 space-y-8 bg-neutral-800 rounded-xl shadow-2xl border border-neutral-700">
                <h2 className="text-3xl font-semibold text-center text-white">
                    Create New Gallery
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-400">
                            Gallery Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={gallery.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-200"
                            placeholder="e.g., California Road Trip"
                        />
                    </div>
                    <div>
                        <label htmlFor="author" className="block text-sm font-medium text-neutral-400">
                            Author
                        </label>
                        <input
                            id="author"
                            name="author"
                            type="text"
                            value={gallery.author}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-200"
                            placeholder="e.g., John Appleseed"
                        />
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-neutral-900 bg-neutral-200 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 disabled:opacity-50 transition duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Gallery'}
                        </button>
                    </div>
                </form>
                {success && (
                    <div className="mt-4 p-4 text-sm text-neutral-100 bg-neutral-700 rounded-lg border border-neutral-600">
                        Gallery created successfully!
                    </div>
                )}
                {error && (
                    <div className="mt-4 p-4 text-sm text-neutral-100 bg-neutral-700 rounded-lg border border-neutral-600">
                        Error: {error}
                    </div>
                )}
            </div>
        </div>
        </div>
    );
};

export default CreateGalleryPage;
