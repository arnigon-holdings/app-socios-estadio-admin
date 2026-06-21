.PHONY: install dev build lint test validate

install:
	npm install

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

preview:
	npm run preview

validate: lint build

help:
	@echo "admin_panel Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  install    Instalar dependencias"
	@echo "  dev        Iniciar servidor de desarrollo"
	@echo "  build      Build de producción"
	@echo "  lint       Verificar código"
	@echo "  preview    Preview del build"
	@echo "  validate   Lint + build"
