# Contributing to e-Khata

Thank you for your interest in contributing to e-Khata! This document provides guidelines for contributing to the project.

## Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/musman5264/e-Khata.git
   cd e-Khata
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   createdb ekhata
   ```

5. **Run in development mode**
   ```bash
   npm run start:dev
   ```

## Project Structure

```
e-Khata/
├── src/
│   ├── config/              # Configuration files
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # User management
│   │   ├── tenants/        # Multi-tenancy
│   │   ├── ledger/         # Ledger management
│   │   ├── transactions/   # Transactions
│   │   ├── payments/       # Payment processing
│   │   ├── sessions/       # Session management
│   │   ├── logging/        # Logging service
│   │   └── notifications/  # Notifications
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── test/                    # Test files
└── scripts/                # Utility scripts
```

## Code Style

- Follow the existing code style
- Use TypeScript
- Run `npm run lint` before committing
- Run `npm run format` to format code

## Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov
```

## Commit Guidelines

Follow conventional commit format:

```
type(scope): subject

body

footer
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build/tooling changes

**Example:**
```
feat(ledger): add search functionality

- Added search by customer name
- Added search by mobile number
- Updated API documentation

Closes #123
```

## Pull Request Process

1. Create a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes
   - Write/update tests
   - Update documentation
   - Ensure all tests pass

3. Commit your changes
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. Push to your fork
   ```bash
   git push origin feature/your-feature-name
   ```

5. Create a Pull Request
   - Describe your changes
   - Reference any related issues
   - Request review

## Code Review

All submissions require review before merging:

- Code follows style guidelines
- Tests pass
- Documentation is updated
- No breaking changes (or properly documented)

## Bug Reports

When filing an issue, include:

- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Relevant logs/screenshots

## Feature Requests

When suggesting features:

- Clear use case
- Expected behavior
- Potential implementation approach
- Impact on existing features

## Security Issues

**Do not** create public issues for security vulnerabilities.

Instead, email: [Contact Information]

## Questions?

Feel free to:
- Open a discussion
- Ask in pull requests
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
