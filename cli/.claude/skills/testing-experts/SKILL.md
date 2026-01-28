# Testing Experts

Composite skill that invokes the testing canon.

## When to Use

When writing tests, designing test strategy, or reviewing test coverage.

## Behavior

When this skill is invoked, you MUST use the Skill tool to invoke each testing expert:

1. **Test philosophy:**
   - Use Skill tool with skill="dodds" - user-centric testing, Testing Library
   - Use Skill tool with skill="fowler-test" - test pyramids, strategies

2. **Test patterns:**
   - Use Skill tool with skill="meszaros" - xUnit patterns, test structure
   - Use Skill tool with skill="hevery" - testable code design

3. **Quality and debugging:**
   - Use Skill tool with skill="kernighan" - clear test names, debugging
   - Use Skill tool with skill="bloch" - edge cases, contracts

## Testing Principles

After invoking experts, ensure tests:
- Test behavior, not implementation (Dodds)
- Follow pyramid: unit > integration > e2e (Fowler)
- Use Four-Phase pattern: setup, exercise, verify, teardown (Meszaros)
- Code is designed for testability (Hevery)
- Test names describe behavior (Kernighan)
- Cover edge cases and error paths (Bloch)

## Output

For each test written:
1. Clear name describing expected behavior
2. Arrange-Act-Assert structure
3. Single assertion per test when possible
4. Edge cases identified and covered
