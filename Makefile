.PHONY: dev dev-up dev-down dev-logs prod prod-up prod-down prod-logs seed build clean

# --- Development (hot reload with volume mounts) ---
dev: dev-up
dev-up:
	docker compose -f docker-compose.dev.yml up

dev-up-d:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

dev-logs:
	docker compose -f docker-compose.dev.yml logs -f

dev-restart:
	docker compose -f docker-compose.dev.yml restart

# --- Production (built images) ---
prod: prod-up
prod-up:
	docker compose up --build

prod-up-d:
	docker compose up --build -d

prod-down:
	docker compose down

prod-logs:
	docker compose logs -f

# --- Utilities ---
seed:
	cd backend && npm run seed

build:
	cd backend && npm run build
	cd catalog-service && npm run build
	cd frontend && npm run build

clean:
	docker compose -f docker-compose.dev.yml down -v
	docker compose down -v
	rm -rf backend/dist catalog-service/dist frontend/.next

# --- Individual services (local, no Docker) ---
run-backend:
	cd backend && npm run dev

run-catalog:
	cd catalog-service && npm run dev

run-frontend:
	cd frontend && npm run dev

# --- Test ---
test-x402:
	cd backend && npm run test:x402 -- http://localhost:8080/api/inference

test-health:
	curl -s http://localhost:8080/health | python3 -m json.tool
