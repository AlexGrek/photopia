import { CloudUpload, PlusCircle } from 'lucide-react';
import { useState, type FormEvent, type ChangeEvent, useEffect } from 'react';
import { Link } from 'react-router';

export const localStorageKey = "photopia-api-key";

const btnClass = `w-full justify-center rounded-lg border border-gray-600 dark:border-gray-600 bg-gray-700 dark:bg-gray-700 py-2.5 px-4 text-sm font-medium text-gray-100 dark:text-gray-100 shadow-md
                     hover:bg-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800 dark:focus:ring-offset-gray-800
                     transition duration-200 ease-in-out
                     `

export default function ApiKeyForm() {

  const [apiKey, setApiKey] = useState<string>('');
  const [savedKey, setSavedKey] = useState<string | null>(null)

  // Load API key from local storage when the component mounts
  useEffect(() => {
    const savedKey = localStorage.getItem(localStorageKey);
    if (savedKey) {
      setApiKey(savedKey);
      setSavedKey(savedKey);
    }
  }, []);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    localStorage.setItem(localStorageKey, apiKey);
    setSavedKey(apiKey)
    console.log('API Key saved to local storage:', apiKey);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 w-full max-w-md">
      <h2 className="text-2xl font-semibold text-gray-200 dark:text-gray-200 mb-6 text-center tracking-tight">
        Photopia API Key
      </h2>
      <div className="mb-5">
        <label htmlFor="apikey" className="block text-sm font-medium text-gray-400 dark:text-gray-400 mb-2">
          API Key
        </label>
        <div className="relative">
          <input
            type="password"
            id="apikey"
            name="apikey"
            value={apiKey}
            onChange={handleInputChange}
            className="block w-full rounded-lg border border-gray-600 dark:border-gray-600 bg-gray-900 dark:bg-gray-900 text-gray-100 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 py-2.5 px-4 pr-10 shadow-sm
                       focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 sm:text-sm
                       transition duration-200 ease-in-out appearance-none"
            placeholder="Enter your API key"
            aria-label="API Key input field"
          />
        </div>
      </div>
      <div>
        <button
          type="submit"
          className={btnClass}
        >
          Save
        </button>
      </div>

      {savedKey != null && <div className='flex w-full fadeIn'>
        <Link className={btnClass + " m-1"} to='/create-gallery'><PlusCircle/>Create gallery</Link>
        <Link className={btnClass + " m-1"} to='/upload-images'><CloudUpload/>Upload images</Link>
      </div>}
    </form>
  );
}