# Documentation Masters

Composite skill that invokes the documentation canon.

## When to Use

When writing documentation, README files, API docs, or technical guides.

## Behavior

When this skill is invoked, you MUST use the Skill tool to invoke each documentation expert:

1. **Structure experts:**
   - Use Skill tool with skill="procida" - Diataxis framework (tutorials, how-to, reference, explanation)
   - Use Skill tool with skill="tufte" - information design, clarity

2. **Writing experts:**
   - Use Skill tool with skill="strunk-white" - omit needless words
   - Use Skill tool with skill="zinsser" - clarity, simplicity, humanity
   - Use Skill tool with skill="kernighan" - clear technical writing

## Diataxis Framework

Ensure documentation includes all four types:
- **Tutorials**: Learning-oriented, hands-on lessons
- **How-to guides**: Task-oriented, practical steps
- **Reference**: Information-oriented, accurate descriptions
- **Explanation**: Understanding-oriented, context and rationale

## Writing Principles

After invoking experts, ensure docs:
- Omit needless words (Strunk & White)
- Use active voice (Zinsser)
- One idea per paragraph (Kernighan)
- Show, don't just tell (Tufte)
- Include examples for every concept

## Output

Documentation that is:
1. Properly categorized (Procida)
2. Visually clear (Tufte)
3. Concise (Strunk & White)
4. Human and readable (Zinsser)
