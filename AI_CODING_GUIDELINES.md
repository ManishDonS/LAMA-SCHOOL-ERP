# AI Coder Development Guidelines

## 1. Introduction & Core Principles

**MANDATORY:** You MUST read and understand this document before making any changes to the codebase.

This document provides essential guidelines for developing and modifying this School ERP project. Its purpose is to ensure consistency, maintain code quality, and prevent errors.

### Core Principles:

*   **Adhere to Conventions:** Strictly follow the existing coding style, structure, and patterns within the project. Analyze the surrounding code before writing anything new.
*   **Test Everything:** All new features must be accompanied by tests. All bug fixes must include a regression test.
*   **Isolate Changes:** Make changes in a targeted and modular way. Do not modify files unrelated to the task at hand.
*   **Verify Your Work:** Before concluding, run all relevant linting, building, and testing commands to ensure your changes haven't broken anything.
*   **Understand, Then Act:** Use file system tools to read and understand the relevant parts of the codebase *before* making any modifications.

## 2. Project Architecture Overview

This is a microservices-based monorepo. The main components are:

*   **`frontend/`**: A Next.js (React/TypeScript) application that serves as the user interface for all students, teachers, and administrators.
    *   **Styling:** Uses Tailwind CSS.
    *   **State Management:** Check `src/store` or `src/context` for existing patterns.
*   **`backend/`**: A Node.js-based backend, likely acting as a monolith or a collection of core services. It includes an `api-gateway`.
    *   **`api-gateway/`**: The single entry point for the frontend to communicate with the backend services.
    *   **`services/`**: Contains various business logic modules (e.g., `auth`, `students`).
    *   **`shared/`**: Contains shared code for the Node.js services (e.g., database, config).
*   **`services/`**: A collection of independent microservices written in **Go**. Each service is responsible for a specific domain (e.g., `attendance`, `exam`, `fee`).
    *   Each service has its own `Dockerfile` and `go.mod` file.
*   **`libs/`**: Shared libraries for the Node.js applications.
*   **`infra/` & `k8s/`**: Contains Docker, Helm, and Kubernetes configurations for deployment.

## 3. Development Workflow

Follow these steps for every task:

1.  **Understand the Goal:** Clearly identify the requirements of the task.
2.  **Locate the Code:** Based on the architecture overview, determine which service(s) or application(s) you need to modify. Use search tools to find the exact files and functions.
3.  **Implement Changes:**
    *   Follow the language-specific guidelines below.
    *   Mimic the style and patterns of the existing code in the file you are editing.
    *   Do not add new dependencies without verifying they are appropriate for the project.
4.  **Write/Update Tests:**
    *   Locate the corresponding test files for the code you have changed.
    *   Add new tests for your feature or bug fix. Ensure all tests pass.
5.  **Verify:**
    *   **Go:** Run `go build`, `go test`, and `go fmt` within the specific service directory (e.g., `services/attendance/`).
    *   **Node.js:** Run `npm install`, `npm run lint`, and `npm test` in the relevant directory (e.g., `backend/`).
    *   **Frontend:** Run `npm install`, `npm run lint`, and `npm run build` in the `frontend/` directory.

## 4. Language-Specific Guidelines

### Go (`services/*`)

*   **Structure:** Each service follows a standard structure: `handlers/`, `routes/`, `database/`, `config/`, `main.go`. Adhere to this.
*   **Dependencies:** Use `go mod tidy` to manage dependencies.
*   **Error Handling:** Use the standard `if err != nil` pattern. Do not panic on recoverable errors.
*   **Logging:** Use a structured logger if one is present.

### Node.js / TypeScript (`backend/`, `libs/`)

*   **Package Manager:** Use `npm`. Do not use `yarn` or other package managers. Check `package.json` for scripts.
*   **Style:** Follow the existing style. An ESLint configuration is likely present. Run `npm run lint` to check your code.
*   **Imports:** Use relative paths for local modules and absolute paths for dependencies.

### Next.js / TypeScript (`frontend/`)

*   **Components:** Create components inside `src/components/`. Follow the existing folder structure (e.g., by feature or type).
*   **Styling:** Use Tailwind CSS utility classes. Avoid writing custom CSS files unless it's for a complex, non-utility-based style.
*   **API Calls:** Use the functions provided in `src/services/` to communicate with the backend.

## 5. Permissions and Security

The system may have a permissions model to control access to certain operations.

*   **Sensitive Operations:** Operations that involve writing data, modifying configurations, or accessing sensitive information (e.g., user data) MUST be protected by a permission check.
*   **Checking Permissions:** Before executing a sensitive operation, look for a function like `check_permission` or similar middleware. You must use it to verify that the operation is allowed.
*   **Example (Conceptual):**
    ```python
    # This is a conceptual example. Find the actual implementation in the codebase.
    def some_sensitive_action(user, data):
        # Before proceeding, check if the user has the required permission.
        check_permission(user, PERMISSION_WRITE)
        # ... proceed with the action
    ```
*   **Security:**
    *   Never hardcode secrets (API keys, passwords). Use environment variables (e.g., via `.env` files).
    *   Sanitize all user inputs to prevent injection attacks (XSS, SQLi).

## 6. Adding a New Module/Service

*   **Go Service:** To create a new Go service, copy an existing one (e.g., `services/attendance`) and use it as a template. Rename all relevant files and update the `go.mod` file.
*   **Node.js Module:** To add a new module in the `backend/services/` directory, create a new folder and follow the structure of existing modules. Remember to register it where necessary (e.g., in the API gateway or main application file).

---

By following these guidelines, you will help maintain the integrity and quality of this project. Failure to adhere to these rules may result in broken functionality.
