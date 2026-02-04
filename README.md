# DevDocs

![License](https://img.shields.io/github/license/Benjaminofili/DevDocs)
![Stars](https://img.shields.io/github/stars/Benjaminofili/DevDocs?style=social)
![Issues](https://img.shields.io/github/issues/Benjaminofili/DevDocs)

DevDocs is a README/documentation generator built with Next.js and TypeScript, leveraging AI dependencies for generation and analysis. It utilizes various APIs to create and manage documentation.

## Quick Start
```bash
npm install && npm run dev
```

## ✨ Highlights
- Powered by Next.js for robust and scalable web applications
- Utilizes AI capabilities from @anthropic-ai/sdk and @google/generative-ai
- Features syntax highlighting with rehype-highlight and remark-gfm
- Supports testing with Jest and code linting with ESLint

## ✨ Features

Based on the project's dependencies and scripts, the following features are available:
- **TypeScript Support** - Utilizes TypeScript for static type checking and code maintainability.
- **Next.js Framework** - Built with Next.js, a popular React-based framework for building server-side rendered and statically generated websites.
- **Testing Capabilities** - Includes Jest testing framework for unit and integration testing, with support for watch mode and code coverage.
- **Linting** - Employs ESLint for code linting and formatting.
- **Markdown Rendering** - Uses `react-markdown` to render Markdown content.
- **Syntax Highlighting** - Includes `rehype-highlight` for syntax highlighting in code blocks.
- **Rate Limiting** - Utilizes `@upstash/ratelimit` for rate limiting, preventing excessive requests.
- **Redis Integration** - Integrates with Redis using `@upstash/redis` for caching and data storage.
- **AI and Machine Learning** - Leverages AI and machine learning capabilities through `@anthropic-ai/sdk`, `@google/generative-ai`, and `openai`.

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | nextjs |
| Language | TypeScript |
| UI Library | react, react-dom |
| AI/ML | @anthropic-ai/sdk, @google/generative-ai, openai |
| Database | @upstash/redis |
| Styling | tailwindcss |
| Testing | jest, @testing-library/react, @testing-library/jest-dom |

## 🚀 Installation

### Prerequisites
- Node.js 
- npm

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Benjaminofili/DevDocs
cd DevDocs
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development**
```bash
npm run dev
```
Note: The original `.env` setup step was removed as there is no mention of a `.env.example` file in the provided project data. If environment variables are required, they should be specified in the project documentation.

## ⚙️ Environment Variables

Create a `.env` file to configure environment-specific settings. Although a `.env.example` file is not provided, we can infer some variables based on the project's dependencies. The following variables might be required:

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_KEY | API key for external services (e.g., @anthropic-ai/sdk, @google/generative-ai, @upstash/ratelimit, @upstash/redis) | Possibly |
| OPENAI_API_KEY | API key for OpenAI services | Possibly |
| GROQ_SDK_API_KEY | API key for Groq SDK | Possibly |
| REDIS_URL | URL for Redis connection | Possibly if using @upstash/redis |

Please note that the actual required variables may vary depending on the specific implementation and usage of these dependencies in the DevDocs project. It's essential to review the code and documentation for each dependency to determine the necessary environment variables.

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `dev` | Starts the development server with `next dev` |
| `build` | Builds the application with `next build` |
| `start` | Starts the production server with `next start` |
| `lint` | Lints the code with `eslint` |
| `test` | Runs tests with `jest` |
| `test:watch` | Runs tests in watch mode with `jest --watch` |
| `test:coverage` | Runs tests with coverage reporting using `jest --coverage` |

## 🚀 Deployment

To deploy DevDocs, you can use the following methods:

### Local Deployment
You can start the application locally by running:
```bash
npm run start
```
This will start the development server.

### Production Build
To create a production build, run:
```bash
npm run build
```
This will generate a production-ready build of the application.

Note: Since DevDocs uses Next.js, it is recommended to deploy to a platform that supports server-side rendering, such as Vercel. However, the official Vercel deployment button is not provided here as it was not detected in the project data.

## 🧪 Testing
The DevDocs project utilizes Jest as its testing framework. To run tests, use the following command:
```bash
npm test
```
Additional testing options are available, including:
* `npm run test:watch` for watching test files and re-running tests on changes
* `npm run test:coverage` for generating test coverage reports
These options can be used to ensure the project's code is thoroughly tested and validated.

## 🤝 Contributing

To contribute to DevDocs, follow these steps:
1. Fork the [repository](https://github.com/Benjaminofili/DevDocs) to your own GitHub account.
2. Create a new feature branch: `git checkout -b feature/your-feature`
3. Commit your changes with a descriptive message: `git commit -m 'Add feature'`
4. Push your changes to your fork: `git push origin feature/your-feature`
5. Open a Pull Request to merge your changes into the main repository.

Before submitting your Pull Request, ensure that your code passes the existing tests by running `npm test` and that it adheres to the project's coding standards by running `npm lint`.

## 📄 License

The DevDocs project is licensed under the MIT License. For more information, please refer to the [LICENSE](LICENSE) file in the repository.