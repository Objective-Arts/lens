# Refactor Masters

Composite skill that invokes the refactoring canon.

## When to Use

When cleaning up code, extracting methods, renaming, or restructuring.

## Behavior

When this skill is invoked, you MUST use the Skill tool to invoke each refactoring expert:

1. **Clarity experts:**
   - Use Skill tool with skill="kernighan" - meaningful names, clarity
   - Use Skill tool with skill="pike" - simplicity above all
   - Use Skill tool with skill="mcilroy" - do one thing well

2. **Refactoring experts:**
   - Use Skill tool with skill="feathers" - working with legacy code
   - Use Skill tool with skill="gang-of-four" - design patterns

3. **Quality experts:**
   - Use Skill tool with skill="bloch" - API design, defensive coding
   - Use Skill tool with skill="liskov" - proper abstractions

## Refactoring Principles

After invoking experts, apply:
- Extract till you drop (small, focused functions)
- Names reveal intent (Kernighan)
- Each function does one thing (McIlroy)
- Seams for testability (Feathers)
- Patterns where appropriate, not forced (Gang of Four)
- Substitutable abstractions (Liskov)

## Refactoring Checklist

- [ ] Functions < 20 lines
- [ ] Names describe behavior, not implementation
- [ ] No magic numbers or strings
- [ ] Single level of abstraction per function
- [ ] No code duplication (DRY)
- [ ] Clear interfaces between modules

## Output

Refactored code with:
1. Extracted methods with clear names
2. Improved structure
3. Tests still passing
4. No behavior changes
