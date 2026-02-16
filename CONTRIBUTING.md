# Contributing to e-Khata

Thank you for your interest in contributing to e-Khata! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/e-Khata.git
   cd e-Khata
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Configure your .env file
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Code Style

- Use TypeScript for all new code
- Follow existing code structure and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Run linter before committing: `npm run lint`

## Git Workflow

1. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Create a Pull Request on GitHub

## Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Run tests: `npm test`

## Pull Request Process

1. Update README.md with details of changes if needed
2. Update API documentation if you change endpoints
3. Ensure TypeScript compilation succeeds
4. Your PR will be reviewed by maintainers
5. Address any feedback from reviewers

## Code Review Guidelines

- Be respectful and constructive
- Focus on the code, not the person
- Explain your reasoning
- Accept that there may be multiple valid approaches

## Questions?

Feel free to open an issue for questions or discussions.

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
