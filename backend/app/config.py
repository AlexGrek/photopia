import os
from pathlib import Path

# --- Application Configuration ---
# Load from environment variables for production readiness.
# The `os.getenv` function returns `None` if the variable is not set.
API_KEY = os.getenv("apikey", "some-api-key")

# Root directory for all galleries and their content
# The second argument to getenv() provides a default value if the environment variable is not set.
GALLERIES_ROOT_DIR = Path(os.getenv("GALLERIES_ROOT_DIR", "galleries"))
GALLERIES_ROOT_DIR.mkdir(exist_ok=True)

# Path to the static build of the React SPA
REACT_BUILD_DIR = Path(os.getenv("REACT_BUILD_DIR", "frontend/dist"))

print(f"REACT_BUILD_DIR is {REACT_BUILD_DIR}")
print(f"GALLERIES_ROOT_DIR is {GALLERIES_ROOT_DIR}")
print(f"API key is {API_KEY}")

# Define the image sizes for automatic resizing (width, height)
# These remain as hardcoded constants as they are application-specific logic.
THUMB_SIZE = (400, 400)
SMALL_SIZE = (1920, 1080)
