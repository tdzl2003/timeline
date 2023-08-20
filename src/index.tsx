import { jsx, html } from 'mobxact';
import { Todo } from './widgets/todo';

const rootEl = document.createElement('div');
document.body.appendChild(rootEl);

const start = Date.now();
html.render(<Todo />, rootEl);

console.log(Date.now() - start);
