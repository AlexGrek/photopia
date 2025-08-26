import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pathlib import Path

# Local imports from our new file structure
from app.routers import galleries
from app.dependencies import APIKeyAuthMiddleware
from app.config import REACT_BUILD_DIR, GALLERIES_ROOT_DIR

# Initialize the main FastAPI app
app = FastAPI(title="Image Gallery API", description="API for managing image galleries.")

# Add custom middleware for API key authentication on POST requests
app.add_middleware(APIKeyAuthMiddleware)

# Include the API router for gallery endpoints
app.include_router(galleries.router, prefix="/api/v1")

# Mount static directories
# Serve images from the galleries root directory
app.mount("/galleries", StaticFiles(directory=GALLERIES_ROOT_DIR), name="galleries")

# Mount the static directory for the React SPA build
if REACT_BUILD_DIR.exists():
    app.mount("/assets", StaticFiles(directory=REACT_BUILD_DIR / "assets"), name="assets")

    # Serve the React SPA's index.html for all non-API routes
    @app.get("/{full_path:path}", response_class=HTMLResponse)
    async def serve_react_app(request: Request, full_path: str):
        """
        Serves the React SPA. This is crucial for React Router. It serves
        'index.html' for all paths that don't match an API route.
        """
        html_file = REACT_BUILD_DIR / "index.html"
        if not html_file.is_file():
            return JSONResponse(status_code=404, content={"detail": "React SPA build not found."})
        
        with open(html_file, "r") as f:
            return HTMLResponse(content=f.read())
else:
    print(f"Warning: React build directory '{REACT_BUILD_DIR}' not found. Serving API only.")

# A simple main entry point for running with uvicorn
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
