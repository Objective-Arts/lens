# Planning Masters

Composite skill that invokes the canon of planning experts.

## When to Use

When planning implementation of features, architecture decisions, or system design.

## Behavior

When this skill is invoked, you MUST use the Skill tool to invoke each of these experts in sequence:

1. **First, invoke for clarity and simplicity:**
   - Use Skill tool with skill="kernighan" - for clear, simple design
   - Use Skill tool with skill="pike" - for systems thinking
   - Use Skill tool with skill="thompson" - for elegant minimalism

2. **Then, invoke for correctness and contracts:**
   - Use Skill tool with skill="dijkstra" - for formal correctness
   - Use Skill tool with skill="liskov" - for proper abstractions
   - Use Skill tool with skill="bloch" - for API design

3. **Finally, invoke for composition:**
   - Use Skill tool with skill="mcilroy" - for Unix philosophy
   - Use Skill tool with skill="cherny" - for type-driven design

## Output

After invoking all experts, synthesize their guidance into a coherent plan that:
- Is clear and simple (Kernighan)
- Has elegant structure (Thompson)
- Is formally correct (Dijkstra)
- Has proper contracts (Liskov)
- Composes well (McIlroy)
- Is type-safe (Cherny)

## Example

```
Planning: User Authentication Feature

Invoking planning masters...
⚡ /kernighan (clarity)
⚡ /pike (simplicity)
⚡ /thompson (elegance)
⚡ /dijkstra (correctness)
⚡ /liskov (contracts)
⚡ /bloch (API design)
⚡ /mcilroy (unix philosophy)
⚡ /cherny (type-driven)

Synthesized plan:
- Single responsibility auth module (McIlroy)
- Clear function names (Kernighan)
- Type-safe tokens (Cherny)
- Proper interface contracts (Liskov)
...
```
