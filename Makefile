#!make

ML_VERSION = latest

.PHONY: help dev-init verify-hooks lint lint-markdown fix fix-markdown test

help:
	@echo
	@echo "Hooks"
	@echo "--------------------------------------------------------------------------------"
	@echo "  dev-init             pnpm install + husky (via prepare)"
	@echo "  verify-hooks         Verify .husky/pre-commit is installed and executable"
	@echo
	@echo "Quality"
	@echo "--------------------------------------------------------------------------------"
	@echo "  lint                 pnpm lint + lint-markdown"
	@echo "  lint-markdown        markdownlint-cli2 (Docker, read-only)"
	@echo "  fix                  pnpm fix + fix-markdown"
	@echo "  fix-markdown         Prettier + markdownlint --fix (Docker)"
	@echo "  test                 pnpm test"
	@echo

# -------------------------------------------------------------------------------------------------
# Hooks
# -------------------------------------------------------------------------------------------------

dev-init:
	pnpm install
	@test -f .husky/pre-commit || (echo "ERROR: .husky/pre-commit not found after install" && exit 1)

verify-hooks:
	@test -f .husky/pre-commit || (echo "ERROR: .husky/pre-commit not found. Run: make dev-init" && exit 1)
	@test -x .husky/pre-commit || (echo "ERROR: .husky/pre-commit is not executable. Run: chmod +x .husky/pre-commit" && exit 1)
	@echo "✓ husky pre-commit hook is properly configured"

# -------------------------------------------------------------------------------------------------
# Read-only quality
# -------------------------------------------------------------------------------------------------

lint:
	pnpm lint
	@$(MAKE) --no-print-directory lint-markdown

lint-markdown:
	@echo "################################################################################"
	@echo "# markdownlint-cli2"
	@echo "################################################################################"
	@docker run --rm -v $(PWD):/data -v /data/node_modules -w /data \
		davidanson/markdownlint-cli2:$(ML_VERSION) "**/*.md"

test:
	pnpm test

# -------------------------------------------------------------------------------------------------
# Writing / auto-fix
# -------------------------------------------------------------------------------------------------

fix:
	pnpm fix
	@$(MAKE) --no-print-directory fix-markdown

fix-markdown:
	@echo "################################################################################"
	@echo "# Prettier (Restricted to Markdown)"
	@echo "################################################################################"
	@docker run --rm \
		-v $(PWD):/work \
		-v /work/node_modules \
		-w /work \
		--user $$(id -u):$$(id -g) \
		tmknom/prettier:latest \
		--write "**/*.md" \
		--parser markdown \
		--ignore-path .gitignore
	@echo "################################################################################"
	@echo "# markdownlint-cli2 --fix"
	@echo "################################################################################"
	@docker run --rm -v $(PWD):/data -v /data/node_modules -w /data \
		davidanson/markdownlint-cli2:$(ML_VERSION) --fix "**/*.md"
