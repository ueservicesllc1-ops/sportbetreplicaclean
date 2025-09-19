# Usa Node.js como base
FROM node:20

# Crea el directorio de trabajo
WORKDIR /app

# Copia package.json y package-lock.json para instalar dependencias primero
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia todo el resto del proyecto
COPY . .

# Expone el puerto de la app
EXPOSE 9002

# Comando para iniciar la app
CMD ["npm", "run", "dev"]
