---
name: dotnet-testing
description: ".NET testing patterns with xUnit, NSubstitute, and FluentAssertions"
---

# .NET Testing Done Right

Distilled from the xUnit team, .NET testing community, and ASP.NET Core best practices. **Write tests that catch bugs, not tests that break when you refactor.** Every test should answer one question clearly.

## The Foundational Principle

> "Test behavior, not implementation. If a refactor breaks your tests but not your users, your tests are wrong."

---

## Core Principles

### 1. xUnit: [Fact] vs [Theory]

`[Fact]` tests one scenario. `[Theory]` tests the same behavior across multiple inputs.

**Not this** (three identical tests for one rule):
```csharp
[Fact] public void Validate_EmptyName_ReturnsFalse() => Assert.False(Validator.IsValidName(""));
[Fact] public void Validate_NullName_ReturnsFalse() => Assert.False(Validator.IsValidName(null));
[Fact] public void Validate_WhitespaceName_ReturnsFalse() => Assert.False(Validator.IsValidName("   "));
```

**This:**
```csharp
[Theory]
[InlineData("")]
[InlineData(null)]
[InlineData("   ")]
public void IsValidName_InvalidInput_ReturnsFalse(string? name)
{
    Validator.IsValidName(name).Should().BeFalse();
}
```

**[MemberData] for complex inputs, [ClassData] for reusable data:**
```csharp
public static IEnumerable<object[]> InvalidOrders => new List<object[]>
{
    new object[] { new Order { Items = Array.Empty<Item>() }, "empty items" },
    new object[] { new Order { Total = -1 }, "negative total" },
};

[Theory]
[MemberData(nameof(InvalidOrders))]
public void Validate_InvalidOrder_ReturnsError(Order order, string reason)
{
    _validator.Validate(order).IsValid.Should().BeFalse(because: reason);
}
```

### 2. Arrange-Act-Assert

One logical assertion per test. Name tests `Method_Scenario_Expected`.

**Not this:**
```csharp
[Fact]
public void TestOrderService() // Vague name, tests 3 behaviors
{
    var svc = new OrderService(new FakeRepo());
    var order = svc.Create("cust-1", new[] { item1 });
    Assert.NotNull(order.Id);
    svc.Cancel(order.Id);
    Assert.Equal(OrderStatus.Cancelled, svc.GetById(order.Id).Status);
}
```

**This:**
```csharp
[Fact]
public void Create_WithItems_AssignsId()
{
    // Arrange
    var service = new OrderService(new FakeOrderRepository());

    // Act
    var order = service.Create("cust-1", new[] { ItemFixture.Widget() });

    // Assert
    order.Id.Should().NotBeEmpty();
}

[Fact]
public void Cancel_ExistingOrder_SetsStatusCancelled()
{
    var service = new OrderService(new FakeOrderRepository());
    var order = service.Create("cust-1", new[] { ItemFixture.Widget() });

    service.Cancel(order.Id);

    service.GetById(order.Id).Status.Should().Be(OrderStatus.Cancelled);
}
```

### 3. Mocking with NSubstitute

Mock external boundaries only. NSubstitute reads like natural language.

```csharp
var emailService = Substitute.For<IEmailService>();
emailService.SendAsync(Arg.Any<string>(), Arg.Any<string>()).Returns(true);

var orderService = new OrderService(emailService);
await orderService.CompleteAsync(orderId);

await emailService.Received(1)
    .SendAsync("customer@example.com", Arg.Is<string>(b => b.Contains("confirmed")));
```

**Argument matchers:**
```csharp
Arg.Any<string>()                              // Any value
Arg.Is<int>(id => id > 0)                      // Condition
Arg.Do<string>(e => captured.Add(e))            // Capture
```

**Not this** (over-mocking):
```csharp
var repo = Substitute.For<IOrderRepository>();
var logger = Substitute.For<ILogger>();
var mapper = Substitute.For<IMapper>();
// ... 15 lines of setup, 10 lines of Received() calls
```

**This** (mock only the boundary):
```csharp
var gateway = Substitute.For<IPaymentGateway>();
gateway.ChargeAsync(Arg.Any<ChargeRequest>())
    .Returns(new ChargeResult { Success = true, TransactionId = "txn-123" });

var service = new CheckoutService(gateway, new RealValidator(), new RealMapper());
var result = await service.ProcessAsync(cart);

result.TransactionId.Should().Be("txn-123");
```

### 4. FluentAssertions

