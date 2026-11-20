FROM mcr.microsoft.com/devcontainers/python:3.14

ENV PYTHONUNBUFFERED 1

ARG NODE_VERSION=24.14.1
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl xz-utils \
    && curl -fsSLo /tmp/node.tar.xz "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz" \
    && tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.xz \
    && apt-get remove -y xz-utils curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

# Copy install and launcher script to bin:
COPY ./run_installs /usr/local/sbin
COPY ./run_develop /usr/local/bin
COPY ./run_build /usr/local/bin

CMD ["sleep", "infinity"]
