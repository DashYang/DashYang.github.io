/**
 * Parse a YAML scalar string into a JS value.
 * Supports quoted strings, booleans, numbers and inline arrays.
 *
 * @param {string} raw - Raw scalar text from YAML.
 * @returns {string | number | boolean | Array<unknown>} Parsed scalar value.
 *
 * @example
 * parseScalar('"hello"') // => 'hello'
 * parseScalar('42')        // => 42
 * parseScalar('[a, b]')    // => ['a', 'b']
 */
function parseScalar(raw) {
  const v = raw.trim();
  if (v === "") return "";
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map((x) => parseScalar(x.trim()));
  }
  return v;
}

/**
 * Parse a minimal YAML string into a plain JS object.
 * This lightweight parser supports nested objects, arrays and scalars used by this project.
 *
 * @param {string} input - YAML document text.
 * @returns {Record<string, unknown>} Parsed object.
 * @throws {Error} When YAML structure is invalid.
 *
 * @example
 * const doc = parseSimpleYaml('chat:\n  type: "group"\n  members: ["a", "b"]');
 * // => { chat: { type: 'group', members: ['a', 'b'] } }
 */
export function parseSimpleYaml(input) {
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  const root = {};
  const stack = [{ indent: -1, container: root, type: "object", lastKey: null }];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    if (!raw.trim() || raw.trim().startsWith("#")) continue;
    const indent = raw.match(/^\s*/)[0].length;
    const line = raw.trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1];

    if (line.startsWith("- ")) {
      const item = line.slice(2);
      if (current.type !== "array") {
        const parent = current.container;
        const key = current.lastKey;
        if (!key) throw new Error(`Invalid YAML list at line ${i + 1}`);
        parent[key] = [];
        const arrFrame = { indent: current.indent + 2, container: parent[key], type: "array", lastKey: null };
        stack.push(arrFrame);
      }
      const arr = stack[stack.length - 1].container;
      arr.push(parseScalar(item));
      continue;
    }

    const idx = line.indexOf(":");
    if (idx === -1) throw new Error(`Invalid YAML line ${i + 1}: ${line}`);

    const key = line.slice(0, idx).trim();
    const rest = line.slice(idx + 1).trim();

    if (rest === "|" || rest === ">") {
      const blockLines = [];
      let blockIndent = null;
      let j = i + 1;
      for (; j < lines.length; j += 1) {
        const blockRaw = lines[j];
        if (!blockRaw.trim()) {
          blockLines.push("");
          continue;
        }
        const blockLineIndent = blockRaw.match(/^\s*/)[0].length;
        if (blockLineIndent <= indent) break;
        if (blockIndent === null) blockIndent = blockLineIndent;
        blockLines.push(blockRaw.slice(Math.min(blockIndent, blockRaw.length)));
      }
      current.container[key] = rest === ">"
        ? blockLines.join("\n").replace(/\n(?!\n)/g, " ")
        : blockLines.join("\n");
      current.lastKey = key;
      i = j - 1;
      continue;
    }

    if (rest === "") {
      current.container[key] = {};
      stack.push({ indent, container: current.container[key], type: "object", lastKey: key });
      current.lastKey = key;
    } else {
      current.container[key] = parseScalar(rest);
      current.lastKey = key;
    }
  }

  return root;
}