Readable assertions with clear failure messages.

```csharp
// Values and strings
result.Should().Be(42);
price.Should().BeApproximately(19.99m, precision: 0.01m);
message.Should().Contain("not found").And.EndWith(".");

// Collections
orders.Should().HaveCount(3);
orders.Should().ContainSingle(o => o.Status == OrderStatus.Active);
orders.Should().OnlyContain(o => o.Total > 0);

// Object graphs — structural comparison, not reference equality
actual.Should().BeEquivalentTo(expected, opts => opts
    .Excluding(o => o.Id)
    .Excluding(o => o.CreatedAt));

// Exceptions (sync and async)
var act = () => service.Process(null!);
act.Should().Throw<ArgumentNullException>().WithParameterName("request");

var asyncAct = async () => await service.ProcessAsync(null!);
await asyncAct.Should().ThrowAsync<ArgumentNullException>();
```

### 5. Integration Testing with WebApplicationFactory

Test real HTTP through the full ASP.NET Core pipeline.

```csharp
public class OrdersApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public OrdersApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureTestServices(services =>
            {
                services.RemoveAll<IPaymentGateway>();
                services.AddSingleton<IPaymentGateway, FakePaymentGateway>();
            });
        }).CreateClient();
    }

    [Fact]
    public async Task CreateOrder_ValidPayload_Returns201()
    {
        var payload = new { CustomerId = "cust-1", Items = new[] { new { Sku = "W-1", Qty = 2 } } };

        var response = await _client.PostAsJsonAsync("/api/orders", payload);

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetOrder_NotFound_Returns404()
    {
        var response = await _client.GetAsync("/api/orders/nonexistent");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
```

### 6. Test Database Strategies

**Not this** -- false confidence:
```csharp
// UseInMemoryDatabase skips constraints, relationships, SQL behavior
services.AddDbContext<AppDbContext>(opts => opts.UseInMemoryDatabase("TestDb"));
```

**This** -- SQLite in-memory for real SQL:
```csharp
var connection = new SqliteConnection("DataSource=:memory:");
connection.Open(); // Must stay open for lifetime
services.AddDbContext<AppDbContext>(opts => opts.UseSqlite(connection));
```

**Testcontainers for full fidelity** (migrations, stored procs, engine-specific behavior):
```csharp
public class DatabaseTests : IAsyncLifetime
{
    private readonly MsSqlContainer _container = new MsSqlBuilder()
        .WithImage("mcr.microsoft.com/mssql/server:2022-latest")
        .Build();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        using var ctx = CreateContext();
        await ctx.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    [Fact]
    public async Task SaveOrder_PersistsWithConstraints()
    {
        using var ctx = CreateContext();
        ctx.Orders.Add(new Order { CustomerId = "cust-1" });
        await ctx.SaveChangesAsync();

        (await ctx.Orders.SingleAsync()).CustomerId.Should().Be("cust-1");
    }
}
```

### 7. Testing Async Code

**Return Task from async tests, never async void:**
```csharp
[Fact]
public async Task FetchUser_ValidId_ReturnsUser()
{
    var user = await _service.GetByIdAsync(1);

    user.Should().NotBeNull();
    user!.Name.Should().Be("Alice");
}
```

**Testing cancellation and timeouts:**
```csharp
[Fact]
public async Task FetchData_WhenCancelled_Throws()
{
    using var cts = new CancellationTokenSource();
    cts.Cancel();

    var act = async () => await _service.FetchAsync(cts.Token);

    await act.Should().ThrowAsync<OperationCanceledException>();
}

[Fact]
public async Task SlowOperation_ExceedsTimeout_Throws()
{
    var slowDep = Substitute.For<IExternalApi>();
    slowDep.CallAsync(Arg.Any<CancellationToken>())
        .Returns(async call =>
        {
            await Task.Delay(TimeSpan.FromMinutes(1), call.Arg<CancellationToken>());
            return "done";
        });

    var service = new MyService(slowDep);
    using var cts = new CancellationTokenSource(TimeSpan.FromMilliseconds(50));

    var act = async () => await service.ExecuteAsync(cts.Token);

    await act.Should().ThrowAsync<OperationCanceledException>();
}
```

### 8. Test Organization

One test class per production class. Mirror the namespace.

