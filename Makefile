# Makefile for dcommunity-app

# --- Application and Docker Settings ---
APP_NAME := photopia
DOCKER_REGISTRY := localhost:5000
# Define the path to your backend and frontend directories relative to the Makefile
BACKEND_DIR := backend
FRONTEND_DIR := frontend

# --- Git-based Image Tag Calculation ---
# Get the short commit hash
GIT_COMMIT := $(shell git rev-parse --short HEAD)
# Check for uncommitted changes (dirty flag)
GIT_DIRTY_FLAG := $(shell git status --porcelain --untracked-files=no 2>/dev/null | grep -q . && echo "-dirty" || echo "")
# Combine commit hash and dirty flag for the image tag
IMAGE_TAG := $(GIT_COMMIT)$(GIT_DIRTY_FLAG)

# Full image name with tag
DOCKER_IMAGE := $(DOCKER_REGISTRY)/$(APP_NAME):$(IMAGE_TAG)

.PHONY: all docker-build docker-push clean helm-install helm-upgrade help

all: docker-build # Default target

# --- Docker Targets ---
docker-build:
	@echo "Building Docker image: $(DOCKER_IMAGE)"
	docker build -t $(DOCKER_IMAGE) .

docker-push: docker-build
	@echo "Pushing Docker image: $(DOCKER_IMAGE)"
	docker push $(DOCKER_IMAGE)

# --- Clean Target ---
clean:
	@echo "Cleaning up..."
	# Remove any existing 'static' dir in backend if it's not managed by git
	# Caution: This removes local 'static' dir, if you're not using Docker to build frontend
	# rm -rf $(BACKEND_DIR)/static
	@echo "Local storage directories are persistent and not cleaned by default."

# --- Helm Targets ---
HELM_CHART_DIR := helm-chart
KUBERNETES_NAMESPACE := default # Or your preferred namespace
SECRET_KEY=jbkjgiygfuyrtdftrdfouyuiuouijkji8u77t785r45esedf

helm-install: docker-push
	@echo "Installing Helm chart for $(APP_NAME) in namespace $(KUBERNETES_NAMESPACE)..."
	helm install $(APP_NAME) $(HELM_CHART_DIR) \
	  --namespace $(KUBERNETES_NAMESPACE) \
	  --set image.repository=$(DOCKER_REGISTRY)/$(APP_NAME) \
	  --set image.tag=$(IMAGE_TAG) \
	  --set secret.apikey="$(SECRET_KEY)" \
	  --wait # Wait for the release to be ready

helm-upgrade: docker-push
	@echo "Upgrading Helm chart for $(APP_NAME) in namespace $(KUBERNETES_NAMESPACE)..."
	helm upgrade $(APP_NAME) $(HELM_CHART_DIR) \
	  --namespace $(KUBERNETES_NAMESPACE) \
	  --set image.repository=$(DOCKER_REGISTRY)/$(APP_NAME) \
	  --set image.tag=$(IMAGE_TAG) \
	  --set secret.apikey="$(SECRET_KEY)" \
	  --wait # Wait for the release to be ready

# Add a target to setup necessary env vars for Makefile (from .env)
load-env:
	@if [ -f .env ]; then \
		export $(grep -v '^#' .env | xargs -0); \
		echo "Environment variables loaded from .env"; \
	else \
		echo "Warning: .env file not found. Ensure environment variables are set."; \
	fi

help:
	@echo "Available targets:"
	@echo "  all                 - Builds and pushes Docker image (default)."
	@echo "  docker-build        - Builds the Docker image."
	@echo "  docker-push         - Builds and pushes the Docker image to the registry."
	@echo "  clean               - Placeholder for cleanup tasks."
	@echo "  helm-install        - Builds, pushes, and installs the Helm chart."
	@echo "  helm-upgrade        - Builds, pushes, and upgrades the Helm chart."
	@echo "  load-env            - Loads environment variables from .env file for Makefile commands."

# To load environment variables from .env before running commands like helm-install
# Use: make load-env helm-install
