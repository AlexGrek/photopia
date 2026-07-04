import React, { useState } from 'react';
import { localStorageKey } from '../components/ApiKeyForm';
import { useNavigate } from 'react-router';
import Logo from '../components/Logo';

// Define the shape of the moodboard data.
interface MoodboardData {
    name: string;
    headerColor: string;
}

const DEFAULT_HEADER_COLOR = '#111827';

const CreateMoodboardPage: React.FC = () => {
    const [moodboard, setMoodboard] = useState<MoodboardData>({
        name: '',
        headerColor: DEFAULT_HEADER_COLOR,
    });

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setMoodboard(prevMoodboard => ({
            ...prevMoodboard,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const response = await fetch('/api/v1/createMoodboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': String(localStorage.getItem(localStorageKey))
                },
                body: JSON.stringify(moodboard),
            });

            if (!response.ok) {
                throw new Error('Failed to create moodboard. Please check your network and try again.');
            }

            const { id } = await response.json();
            setSuccess(true);
            navigate(`/edit-moodboard/${id}`);
            setMoodboard({ name: '', headerColor: DEFAULT_HEADER_COLOR });
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
                    Create New Moodboard
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-400">
                            Moodboard Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={moodboard.name}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-200"
                            placeholder="e.g., Summer Vibes"
                        />
                    </div>
                    <div>
                        <label htmlFor="headerColor" className="block text-sm font-medium text-neutral-400">
                            Header Color
                        </label>
                        <div className="mt-1 flex items-center gap-3">
                            <input
                                id="headerColorPicker"
                                name="headerColor"
                                type="color"
                                value={moodboard.headerColor}
                                onChange={handleChange}
                                className="h-10 w-14 rounded-md border border-transparent bg-neutral-700 cursor-pointer"
                            />
                            <input
                                id="headerColor"
                                name="headerColor"
                                type="text"
                                value={moodboard.headerColor}
                                onChange={handleChange}
                                required
                                className="block w-full px-4 py-2 bg-neutral-700 text-white rounded-md shadow-inner border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 sm:text-sm transition duration-200"
                                placeholder="#111827"
                            />
                        </div>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-neutral-900 bg-neutral-200 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 disabled:opacity-50 transition duration-200"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Create Moodboard'}
                        </button>
                    </div>
                </form>
                {success && (
                    <div className="mt-4 p-4 text-sm text-neutral-100 bg-neutral-700 rounded-lg border border-neutral-600">
                        Moodboard created successfully!
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

export default CreateMoodboardPage;