**IClassFixture** -- expensive setup shared across tests in one class:
```csharp
public class DatabaseFixture : IAsyncLifetime
{
    public AppDbContext Context { get; private set; } = null!;
    private SqliteConnection _connection = null!;

    public async Task InitializeAsync()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        await _connection.OpenAsync();
        Context = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection).Options);
        await Context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await Context.DisposeAsync();
        await _connection.DisposeAsync();
    }
}

public class OrderRepoTests : IClassFixture<DatabaseFixture>
{
    public OrderRepoTests(DatabaseFixture fixture) => _ctx = fixture.Context;
}
```

**Collection fixture** -- share across multiple test classes:
```csharp
[CollectionDefinition("Database")]
public class DatabaseCollection : ICollectionFixture<DatabaseFixture> { }

[Collection("Database")]
public class OrderRepoTests { /* injected via constructor */ }

[Collection("Database")]
public class CustomerRepoTests { /* same fixture instance */ }
```

### 9. Avoiding Test Anti-Patterns

**Testing implementation, not behavior:**
```csharp
// NOT THIS: Verifies internal call ordering
Received.InOrder(() => { repo.Save(Arg.Any<Order>()); bus.Publish(Arg.Any<Event>()); });

// THIS: Verifies observable outcome
repo.FindById(order.Id).Should().NotBeNull();
bus.Published.Should().ContainSingle(e => e is OrderPlacedEvent);
```

**Brittle mock verification:**
```csharp
// NOT THIS: Breaks on any internal change
logger.Received(1).LogInformation(Arg.Any<string>());

// THIS: Verify only what matters
repo.Received().SaveAsync(Arg.Is<Order>(o => o.Status == OrderStatus.Confirmed));
```

**Test interdependence:**
```csharp
// NOT THIS: Static shared state between tests
private static Order? _sharedOrder;
[Fact] public void Test1() { _sharedOrder = _svc.Create(items); }
[Fact] public void Test2() { _svc.Cancel(_sharedOrder!.Id); } // Fails alone

// THIS: Each test owns its data
[Fact]
public void Cancel_ExistingOrder_Succeeds()
{
    var order = _service.Create(items);
    _service.Cancel(order.Id);
    _service.GetById(order.Id).Status.Should().Be(OrderStatus.Cancelled);
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|---|---|---|
| UseInMemoryDatabase for everything | Skips constraints, false passes | SQLite in-memory or Testcontainers |
| Mocking what you own | Tight coupling to internals | Use fakes for owned interfaces |
| async void tests | Exceptions swallowed silently | Return Task from test methods |
| Shared mutable state between tests | Order-dependent failures | Fresh fixtures per test |
| Excessive Received() verification | Brittle to refactoring | Verify outcomes, not call counts |
| No test naming convention | Can't diagnose CI failures | Method_Scenario_Expected |
| Testing private methods via reflection | Coupling to implementation | Test through public API |

---

## Decision Framework

| Question | Answer |
|---|---|
| Quick logic validation? | `[Fact]` with FluentAssertions |
| Same logic, many inputs? | `[Theory]` with `[InlineData]` or `[MemberData]` |
| External service dependency? | NSubstitute for the interface boundary |
| HTTP endpoint test? | `WebApplicationFactory` with service overrides |
| Database behavior (basic)? | SQLite in-memory via `IClassFixture` |
| Database behavior (full fidelity)? | Testcontainers with real engine |
| Expensive shared setup? | `IClassFixture<T>` or `ICollectionFixture<T>` |
| Need to verify a call happened? | `Received()` -- but prefer state verification |

---

## Code Review Checklist

### Structure
- [ ] Tests follow Arrange-Act-Assert with blank line separators?
- [ ] One logical behavior per test method?
- [ ] Test names follow Method_Scenario_Expected?
- [ ] Test class mirrors production class namespace?

### Assertions
- [ ] Using FluentAssertions, not raw Assert?
- [ ] BeEquivalentTo for DTOs, not property-by-property checks?
- [ ] Exception assertions use Should().ThrowAsync / Should().Throw?

### Mocking
- [ ] Only external boundaries are mocked?
- [ ] Received() checks verify meaningful interactions only?
- [ ] Fakes used for complex owned dependencies over deep mock setups?

### Data & Async
- [ ] No shared mutable state across tests?
- [ ] Database tests use SQLite/Testcontainers, not InMemory?
- [ ] Async tests return Task, never async void?
- [ ] Fixtures implement IAsyncLifetime for async setup/teardown?

---

*"A test that never fails adds no value. A test that fails for the wrong reason subtracts it."*
