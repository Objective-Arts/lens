# Kent C. Dodds Skill

React and testing patterns from Kent C. Dodds (Testing Library creator, Epic React author).

## Files

```
react-test/
├── SKILL.md                      <- Main skill (auto-invoked)
├── README.md                     <- This file
└── references/
    ├── testing-mistakes.md       <- Common mistakes to avoid
    └── react-patterns.md         <- Advanced React patterns
```

## Auto-Activation

This skill auto-activates when:
- Writing or reviewing test files (`*.test.js`, `*.test.jsx`)
- Working with React Testing Library
- Creating React components
- Code review requests

## Core Concepts

### Testing Trophy
Integration tests > Unit tests > E2E tests (by volume)

### Query Priority
1. `getByRole` - Best
2. `getByLabelText` - Forms
3. `getByText` - Non-interactive
4. `getByTestId` - Last resort

### Golden Rules
- "Write tests. Not too many. Mostly integration."
- "Test behavior, not implementation."
- "The more your tests resemble the way your software is used, the more confidence they can give you."

## Usage

Skill is auto-invoked, but you can explicitly request:

```
Apply Kent C. Dodds patterns to this component
Review this test using Kent C. Dodds principles
```

## References

- [Testing Library Docs](https://testing-library.com)
- [Kent's Blog](https://kentcdodds.com/blog)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Epic React](https://epicreact.dev)
