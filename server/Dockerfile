# Base Image
FROM node:20-alpine

# Working Directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
# Install ALL dependencies (including dev) to run Prisma generation
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Expose Port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
