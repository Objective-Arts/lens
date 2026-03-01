---
name: dotnet-core
description: "ASP.NET Core patterns and architecture"
---

# ASP.NET Core: Patterns That Ship

The ASP.NET Core team's core belief: **Convention over configuration, but always let developers override.** The framework gives you a pit of success — DI, middleware, configuration — use them as designed and things just work.

## The Foundational Principle

> "The request pipeline is everything. Understand the middleware pipeline, and you understand ASP.NET Core."

Every HTTP request flows through an ordered pipeline of middleware. The order you register middleware is the order it executes. Get this wrong, and auth checks happen after routing, or CORS headers never appear.

---

## Core Principles

### 1. Minimal API vs Controllers

Minimal APIs are for lean endpoints. Controllers are for structured, feature-rich APIs.

**Minimal API — route groups reduce repetition:**
```csharp
var api = app.MapGroup("/api/products").RequireAuthorization().WithTags("Products");

api.MapGet("/", async (IProductService svc) => Results.Ok(await svc.GetAllAsync()));

api.MapGet("/{id:int}", async (int id, IProductService svc) =>
    await svc.GetByIdAsync(id) is { } product ? Results.Ok(product) : Results.NotFound());

api.MapPost("/", async (CreateProductRequest req, IProductService svc) =>
{
    var product = await svc.CreateAsync(req);
    return Results.Created($"/api/products/{product.Id}", product);
});
```

**Controllers — large APIs, filters, OpenAPI attributes:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class ProductsController(IProductService svc) : ControllerBase
{
    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var product = await svc.GetByIdAsync(id);
        return product is null ? NotFound() : Ok(product);
    }
}
```

**When to choose:**
- Minimal APIs: microservices, serverless, < 10 endpoints, rapid prototyping
- Controllers: large teams, OpenAPI generation, complex filters, existing codebase

### 2. Middleware Pipeline

Middleware order is not a suggestion. It is execution order.

**Not this:**
```csharp
app.UseRouting();
app.UseEndpoints(e => e.MapControllers());
app.UseAuthentication();  // Too late — unauthenticated requests already hit endpoints
app.UseAuthorization();
```

**This:**
```csharp
app.UseExceptionHandler("/error");
app.UseHsts();
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

**Use vs Run vs Map:**
```csharp
// Use: chain link — calls next
app.Use(async (context, next) =>
{
    var sw = Stopwatch.StartNew();
    await next(context);
    context.Response.Headers.Append("X-Elapsed-Ms", sw.ElapsedMilliseconds.ToString());
});

// Run: terminal — dead end
app.Run(async context => await context.Response.WriteAsync("Hello"));

// Map: branch by path
app.Map("/health", b => b.Run(async ctx => await ctx.Response.WriteAsync("OK")));
```

**Custom middleware class — constructor takes `RequestDelegate`, method takes `HttpContext`:**
```csharp
public class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var id = context.Request.Headers["X-Correlation-Id"].FirstOrDefault()
            ?? Guid.NewGuid().ToString();
        context.Items["CorrelationId"] = id;
        context.Response.Headers.Append("X-Correlation-Id", id);
        await next(context);
    }
}
```

### 3. Dependency Injection

ASP.NET Core has DI built in. Understand lifetimes or suffer subtle bugs.

```csharp
builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();     // New every time
builder.Services.AddScoped<IShoppingCart, SessionCart>();            // One per request
builder.Services.AddSingleton<ICacheService, MemoryCacheService>(); // One for app lifetime
```

**The captive dependency bug — Singleton captures Scoped:**

**Not this:**
```csharp
public class CacheWarmer : ICacheWarmer  // Registered as Singleton
{
    private readonly IDbContext _db;  // Registered as Scoped — BUG!
    public CacheWarmer(IDbContext db) => _db = db;
}
```

**This:**
```csharp
public class CacheWarmer : ICacheWarmer  // Singleton
{
    private readonly IServiceScopeFactory _scopeFactory;
    public CacheWarmer(IServiceScopeFactory scopeFactory) => _scopeFactory = scopeFactory;

    public async Task WarmAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IDbContext>();
        await db.Products.LoadAsync();
    }
}
```

**Lifetime rule:** A service can only depend on services with equal or longer lifetimes. Singleton -> Singleton only. Scoped -> Singleton + Scoped. Transient -> any.

```csharp
// Catch violations at startup
builder.Host.UseDefaultServiceProvider(o => { o.ValidateScopes = true; o.ValidateOnBuild = true; });
```

