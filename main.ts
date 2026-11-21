// Push-optimal Sokoban solver, room by room (push-BFS per room).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const IN = process.env.MAKEFUN_INPUT_DIR ?? '/input';
const OUT = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const C1 = 250000;
const C2 = 100000;
const C3 = 3000000;
const D = [[0, -1, 'u'], [0, 1, 'd'], [-1, 0, 'l'], [1, 0, 'r']];
let spent = 0;
function parse(text) {
const rows = text.split('\n').filter((r) => r.length > 0);
const h = rows.length;
const w = Math.max(...rows.map((r) => r.length));
const wall = new Uint8Array(w * h).fill(1);
const goals = [];
const boxes = [];
let player = -1;
rows.forEach((row, y) => {
for (let x = 0; x < row.length; x++) {
const c = row[x];
const i = y * w + x;
if (c === '#') continue;
wall[i] = 0;
if (c === '.' || c === '*' || c === '+') goals.push(i);
if (c === '$' || c === '*') boxes.push(i);
if (c === '@' || c === '+') player = i;
}
});
for (let x = 0; x < w; x++) { wall[x] = 1; wall[(h - 1) * w + x] = 1; }
for (let y = 0; y < h; y++) { wall[y * w] = 1; wall[y * w + w - 1] = 1; }
boxes.sort((a, b) => a - b);
return { w, h, wall, goals, boxes, player };
}
function V(w, wall, goals) {
const live = new Uint8Array(wall.length);
const q = [...goals];
for (const g of goals) live[g] = 1;
for (let i = 0; i < q.length; i++) {
const x = q[i];
for (const [dx, dy] of D) {
const d = dy * w + dx;
const y = x - d;
if (!wall[y] && !wall[y - d] && !live[y]) {
live[y] = 1;
q.push(y);
}
}
}
return live;
}
function R(w, wall, occ, from, seen, stamp, stack) {
let low = from;
let n = 0;
stack[n++] = from;
seen[from] = stamp;
while (n > 0) {
const p = stack[--n];
if (p < low) low = p;
if (!wall[p - w] && !occ[p - w] && seen[p - w] !== stamp) { seen[p - w] = stamp; stack[n++] = p - w; }
if (!wall[p + w] && !occ[p + w] && seen[p + w] !== stamp) { seen[p + w] = stamp; stack[n++] = p + w; }
if (!wall[p - 1] && !occ[p - 1] && seen[p - 1] !== stamp) { seen[p - 1] = stamp; stack[n++] = p - 1; }
if (!wall[p + 1] && !occ[p + 1] && seen[p + 1] !== stamp) { seen[p + 1] = stamp; stack[n++] = p + 1; }
}
return low;
}
function F(w, wall, occ, goal, t) {
for (const a of [t, t - 1, t - w, t - w - 1]) {
const b = a + 1;
const c = a + w;
const d = c + 1;
if ((wall[a] || occ[a]) && (wall[b] || occ[b]) && (wall[c] || occ[c]) && (wall[d] || occ[d])
&& ((occ[a] && !goal[a]) || (occ[b] && !goal[b]) || (occ[c] && !goal[c]) || (occ[d] && !goal[d]))) return true;
}
return false;
}
function W(w, wall, occ, from, to) {
if (from === to) return '';
const prev = new Int32Array(wall.length).fill(-1);
const how = new Array(wall.length);
const q = [from];
prev[from] = from;
for (let i = 0; i < q.length; i++) {
const p = q[i];
if (p === to) break;
for (const [dx, dy, ch] of D) {
const n = p + dy * w + dx;
if (wall[n] || occ[n] || prev[n] !== -1) continue;
prev[n] = p;
how[n] = ch;
q.push(n);
}
}
if (prev[to] === -1) throw new Error('push square unreachable');
let s = '';
for (let p = to; p !== from; p = prev[p]) s = how[p] + s;
return s;
}
function B(w, wall, goals, boxes, player, cap) {
const size = wall.length;
const goal = new Uint8Array(size);
for (const g of goals) goal[g] = 1;
const live = V(w, wall, goals);
if (boxes.some((b) => !live[b])) return null;
const num = boxes.length <= 5;
const keyOf = num
? (bx, low) => { let k = low; for (const b of bx) k = k * size + b; return k; }
: (bx, low) => low + ':' + bx.join(',');
const occ = new Uint8Array(size);
const seen = new Int32Array(size);
const mark = new Int32Array(size);
const stack = new Int32Array(size);
let stamp = 0;
const Z = (bx) => bx.every((b) => goal[b]);
const A = [boxes.slice()];
const Y = [player];
const G = [-1];
const K = new Map();
for (const b of boxes) occ[b] = 1;
K.set(keyOf(boxes, R(w, wall, occ, player, seen, ++stamp, stack)), 0);
for (const b of boxes) occ[b] = 0;
let found = Z(boxes) ? 0 : -1;
for (let head = 0; found < 0 && head < A.length; head++) {
const bx = A[head];
for (const b of bx) occ[b] = 1;
R(w, wall, occ, Y[head], seen, ++stamp, stack);
const here = stamp;
for (let bi = 0; bi < bx.length && found < 0; bi++) {
const b = bx[bi];
for (let k = 0; k < 4 && found < 0; k++) {
const [dx, dy] = D[k];
const d = dy * w + dx;
const t = b + d;
if (seen[b - d] !== here || wall[t] || occ[t] || !live[t]) continue;
occ[b] = 0;
occ[t] = 1;
const frz = F(w, wall, occ, goal, t);
let key = -1;
let nb = null;
if (!frz) {
nb = bx.slice();
nb[bi] = t;
nb.sort((x, y) => x - y);
key = keyOf(nb, R(w, wall, occ, b, mark, ++stamp, stack));
}
occ[t] = 0;
occ[b] = 1;
if (frz) continue;
if (Z(nb)) {
K.set(key, A.length);
A.push(nb);
Y.push(b);
G.push(head);
found = A.length - 1;
break;
}
if (K.has(key)) continue;
if (A.length >= cap || ++spent > C3) return null;
K.set(key, A.length);
A.push(nb);
Y.push(b);
G.push(head);
}
}
for (const x of bx) occ[x] = 0;
}
if (found < 0) return null;
const path = [];
for (let s = found; s > 0; s = G[s]) path.push(s);
path.reverse();
let moves = '';
let pl = player;
let cur = boxes;
for (const s of path) {
const nx = A[s];
const from = cur.find((b) => !nx.includes(b));
const to = nx.find((b) => !cur.includes(b));
const d = to - from;
const dir = D.find(([dx, dy]) => dy * w + dx === d);
for (const b of cur) occ[b] = 1;
moves += W(w, wall, occ, pl, from - d);
for (const b of cur) occ[b] = 0;
moves += dir[2].toUpperCase();
pl = from;
cur = nx;
}
return { pushes: path.length, moves, player: pl };
}
function O(L) {
const { w, wall, goals, boxes, player } = L;
const live = V(w, wall, goals);
const row = Math.floor(player / w);
const cut = new Uint8Array(wall.length);
for (let i = row * w; i < (row + 1) * w; i++) if (!wall[i] && !live[i]) cut[i] = 1;
if (boxes.some((b) => cut[b])) return null;
const part = new Int32Array(wall.length).fill(-1);
const rooms = [];
for (let s = 0; s < wall.length; s++) {
if (wall[s] || cut[s] || part[s] >= 0) continue;
const squares = [s];
part[s] = rooms.length;
for (let i = 0; i < squares.length; i++) {
const p = squares[i];
for (const [dx, dy] of D) {
const q = p + dy * w + dx;
if (!wall[q] && !cut[q] && part[q] < 0) {
part[q] = rooms.length;
squares.push(q);
}
}
}
rooms.push({ squares, boxes: [], goals: [] });
}
for (const b of boxes) {
if (part[b] < 0) return null;
rooms[part[b]].boxes.push(b);
}
for (const g of goals) {
if (part[g] < 0) return null;
rooms[part[g]].goals.push(g);
}
if (rooms.some((r) => r.boxes.length !== r.goals.length)) return null;
return rooms.filter((r) => r.boxes.length > 0);
}
function H(L) {
const s = B(L.w, L.wall, L.goals, L.boxes, L.player, C2);
return s ? s.moves : '';
}
function S(L) {
const rooms = O(L);
if (!rooms) return H(L);
let player = L.player;
let moves = '';
for (const r of rooms) {
const wall = L.wall.slice();
for (const o of rooms) {
if (o === r) continue;
for (const b of o.done ? o.goals : o.boxes) wall[b] = 1;
}
const s = B(L.w, wall, r.goals, r.boxes, player, C1);
if (!s) return H(L);
moves += s.moves;
player = s.player;
r.done = true;
}
return moves;
}
for (const id of readdirSync(IN).sort()) {
let moves = '';
try {
moves = S(parse(readFileSync(join(IN, id, 'level.txt'), 'utf8')));
} catch {
moves = '';
}
mkdirSync(join(OUT, id), { recursive: true });
writeFileSync(join(OUT, id, 'solution.txt'), moves + '\n');
}