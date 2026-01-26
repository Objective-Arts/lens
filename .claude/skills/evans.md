---
name: evans
description: "Eric Evans' Domain-Driven Design patterns"
---

# Evans: Domain-Driven Design

Eric Evans' core belief: **Software should reflect the domain it serves.** The code structure, naming, and relationships should mirror how domain experts think about the problem.

## The Foundational Principle

> "The heart of software is its ability to solve domain-related problems for its users."

Technical excellence means nothing if the software doesn't model the domain correctly. Start with the domain, not the database or UI.

## Core Concepts

### 1. Ubiquitous Language

A shared vocabulary between developers and domain experts, used consistently in code, conversations, and documentation.

**Not this:**
```java
// Developer-speak that domain experts won't recognize
class DataProcessor {
    void handleRecord(Record r) {
        if (r.getFlag() == 1) {
            updateStore(r);
        }
    }
}
```

**This:**
```java
// Domain language that experts immediately understand
class OrderFulfillment {
    void shipOrder(Order order) {
        if (order.isReadyForShipment()) {
            warehouse.dispatchOrder(order);
        }
    }
}
```

**The test:** Can a domain expert read your class names and understand what's happening?

### 2. Bounded Contexts

Large systems have multiple models. Each model has a boundary where it applies. Don't try to create one model to rule them all.

```
┌─────────────────────┐     ┌─────────────────────┐
│   Sales Context     │     │  Shipping Context   │
│                     │     │                     │
│  Customer = buyer   │     │  Customer = address │
│  Product = catalog  │     │  Product = package  │
│  Order = cart→sale  │     │  Order = shipment   │
└─────────────────────┘     └─────────────────────┘
          │                           │
          └───────── ACL ─────────────┘
              (Anti-Corruption Layer)
```

**Key insight:** "Customer" means different things in different contexts. That's OK. Don't force a single Customer class everywhere.

### 3. Entities vs Value Objects

**Entities** have identity that persists through state changes:
```java
// Entity - identity matters
class Customer {
    private final CustomerId id;  // This defines identity
    private String name;          // Can change
    private Address address;      // Can change

    // Two customers with same name are NOT the same customer
    @Override
    public boolean equals(Object o) {
        return id.equals(((Customer) o).id);  // Compare by ID only
    }
}
```

**Value Objects** are defined by their attributes, have no identity:
```java
// Value Object - attributes define equality
class Money {
    private final BigDecimal amount;
    private final Currency currency;

    // Two Money objects with same amount/currency ARE the same
    @Override
    public boolean equals(Object o) {
        Money m = (Money) o;
        return amount.equals(m.amount) && currency.equals(m.currency);
    }
}

class Address {
    private final String street;
    private final String city;
    private final String zip;
    // Immutable, compared by all fields
}
```

**The test:** If you swap two instances with identical attributes, does it matter? If yes → Entity. If no → Value Object.

### 4. Aggregates

A cluster of entities and value objects treated as a single unit for data changes. Has one root entity that controls access.

```java
// Order is the Aggregate Root
class Order {
    private final OrderId id;
    private final List<OrderLine> lines;  // Owned by Order
    private OrderStatus status;

    // All changes go through the root
    public void addItem(Product product, int quantity) {
        if (status != OrderStatus.DRAFT) {
            throw new IllegalStateException("Cannot modify submitted order");
        }
        lines.add(new OrderLine(product.getId(), quantity, product.getPrice()));
    }

    public void submit() {
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot submit empty order");
        }
        status = OrderStatus.SUBMITTED;
    }
}

// OrderLine is NOT accessible outside the Order aggregate
class OrderLine {
    private final ProductId productId;
    private final int quantity;
    private final Money price;
    // No public ID - it has no meaning outside its Order
}
```

**Rules:**
- Only the root has global identity
- External objects can only hold references to the root
- Internal objects can hold references to each other
- Deleting the root deletes everything inside
- Invariants are enforced by the root

### 5. Repositories

Provide illusion of in-memory collection for aggregates. Hide persistence details.

```java
// Repository interface in domain layer
interface OrderRepository {
    Order findById(OrderId id);
    void save(Order order);
    List<Order> findByCustomer(CustomerId customerId);
}

// Implementation in infrastructure layer
class JpaOrderRepository implements OrderRepository {
    // JPA/Hibernate details hidden here
}
```

**Not this:**
```java
// Leaking persistence into domain
class OrderService {
    void processOrder(Long orderId) {
        EntityManager em = ...;
        Order order = em.find(Order.class, orderId);
        em.getTransaction().begin();
        // Domain logic mixed with persistence
    }
}
```

