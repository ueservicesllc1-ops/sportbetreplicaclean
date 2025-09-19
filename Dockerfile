# Usamos Node 20
FROM node:20-bullseye

# Carpeta de trabajo en el contenedor
WORKDIR /app

# Copiar package.json y package-lock.json primero (para cache de dependencias)
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el proyecto
COPY . .

# Exponer puerto de la app
EXPOSE 9002

# Comando para iniciar la app
CMD ["npm", "run", "dev"]
