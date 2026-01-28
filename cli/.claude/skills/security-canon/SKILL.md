# Security Canon

Composite skill that invokes the full security expert panel.

## When to Use

When reviewing code for security, implementing auth/crypto, handling user input, or designing trust boundaries.

## Behavior

When this skill is invoked, you MUST use the Skill tool to invoke each security expert:

1. **Mindset experts:**
   - Use Skill tool with skill="schneier" - security mindset, think like attacker
   - Use Skill tool with skill="security-mindset" - systematic threat thinking

2. **Vulnerability experts:**
   - Use Skill tool with skill="owasp" - OWASP Top 10, secure coding
   - Use Skill tool with skill="tanya-janca" - application security
   - Use Skill tool with skill="troy-hunt" - real-world breach lessons

3. **Architecture experts:**
   - Use Skill tool with skill="threat-model" - systematic threat analysis
   - Use Skill tool with skill="defense-in-depth" - layered security
   - Use Skill tool with skill="leveson" - safety engineering

## Security Checklist

After invoking all experts, verify:
- [ ] Input validation at all boundaries (OWASP)
- [ ] Authentication/authorization correct (Schneier)
- [ ] No injection vulnerabilities (Tanya Janca)
- [ ] Secrets properly managed (Troy Hunt lessons)
- [ ] Defense in depth applied (multiple layers)
- [ ] Threat model documented (attack surfaces identified)
- [ ] Fail securely (Leveson safety principles)

## Output

Provide security assessment with:
1. Threats identified (from threat-model)
2. Vulnerabilities found (from owasp, tanya-janca)
3. Mitigations applied (from defense-in-depth)
4. Residual risks (from schneier mindset)
