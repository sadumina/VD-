# ----------------------
# Frontend Dockerfile
# ----------------------

# Step 1: Build React app
FROM node:20-alpine as build

WORKDIR /app

# Copy dependency files and install
COPY package.json package-lock.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Step 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx web files
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config (optional, for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose frontend port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
