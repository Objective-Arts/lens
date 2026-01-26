---
name: gang-of-four
description: "Complete GoF Design Patterns - all 23 patterns with examples"
allowed-tools: []
---

# Gang of Four: Design Patterns (Complete)

The core belief: **Favor object composition over class inheritance.** Design to interfaces, not implementations. Find what varies and encapsulate it.

This skill covers ALL 23 patterns from "Design Patterns: Elements of Reusable Object-Oriented Software" (1994).

---

## CREATIONAL PATTERNS

*Abstract the instantiation process. Make system independent of how objects are created, composed, and represented.*

---

### Abstract Factory

**Intent**: Provide interface for creating families of related objects without specifying concrete classes.

**Problem**: System must work with multiple families of products. Mixing products from different families causes bugs.

**When to Use**:
- System should be independent of how products are created
- System should be configured with one of multiple families of products
- Family of products must be used together
- You want to provide a class library of products, revealing only interfaces

**Structure**:
```
AbstractFactory                    AbstractProductA
  + createProductA()               ConcreteProductA1
  + createProductB()               ConcreteProductA2

ConcreteFactory1                   AbstractProductB
  + createProductA() → A1          ConcreteProductB1
  + createProductB() → B1          ConcreteProductB2

ConcreteFactory2
  + createProductA() → A2
  + createProductB() → B2
```

**Example**:
```java
// Abstract factory
public interface GUIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

// Concrete factory - Windows family
public class WindowsFactory implements GUIFactory {
    public Button createButton() { return new WindowsButton(); }
    public Checkbox createCheckbox() { return new WindowsCheckbox(); }
}

// Concrete factory - Mac family
public class MacFactory implements GUIFactory {
    public Button createButton() { return new MacButton(); }
    public Checkbox createCheckbox() { return new MacCheckbox(); }
}

// Client code - works with any factory
public class Application {
    private final Button button;
    private final Checkbox checkbox;

    public Application(GUIFactory factory) {
        button = factory.createButton();
        checkbox = factory.createCheckbox();
    }
}
```

**Consequences**:
- Isolates concrete classes from clients
- Makes exchanging product families easy
- Promotes consistency among products
- Supporting new kinds of products is difficult (must extend interface)

**Related**: Factory Method (often implemented using), Singleton (factories often are), Prototype (alternative)

---

### Builder

**Intent**: Separate construction of complex object from its representation, allowing same construction process to create different representations.

**Problem**: Constructor with many parameters is error-prone. Telescoping constructors are unmaintainable.

**When to Use**:
- Algorithm for creating complex object should be independent of parts
- Construction must allow different representations
- Object has many optional parameters
- Construction involves many steps

**Structure**:
```
Director                          Builder
  + construct()                     + buildPartA()
  - builder: Builder                + buildPartB()
                                    + getResult()

                                  ConcreteBuilder
                                    + buildPartA()
                                    + buildPartB()
                                    + getResult(): Product
```

**Example**:
```java
// Builder interface
public interface MealBuilder {
    MealBuilder addBurger(String type);
    MealBuilder addDrink(String drink);
    MealBuilder addSide(String side);
    MealBuilder addToy(boolean include);
    Meal build();
}

// Concrete builder
public class KidsMealBuilder implements MealBuilder {
    private String burger;
    private String drink;
    private String side;
    private boolean toy;

    public MealBuilder addBurger(String type) { this.burger = type; return this; }
    public MealBuilder addDrink(String drink) { this.drink = drink; return this; }
    public MealBuilder addSide(String side) { this.side = side; return this; }
    public MealBuilder addToy(boolean include) { this.toy = include; return this; }

    public Meal build() {
        return new KidsMeal(burger, drink, side, toy);
    }
}

// Fluent usage
Meal meal = new KidsMealBuilder()
    .addBurger("cheeseburger")
    .addDrink("milk")
    .addSide("apple slices")
    .addToy(true)
    .build();
```

**Bloch's Builder Variant** (most common in Java):
```java
public class NutritionFacts {
    private final int servingSize;  // required
    private final int servings;     // required
    private final int calories;     // optional
    private final int fat;          // optional

    public static class Builder {
        // Required parameters
        private final int servingSize;
        private final int servings;
        // Optional parameters - initialized to default
        private int calories = 0;
        private int fat = 0;

        public Builder(int servingSize, int servings) {
            this.servingSize = servingSize;
            this.servings = servings;
        }

        public Builder calories(int val) { calories = val; return this; }
        public Builder fat(int val) { fat = val; return this; }

        public NutritionFacts build() {
            return new NutritionFacts(this);
        }
    }

    private NutritionFacts(Builder builder) {
        servingSize = builder.servingSize;
        servings = builder.servings;
        calories = builder.calories;
        fat = builder.fat;
    }
}
```

**Consequences**:
- Lets you vary product's internal representation
- Isolates code for construction and representation
- Gives finer control over construction process
- Immutable objects are natural result

**Related**: Abstract Factory (similar but Builder builds step by step), Composite (often what gets built)

---

### Factory Method

**Intent**: Define interface for creating object, but let subclasses decide which class to instantiate. Defer instantiation to subclasses.

**Problem**: A class can't anticipate the class of objects it must create. A class wants subclasses to specify the objects it creates.

**When to Use**:
- Class can't anticipate the class of objects it must create
- Class wants subclasses to specify objects it creates
- Classes delegate responsibility to one of several helper subclasses

**Structure**:
```
Creator                           Product
  + factoryMethod(): Product      ConcreteProduct
  + operation()

ConcreteCreator
  + factoryMethod(): ConcreteProduct
```

**Example**:
```java
// Product interface
public interface Document {
    void open();
    void close();
}

// Concrete products
public class WordDocument implements Document {
    public void open() { /* Word-specific */ }
    public void close() { /* Word-specific */ }
}

public class PdfDocument implements Document {
    public void open() { /* PDF-specific */ }
    public void close() { /* PDF-specific */ }
}

// Creator with factory method
public abstract class Application {
    // Factory method - subclasses decide what to create
    protected abstract Document createDocument();

    public void newDocument() {
        Document doc = createDocument();  // Factory method call
        documents.add(doc);
        doc.open();
    }
}

// Concrete creators
public class WordApplication extends Application {
    protected Document createDocument() {
        return new WordDocument();
    }
}

public class PdfApplication extends Application {
    protected Document createDocument() {
        return new PdfDocument();
    }
}
```

**Parameterized Factory Method**:
```java
public class DocumentFactory {
    public static Document createDocument(String type) {
        return switch (type) {
            case "word" -> new WordDocument();
            case "pdf" -> new PdfDocument();
            case "html" -> new HtmlDocument();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}
```

**Consequences**:
- Eliminates need to bind application-specific classes into code
- Clients deal only with Product interface
- Provides hook for subclasses to extend
- May require creating subclass just to create a product

