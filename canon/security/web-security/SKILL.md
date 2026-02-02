---
name: web-security
description: "Pragmatic web security, password handling, breach response, HTTPS"
---

# Troy Hunt's Pragmatic Web Security

Applying real-world security wisdom to authentication, password handling, breach response, and web application hardening. Use when implementing login systems, password storage, security headers, HTTPS configuration, or responding to security incidents. Not for theoretical security research, compliance documentation, or penetration testing methodology.

---

## Core Philosophy

Security that ships beats perfect security that doesn't. Users will find workarounds for inconvenient security. Attackers exploit the weakest link, not the strongest defense. Assume breach - design for detection and containment.

---

## Password Handling

### Storage

```
NEVER: MD5, SHA1, SHA256 alone, encryption (reversible)
ALWAYS: bcrypt, scrypt, or Argon2id with appropriate work factors

bcrypt: cost 12+ (2024 baseline)
Argon2id: memory 64MB+, iterations 3+, parallelism 1
```

### Password Rules That Work

**DO:**
- Minimum 12 characters (16+ for high-value accounts)
- Check against breached password databases
- Allow paste (password managers need this)
- Allow all characters including spaces

**DON'T:**
- Maximum length limits (or if you must, 128+ characters)
- Complexity requirements (uppercase, symbols, etc.)
- Periodic rotation requirements
- Block password managers

---

## HTTPS Everywhere

```nginx
# HSTS - commit to HTTPS
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Redirect all HTTP to HTTPS
server {
    listen 80;
    return 301 https://$host$request_uri;
}

# TLS configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
```

---

## Security Headers

```nginx
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self';" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
```

---

## Authentication Patterns

### Session Management

```javascript
const sessionToken = crypto.randomBytes(32).toString('hex');

res.cookie('session', sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 3600000,
  path: '/'
});
```

### Rate Limiting

```javascript
// Account enumeration prevention
async function login(username, password) {
  const user = await findUser(username);

  // Always hash even if user not found (timing attack prevention)
  const passwordToCheck = user?.passwordHash || '$2b$12$dummy.hash.for.timing';
  const valid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !valid) {
    return { error: 'Invalid username or password' }; // Generic message
  }

  return { success: true, user };
}
```

---

## Pragmatic Principles

1. **"HTTPS everywhere is easier than deciding where"** - Just encrypt everything

2. **"Passwords are a UX problem, not a security problem"** - Long > complex, managers > memory

3. **"Security through obscurity is no security at all"** - Assume attackers know your stack

4. **"The best security is the security that ships"** - Incremental improvement beats paralysis

5. **"Design for breach"** - Assume you will be breached, limit blast radius

---

## Anti-Patterns to Avoid

**NEVER:**
- Roll your own crypto
- Store passwords in plain text
- Trust client-side validation alone
- Log sensitive data
- Use security questions as sole recovery

---

## Resources

- **Have I Been Pwned**: haveibeenpwned.com
- **Troy Hunt's Blog**: troyhunt.com
