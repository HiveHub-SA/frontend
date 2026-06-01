# HiveHub — Frontend

The frontend application for **HiveHub**, built with Angular. Communicates with the HiveHub backend REST API to deliver the user-facing interface.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 5.9 |
| Framework | Angular 21.2 |
| Routing | Angular Router |
| Forms | Angular Forms |
| HTTP | Angular Common (HttpClient) |
| Reactive | RxJS 7.8 |
| Test Runner | Vitest 4 |
| Formatter | Prettier 3 |
| Package Manager | npm 11 |

---

## Prerequisites

- **Node.js** (LTS recommended)
- **npm 11.12.1+**
- **Angular CLI 21** — install globally if not already:

```bash
npm install -g @angular/cli
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/HiveHub-SA/frontend.git
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

The app will be available at `http://localhost:4200/` and will hot-reload on file changes.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the dev server at `localhost:4200` |
| `npm test` | Run unit tests with Vitest |
| `npm run watch` | Build in watch mode (development config) |
| `ng generate component <name>` | Scaffold a new component |
| `ng generate --help` | List all available Angular schematics |

---

## Project Structure

```
frontend/
├── public/                  # Static assets
├── src/
│   ├── app/                 # Components, services, routing
│   ├── environments/        # Environment config (dev / prod)
│   └── main.ts              # Application bootstrap
├── .editorconfig            # Editor formatting rules
├── .prettierrc              # Prettier code style config
├── angular.json             # Angular CLI workspace config
├── tsconfig.json            # Base TypeScript config
├── tsconfig.app.json        # App-specific TypeScript config
├── tsconfig.spec.json       # Test-specific TypeScript config
└── package.json             # Dependencies & npm scripts
```

---

## Connecting to the Backend

Make sure the [HiveHub backend](https://github.com/HiveHub-SA/backend) is running locally before starting the frontend. By default the backend runs on `http://localhost:8080`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

This project is currently unlicensed. Contact the HiveHub-SA organization for usage permissions.
