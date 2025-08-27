# Photopia

Photopia is a photo hosting platform that provides basic functionality through API and Web UI access.

It uses **React** with *tailwind* and *headless-ui* to provide best user experience and fast vibecoded development time, as well as *framer-motion* for animation.

It uses python's **FastAPI** for serving both frontend SPA and API, using *Pillow* to resize images and create thumbnails.

## Auth

API-key-based auth is a primitive temporary solution, I am planning to extend it with multiple keys and JWT tokens, but it works for now.

Single API key is defined in environment variable `apikey`.

## Storage

Photopia is built to be independent sibgle-binary self-contained app, so it does not rely on any external storage solutions - only on filesystem. It uses yaml files to store metadata and relies on directory structure and file names to store gallery data.

## Build and run

Use makefile targets to build a Docker image and deploy it with provided helm chart, customize values.

```bash
make docker-build # build image
make helm-install # deploy helm chart
make helm-upgrade # redeploy helm chart with new version
```

## Development

### Run vite dev server

```bash
cd frontend
npm i
npm run dev
```

### Run FastAPI server

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py 
```

It will start API server at port **8000**

# License

WTFPL