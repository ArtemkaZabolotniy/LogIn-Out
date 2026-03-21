# Debian-based base image with more utilities than alpine (useful for playwright)
FROM node:22-bookworm

# Bake system libraries needed by playwright into the image
RUN npx playwright install-deps