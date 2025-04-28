import tap from 'tap';
import { greet, add, subtract } from '../src/index.js';

// Test for greet function
tap.test('greet function', t => {
    t.equal(
        greet('World'),
        'Hello, World!',
        'Should greet the world correctly'
    );
    t.equal(greet('Alice'), 'Hello, Alice!', 'Should greet Alice correctly');
    t.end();
});

// Test for add function
tap.test('add function', t => {
    t.equal(add(2, 3), 5, '2 + 3 should equal 5');
    t.equal(add(-1, 1), 0, '-1 + 1 should equal 0');
    t.equal(add(0, 0), 0, '0 + 0 should equal 0');
    t.end();
});

// Test for subtract function
tap.test('subtract function', t => {
    t.equal(subtract(5, 3), 2, '5 - 3 should equal 2');
    t.equal(subtract(0, 5), -5, '0 - 5 should equal -5');
    t.equal(subtract(10, 10), 0, '10 - 10 should equal 0');
    t.end();
});
