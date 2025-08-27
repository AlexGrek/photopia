# Dockerfile

# --- Stage 1: Frontend Build (Vite/React) ---
FROM node:24 AS frontend_builder

WORKDIR /frontend

# Copy package.json and package-lock.json (or yarn.lock) first to leverage Docker cache
# Assuming your package.json for frontend is at ./frontend/package.json
COPY ./frontend/package.json ./
COPY ./frontend/package-lock.json ./
# If you use yarn, uncomment the line below and comment the npm line above
# COPY ./frontend/yarn.lock ./

# Install frontend dependencies
RUN npm install
# If you use yarn, use this:
# RUN yarn install

# Copy the rest of the frontend source code
COPY ./frontend .

# Build the frontend application
# Vite typically outputs to a 'dist' directory
RUN npm run build
# If you use yarn, use this:
# RUN yarn build

# --- Stage 2: Backend Build (FastAPI/Python) ---
FROM python:3.13-slim

# Set the working directory in the backend container
WORKDIR /app/backend

# Copy backend requirements and install Python dependencies
# Assuming your requirements.txt for backend is at ./backend/requirements.txt
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
# Assuming your backend code is in the ./backend directory
COPY ./backend .

ENV REACT_BUILD_DIR=/frontend/dist

# Copy the built frontend assets from the frontend_builder stage
# Vite's default output directory is 'dist'. This copies it to the backend's 'static' directory.
COPY --from=frontend_builder /frontend/dist /frontend/dist

# Expose the port FastAPI will run on
EXPOSE 8000

# Command to run the application using Uvicorn
# The app.py will handle creating `static/index.html` if it doesn't exist
# (though it will be overwritten by the frontend build anyway if you build frontend)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
