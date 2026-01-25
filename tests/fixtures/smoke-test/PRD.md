# PRD: Fix UserService Issues

## Requirements

- [ ] Fix async void methods - should return Task
- [ ] Fix blocking async calls - remove .Result usage
- [ ] Add null checks where needed
- [ ] Fix SQL injection vulnerability
- [ ] Refactor long methods to under 30 lines

## Acceptance Criteria

- No async void methods (except event handlers)
- No .Result or .Wait() calls
- Null checks on public method parameters
- Parameterized queries, no string concatenation
- All methods under 30 lines
