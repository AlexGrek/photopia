import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pathlib import Path

# Local imports from our new file structure
from app.routers import galleries
from app.dependencies import APIKeyAuthMiddleware
from app.config import REACT_BUILD_DIR, GALLERIES_ROOT_DIR

# Initialize the main FastAPI app
app = FastAPI(
    title="Image Gallery API", description="API for managing image galleries."
)

# Add custom middleware for API key authentication on POST requests
app.add_middleware(APIKeyAuthMiddleware)

# Include the API router for gallery endpoints
app.include_router(galleries.router, prefix="/api/v1")

# Mount static directories
# Serve images from the galleries root directory
app.mount("/galleries", StaticFiles(directory=GALLERIES_ROOT_DIR), name="galleries")

# Mount the static directory for the React SPA build
if REACT_BUILD_DIR.exists():
    app.mount(
        "/assets", StaticFiles(directory=REACT_BUILD_DIR / "assets"), name="assets"
    )

    # Mount the entire React build directory to serve favicon, manifest, etc.
    # This will serve files like favicon.ico, manifest.json, robots.txt, etc.
    # We use a lower priority by mounting it after /assets
    app.mount("/static", StaticFiles(directory=REACT_BUILD_DIR), name="static")

    # Serve the React SPA's index.html for all non-API routes
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_react_app(request: Request, full_path: str):
        """
        Serves the React SPA. This is crucial for React Router. It serves
        'index.html' for all paths that don't match an API route or static file.
        """
        # Check if the requested file exists in the React build directory
        requested_file = REACT_BUILD_DIR / full_path

        # If it's a static file (like favicon.ico, manifest.json, etc.), serve it directly
        if requested_file.is_file() and not full_path.startswith("api/"):
            # Determine content type based on file extension
            content_type = "text/html"
            if full_path.endswith(".ico"):
                content_type = "image/x-icon"
            elif full_path.endswith(".json"):
                content_type = "application/json"
            elif full_path.endswith(".xml"):
                content_type = "application/xml"
            elif full_path.endswith(".txt"):
                content_type = "text/plain"
            elif full_path.endswith(".png"):
                content_type = "image/png"
            elif full_path.endswith(".svg"):
                content_type = "image/svg+xml"
            elif full_path.endswith(".css"):
                content_type = "text/css"
            elif full_path.endswith(".js"):
                content_type = "application/javascript"

            with open(requested_file, "rb") as f:
                return Response(content=f.read(), media_type=content_type)

        # For all other paths (React routes), serve index.html
        html_file = REACT_BUILD_DIR / "index.html"
        if not html_file.is_file():
            return JSONResponse(
                status_code=404, content={"detail": "React SPA build not found."}
            )

        with open(html_file, "r") as f:
            return HTMLResponse(content=f.read())

else:
    print(
        f"Warning: React build directory '{REACT_BUILD_DIR}' not found. Serving API only."
    )

# A simple main entry point for running with uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
