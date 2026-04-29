FROM node:20

WORKDIR /app

# Copy prisma schema before npm install — needed for postinstall prisma generate
COPY package.json package-lock.json* ./
COPY prisma/ ./prisma/

RUN npm install

# Frontend deps
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm install

# Copy everything else
COPY . .

# Build React frontend
RUN cd frontend && npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
