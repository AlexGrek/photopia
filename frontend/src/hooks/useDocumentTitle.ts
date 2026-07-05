import { useEffect } from 'react';

const BASE_TITLE = 'Photopia';

/**
 * Sets the browser tab title to `"<title> · Photopia"`, falling back to just
 * "Photopia" while `title` is empty/undefined (e.g. before a fetch resolves).
 */
export function useDocumentTitle(title?: string | null) {
    useEffect(() => {
        document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;
    }, [title]);
}
