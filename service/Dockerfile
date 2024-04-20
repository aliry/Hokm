# Use the official Node.js runtime as the base image  
FROM node:16  

# Set the working directory inside the container  
WORKDIR /usr/src/app  

# Copy package.json and package-lock.json (or yarn.lock if you use yarn)  
COPY package*.json ./  

# Install dependencies  
RUN npm install  

# Copy the rest of your app's source code from your host to your image filesystem.  
COPY . .  

# Transpile TypeScript to JavaScript  
RUN npm run build  

# Inform Docker that the container is listening on the specified port at runtime.  
EXPOSE 3001  

# Specify the command to run your app using CMD which defines your runtime  
CMD [ "node", "dist/server.js" ]  
