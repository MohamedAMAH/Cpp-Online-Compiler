# Use an official GCC image from the Docker Hub
FROM gcc:latest

# Install strace and other necessary tools
RUN apt-get update && \
    apt-get install -y strace

# Create a directory inside the container to hold the code
WORKDIR /usr/src/app

# Copy the source code into the container
COPY . .

# Default command to compile the C++ code
CMD ["bash", "-c", "g++ -o program main.cpp && strace -o /tmp/strace.log ./program"]
