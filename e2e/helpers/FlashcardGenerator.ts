/**
 * Generates unique flashcard content with timestamps to avoid duplicates
 */
export class FlashcardGenerator {
  private counter = 0;

  /**
   * Generates a unique flashcard with programming-related content
   */
  generateProgrammingFlashcard() {
    this.counter++;
    const timestamp = Date.now();
    const uniqueId = `${timestamp}_${this.counter}`;

    const topics = [
      {
        front: `What is a closure in JavaScript? [${uniqueId}]`,
        back: `A closure is a function that has access to variables in its outer (enclosing) function's scope, even after the outer function has returned. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `Explain the difference between let and const [${uniqueId}]`,
        back: `'let' allows reassignment of the variable, while 'const' creates a constant reference that cannot be reassigned. Both are block-scoped. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What is the purpose of async/await? [${uniqueId}]`,
        back: `async/await is syntactic sugar for working with Promises, making asynchronous code look and behave more like synchronous code. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What is hoisting in JavaScript? [${uniqueId}]`,
        back: `Hoisting is JavaScript's behavior of moving declarations to the top of their scope before code execution. Variables declared with 'var' and function declarations are hoisted. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `Explain event bubbling and capturing [${uniqueId}]`,
        back: `Event bubbling is when an event propagates from the target element up through its ancestors. Event capturing is the opposite - from the root down to the target. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What is the difference between == and ===? [${uniqueId}]`,
        back: `'==' performs type coercion before comparison, while '===' is a strict equality operator that compares both value and type without coercion. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What is a Promise in JavaScript? [${uniqueId}]`,
        back: `A Promise is an object representing the eventual completion or failure of an asynchronous operation. It can be in one of three states: pending, fulfilled, or rejected. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `Explain the concept of prototypal inheritance [${uniqueId}]`,
        back: `JavaScript objects inherit properties and methods from their prototype. Each object has an internal link to another object called its prototype, forming a prototype chain. Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What is the purpose of 'this' keyword? [${uniqueId}]`,
        back: `The 'this' keyword refers to the object that is executing the current function. Its value depends on how the function is called (context). Generated at ${new Date().toISOString()}.`,
      },
      {
        front: `What are arrow functions? [${uniqueId}]`,
        back: `Arrow functions are a shorter syntax for function expressions. They don't have their own 'this', 'arguments', 'super', or 'new.target' bindings. Generated at ${new Date().toISOString()}.`,
      },
    ];

    // Use modulo to cycle through topics if we generate more than available
    const index = (this.counter - 1) % topics.length;
    return topics[index];
  }

  /**
   * Generates a batch of unique flashcards
   */
  generateBatch(count: number) {
    return Array.from({ length: count }, () => this.generateProgrammingFlashcard());
  }

  /**
   * Generates a completely custom flashcard with unique identifiers
   */
  generateCustom(baseFront: string, baseBack: string) {
    this.counter++;
    const timestamp = Date.now();
    const uniqueId = `${timestamp}_${this.counter}`;

    return {
      front: `${baseFront} [${uniqueId}]`,
      back: `${baseBack} Generated at ${new Date().toISOString()}.`,
    };
  }

  /**
   * Resets the counter (useful for test isolation)
   */
  reset() {
    this.counter = 0;
  }
}
