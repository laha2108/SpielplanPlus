'use strict';

const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const walk = require('acorn-walk');

const root = path.resolve(__dirname, '..');

const files = [
    ...fs
        .readdirSync(path.join(root, 'src'))
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(root, 'src', file)),

    path.join(root, 'content.js')
];

const defined = new Set();
const called = new Set();

for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');

    const ast = acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script'
    });

    walk.simple(ast, {
        AssignmentExpression(node) {
            const left = node.left;

            if (
                left.type === 'MemberExpression' &&
                !left.computed &&
                left.object.type === 'Identifier' &&
                left.object.name === 'H' &&
                left.property.type === 'Identifier'
            ) {
                defined.add(left.property.name);
            }
        },

        CallExpression(node) {
            const callee = node.callee;

            if (
                callee.type === 'MemberExpression' &&
                !callee.computed &&
                callee.object.type === 'Identifier' &&
                callee.object.name === 'H' &&
                callee.property.type === 'Identifier'
            ) {
                called.add(callee.property.name);
            }
        }
    });
}

const allowed = new Set([
    'api'
]);

const missing = [...called]
    .filter(name => !defined.has(name) && !allowed.has(name))
    .sort();

if (missing.length) {
    console.error(
        'Nicht definierte HSP-Funktionen:',
        missing.join(', ')
    );

    process.exit(1);
}

console.log(
    'Alle aufgerufenen HSP-Funktionen sind definiert.'
);