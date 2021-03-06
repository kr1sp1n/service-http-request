.PHONY: all test

PROJECT  ?= kr1sp1n/service-http-request
TAG      ?= latest
PORT 		 ?= 3030

ifdef REGISTRY
	IMAGE=$(REGISTRY)/$(PROJECT):$(TAG)
else
	IMAGE=$(PROJECT):$(TAG)
endif

all:
	@echo "Available targets:"
	@echo "  * build - build a Docker image for $(IMAGE)"
	@echo "  * pull  - pull $(IMAGE)"
	@echo "  * push  - push $(IMAGE)"
	@echo "  * test  - build and test $(IMAGE)"

install: package.json
	npm install

test:
	npm test

build: Dockerfile install
	docker build -t $(IMAGE) .

run:
	docker run -d -p $(PORT):$(PORT) $(IMAGE)

pull:
	docker pull $(IMAGE) || true

push:
	docker push $(IMAGE)