### 4. Configuration and Options Pattern

Bind config sections to typed objects. Never scatter `Configuration["Magic:String"]` through code.

**Not this:**
```csharp
public EmailService(IConfiguration config)
{
    var host = config["Smtp:Host"];              // string? — might be null
    var port = int.Parse(config["Smtp:Port"]!);  // Throws if missing
}
```

**This:**
```csharp
public class SmtpOptions
{
    public const string Section = "Smtp";
    public required string Host { get; init; }
    public int Port { get; init; } = 587;
}

builder.Services.AddOptions<SmtpOptions>()
    .BindConfiguration(SmtpOptions.Section)
    .ValidateDataAnnotations()
    .ValidateOnStart();  // Fail at startup, not first request

public EmailService(IOptions<SmtpOptions> options) => _opts = options.Value;
```

**IOptions vs IOptionsSnapshot vs IOptionsMonitor:**
- `IOptions<T>` — Singleton. Read once at startup. Never changes.
- `IOptionsSnapshot<T>` — Scoped. Re-reads config each request.
- `IOptionsMonitor<T>` — Singleton. Fires `OnChange` callback when config changes.

### 5. Model Binding and Validation

Bind input to models. Validate before processing. Return ProblemDetails on failure.

```csharp
public class CreateOrderRequest
{
    [Required, StringLength(100)]
    public required string CustomerName { get; init; }

    [Range(1, 10000)]
    public decimal Amount { get; init; }

    [EmailAddress]
    public required string Email { get; init; }
}
```

**FluentValidation for complex rules:**
```csharp
public class CreateOrderValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderValidator()
    {
        RuleFor(x => x.CustomerName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Amount).GreaterThan(0).LessThanOrEqualTo(10000);
    }
}
```

`[ApiController]` enables automatic 400 responses with ProblemDetails (RFC 7807) for invalid models — no manual `ModelState.IsValid` needed.

### 6. Filters vs Middleware

Middleware operates on every request. Filters operate on MVC actions with access to action context.

**Use middleware when:** logic applies to all requests — logging, CORS, compression.
**Use filters when:** logic needs action context — audit logging, result transformation.

```csharp
public class AuditLogFilter(IAuditService audit) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(
        ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var result = await next();
        if (result.Exception is null)
            await audit.LogAsync(context.ActionDescriptor.DisplayName, "Success");
    }
}

builder.Services.AddControllers(o => o.Filters.Add<AuditLogFilter>());  // Global
[ServiceFilter(typeof(AuditLogFilter))]  // Per-action
```

**Filter execution order:** Authorization -> Resource -> Action -> Exception -> Result.

### 7. Background Services

Long-running work belongs in `BackgroundService`, not in request handlers.

**Not this:**
```csharp
[HttpPost("send-email")]
public IActionResult SendEmail(EmailRequest req)
{
    _ = _emailService.SendAsync(req);  // Fire-and-forget — lost on restart
    return Accepted();
}
```

**This — queue work for a BackgroundService:**
```csharp
[HttpPost("send-email")]
public IActionResult SendEmail(EmailRequest req, IBackgroundTaskQueue queue)
{
    queue.Enqueue(async (scope, ct) =>
    {
        var sender = scope.ServiceProvider.GetRequiredService<IEmailSender>();
        await sender.SendAsync(req, ct);
    });
    return Accepted();
}
```

**Timed background service — use PeriodicTimer, create own DI scope:**
```csharp
public class MetricsCollector(IServiceScopeFactory sf) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(5));
        while (await timer.WaitForNextTickAsync(ct))
        {
            using var scope = sf.CreateScope();
            await scope.ServiceProvider.GetRequiredService<IMetricsService>().CollectAsync(ct);
        }
    }
}
```

### 8. Error Handling

Global exception handler middleware. ProblemDetails (RFC 7807). Never leak stack traces.

**Not this:**
```csharp
// try/catch in every action, inconsistent error formats, leaks internals
catch (Exception ex) { return StatusCode(500, new { error = ex.Message }); }
```

**This:**
```csharp
builder.Services.AddProblemDetails();

app.UseExceptionHandler(err => err.Run(async context =>
{
    var ex = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    context.Response.StatusCode = ex switch
    {
        NotFoundException => 404, ValidationException => 400, _ => 500
    };
    await context.Response.WriteAsJsonAsync(new ProblemDetails
    {
        Status = context.Response.StatusCode,
        Title = ex switch
        {
            NotFoundException => "Resource not found",
            ValidationException => "Validation failed",
            _ => "An unexpected error occurred"
        },
        Detail = context.Response.StatusCode != 500 ? ex?.Message : null  // Never expose 500 details
    });
}));

// Controllers stay clean — throw domain exceptions, middleware handles them
var product = await _svc.GetByIdAsync(id) ?? throw new NotFoundException($"Product {id}");
```

