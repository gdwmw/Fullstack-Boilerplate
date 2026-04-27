![Next.js - Home](public/project/1.png)
![Next.js - Login](public/project/2.png)
![Next.js - Register](public/project/3.png)
![ElysiaJS - Swagger](public/project/4.png)
![ElysiaJS - Swagger Auth](public/project/5.png)
![ElysiaJS - Swagger Test](public/project/6.png)

# Turborepo + Next.js + ElysiaJS Boilerplate

Boilerplate By [Gede Dewo Wahyu M.W](https://github.com/gdwmw) ❤️

## Boilerplate Description 📖

This monorepo is a full‑stack boilerplate built with Turborepo, featuring a Next.js application and an ElysiaJS REST API. It includes JWT authentication, theme management, state management, form validation, file upload, and Storybook, and it follows Atomic Design principles for component organization.

## Tech Stack 🛠️

- **Monorepo**: Turborepo + pnpm
- **Frontend**: Next.js, TailwindCSS, Zustand, React Hook Form, Zod
- **Backend**: ElysiaJS, Prisma, PostgreSQL, JWT

## Installation 🚀

To get started, follow these steps:

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/Fullstack-Boilerplate.git
   cd Fullstack-Boilerplate
   ```

2. **Install dependencies (root)**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp apps/next/.env.example apps/next/.env
   cp apps/elysia/.env.example apps/elysia/.env
   ```

4. **Run database migrations**

   ```bash
   cd apps/elysia && bun generate
   ```

5. **Start development (via Turborepo)**

   ```bash
   pnpm dev
   ```

6. **Access the applications**

   - Next.js App: [http://localhost:3000](http://localhost:3000)
   - ElysiaJS API: [http://localhost:1337](http://localhost:1337)
   - Swagger UI: [http://localhost:1337/swagger](http://localhost:1337/swagger)

## Commit Guidelines 📝

When committing changes with `pnpm commit`, follow these steps:

1. **Prepare your changes**  
   Ensure your code is tested and complies with the project's coding standards.

2. **Stage your changes**  
   Stage all relevant files:

   ```bash
   git add .
   ```

3. **Run the commit command**  
   Execute:

   ```bash
   pnpm commit
   ```

4. **Follow the interactive prompt**  
   Select the appropriate change type (e.g., feature, fix, docs) when prompted.

5. **Optionally provide a scope**  
   If relevant, specify the scope (e.g., a specific module or feature).

6. **Write a concise subject**  
   Use the imperative mood and keep it short and clear.

7. **Optionally add a detailed body**  
   Include motivation, context, and implementation details if helpful.

8. **Document breaking changes (if any)**  
   Clearly list any breaking changes in the designated section.

9. **Confirm your commit**  
   Review the message and confirm when prompted.

Following these guidelines ensures commit messages are informative and consistent with the project's standards.

## Contribution 🤝

If you would like to contribute, follow these steps:

1. **Fork the repository**  
   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**  
   Clone your forked repository to your local machine:

   ```bash
   git clone https://github.com/your-username/Fullstack-Boilerplate.git
   cd Fullstack-Boilerplate
   ```

3. **Create a new branch**  
   Create a branch for your feature or bug fix:

   ```bash
   git checkout -b your-feature-branch
   ```

4. **Make your changes**  
   Implement your changes and ensure they follow the project's standards.

5. **Commit your changes**  
   Commit with a descriptive message:

   ```bash
   pnpm commit
   ```

6. **Push to your fork**  
   Push your branch to your forked repository:

   ```bash
   git push origin your-feature-branch
   ```

7. **Open a pull request**  
   In the original repository, click "New Pull Request", select your branch, and submit with a clear description.

Thank you for contributing!

## MIT License ⚖️

This project is licensed under the MIT License. See the `LICENSE` file for details.

## How to Ask Questions ❓

If you have questions about the boilerplate or how to use it, follow these guidelines:

1. **Be clear and concise**  
   Clearly state your question or issue and provide enough context.

2. **Include relevant details**  
   Share specific errors, code snippets, or configurations that are relevant.

3. **Search before asking**  
   Review the documentation and existing issues to avoid duplicates.

4. **Use proper formatting**  
   Use code blocks when sharing code or error messages for readability.

5. **Be respectful**  
   Be polite and respectful in all communication.

Following these guidelines helps ensure your questions are understood and answered promptly.

This documentation provides an overview of the boilerplate, installation steps, commit guidelines, and contribution process. If you have further questions, feel free to ask!
