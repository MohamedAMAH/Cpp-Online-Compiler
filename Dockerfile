# Use an official GCC image from the Docker Hub
FROM gcc:latest

# Create a directory inside the container to hold the code
WORKDIR /usr/src/app

# Copy the source code into the container
COPY . .

# Command to compile the C++ code
CMD ["g++", "-o", "program", "main.cpp"]