### 6. Domain Services

Operations that don't belong to any entity. Stateless, named after domain activities.

```java
// Doesn't belong to Account entity - involves two accounts
class FundsTransferService {
    void transfer(Account from, Account to, Money amount) {
        from.debit(amount);
        to.credit(amount);
    }
}

// Doesn't belong to any single entity
class PricingService {
    Money calculatePrice(Product product, Customer customer, Quantity qty) {
        Money basePrice = product.getBasePrice().multiply(qty);
        Discount discount = customer.getApplicableDiscount();
        return discount.applyTo(basePrice);
    }
}
```

**The test:** If the operation needs multiple aggregates or doesn't naturally fit one entity, it's a Domain Service.

### 7. Domain Events

Something that happened in the domain that domain experts care about.

```java
// Event - immutable, past tense
class OrderSubmitted {
    private final OrderId orderId;
    private final CustomerId customerId;
    private final Instant occurredAt;
    private final Money totalAmount;
}

// Aggregate publishes events
class Order {
    private final List<DomainEvent> events = new ArrayList<>();

    public void submit() {
        // ... validation ...
        status = OrderStatus.SUBMITTED;
        events.add(new OrderSubmitted(id, customerId, Instant.now(), total));
    }

    public List<DomainEvent> getEvents() {
        return List.copyOf(events);
    }
}
```

### 8. Anti-Corruption Layer (ACL)

Translate between your model and external/legacy systems. Don't let their model pollute yours.

```java
// External system uses different model
class LegacyInventorySystem {
    int checkStock(String sku);  // Returns -1 for unknown
}

// ACL translates to your domain
class InventoryAdapter implements InventoryService {
    private final LegacyInventorySystem legacy;

    public Optional<StockLevel> getStockLevel(ProductId productId) {
        String sku = productId.toSku();  // Translate ID
        int stock = legacy.checkStock(sku);
        if (stock < 0) return Optional.empty();  // Translate -1 to Optional
        return Optional.of(new StockLevel(stock));  // Wrap in domain type
    }
}
```

## Strategic Design

### Context Mapping

How bounded contexts relate to each other:

| Pattern | Description |
|---------|-------------|
| **Shared Kernel** | Two contexts share a subset of the model |
| **Customer-Supplier** | Upstream context serves downstream's needs |
| **Conformist** | Downstream conforms to upstream's model |
| **Anti-Corruption Layer** | Downstream translates upstream's model |
| **Separate Ways** | No integration, duplicate where needed |
| **Published Language** | Shared interchange format (JSON schema, etc.) |

### Subdomain Types

| Type | Description | Example |
|------|-------------|---------|
| **Core** | Competitive advantage, deserves best effort | Pricing algorithm, matching engine |
| **Supporting** | Necessary but not differentiating | User management, reporting |
| **Generic** | Solved problem, buy or use library | Email, payments, auth |

**Invest modeling effort in Core domains. Use off-the-shelf for Generic.**

## The Evans Test

Before committing domain code, ask:

1. **Does naming match domain language?** Would domain experts recognize the terms?
2. **Are aggregates sized correctly?** Small enough for invariants, large enough for transactions?
3. **Are value objects immutable?** Do they compare by attributes?
4. **Is persistence hidden?** Do repositories look like collections?
5. **Are bounded contexts explicit?** Do you know where one model ends and another begins?
6. **Are external systems behind ACLs?** Is their model isolated from yours?

## When Reviewing Code

Apply these checks:

- [ ] Classes named using ubiquitous language
- [ ] Entities identified by ID, not attributes
- [ ] Value objects are immutable and compared by value
- [ ] Aggregates protect their invariants
- [ ] External objects only reference aggregate roots
- [ ] Repositories abstract persistence
- [ ] Domain logic in domain layer, not services or controllers
- [ ] External systems accessed through ACL
- [ ] Events named in past tense, describing what happened

## When NOT to Use This Skill

Use a different skill when:
- **Simple CRUD apps** → DDD is overkill, use simple layered architecture
- **API/interface design** → Use `bloch` (defensive design)
- **Data structure design** → Use `linus` (data structures first)
- **Technical patterns** → Use `gang-of-four` (GoF patterns)

Evans is the **domain modeling skill**—use it when the domain complexity justifies the investment.

## Sources

- Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software" (2003)
- Evans, "Domain-Driven Design Reference" (2015) - free PDF summary
- Vernon, "Implementing Domain-Driven Design" (2013)
- Fowler, "Patterns of Enterprise Application Architecture" (2002) - complementary patterns

---

*"The critical complexity of most software projects is in understanding the domain itself."* — Eric Evans
