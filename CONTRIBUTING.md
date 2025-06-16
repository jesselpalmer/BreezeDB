# Contributing to BreezeDB

Thank you for your interest in contributing to BreezeDB! We welcome contributions from the community.

## Development Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/yourusername/BreezeDB.git
cd BreezeDB
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

## Development Workflow

### Code Quality

We use several tools to maintain code quality:

```bash
# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix  # Auto-fix issues

# Formatting
npm run format
npm run format:check

# Run all quality checks
npm run check
```

### Testing

```bash
# Run tests
npm test

# Run full CI pipeline
npm run test:ci
```

### Building

```bash
# Build TypeScript
npm run build

# Watch mode for development
npm run build:watch
```

## Code Style

- **TypeScript**: All new code should be written in TypeScript
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Code is automatically formatted with Prettier
- **Imports**: Use ES6 imports/exports
- **Types**: Provide proper type annotations

## Project Structure

```
src/
├── breezedb.ts      # Main BreezeDB class
├── types.ts         # TypeScript type definitions
├── utils.ts         # Utility classes (encryption, compression, validation)
├── ttl-manager.ts   # TTL management
├── persistence.ts   # File I/O operations
└── index.ts         # Public API exports
```

## Submitting Changes

1. **Create a feature branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

   - Write code following our style guidelines
   - Add/update tests for your changes
   - Update documentation if needed

3. **Test your changes**

```bash
npm run check    # Type check, lint, format
npm test         # Run tests
```

4. **Commit your changes**

   - Use descriptive commit messages
   - Follow conventional commit format if possible

5. **Push and create a pull request**

```bash
git push origin feature/your-feature-name
```

## Guidelines

### Adding New Features

- Ensure backward compatibility
- Add comprehensive tests
- Update README.md with examples
- Update TypeScript types
- Consider performance implications

### Bug Fixes

- Include a test case that reproduces the bug
- Fix the bug
- Verify the test now passes
- Update documentation if the bug affected documented behavior

### Performance Improvements

- Include benchmarks showing the improvement
- Ensure no breaking changes
- Test with various data sizes

## Testing Guidelines

- Write unit tests for new functionality
- Test edge cases and error conditions
- Include integration tests for complex features
- Ensure tests are deterministic and fast

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new public methods
- Include code examples for new features
- Update TypeScript types and interfaces

## Pull Request Process

1. Ensure all tests pass and code quality checks pass
2. Update documentation
3. Write a clear PR description explaining the changes
4. Link any related issues
5. Be responsive to feedback during review

## Pre-commit Hooks

We use Husky and lint-staged to run checks before commits:

- TypeScript compilation
- ESLint
- Prettier formatting
- Tests (on push)

If pre-commit hooks fail, fix the issues before committing.

## Release Process

Releases are handled by maintainers:

1. Version bump in package.json
2. Update CHANGELOG.md
3. Create release tag
4. GitHub Actions handles npm publishing

## Getting Help

- Check existing issues and discussions
- Create a new issue for bugs or feature requests
- Join discussions in existing issues
- Contact maintainers for guidance

## Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Focus on constructive feedback
- Maintain a professional tone

Thank you for contributing to BreezeDB! 🎉