### 9. Authentication and Authorization

Claims-based identity. Policy-based authorization. Keep auth declarative.

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = builder.Configuration["Auth:Authority"];
        o.Audience = builder.Configuration["Auth:Audience"];
    });

builder.Services.AddAuthorization(o =>
{
    o.AddPolicy("AdminOnly", p => p.RequireRole("Admin"));
    o.AddPolicy("CanEditProducts", p => p.RequireClaim("permission", "products:write"));
    o.AddPolicy("MinAge", p => p.AddRequirements(new MinimumAgeRequirement(18)));
});
```

**Custom requirement + handler:**
```csharp
public record MinimumAgeRequirement(int MinimumAge) : IAuthorizationRequirement;

public class MinimumAgeHandler : AuthorizationHandler<MinimumAgeRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context, MinimumAgeRequirement req)
    {
        var claim = context.User.FindFirst("birth_date");
        if (claim is not null && DateTime.TryParse(claim.Value, out var dob)
            && DateTime.Today.Year - dob.Year >= req.MinimumAge)
            context.Succeed(req);
        return Task.CompletedTask;
    }
}
```

**Apply to endpoints:**
```csharp
[Authorize(Policy = "CanEditProducts")]                                   // Controller
app.MapPut("/api/products/{id}", handler).RequireAuthorization("CanEdit"); // Minimal API

// Resource-based auth inside handler
var authResult = await _authService.AuthorizeAsync(User, document, "EditPolicy");
if (!authResult.Succeeded) return Forbid();
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `IConfiguration` injected everywhere | Magic strings, no validation | `IOptions<T>` with `ValidateOnStart` |
| Captive dependency | Singleton holds Scoped service | Inject `IServiceScopeFactory` |
| Service locator in constructors | Hides dependencies, breaks testability | Constructor injection |
| Auth middleware after routing | Unauthenticated requests reach endpoints | Correct middleware order |
| `Task.Run` in request handlers | Wastes thread pool thread | Call async directly or `BackgroundService` |
| Catching `Exception` in every action | Inconsistent error responses | Global exception handler |
| Returning raw exception messages | Leaks internals to clients | ProblemDetails with safe messages |
| `AddSingleton<DbContext>()` | DbContext is not thread-safe | Always register as Scoped |

---

## Decision Framework

| Question | Answer |
|---|---|
| Few endpoints, simple routing? | Minimal API |
| Many endpoints, filters, OpenAPI? | Controllers |
| Logic applies to all requests? | Middleware |
| Logic needs action/model context? | Filter |
| Config value read once? | `IOptions<T>` |
| Config reloads per request? | `IOptionsSnapshot<T>` |
| Config changes with notification? | `IOptionsMonitor<T>` |
| Work outlives the request? | `BackgroundService` with queue |
| Auth rule is role/claim based? | Built-in policy |
| Auth rule is resource-based? | Custom `IAuthorizationHandler` |

---

## Code Review Checklist

1. **Middleware order correct?** Exception handler, HTTPS, static files, routing, CORS, auth, authorization, endpoints.
2. **DI lifetimes safe?** No Scoped captured by Singletons? `ValidateScopes` enabled in dev?
3. **Options validated?** `ValidateDataAnnotations()` and `ValidateOnStart()` called?
4. **No raw IConfiguration injection?** Strongly-typed options everywhere?
5. **Error responses use ProblemDetails?** Consistent RFC 7807 format?
6. **No stack traces in production responses?** 500 errors return generic messages?
7. **Background work in BackgroundService?** No fire-and-forget in request handlers?
8. **Auth policies declared, not hard-coded?** Using `[Authorize(Policy = "...")]`, not manual claims checks?
9. **CancellationToken passed through?** From controller actions to service layer to data access?

---

## Source Material

- ASP.NET Core documentation (Microsoft, docs.microsoft.com)
- "ASP.NET Core in Action" (Andrew Lock, Manning, 3rd Edition)
- Andrew Lock's blog: andrewlock.net
- Microsoft patterns & practices guidance

---

*"Make the right thing easy and the wrong thing hard."* — ASP.NET Core design philosophy