**Related**: Abstract Factory (often uses), Template Method (factory methods often called from), Prototype (alternative that doesn't require subclassing)

---

### Prototype

**Intent**: Specify kinds of objects to create using a prototypical instance, create new objects by copying this prototype.

**Problem**: System should be independent of how products are created. Classes to instantiate are specified at runtime.

**When to Use**:
- Classes to instantiate specified at runtime (e.g., dynamic loading)
- Avoiding hierarchy of factory classes parallel to product classes
- Instances of a class can have few different combinations of state
- Cloning is cheaper than creating from scratch

**Structure**:
```
Prototype                         Client
  + clone(): Prototype              + operation()
                                    - prototype: Prototype
ConcretePrototype1
  + clone(): Prototype

ConcretePrototype2
  + clone(): Prototype
```

**Example**:
```java
// Prototype interface
public interface Shape extends Cloneable {
    Shape clone();
    void draw();
}

// Concrete prototype
public class Circle implements Shape {
    private int x, y, radius;
    private String color;

    public Circle(Circle source) {
        this.x = source.x;
        this.y = source.y;
        this.radius = source.radius;
        this.color = source.color;
    }

    public Shape clone() {
        return new Circle(this);
    }

    public void draw() { /* draw circle */ }
}

// Prototype registry
public class ShapeCache {
    private static Map<String, Shape> cache = new HashMap<>();

    static {
        cache.put("circle", new Circle(0, 0, 10, "red"));
        cache.put("rectangle", new Rectangle(0, 0, 20, 10, "blue"));
    }

    public static Shape getShape(String type) {
        return cache.get(type).clone();
    }
}

// Usage
Shape circle1 = ShapeCache.getShape("circle");
Shape circle2 = ShapeCache.getShape("circle");  // Different instance, same values
```

**Deep vs Shallow Copy**:
```java
// Shallow copy - references shared
public Shape shallowClone() {
    try {
        return (Shape) super.clone();
    } catch (CloneNotSupportedException e) {
        throw new RuntimeException(e);
    }
}

// Deep copy - all objects cloned
public Shape deepClone() {
    Circle copy = new Circle(this);
    copy.attributes = new HashMap<>(this.attributes);  // Copy mutable fields
    return copy;
}
```

**Consequences**:
- Hides concrete product classes from client
- Add/remove products at runtime
- Specify new objects by varying values
- Reduced subclassing
- Cloning complex objects can be difficult

**Related**: Abstract Factory (can use), Composite and Decorator (often benefit from)

---

### Singleton

**Intent**: Ensure a class has only one instance, provide global point of access.

**Problem**: Some classes should have exactly one instance (logging, config, thread pools, caches).

**When to Use**:
- Exactly one instance needed, accessible from well-known point
- Sole instance should be extensible by subclassing
- **Use sparingly** - often a sign of poor design

**Structure**:
```
Singleton
  - instance: Singleton
  - Singleton()  // private
  + getInstance(): Singleton
```

**Example - Thread-Safe Implementations**:

```java
// 1. Enum (preferred in Java - Bloch Item 3)
public enum Singleton {
    INSTANCE;

    public void doSomething() { }
}

// 2. Initialization-on-demand holder (lazy, thread-safe)
public class Singleton {
    private Singleton() { }

    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}

// 3. Double-checked locking (Java 5+)
public class Singleton {
    private static volatile Singleton instance;

    private Singleton() { }

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// 4. Simple synchronized (correct but slower)
public class Singleton {
    private static Singleton instance;

    private Singleton() { }

    public static synchronized Singleton getInstance() {
        if (instance == null) {
            instance = new Singleton();
        }
        return instance;
    }
}
```

**Consequences**:
- Controlled access to sole instance
- Reduced name space (vs global variables)
- Permits refinement of operations and representation
- Permits variable number of instances
- **Downsides**: Hard to test, hidden dependencies, global state

**When NOT to Use**:
- Dependency injection is almost always better
- Consider if you really need global access
- Often a code smell indicating poor separation of concerns

**Related**: Abstract Factory, Builder, Prototype (can be singletons)

---

## STRUCTURAL PATTERNS

*Compose classes or objects into larger structures. Class patterns use inheritance, object patterns use composition.*

---

### Adapter

**Intent**: Convert interface of a class into another interface clients expect. Let classes work together that couldn't otherwise due to incompatible interfaces.

**Also Known As**: Wrapper

**Problem**: Existing class has the functionality you need but wrong interface.

**When to Use**:
- Want to use existing class but interface doesn't match
- Want to create reusable class that cooperates with unrelated classes
- Need to use several existing subclasses but impractical to adapt each

**Structure**:

*Class Adapter (inheritance)*:
```
Target                   Adaptee
  + request()              + specificRequest()

        Adapter (extends Adaptee, implements Target)
          + request() { specificRequest(); }
```

*Object Adapter (composition)*:
```
Target                   Adaptee
  + request()              + specificRequest()

        Adapter (implements Target)
          - adaptee: Adaptee
          + request() { adaptee.specificRequest(); }
```

**Example**:
```java
// Target interface (what client expects)
public interface MediaPlayer {
    void play(String filename);
}

// Adaptee (existing class with different interface)
public class AdvancedMediaPlayer {
    public void playVlc(String filename) { /* VLC logic */ }
    public void playMp4(String filename) { /* MP4 logic */ }
}

// Object Adapter
public class MediaAdapter implements MediaPlayer {
    private final AdvancedMediaPlayer advancedPlayer;
    private final String format;

    public MediaAdapter(String format) {
        this.format = format;
        this.advancedPlayer = new AdvancedMediaPlayer();
    }

    public void play(String filename) {
        if (format.equals("vlc")) {
            advancedPlayer.playVlc(filename);
        } else if (format.equals("mp4")) {
            advancedPlayer.playMp4(filename);
        }
    }
}

// Client
public class AudioPlayer implements MediaPlayer {
    public void play(String filename) {
        String extension = getExtension(filename);
        if (extension.equals("mp3")) {
            // Native support
            playMp3(filename);
        } else if (extension.equals("vlc") || extension.equals("mp4")) {
            // Use adapter
            MediaAdapter adapter = new MediaAdapter(extension);
            adapter.play(filename);
        }
    }
}
```

**Consequences**:
- Class Adapter: can override Adaptee behavior, introduces only one object
- Object Adapter: can adapt class and all subclasses, harder to override behavior
- Object Adapter is generally preferred (more flexible)

**Related**: Bridge (similar structure but different intent), Decorator (wraps without changing interface), Proxy (same interface as subject)

---

### Bridge

**Intent**: Decouple abstraction from implementation so both can vary independently.

**Also Known As**: Handle/Body

**Problem**: Abstraction and implementation in same hierarchy causes exponential class growth when either varies.

**When to Use**:
- Avoid permanent binding between abstraction and implementation
- Both abstraction and implementation should be extensible by subclassing
- Changes in implementation shouldn't affect clients
- Hide implementation completely from clients

**Structure**:
```
Abstraction                        Implementor
  - impl: Implementor                + operationImpl()
  + operation()
                                   ConcreteImplementorA
RefinedAbstraction                   + operationImpl()
  + operation()
                                   ConcreteImplementorB
                                     + operationImpl()
```

**Example**:
```java
// Implementor
public interface Device {
    void turnOn();
    void turnOff();
    void setVolume(int volume);
    int getVolume();
}

// Concrete Implementors
public class TV implements Device {
    private int volume = 50;
    public void turnOn() { System.out.println("TV on"); }
    public void turnOff() { System.out.println("TV off"); }
    public void setVolume(int v) { volume = v; }
    public int getVolume() { return volume; }
}

public class Radio implements Device {
    private int volume = 30;
    public void turnOn() { System.out.println("Radio on"); }
    public void turnOff() { System.out.println("Radio off"); }
    public void setVolume(int v) { volume = v; }
    public int getVolume() { return volume; }
}

// Abstraction
public class Remote {
    protected Device device;

    public Remote(Device device) { this.device = device; }

    public void togglePower() {
        // Uses implementor
    }

    public void volumeUp() {
        device.setVolume(device.getVolume() + 10);
    }
}

// Refined Abstraction
public class AdvancedRemote extends Remote {
    public AdvancedRemote(Device device) { super(device); }

    public void mute() {
        device.setVolume(0);
    }
}

// Usage - abstraction and implementation vary independently
Remote tvRemote = new Remote(new TV());
Remote radioRemote = new AdvancedRemote(new Radio());
```

**Without Bridge** (exponential growth):
```
Remote
├── TVRemote
├── RadioRemote
├── AdvancedTVRemote
├── AdvancedRadioRemote
└── ... (new device × new remote type)
```

**Consequences**:
- Decouples interface and implementation
- Improved extensibility
- Hiding implementation details from clients
- Both hierarchies can evolve independently

**Related**: Abstract Factory (can create and configure Bridge), Adapter (makes unrelated classes work together; Bridge designed up-front)

---

### Composite

**Intent**: Compose objects into tree structures to represent part-whole hierarchies. Let clients treat individual objects and compositions uniformly.

**Problem**: Need to represent hierarchies where both primitives and containers are treated the same way.

**When to Use**:
- Represent part-whole hierarchies
- Clients should ignore difference between compositions and individuals
- Structure can have arbitrary depth

**Structure**:
```
Component
  + operation()
  + add(Component)
  + remove(Component)
  + getChild(int)

Leaf                              Composite
  + operation()                     - children: List<Component>
                                    + operation() { for each child: child.operation() }
                                    + add(Component)
                                    + remove(Component)
                                    + getChild(int)
```

**Example**:
```java
// Component
public interface FileSystemItem {
    String getName();
    long getSize();
    void print(String indent);
}

// Leaf
public class File implements FileSystemItem {
    private final String name;
    private final long size;

    public File(String name, long size) {
        this.name = name;
        this.size = size;
    }

    public String getName() { return name; }
    public long getSize() { return size; }
    public void print(String indent) {
        System.out.println(indent + name + " (" + size + " bytes)");
    }
}

// Composite
public class Directory implements FileSystemItem {
    private final String name;
    private final List<FileSystemItem> children = new ArrayList<>();

    public Directory(String name) { this.name = name; }

    public void add(FileSystemItem item) { children.add(item); }
    public void remove(FileSystemItem item) { children.remove(item); }

    public String getName() { return name; }

    public long getSize() {
        return children.stream()
            .mapToLong(FileSystemItem::getSize)
            .sum();
    }

    public void print(String indent) {
        System.out.println(indent + name + "/");
        for (FileSystemItem child : children) {
            child.print(indent + "  ");
        }
    }
}

// Usage - uniform treatment
Directory root = new Directory("root");
root.add(new File("readme.txt", 100));

Directory src = new Directory("src");
src.add(new File("Main.java", 500));
src.add(new File("Utils.java", 300));
root.add(src);

System.out.println("Total size: " + root.getSize());  // Works uniformly
root.print("");
```

**Consequences**:
- Defines class hierarchies with primitives and composites
- Simplifies client code (uniform interface)
- Easy to add new component types
- Can make design overly general (hard to restrict components)

**Related**: Chain of Responsibility (component links often follow parent link), Decorator (often used together), Iterator (traverse composite), Visitor (localize operations on composite)

---

### Decorator

**Intent**: Attach additional responsibilities to object dynamically. Flexible alternative to subclassing for extending functionality.

**Also Known As**: Wrapper

**Problem**: Need to add responsibilities to individual objects, not entire class. Inheritance is static and applies to entire class.

**When to Use**:
- Add responsibilities dynamically and transparently
- Responsibilities can be withdrawn
- Extension by subclassing is impractical
- Lots of independent extensions would cause explosion of subclasses

**Structure**:
```
Component                          Decorator
  + operation()                      - component: Component
                                     + operation() { component.operation() }
ConcreteComponent
  + operation()                    ConcreteDecoratorA
                                     + addedState
                                     + operation()

                                   ConcreteDecoratorB
                                     + operation()
                                     + addedBehavior()
```

**Example**:
```java
// Component
public interface Coffee {
    double getCost();
    String getDescription();
}

// Concrete Component
public class SimpleCoffee implements Coffee {
    public double getCost() { return 2.0; }
    public String getDescription() { return "Simple Coffee"; }
}

// Base Decorator
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee decoratedCoffee;

    public CoffeeDecorator(Coffee coffee) {
        this.decoratedCoffee = coffee;
    }

    public double getCost() { return decoratedCoffee.getCost(); }
    public String getDescription() { return decoratedCoffee.getDescription(); }
}

// Concrete Decorators
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }

    public double getCost() { return super.getCost() + 0.5; }
    public String getDescription() { return super.getDescription() + ", Milk"; }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }

    public double getCost() { return super.getCost() + 0.2; }
    public String getDescription() { return super.getDescription() + ", Sugar"; }
}

public class WhipDecorator extends CoffeeDecorator {
    public WhipDecorator(Coffee coffee) { super(coffee); }

    public double getCost() { return super.getCost() + 0.7; }
    public String getDescription() { return super.getDescription() + ", Whip"; }
}

// Usage - stack decorators
Coffee coffee = new SimpleCoffee();
coffee = new MilkDecorator(coffee);
coffee = new SugarDecorator(coffee);
coffee = new WhipDecorator(coffee);

System.out.println(coffee.getDescription());  // Simple Coffee, Milk, Sugar, Whip
System.out.println(coffee.getCost());         // 3.4
```

**Java I/O Example**:
```java
// Classic decorator pattern in Java
InputStream in = new BufferedInputStream(
    new FileInputStream("file.txt"));

Reader reader = new BufferedReader(
    new InputStreamReader(
        new FileInputStream("file.txt"), "UTF-8"));
```

**Consequences**:
- More flexibility than static inheritance
- Avoids feature-laden classes high in hierarchy
- Decorator and component aren't identical (identity checks fail)
- Lots of little objects (can be hard to debug)

**Related**: Adapter (changes interface), Composite (decorator is degenerate composite with one child), Strategy (change guts vs skin)

---

### Facade

**Intent**: Provide unified interface to a set of interfaces in a subsystem. Higher-level interface makes subsystem easier to use.

**Problem**: Subsystem has many classes and is difficult to use. Clients need to know too much about subsystem structure.

**When to Use**:
- Want simple interface to complex subsystem
- Many dependencies between clients and implementation classes
- Want to layer subsystems (facade is entry point to each layer)

**Structure**:
```
                                    Subsystem classes
Facade ──────────────────────────► ClassA
  + operation()                     ClassB
                                    ClassC
                                    ClassD
```

**Example**:
```java
// Complex subsystem classes
public class VideoFile {
    private String filename;
    public VideoFile(String filename) { this.filename = filename; }
}

public class Codec { }
public class MPEG4Codec extends Codec { }
public class OggCodec extends Codec { }

public class CodecFactory {
    public static Codec extract(VideoFile file) { /* ... */ return null; }
}

public class BitrateReader {
    public static VideoFile read(VideoFile file, Codec codec) { return file; }
    public static VideoFile convert(VideoFile buffer, Codec codec) { return buffer; }
}

public class AudioMixer {
    public VideoFile fix(VideoFile result) { return result; }
}

// Facade - simplifies the complex subsystem
public class VideoConverter {
    public VideoFile convert(String filename, String format) {
        VideoFile file = new VideoFile(filename);
        Codec sourceCodec = CodecFactory.extract(file);

        Codec destinationCodec = format.equals("mp4")
            ? new MPEG4Codec()
            : new OggCodec();

        VideoFile buffer = BitrateReader.read(file, sourceCodec);
        VideoFile intermediateResult = BitrateReader.convert(buffer, destinationCodec);
        VideoFile result = new AudioMixer().fix(intermediateResult);

        return result;
    }
}

// Client code - simple
VideoConverter converter = new VideoConverter();
VideoFile mp4 = converter.convert("funny-video.ogg", "mp4");
```

**Consequences**:
- Shields clients from subsystem components
- Promotes weak coupling between subsystem and clients
- Doesn't prevent applications from using subsystem classes if needed
- Subsystem can evolve independently

**Related**: Abstract Factory (create subsystem objects in subsystem-independent way), Mediator (abstracts existing classes, but Mediator's colleagues are aware of it), Singleton (Facades often are)

---

### Flyweight

**Intent**: Use sharing to support large numbers of fine-grained objects efficiently.

**Problem**: Application uses large number of objects. Storage costs are high due to sheer quantity.

**When to Use**:
- Application uses large number of objects
- Storage costs high because of quantity
- Most object state can be made extrinsic (passed in)
- Many groups of objects may be replaced by few shared objects
- Application doesn't depend on object identity

**Structure**:
```
FlyweightFactory                   Flyweight
  - flyweights: Map                  + operation(extrinsicState)
  + getFlyweight(key)
                                   ConcreteFlyweight
                                     - intrinsicState
                                     + operation(extrinsicState)

                                   UnsharedConcreteFlyweight
                                     - allState
                                     + operation(extrinsicState)
```

**Example**:
```java
// Flyweight - shared state only
public class TreeType {
    private final String name;
    private final String color;
    private final String texture;

    public TreeType(String name, String color, String texture) {
        this.name = name;
        this.color = color;
        this.texture = texture;
    }

    public void draw(int x, int y) {
        System.out.println("Drawing " + name + " at (" + x + ", " + y + ")");
    }
}

// Flyweight Factory
public class TreeFactory {
    private static final Map<String, TreeType> treeTypes = new HashMap<>();

    public static TreeType getTreeType(String name, String color, String texture) {
        String key = name + "_" + color + "_" + texture;
        if (!treeTypes.containsKey(key)) {
            treeTypes.put(key, new TreeType(name, color, texture));
        }
        return treeTypes.get(key);
    }
}

// Context - contains extrinsic state
public class Tree {
    private final int x;
    private final int y;
    private final TreeType type;  // Shared flyweight

    public Tree(int x, int y, TreeType type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }

    public void draw() {
        type.draw(x, y);
    }
}

// Forest with many trees
public class Forest {
    private final List<Tree> trees = new ArrayList<>();

    public void plantTree(int x, int y, String name, String color, String texture) {
        TreeType type = TreeFactory.getTreeType(name, color, texture);
        trees.add(new Tree(x, y, type));
    }

    public void draw() {
        trees.forEach(Tree::draw);
    }
}

// Usage - 1 million trees, but only a few TreeType objects
Forest forest = new Forest();
for (int i = 0; i < 1_000_000; i++) {
    forest.plantTree(
        random.nextInt(1000), random.nextInt(1000),
        "Oak", "Green", "rough"  // Shared
    );
}
```

**Intrinsic vs Extrinsic State**:
- **Intrinsic**: Stored in flyweight, shared, context-independent (name, color, texture)
- **Extrinsic**: Stored in client, passed to flyweight, context-dependent (x, y coordinates)

**Consequences**:
- Significant memory savings when sharing is possible
- Computation costs may increase (extrinsic state computation)
- Complexity increases
- Flyweights can't be used for identity comparisons

**Related**: Composite (often combined, flyweight leaf nodes), State and Strategy (often implemented as flyweights)

---

### Proxy

**Intent**: Provide surrogate or placeholder for another object to control access to it.

**Also Known As**: Surrogate

**Problem**: Need to control access to object: lazy initialization, access control, logging, caching.

**When to Use**:
- Remote proxy: local representative for remote object
- Virtual proxy: creates expensive objects on demand
- Protection proxy: controls access based on permissions
- Smart reference: additional actions when object accessed

**Structure**:
```
Subject                            RealSubject
  + request()                        + request()

Proxy
  - realSubject: RealSubject
  + request() {
      // ... before
      realSubject.request();
      // ... after
  }
```

**Example - Virtual Proxy (lazy loading)**:
```java
// Subject interface
public interface Image {
    void display();
}

// Real subject - expensive to create
public class RealImage implements Image {
    private final String filename;

    public RealImage(String filename) {
        this.filename = filename;
        loadFromDisk();  // Expensive operation
    }

    private void loadFromDisk() {
        System.out.println("Loading " + filename);
        // Simulate slow loading
    }

    public void display() {
        System.out.println("Displaying " + filename);
    }
}

// Virtual Proxy - defers creation
public class ProxyImage implements Image {
    private RealImage realImage;
    private final String filename;

    public ProxyImage(String filename) {
        this.filename = filename;
        // Don't load yet
    }

    public void display() {
        if (realImage == null) {
            realImage = new RealImage(filename);  // Load on first use
        }
        realImage.display();
    }
}

// Usage
Image image = new ProxyImage("huge_photo.jpg");  // No loading yet
// ... later
image.display();  // NOW it loads
image.display();  // Already loaded
```

**Protection Proxy Example**:
```java
public interface Document {
    void view();
    void edit();
}

public class SecureDocumentProxy implements Document {
    private final Document document;
    private final User currentUser;

    public SecureDocumentProxy(Document document, User user) {
        this.document = document;
        this.currentUser = user;
    }

    public void view() {
        if (currentUser.hasPermission("view")) {
            document.view();
        } else {
            throw new AccessDeniedException("No view permission");
        }
    }

    public void edit() {
        if (currentUser.hasPermission("edit")) {
            document.edit();
        } else {
            throw new AccessDeniedException("No edit permission");
        }
    }
}
```

**Caching Proxy Example**:
```java
public class CachingProxy implements DataService {
    private final DataService realService;
    private final Map<String, Data> cache = new HashMap<>();

    public Data getData(String id) {
        if (!cache.containsKey(id)) {
            cache.put(id, realService.getData(id));
        }
        return cache.get(id);
    }
}
```

**Consequences**:
- Introduces level of indirection
- Can hide location of real subject (remote proxy)
- Can perform optimizations (virtual proxy)
- Can add behavior (protection, caching, logging)

**Related**: Adapter (different interface), Decorator (adds responsibilities, proxy controls access)

---

## BEHAVIORAL PATTERNS

*Concerned with algorithms and assignment of responsibilities between objects. Describe patterns of communication between objects.*

---

### Chain of Responsibility

**Intent**: Avoid coupling sender to receiver by giving multiple objects a chance to handle request. Chain receiving objects, pass request along until handled.

**Problem**: More than one object may handle a request. Handler isn't known a priori. Want to issue request without specifying receiver explicitly.

**When to Use**:
- More than one object may handle request, handler not known
- Want to issue request without specifying receiver explicitly
- Set of handlers should be specified dynamically

**Structure**:
```
Handler
  - successor: Handler
  + handleRequest()

ConcreteHandler1                   ConcreteHandler2
  + handleRequest() {                + handleRequest() {
      if (canHandle)                     if (canHandle)
          // handle                          // handle
      else                               else
          successor.handleRequest()          successor.handleRequest()
  }                                  }
```

**Example**:
```java
// Handler
public abstract class SupportHandler {
    protected SupportHandler nextHandler;

    public void setNext(SupportHandler handler) {
        this.nextHandler = handler;
    }

    public abstract void handleRequest(SupportTicket ticket);
}

// Concrete Handlers
public class Level1Support extends SupportHandler {
    public void handleRequest(SupportTicket ticket) {
        if (ticket.getSeverity() == Severity.LOW) {
            System.out.println("Level 1 handling: " + ticket);
        } else if (nextHandler != null) {
            nextHandler.handleRequest(ticket);
        }
    }
}

public class Level2Support extends SupportHandler {
    public void handleRequest(SupportTicket ticket) {
        if (ticket.getSeverity() == Severity.MEDIUM) {
            System.out.println("Level 2 handling: " + ticket);
        } else if (nextHandler != null) {
            nextHandler.handleRequest(ticket);
        }
    }
}

public class Level3Support extends SupportHandler {
    public void handleRequest(SupportTicket ticket) {
        System.out.println("Level 3 handling (escalated): " + ticket);
    }
}

// Setup chain
SupportHandler chain = new Level1Support();
chain.setNext(new Level2Support());
chain.getNext().setNext(new Level3Support());

// Use
chain.handleRequest(new SupportTicket("Password reset", Severity.LOW));
chain.handleRequest(new SupportTicket("Server down", Severity.HIGH));
```

**Modern Java Variant (functional)**:
```java
public interface Handler<T> {
    Optional<T> handle(Request request);
}

List<Handler<Response>> handlers = List.of(
    this::handleAuth,
    this::handleValidation,
    this::handleBusinessLogic
);

Optional<Response> result = handlers.stream()
    .map(h -> h.handle(request))
    .filter(Optional::isPresent)
    .findFirst()
    .orElse(Optional.empty());
```

**Consequences**:
- Reduced coupling (sender doesn't know who handles)
- Added flexibility in assigning responsibilities
- Receipt not guaranteed (might fall through chain)

**Related**: Composite (parent can act as successor)

---

### Command

**Intent**: Encapsulate request as object, letting you parameterize clients, queue or log requests, and support undoable operations.

**Also Known As**: Action, Transaction

**Problem**: Need to issue requests to objects without knowing the operation being requested or the receiver.

**When to Use**:
- Parameterize objects by action to perform (callbacks)
- Specify, queue, and execute requests at different times
- Support undo
- Support logging changes for crash recovery
- Structure system around high-level operations built on primitives

**Structure**:
```
Invoker                            Command
  - command: Command                 + execute()
                                     + undo()

Client ────► ConcreteCommand        Receiver
               - receiver              + action()
               - state
               + execute() { receiver.action() }
               + undo()
```

**Example**:
```java
// Command interface
public interface Command {
    void execute();
    void undo();
}

// Receiver
public class Light {
    private boolean on = false;

    public void turnOn() { on = true; System.out.println("Light on"); }
    public void turnOff() { on = false; System.out.println("Light off"); }
}

// Concrete Commands
public class LightOnCommand implements Command {
    private final Light light;

    public LightOnCommand(Light light) { this.light = light; }

    public void execute() { light.turnOn(); }
    public void undo() { light.turnOff(); }
}

public class LightOffCommand implements Command {
    private final Light light;

    public LightOffCommand(Light light) { this.light = light; }

    public void execute() { light.turnOff(); }
    public void undo() { light.turnOn(); }
}

// Invoker with undo support
public class RemoteControl {
    private Command command;
    private final Stack<Command> history = new Stack<>();

    public void setCommand(Command command) {
        this.command = command;
    }

    public void pressButton() {
        command.execute();
        history.push(command);
    }

    public void pressUndo() {
        if (!history.isEmpty()) {
            history.pop().undo();
        }
    }
}

// Usage
Light light = new Light();
RemoteControl remote = new RemoteControl();

remote.setCommand(new LightOnCommand(light));
remote.pressButton();  // Light on

remote.setCommand(new LightOffCommand(light));
remote.pressButton();  // Light off

remote.pressUndo();    // Light on
remote.pressUndo();    // Light off
```

**Macro Command**:
```java
public class MacroCommand implements Command {
    private final List<Command> commands;

    public MacroCommand(List<Command> commands) {
        this.commands = commands;
    }

    public void execute() {
        commands.forEach(Command::execute);
    }

    public void undo() {
        // Undo in reverse order
        ListIterator<Command> it = commands.listIterator(commands.size());
        while (it.hasPrevious()) {
            it.previous().undo();
        }
    }
}
```

**Consequences**:
- Decouples invoker from receiver
- Commands are first-class objects (can be manipulated and extended)
- Easy to add new commands
- Can assemble commands into composite commands

**Related**: Composite (macro commands), Memento (keep state for undo), Prototype (command that must be copied)

---

### Interpreter

**Intent**: Given a language, define representation for its grammar along with an interpreter that uses the representation to interpret sentences.

**Problem**: A particular kind of problem occurs often enough to warrant expressing as simple language. Grammar is simple and efficiency is not critical.

**When to Use**:
- Grammar is simple
- Efficiency is not critical
- Want to easily extend grammar

**Structure**:
```
AbstractExpression
  + interpret(Context)

TerminalExpression                 NonterminalExpression
  + interpret(Context)               - expressions: List<AbstractExpression>
                                     + interpret(Context)

Context
  - input, output
```

**Example**:
```java
// Context
public class Context {
    private final Map<String, Boolean> variables = new HashMap<>();

    public void assign(String var, boolean value) {
        variables.put(var, value);
    }

    public boolean lookup(String var) {
        return variables.get(var);
    }
}

// Abstract Expression
public interface BooleanExpression {
    boolean interpret(Context context);
}

// Terminal Expression
public class Variable implements BooleanExpression {
    private final String name;

    public Variable(String name) { this.name = name; }

    public boolean interpret(Context context) {
        return context.lookup(name);
    }
}

public class Constant implements BooleanExpression {
    private final boolean value;

    public Constant(boolean value) { this.value = value; }

    public boolean interpret(Context context) {
        return value;
    }
}

// Nonterminal Expressions
public class And implements BooleanExpression {
    private final BooleanExpression left, right;

    public And(BooleanExpression left, BooleanExpression right) {
        this.left = left;
        this.right = right;
    }

    public boolean interpret(Context context) {
        return left.interpret(context) && right.interpret(context);
    }
}

public class Or implements BooleanExpression {
    private final BooleanExpression left, right;

    public Or(BooleanExpression left, BooleanExpression right) {
        this.left = left;
        this.right = right;
    }

    public boolean interpret(Context context) {
        return left.interpret(context) || right.interpret(context);
    }
}

public class Not implements BooleanExpression {
    private final BooleanExpression expr;

    public Not(BooleanExpression expr) { this.expr = expr; }

    public boolean interpret(Context context) {
        return !expr.interpret(context);
    }
}

// Usage: (x AND y) OR (NOT z)
Context ctx = new Context();
ctx.assign("x", true);
ctx.assign("y", false);
ctx.assign("z", true);

BooleanExpression expr = new Or(
    new And(new Variable("x"), new Variable("y")),
    new Not(new Variable("z"))
);

System.out.println(expr.interpret(ctx));  // false
```

**Consequences**:
- Easy to change and extend grammar
- Easy to implement grammar
- Complex grammars hard to maintain
- Adding new ways to interpret expressions is easy

**Related**: Composite (abstract syntax tree), Flyweight (share terminal symbols), Iterator (traverse structure), Visitor (maintain behavior in one class)

---

### Iterator

**Intent**: Provide way to access elements of aggregate sequentially without exposing underlying representation.

**Also Known As**: Cursor

**Problem**: Need to access aggregate's contents without exposing internal structure. Want multiple traversals simultaneously.

**When to Use**:
- Access aggregate's contents without exposing representation
- Support multiple traversals
- Provide uniform interface for traversing different aggregates

**Structure**:
```
Iterator                           Aggregate
  + first()                          + createIterator(): Iterator
  + next()
  + isDone()                       ConcreteAggregate
  + currentItem()                    + createIterator()

ConcreteIterator
  - aggregate
  - current
```

**Example**:
```java
// Iterator interface
public interface Iterator<T> {
    boolean hasNext();
    T next();
}

// Aggregate interface
public interface Container<T> {
    Iterator<T> createIterator();
}

// Concrete Aggregate
public class NameRepository implements Container<String> {
    private String[] names = {"Robert", "John", "Julie", "Lora"};

    public Iterator<String> createIterator() {
        return new NameIterator();
    }

    // Concrete Iterator (inner class has access to names)
    private class NameIterator implements Iterator<String> {
        private int index = 0;

        public boolean hasNext() {
            return index < names.length;
        }

        public String next() {
            if (hasNext()) {
                return names[index++];
            }
            throw new NoSuchElementException();
        }
    }
}

// Usage
Container<String> repo = new NameRepository();
Iterator<String> iter = repo.createIterator();

while (iter.hasNext()) {
    System.out.println(iter.next());
}
```

**Modern Java**:
```java
// Java's built-in iteration
public class BookCollection implements Iterable<Book> {
    private List<Book> books = new ArrayList<>();

    public java.util.Iterator<Book> iterator() {
        return books.iterator();
    }
}

// Usage with for-each
for (Book book : bookCollection) {
    System.out.println(book);
}

// Streams
bookCollection.stream()
    .filter(b -> b.getYear() > 2000)
    .forEach(System.out::println);
```

**Consequences**:
- Supports variations in aggregate traversal
- Simplifies aggregate interface
- Multiple traversals can be in progress simultaneously
- In modern languages, usually built-in

**Related**: Composite (often used to traverse), Factory Method (polymorphic iterators), Memento (capture iteration state)

---

### Mediator

**Intent**: Define object that encapsulates how a set of objects interact. Promotes loose coupling by keeping objects from referring to each other explicitly.

**Problem**: Many objects communicate in complex ways. Each object knows about many others. System is hard to change.

**When to Use**:
- Objects communicate in well-defined but complex ways
- Reusing object is difficult because it refers to many others
- Behavior distributed between several classes should be customizable without subclassing

**Structure**:
```
Mediator                           Colleague
  + notify(sender, event)            - mediator: Mediator
                                     + operation()
ConcreteMediator
  - colleagueA                     ConcreteColleagueA
  - colleagueB                     ConcreteColleagueB
  + notify(sender, event)
```

**Example**:
```java
// Mediator interface
public interface DialogMediator {
    void notify(Component sender, String event);
}

// Concrete Mediator
public class AuthenticationDialog implements DialogMediator {
    private TextField usernameField;
    private TextField passwordField;
    private Checkbox rememberMe;
    private Button loginButton;

    public AuthenticationDialog() {
        usernameField = new TextField(this);
        passwordField = new TextField(this);
        rememberMe = new Checkbox(this);
        loginButton = new Button(this);
        loginButton.setEnabled(false);
    }

    public void notify(Component sender, String event) {
        if (sender == usernameField || sender == passwordField) {
            if (event.equals("textChanged")) {
                // Enable login if both fields have text
                loginButton.setEnabled(
                    !usernameField.getText().isEmpty() &&
                    !passwordField.getText().isEmpty()
                );
            }
        } else if (sender == loginButton && event.equals("click")) {
            // Perform login
            String username = usernameField.getText();
            String password = passwordField.getText();
            boolean remember = rememberMe.isChecked();
            authenticate(username, password, remember);
        }
    }
}

// Base Colleague
public abstract class Component {
    protected DialogMediator mediator;

    public Component(DialogMediator mediator) {
        this.mediator = mediator;
    }

    protected void changed(String event) {
        mediator.notify(this, event);
    }
}

// Concrete Colleagues
public class TextField extends Component {
    private String text = "";

    public TextField(DialogMediator mediator) { super(mediator); }

    public void setText(String text) {
        this.text = text;
        changed("textChanged");
    }

    public String getText() { return text; }
}

public class Button extends Component {
    private boolean enabled = true;

    public Button(DialogMediator mediator) { super(mediator); }

    public void click() {
        if (enabled) {
            changed("click");
        }
    }

    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
```

**Consequences**:
- Limits subclassing (localize behavior change)
- Decouples colleagues
- Simplifies object protocols (many-to-many to one-to-many)
- Abstracts how objects cooperate
- Centralizes control (mediator can become monolithic)

**Related**: Facade (simplifies interface but unidirectional), Observer (colleagues communicate via mediator by observing it)

---

### Memento

**Intent**: Without violating encapsulation, capture and externalize object's internal state so it can be restored later.

**Also Known As**: Token

**Problem**: Need to save and restore object state (undo, checkpoints) without exposing implementation.

**When to Use**:
- Snapshot of state must be saved for later restore
- Direct interface to obtaining state would expose implementation

**Structure**:
```
Originator                         Memento
  - state                            - state
  + createMemento(): Memento         + getState() [only to Originator]
  + restore(Memento)

Caretaker
  - memento: Memento
```

**Example**:
```java
// Memento - immutable snapshot
public final class EditorMemento {
    private final String content;
    private final int cursorPosition;
    private final String[] selection;

    EditorMemento(String content, int cursorPosition, String[] selection) {
        this.content = content;
        this.cursorPosition = cursorPosition;
        this.selection = selection != null ? selection.clone() : null;
    }

    // Package-private getters (only Originator should access)
    String getContent() { return content; }
    int getCursorPosition() { return cursorPosition; }
    String[] getSelection() { return selection != null ? selection.clone() : null; }
}

// Originator
public class Editor {
    private String content = "";
    private int cursorPosition = 0;
    private String[] selection;

    public void type(String text) {
        content = content.substring(0, cursorPosition) + text +
                  content.substring(cursorPosition);
        cursorPosition += text.length();
    }

    public void delete() {
        if (cursorPosition > 0) {
            content = content.substring(0, cursorPosition - 1) +
                      content.substring(cursorPosition);
            cursorPosition--;
        }
    }

    public EditorMemento save() {
        return new EditorMemento(content, cursorPosition, selection);
    }

    public void restore(EditorMemento memento) {
        content = memento.getContent();
        cursorPosition = memento.getCursorPosition();
        selection = memento.getSelection();
    }

    public String getContent() { return content; }
}

// Caretaker
public class History {
    private final Stack<EditorMemento> history = new Stack<>();
    private final Editor editor;

    public History(Editor editor) { this.editor = editor; }

    public void backup() {
        history.push(editor.save());
    }

    public void undo() {
        if (!history.isEmpty()) {
            editor.restore(history.pop());
        }
    }
}

// Usage
Editor editor = new Editor();
History history = new History(editor);

editor.type("Hello");
history.backup();

editor.type(" World");
history.backup();

editor.type("!");
System.out.println(editor.getContent());  // "Hello World!"

history.undo();
System.out.println(editor.getContent());  // "Hello World"

history.undo();
System.out.println(editor.getContent());  // "Hello"
```

**Consequences**:
- Preserves encapsulation boundaries
- Simplifies Originator (doesn't manage history)
- Using mementos might be expensive (if state is large)
- Defining narrow and wide interfaces (Caretaker vs Originator)
- Hidden costs in caring for mementos

**Related**: Command (commands can use memento for undo state), Iterator (memento can store iteration state)

---

### Observer

**Intent**: Define one-to-many dependency between objects so when one changes state, all dependents are notified and updated automatically.

**Also Known As**: Dependents, Publish-Subscribe

**Problem**: Need to maintain consistency between related objects without tight coupling.

**When to Use**:
- Abstraction has two aspects, one dependent on other
- Change to one object requires changing others (unknown how many)
- Object should notify unknown other objects

**Structure**:
```
Subject                            Observer
  - observers: List<Observer>        + update()
  + attach(Observer)
  + detach(Observer)               ConcreteObserver
  + notify()                         - subject
                                     - observerState
ConcreteSubject                      + update()
  - subjectState
  + getState()
  + setState()
```

**Example**:
```java
// Observer interface
public interface Observer {
    void update(String event, Object data);
}

// Subject
public class EventManager {
    private final Map<String, List<Observer>> listeners = new HashMap<>();

    public void subscribe(String eventType, Observer listener) {
        listeners.computeIfAbsent(eventType, k -> new ArrayList<>()).add(listener);
    }

    public void unsubscribe(String eventType, Observer listener) {
        List<Observer> users = listeners.get(eventType);
        if (users != null) {
            users.remove(listener);
        }
    }

    public void notify(String eventType, Object data) {
        List<Observer> users = listeners.get(eventType);
        if (users != null) {
            for (Observer listener : users) {
                listener.update(eventType, data);
            }
        }
    }
}

// Concrete Subject
public class Editor {
    private final EventManager events = new EventManager();
    private String content = "";

    public void subscribe(String eventType, Observer listener) {
        events.subscribe(eventType, listener);
    }

    public void openFile(String path) {
        content = readFile(path);
        events.notify("open", path);
    }

    public void saveFile() {
        writeFile(content);
        events.notify("save", content);
    }
}

// Concrete Observers
public class LoggingListener implements Observer {
    private final String logFile;

    public LoggingListener(String logFile) { this.logFile = logFile; }

    public void update(String eventType, Object data) {
        log(logFile, "Event: " + eventType + ", Data: " + data);
    }
}

public class EmailAlertsListener implements Observer {
    private final String email;

    public EmailAlertsListener(String email) { this.email = email; }

    public void update(String eventType, Object data) {
        if (eventType.equals("save")) {
            sendEmail(email, "File saved: " + data);
        }
    }
}

// Usage
Editor editor = new Editor();
editor.subscribe("open", new LoggingListener("log.txt"));
editor.subscribe("save", new EmailAlertsListener("admin@example.com"));

editor.openFile("test.txt");  // LoggingListener notified
editor.saveFile();            // Both listeners notified
```

**Java Built-in (deprecated but illustrative)**:
```java
// Using PropertyChangeSupport (bean pattern)
public class Stock {
    private PropertyChangeSupport support = new PropertyChangeSupport(this);
    private double price;

    public void addPropertyChangeListener(PropertyChangeListener l) {
        support.addPropertyChangeListener(l);
    }

    public void setPrice(double newPrice) {
        double oldPrice = this.price;
        this.price = newPrice;
        support.firePropertyChange("price", oldPrice, newPrice);
    }
}
```

**Consequences**:
- Abstract coupling between Subject and Observer
- Support for broadcast communication
- Unexpected updates (observers don't know about each other)
- Memory leaks if observers not properly removed

**Related**: Mediator (encapsulates communication), Singleton (subject often is)

---

### State

**Intent**: Allow object to alter behavior when internal state changes. Object will appear to change its class.

**Also Known As**: Objects for States

**Problem**: Object behavior depends on state, and must change at runtime. Conditionals everywhere.

**When to Use**:
- Object's behavior depends on state, must change at runtime
- Operations have large multipart conditional statements depending on state

**Structure**:
```
Context                            State
  - state: State                     + handle()
  + request()
  + setState(State)                ConcreteStateA
                                     + handle()

                                   ConcreteStateB
                                     + handle()
```

**Example**:
```java
// State interface
public interface State {
    void insertQuarter(VendingMachine machine);
    void ejectQuarter(VendingMachine machine);
    void turnCrank(VendingMachine machine);
    void dispense(VendingMachine machine);
}

// Concrete States
public class NoQuarterState implements State {
    public void insertQuarter(VendingMachine m) {
        System.out.println("Quarter inserted");
        m.setState(m.getHasQuarterState());
    }
    public void ejectQuarter(VendingMachine m) {
        System.out.println("No quarter to eject");
    }
    public void turnCrank(VendingMachine m) {
        System.out.println("No quarter, please insert");
    }
    public void dispense(VendingMachine m) {
        System.out.println("Please pay first");
    }
}

public class HasQuarterState implements State {
    public void insertQuarter(VendingMachine m) {
        System.out.println("Already have quarter");
    }
    public void ejectQuarter(VendingMachine m) {
        System.out.println("Quarter returned");
        m.setState(m.getNoQuarterState());
    }
    public void turnCrank(VendingMachine m) {
        System.out.println("Turning...");
        m.setState(m.getSoldState());
    }
    public void dispense(VendingMachine m) {
        System.out.println("Please turn crank");
    }
}

public class SoldState implements State {
    public void insertQuarter(VendingMachine m) {
        System.out.println("Please wait, dispensing");
    }
    public void ejectQuarter(VendingMachine m) {
        System.out.println("Too late, already turned");
    }
    public void turnCrank(VendingMachine m) {
        System.out.println("Already turned");
    }
    public void dispense(VendingMachine m) {
        m.releaseBall();
        if (m.getCount() > 0) {
            m.setState(m.getNoQuarterState());
        } else {
            System.out.println("Out of gumballs!");
            m.setState(m.getSoldOutState());
        }
    }
}

// Context
public class VendingMachine {
    private State noQuarterState;
    private State hasQuarterState;
    private State soldState;
    private State soldOutState;

    private State state;
    private int count;

    public VendingMachine(int count) {
        noQuarterState = new NoQuarterState();
        hasQuarterState = new HasQuarterState();
        soldState = new SoldState();
        soldOutState = new SoldOutState();

        this.count = count;
        state = count > 0 ? noQuarterState : soldOutState;
    }

    public void insertQuarter() { state.insertQuarter(this); }
    public void ejectQuarter() { state.ejectQuarter(this); }
    public void turnCrank() {
        state.turnCrank(this);
        state.dispense(this);
    }

    void setState(State state) { this.state = state; }
    void releaseBall() { if (count > 0) count--; }

    // Getters for states...
}
```

**Consequences**:
- Localizes state-specific behavior, partitions it for different states
- Makes state transitions explicit
- State objects can be shared (if no instance variables)
- Can result in many classes

**State vs Strategy**:
- **State**: Object appears to change class, states often know about each other
- **Strategy**: Client chooses algorithm, strategies are independent alternatives

**Related**: Flyweight (share state objects), Singleton (states often are)

---

### Strategy

**Intent**: Define family of algorithms, encapsulate each one, make them interchangeable. Let algorithm vary independently from clients.

**Also Known As**: Policy

**Problem**: Need to use different variants of algorithm. Don't want conditionals. Algorithms change frequently.

**When to Use**:
- Many related classes differ only in behavior
- Need different variants of an algorithm
- Algorithm uses data clients shouldn't know about
- Class defines many behaviors as multiple conditionals

**Structure**:
```
Context                            Strategy
  - strategy: Strategy               + algorithm()
  + contextInterface()
                                   ConcreteStrategyA
                                     + algorithm()

                                   ConcreteStrategyB
                                     + algorithm()
```

**Example**:
```java
// Strategy interface
public interface PaymentStrategy {
    void pay(int amount);
}

// Concrete Strategies
public class CreditCardPayment implements PaymentStrategy {
    private final String cardNumber;
    private final String cvv;

    public CreditCardPayment(String cardNumber, String cvv) {
        this.cardNumber = cardNumber;
        this.cvv = cvv;
    }

    public void pay(int amount) {
        System.out.println("Paid $" + amount + " with credit card " +
            cardNumber.substring(cardNumber.length() - 4));
    }
}

public class PayPalPayment implements PaymentStrategy {
    private final String email;

    public PayPalPayment(String email) {
        this.email = email;
    }

    public void pay(int amount) {
        System.out.println("Paid $" + amount + " via PayPal (" + email + ")");
    }
}

public class CryptoPayment implements PaymentStrategy {
    private final String walletAddress;

    public CryptoPayment(String walletAddress) {
        this.walletAddress = walletAddress;
    }

    public void pay(int amount) {
        System.out.println("Paid $" + amount + " in crypto to " +
            walletAddress.substring(0, 8) + "...");
    }
}

// Context
public class ShoppingCart {
    private final List<Item> items = new ArrayList<>();

    public void addItem(Item item) {
        items.add(item);
    }

    public int calculateTotal() {
        return items.stream().mapToInt(Item::getPrice).sum();
    }

    public void checkout(PaymentStrategy paymentStrategy) {
        int total = calculateTotal();
        paymentStrategy.pay(total);
    }
}

// Usage
ShoppingCart cart = new ShoppingCart();
cart.addItem(new Item("Book", 50));
cart.addItem(new Item("Pen", 10));

// Pay with credit card
cart.checkout(new CreditCardPayment("1234-5678-9012-3456", "123"));

// Or pay with PayPal
cart.checkout(new PayPalPayment("user@example.com"));

// Or pay with crypto
cart.checkout(new CryptoPayment("0x742d35Cc6634C0532925a3b844Bc9e7595f"));
```

**Lambda Variant (Java 8+)**:
```java
// Strategy as functional interface
@FunctionalInterface
public interface SortStrategy<T> {
    void sort(List<T> list);
}

// Usage with lambdas
SortStrategy<Integer> bubbleSort = list -> { /* bubble sort */ };
SortStrategy<Integer> quickSort = list -> { /* quick sort */ };
SortStrategy<Integer> builtIn = Collections::sort;

List<Integer> numbers = Arrays.asList(5, 2, 8, 1, 9);
quickSort.sort(numbers);
```

**Consequences**:
- Family of related algorithms
- Alternative to subclassing
- Eliminates conditional statements
- Choice of implementations
- Clients must be aware of different strategies
- Communication overhead between strategy and context

**Related**: Flyweight (strategies are good candidates for flyweights)

---

### Template Method

**Intent**: Define skeleton of algorithm in operation, deferring some steps to subclasses. Let subclasses redefine certain steps without changing algorithm's structure.

**Problem**: Two algorithms are almost identical, differing in a few steps. Duplication is bad.

**When to Use**:
- Implement invariant parts of algorithm once, leave variable parts to subclasses
- Common behavior among subclasses should be factored and localized
- Control subclass extensions (hooks at specific points)

**Structure**:
```
AbstractClass
  + templateMethod() {
      primitiveOperation1();
      primitiveOperation2();
      hook();
  }
  # primitiveOperation1()  // abstract
  # primitiveOperation2()  // abstract
  + hook() { }             // optional override

ConcreteClass
  # primitiveOperation1()
  # primitiveOperation2()
```

**Example**:
```java
// Abstract class with template method
public abstract class DataMiner {

    // Template method - defines the algorithm skeleton
    public final void mine(String path) {
        openFile(path);
        extractData();
        parseData();
        analyzeData();
        sendReport();
        closeFile();
    }

    // Steps that must be implemented by subclasses
    protected abstract void openFile(String path);
    protected abstract void extractData();
    protected abstract void closeFile();

    // Steps with default implementation
    protected void parseData() {
        System.out.println("Parsing data...");
    }

    // Hook - optional override
    protected void analyzeData() {
        // Default: do nothing
    }

    // Final step (can't be overridden)
    private void sendReport() {
        System.out.println("Sending report...");
    }
}

// Concrete implementations
public class PDFDataMiner extends DataMiner {
    protected void openFile(String path) {
        System.out.println("Opening PDF: " + path);
    }

    protected void extractData() {
        System.out.println("Extracting data from PDF...");
    }

    protected void closeFile() {
        System.out.println("Closing PDF");
    }

    @Override
    protected void analyzeData() {
        System.out.println("Analyzing PDF data with special rules...");
    }
}

public class CSVDataMiner extends DataMiner {
    protected void openFile(String path) {
        System.out.println("Opening CSV: " + path);
    }

    protected void extractData() {
        System.out.println("Extracting data from CSV rows...");
    }

    protected void closeFile() {
        System.out.println("Closing CSV");
    }
}

// Usage
DataMiner pdfMiner = new PDFDataMiner();
pdfMiner.mine("report.pdf");

DataMiner csvMiner = new CSVDataMiner();
csvMiner.mine("data.csv");
```

**Hollywood Principle**: "Don't call us, we'll call you." - high-level component calls low-level component, not vice versa.

**Consequences**:
- Fundamental technique for code reuse
- Leads to inverted control structure (Hollywood Principle)
- Template methods call: concrete operations, primitive operations (abstract), factory methods, hook operations
- Minimizes primitive operations a subclass must override

**Related**: Factory Method (often called by template methods), Strategy (uses delegation vs inheritance)

---

### Visitor

**Intent**: Represent operation to be performed on elements of an object structure. Define new operation without changing classes of elements.

**Problem**: Many distinct operations need to be performed on objects in object structure. Want to avoid "polluting" classes with these operations.

**When to Use**:
- Object structure has many classes with differing interfaces, want operations based on concrete class
- Many distinct operations on object structure, don't want to pollute classes
- Classes of object structure rarely change, but often define new operations

**Structure**:
```
Visitor                            Element
  + visitConcreteElementA(A)         + accept(Visitor)
  + visitConcreteElementB(B)

ConcreteVisitor1                   ConcreteElementA
  + visitConcreteElementA(A)         + accept(v) { v.visitConcreteElementA(this) }
  + visitConcreteElementB(B)         + operationA()

ConcreteVisitor2                   ConcreteElementB
  + visitConcreteElementA(A)         + accept(v) { v.visitConcreteElementB(this) }
  + visitConcreteElementB(B)         + operationB()
```

**Example**:
```java
// Element interface
public interface Shape {
    void accept(ShapeVisitor visitor);
}

// Concrete Elements
public class Circle implements Shape {
    private final double radius;

    public Circle(double radius) { this.radius = radius; }

    public double getRadius() { return radius; }

    public void accept(ShapeVisitor visitor) {
        visitor.visitCircle(this);
    }
}

public class Rectangle implements Shape {
    private final double width;
    private final double height;

    public Rectangle(double width, double height) {
        this.width = width;
        this.height = height;
    }

    public double getWidth() { return width; }
    public double getHeight() { return height; }

    public void accept(ShapeVisitor visitor) {
        visitor.visitRectangle(this);
    }
}

// Visitor interface
public interface ShapeVisitor {
    void visitCircle(Circle circle);
    void visitRectangle(Rectangle rectangle);
}

// Concrete Visitors - different operations
public class AreaCalculator implements ShapeVisitor {
    private double totalArea = 0;

    public void visitCircle(Circle circle) {
        totalArea += Math.PI * circle.getRadius() * circle.getRadius();
    }

    public void visitRectangle(Rectangle rectangle) {
        totalArea += rectangle.getWidth() * rectangle.getHeight();
    }

    public double getTotalArea() { return totalArea; }
}

public class DrawingVisitor implements ShapeVisitor {
    public void visitCircle(Circle circle) {
        System.out.println("Drawing circle with radius " + circle.getRadius());
    }

    public void visitRectangle(Rectangle rectangle) {
        System.out.println("Drawing rectangle " +
            rectangle.getWidth() + "x" + rectangle.getHeight());
    }
}

public class XMLExporter implements ShapeVisitor {
    private StringBuilder xml = new StringBuilder();

    public void visitCircle(Circle circle) {
        xml.append("<circle radius=\"").append(circle.getRadius()).append("\"/>\n");
    }

    public void visitRectangle(Rectangle rectangle) {
        xml.append("<rectangle width=\"").append(rectangle.getWidth())
           .append("\" height=\"").append(rectangle.getHeight()).append("\"/>\n");
    }

    public String getXML() { return xml.toString(); }
}

// Usage
List<Shape> shapes = Arrays.asList(
    new Circle(5),
    new Rectangle(4, 6),
    new Circle(3)
);

// Calculate total area
AreaCalculator areaCalc = new AreaCalculator();
shapes.forEach(s -> s.accept(areaCalc));
System.out.println("Total area: " + areaCalc.getTotalArea());

// Export to XML
XMLExporter exporter = new XMLExporter();
shapes.forEach(s -> s.accept(exporter));
System.out.println(exporter.getXML());
```

**Consequences**:
- Easy to add new operations (just add new Visitor)
- Gathers related operations (in visitor), separates unrelated (different visitors)
- Adding new ConcreteElement is hard (must update all visitors)
- Visiting across class hierarchies
- Accumulating state as visitor traverses

**Related**: Composite (visitors often applied over), Interpreter (visitor can apply operation over syntax tree)

---

## Quick Reference: Pattern Selection

```
PROBLEM                                    PATTERN
──────────────────────────────────────────────────────────────────────
Create objects without specifying class    Factory Method, Abstract Factory
Complex object with many parts             Builder
Need exactly one instance                  Singleton (use sparingly)
Create by cloning                          Prototype

Make incompatible interfaces work          Adapter
Separate abstraction from implementation   Bridge
Tree structures, uniform treatment         Composite
Add responsibilities dynamically           Decorator
Simplify complex subsystem                 Facade
Share many fine-grained objects            Flyweight
Control access to object                   Proxy

Give objects a chance to handle request    Chain of Responsibility
Encapsulate request as object              Command
Interpret a grammar                        Interpreter
Traverse collection                        Iterator
Centralize complex communication           Mediator
Capture object state for undo              Memento
Notify dependents of state change          Observer
Object changes behavior with state         State
Interchangeable algorithms                 Strategy
Algorithm skeleton with variable steps     Template Method
Add operations without changing classes    Visitor
```

---

## The GoF Test

Before implementing a pattern, ask:

1. **Is this solving a real problem?** Don't pattern for pattern's sake.
2. **Is this the simplest pattern that works?** Prefer simpler patterns.
3. **Have I considered composition over inheritance?** The GoF mantra.
4. **Does this add flexibility I actually need?** YAGNI still applies.
5. **Can others understand this?** Pattern should clarify, not obscure.

---

## Sources

- Gamma, Helm, Johnson, Vlissides, "Design Patterns: Elements of Reusable Object-Oriented Software" (1994)
- All 23 patterns with complete examples and structure

---

*"Program to an interface, not an implementation."* — Gang of Four
