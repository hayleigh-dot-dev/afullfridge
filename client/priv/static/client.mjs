// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  countLength() {
    let length5 = 0;
    for (let _ of this)
      length5++;
    return length5;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements2, tail) {
  return List.fromArray(elements2, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index3) {
    return this.buffer[index3];
  }
  // @internal
  floatAt(index3) {
    return byteArrayToFloat(this.buffer.slice(index3, index3 + 8));
  }
  // @internal
  intFromSlice(start4, end) {
    return byteArrayToInt(this.buffer.slice(start4, end));
  }
  // @internal
  binaryFromSlice(start4, end) {
    return new _BitArray(this.buffer.slice(start4, end));
  }
  // @internal
  sliceAfter(index3) {
    return new _BitArray(this.buffer.slice(index3));
  }
};
var UtfCodepoint = class {
  constructor(value3) {
    this.value = value3;
  }
};
function byteArrayToInt(byteArray) {
  byteArray = byteArray.reverse();
  let value3 = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value3 = value3 * 256 + byteArray[i];
  }
  return value3;
}
function byteArrayToFloat(byteArray) {
  return new Float64Array(byteArray.reverse().buffer)[0];
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a2 = values.pop();
    let b = values.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get3] = getters(a2);
    for (let k of keys2(a2)) {
      values.push(get3(a2, k), get3(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function makeError(variant, module, line, fn, message, extra) {
  let error2 = new globalThis.Error(message);
  error2.gleam_error = variant;
  error2.module = module;
  error2.line = line;
  error2.fn = fn;
  for (let k in extra)
    error2[k] = extra[k];
  return error2;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option, e) {
  if (option instanceof Some) {
    let a2 = option[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}
function from_result(result) {
  if (result.isOk()) {
    let a2 = result[0];
    return new Some(a2);
  } else {
    return new None();
  }
}
function unwrap(option, default$) {
  if (option instanceof Some) {
    let x = option[0];
    return x;
  } else {
    return default$;
  }
}
function map(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return new Some(fun(x));
  } else {
    return new None();
  }
}
function then$(option, fun) {
  if (option instanceof Some) {
    let x = option[0];
    return fun(x);
  } else {
    return new None();
  }
}
function or(first2, second2) {
  if (first2 instanceof Some) {
    return first2;
  } else {
    return second2;
  }
}

// build/dev/javascript/gleam_stdlib/gleam/regex.mjs
var Match = class extends CustomType {
  constructor(content2, submatches) {
    super();
    this.content = content2;
    this.submatches = submatches;
  }
};
var CompileError = class extends CustomType {
  constructor(error2, byte_index) {
    super();
    this.error = error2;
    this.byte_index = byte_index;
  }
};
var Options = class extends CustomType {
  constructor(case_insensitive, multi_line) {
    super();
    this.case_insensitive = case_insensitive;
    this.multi_line = multi_line;
  }
};
function compile(pattern, options) {
  return compile_regex(pattern, options);
}
function scan(regex, string3) {
  return regex_scan(regex, string3);
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function parse(string3) {
  return parse_int(string3);
}
function to_string2(x) {
  return to_string(x);
}

// build/dev/javascript/gleam_stdlib/gleam/pair.mjs
function second(pair) {
  let a2 = pair[1];
  return a2;
}
function map_first(pair, fun) {
  let a2 = pair[0];
  let b = pair[1];
  return [fun(a2), b];
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function count_length(loop$list, loop$count) {
  while (true) {
    let list2 = loop$list;
    let count = loop$count;
    if (list2.atLeastLength(1)) {
      let list$1 = list2.tail;
      loop$list = list$1;
      loop$count = count + 1;
    } else {
      return count;
    }
  }
}
function length(list2) {
  return count_length(list2, 0);
}
function do_reverse(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(xs) {
  return do_reverse(xs, toList([]));
}
function first(list2) {
  if (list2.hasLength(0)) {
    return new Error(void 0);
  } else {
    let x = list2.head;
    return new Ok(x);
  }
}
function do_filter(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let xs = list2.tail;
      let new_acc = (() => {
        let $ = fun(x);
        if ($) {
          return prepend(x, acc);
        } else {
          return acc;
        }
      })();
      loop$list = xs;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list2, predicate) {
  return do_filter(list2, predicate, toList([]));
}
function do_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let xs = list2.tail;
      loop$list = xs;
      loop$fun = fun;
      loop$acc = prepend(fun(x), acc);
    }
  }
}
function map2(list2, fun) {
  return do_map(list2, fun, toList([]));
}
function do_try_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let x = list2.head;
      let xs = list2.tail;
      let $ = fun(x);
      if ($.isOk()) {
        let y = $[0];
        loop$list = xs;
        loop$fun = fun;
        loop$acc = prepend(y, acc);
      } else {
        let error2 = $[0];
        return new Error(error2);
      }
    }
  }
}
function try_map(list2, fun) {
  return do_try_map(list2, fun, toList([]));
}
function do_take(loop$list, loop$n, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list2.hasLength(0)) {
        return reverse(acc);
      } else {
        let x = list2.head;
        let xs = list2.tail;
        loop$list = xs;
        loop$n = n - 1;
        loop$acc = prepend(x, acc);
      }
    }
  }
}
function take(list2, n) {
  return do_take(list2, n, toList([]));
}
function do_append(loop$first, loop$second) {
  while (true) {
    let first2 = loop$first;
    let second2 = loop$second;
    if (first2.hasLength(0)) {
      return second2;
    } else {
      let item = first2.head;
      let rest$1 = first2.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second2);
    }
  }
}
function append(first2, second2) {
  return do_append(reverse(first2), second2);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function do_concat(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list2 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list2, acc);
    }
  }
}
function concat(lists) {
  return do_concat(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let x = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}
function do_intersperse(loop$list, loop$separator, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let separator = loop$separator;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$separator = separator;
      loop$acc = prepend(x, prepend(separator, acc));
    }
  }
}
function intersperse(list2, elem) {
  if (list2.hasLength(0)) {
    return list2;
  } else if (list2.hasLength(1)) {
    return list2;
  } else {
    let x = list2.head;
    let rest$1 = list2.tail;
    return do_intersperse(rest$1, elem, toList([x]));
  }
}
function do_repeat(loop$a, loop$times, loop$acc) {
  while (true) {
    let a2 = loop$a;
    let times = loop$times;
    let acc = loop$acc;
    let $ = times <= 0;
    if ($) {
      return acc;
    } else {
      loop$a = a2;
      loop$times = times - 1;
      loop$acc = prepend(a2, acc);
    }
  }
}
function repeat(a2, times) {
  return do_repeat(a2, times, toList([]));
}
function key_set(list2, key2, value3) {
  if (list2.hasLength(0)) {
    return toList([[key2, value3]]);
  } else if (list2.atLeastLength(1) && isEqual(list2.head[0], key2)) {
    let k = list2.head[0];
    let rest$1 = list2.tail;
    return prepend([key2, value3], rest$1);
  } else {
    let first$1 = list2.head;
    let rest$1 = list2.tail;
    return prepend(first$1, key_set(rest$1, key2, value3));
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map3(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error2 = result[0];
    return new Error(fun(error2));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$2(result, fun) {
  return try$(result, fun);
}
function unwrap2(result, default$) {
  if (result.isOk()) {
    let v = result[0];
    return v;
  } else {
    return default$;
  }
}
function nil_error(result) {
  return map_error(result, (_) => {
    return void 0;
  });
}
function all(results) {
  return try_map(results, (x) => {
    return x;
  });
}

// build/dev/javascript/gleam_stdlib/gleam/string_builder.mjs
function from_strings(strings) {
  return concat2(strings);
}
function concat3(builders) {
  return concat2(builders);
}
function from_string(string3) {
  return identity(string3);
}
function to_string3(builder) {
  return identity(builder);
}
function split2(iodata, pattern) {
  return split(iodata, pattern);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function from(a2) {
  return identity(a2);
}
function dynamic(value3) {
  return new Ok(value3);
}
function string(data) {
  return decode_string(data);
}
function classify(data) {
  return classify_dynamic(data);
}
function int(data) {
  return decode_int(data);
}
function shallow_list(value3) {
  return decode_list(value3);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify(data), toList([]))])
      );
    } else {
      let decoder2 = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder2(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function all_errors(result) {
  if (result.isOk()) {
    return toList([]);
  } else {
    let errors = result[0];
    return errors;
  }
}
function decode1(constructor, t1) {
  return (value3) => {
    let $ = t1(value3);
    if ($.isOk()) {
      let a2 = $[0];
      return new Ok(constructor(a2));
    } else {
      let a2 = $;
      return new Error(all_errors(a2));
    }
  };
}
function push_path(error2, name) {
  let name$1 = from(name);
  let decoder2 = any(
    toList([string, (x) => {
      return map3(int(x), to_string2);
    }])
  );
  let name$2 = (() => {
    let $ = decoder2(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify(name$1), ">"]);
      let _pipe$1 = from_strings(_pipe);
      return to_string3(_pipe$1);
    }
  })();
  return error2.withFields({ path: prepend(name$2, error2.path) });
}
function list(decoder_type) {
  return (dynamic2) => {
    return try$(
      shallow_list(dynamic2),
      (list2) => {
        let _pipe = list2;
        let _pipe$1 = try_map(_pipe, decoder_type);
        return map_errors(
          _pipe$1,
          (_capture) => {
            return push_path(_capture, "*");
          }
        );
      }
    );
  };
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map2(_capture, f);
    }
  );
}
function field(name, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name);
          }
        );
      }
    );
  };
}
function optional_field(name, inner_type) {
  return (value3) => {
    return try$(
      decode_field(value3, name),
      (maybe_inner) => {
        if (maybe_inner instanceof None) {
          return new Ok(new None());
        } else {
          let dynamic_inner = maybe_inner[0];
          let _pipe = dynamic_inner;
          let _pipe$1 = decode_option(_pipe, inner_type);
          return map_errors(
            _pipe$1,
            (_capture) => {
              return push_path(_capture, name);
            }
          );
        }
      }
    );
  };
}
function decode2(constructor, t1, t2) {
  return (value3) => {
    let $ = t1(value3);
    let $1 = t2(value3);
    if ($.isOk() && $1.isOk()) {
      let a2 = $[0];
      let b = $1[0];
      return new Ok(constructor(a2, b));
    } else {
      let a2 = $;
      let b = $1;
      return new Error(concat(toList([all_errors(a2), all_errors(b)])));
    }
  };
}
function decode3(constructor, t1, t2, t3) {
  return (value3) => {
    let $ = t1(value3);
    let $1 = t2(value3);
    let $2 = t3(value3);
    if ($.isOk() && $1.isOk() && $2.isOk()) {
      let a2 = $[0];
      let b = $1[0];
      let c = $2[0];
      return new Ok(constructor(a2, b, c));
    } else {
      let a2 = $;
      let b = $1;
      let c = $2;
      return new Error(
        concat(toList([all_errors(a2), all_errors(b), all_errors(c)]))
      );
    }
  };
}
function decode4(constructor, t1, t2, t3, t4) {
  return (x) => {
    let $ = t1(x);
    let $1 = t2(x);
    let $2 = t3(x);
    let $3 = t4(x);
    if ($.isOk() && $1.isOk() && $2.isOk() && $3.isOk()) {
      let a2 = $[0];
      let b = $1[0];
      let c = $2[0];
      let d = $3[0];
      return new Ok(constructor(a2, b, c, d));
    } else {
      let a2 = $;
      let b = $1;
      let c = $2;
      let d = $3;
      return new Error(
        concat(
          toList([all_errors(a2), all_errors(b), all_errors(c), all_errors(d)])
        )
      );
    }
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root2, shift, hash, key2, val, addedLeaf) {
  switch (root2.type) {
    case ARRAY_NODE:
      return assocArray(root2, shift, hash, key2, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root2, shift, hash, key2, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root2, shift, hash, key2, val, addedLeaf);
  }
}
function assocArray(root2, shift, hash, key2, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size + 1,
      array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key2, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key2, node.k)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: ARRAY_NODE,
        size: root2.size,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key2, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
  if (n === node) {
    return root2;
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function assocIndex(root2, shift, hash, key2, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root2.bitmap, bit);
  if ((root2.bitmap & bit) !== 0) {
    const node = root2.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key2, val, addedLeaf);
      if (n === node) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key2, nodeKey)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key2,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key2, val)
      )
    };
  } else {
    const n = root2.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key2, val, addedLeaf);
      let j = 0;
      let bitmap = root2.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root2.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root2.array, idx, {
        type: ENTRY,
        k: key2,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root2, shift, hash, key2, val, addedLeaf) {
  if (hash === root2.hash) {
    const idx = collisionIndexOf(root2, key2);
    if (idx !== -1) {
      const entry = root2.array[idx];
      if (entry.v === val) {
        return root2;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key2, v: val })
      };
    }
    const size = root2.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root2.array, size, { type: ENTRY, k: key2, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root2.hash, shift),
      array: [root2]
    },
    shift,
    hash,
    key2,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root2, key2) {
  const size = root2.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key2, root2.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root2, shift, hash, key2) {
  switch (root2.type) {
    case ARRAY_NODE:
      return findArray(root2, shift, hash, key2);
    case INDEX_NODE:
      return findIndex(root2, shift, hash, key2);
    case COLLISION_NODE:
      return findCollision(root2, key2);
  }
}
function findArray(root2, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root2, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key2);
  }
  if (isEqual(key2, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root2, key2) {
  const idx = collisionIndexOf(root2, key2);
  if (idx < 0) {
    return void 0;
  }
  return root2.array[idx];
}
function without(root2, shift, hash, key2) {
  switch (root2.type) {
    case ARRAY_NODE:
      return withoutArray(root2, shift, hash, key2);
    case INDEX_NODE:
      return withoutIndex(root2, shift, hash, key2);
    case COLLISION_NODE:
      return withoutCollision(root2, key2);
  }
}
function withoutArray(root2, shift, hash, key2) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return root2;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key2)) {
      return root2;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root2;
    }
  }
  if (n === void 0) {
    if (root2.size <= MIN_ARRAY_NODE) {
      const arr = root2.array;
      const out = new Array(root2.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root2.size - 1,
      array: cloneAndSet(root2.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function withoutIndex(root2, shift, hash, key2) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return root2;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key2);
    if (n === node) {
      return root2;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  if (isEqual(key2, node.k)) {
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  return root2;
}
function withoutCollision(root2, key2) {
  const idx = collisionIndexOf(root2, key2);
  if (idx < 0) {
    return root2;
  }
  if (root2.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root2.hash,
    array: spliceOut(root2.array, idx)
  };
}
function forEach(root2, fn) {
  if (root2 === void 0) {
    return;
  }
  const items = root2.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root2, size) {
    this.root = root2;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key2, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key2), key2);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key2, val) {
    const addedLeaf = { val: false };
    const root2 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root2, 0, getHash(key2), key2, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key2) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key2), key2);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key2) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key2), key2) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function parse_int(value3) {
  if (/^[-+]?(\d+)$/.test(value3)) {
    return new Ok(parseInt(value3));
  } else {
    return new Error(Nil);
  }
}
function to_string(term) {
  return term.toString();
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string3.match(/./gsu));
  }
}
function graphemes_iterator(string3) {
  if (Intl && Intl.Segmenter) {
    return new Intl.Segmenter().segment(string3)[Symbol.iterator]();
  }
}
function pop_grapheme(string3) {
  let first2;
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    first2 = iterator.next().value?.segment;
  } else {
    first2 = string3.match(/./su)?.[0];
  }
  if (first2) {
    return new Ok([first2, string3.slice(first2.length)]);
  } else {
    return new Error(Nil);
  }
}
function lowercase(string3) {
  return string3.toLowerCase();
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function join(xs, separator) {
  const iterator = xs[Symbol.iterator]();
  let result = iterator.next().value || "";
  let current = iterator.next();
  while (!current.done) {
    result = result + separator + current.value;
    current = iterator.next();
  }
  return result;
}
function concat2(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
function starts_with(haystack, needle) {
  return haystack.startsWith(needle);
}
function print_debug(string3) {
  if (typeof process === "object" && process.stderr?.write) {
    process.stderr.write(string3 + "\n");
  } else if (typeof Deno === "object") {
    Deno.stderr.writeSync(new TextEncoder().encode(string3 + "\n"));
  } else {
    console.log(string3);
  }
}
function compile_regex(pattern, options) {
  try {
    let flags = "gu";
    if (options.case_insensitive)
      flags += "i";
    if (options.multi_line)
      flags += "m";
    return new Ok(new RegExp(pattern, flags));
  } catch (error2) {
    const number = (error2.columnNumber || 0) | 0;
    return new Error(new CompileError(error2.message, number));
  }
}
function regex_scan(regex, string3) {
  const matches = Array.from(string3.matchAll(regex)).map((match) => {
    const content2 = match[0];
    const submatches = [];
    for (let n = match.length - 1; n > 0; n--) {
      if (match[n]) {
        submatches[n - 1] = new Some(match[n]);
        continue;
      }
      if (submatches.length > 0) {
        submatches[n - 1] = new None();
      }
    }
    return new Match(content2, List.fromArray(submatches));
  });
  return List.fromArray(matches);
}
function map_get(map6, key2) {
  const value3 = map6.get(key2, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function unsafe_percent_decode(string3) {
  return decodeURIComponent((string3 || "").replace("+", " "));
}
function percent_encode(string3) {
  return encodeURIComponent(string3);
}
function parse_query(query) {
  try {
    const pairs = [];
    for (const section of query.split("&")) {
      const [key2, value3] = section.split("=");
      if (!key2)
        continue;
      pairs.push([unsafe_percent_decode(key2), unsafe_percent_decode(value3)]);
    }
    return new Ok(List.fromArray(pairs));
  } catch {
    return new Error(Nil);
  }
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_list(data) {
  if (Array.isArray(data)) {
    return new Ok(List.fromArray(data));
  }
  return data instanceof List ? new Ok(data) : decoder_error("List", data);
}
function decode_option(data, decoder2) {
  if (data === null || data === void 0 || data instanceof None)
    return new Ok(new None());
  if (data instanceof Some)
    data = data[0];
  const result = decoder2(data);
  if (result.isOk()) {
    return new Ok(new Some(result[0]));
  } else {
    return result;
  }
}
function decode_field(value3, name) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name, not_a_map_error);
  }
}
function try_get_field(value3, field3, or_else) {
  try {
    return field3 in value3 ? new Ok(new Some(value3[field3])) : or_else();
  } catch {
    return or_else();
  }
}
function inspect(v) {
  const t = typeof v;
  if (v === true)
    return "True";
  if (v === false)
    return "False";
  if (v === null)
    return "//js(null)";
  if (v === void 0)
    return "Nil";
  if (t === "string")
    return JSON.stringify(v);
  if (t === "bigint" || t === "number")
    return v.toString();
  if (Array.isArray(v))
    return `#(${v.map(inspect).join(", ")})`;
  if (v instanceof List)
    return inspectList(v);
  if (v instanceof UtfCodepoint)
    return inspectUtfCodepoint(v);
  if (v instanceof BitArray)
    return inspectBitArray(v);
  if (v instanceof CustomType)
    return inspectCustomType(v);
  if (v instanceof Dict)
    return inspectDict(v);
  if (v instanceof Set)
    return `//js(Set(${[...v].map(inspect).join(", ")}))`;
  if (v instanceof RegExp)
    return `//js(${v})`;
  if (v instanceof Date)
    return `//js(Date("${v.toISOString()}"))`;
  if (v instanceof Function) {
    const args = [];
    for (const i of Array(v.length).keys())
      args.push(String.fromCharCode(i + 97));
    return `//fn(${args.join(", ")}) { ... }`;
  }
  return inspectObject(v);
}
function inspectDict(map6) {
  let body = "dict.from_list([";
  let first2 = true;
  map6.forEach((value3, key2) => {
    if (!first2)
      body = body + ", ";
    body = body + "#(" + inspect(key2) + ", " + inspect(value3) + ")";
    first2 = false;
  });
  return body + "])";
}
function inspectObject(v) {
  const name = Object.getPrototypeOf(v)?.constructor?.name || "Object";
  const props = [];
  for (const k of Object.keys(v)) {
    props.push(`${inspect(k)}: ${inspect(v[k])}`);
  }
  const body = props.length ? " " + props.join(", ") + " " : "";
  const head = name === "Object" ? "" : name + " ";
  return `//js(${head}{${body}})`;
}
function inspectCustomType(record) {
  const props = Object.keys(record).map((label2) => {
    const value3 = inspect(record[label2]);
    return isNaN(parseInt(label2)) ? `${label2}: ${value3}` : value3;
  }).join(", ");
  return props ? `${record.constructor.name}(${props})` : record.constructor.name;
}
function inspectList(list2) {
  return `[${list2.toArray().map(inspect).join(", ")}]`;
}
function inspectBitArray(bits) {
  return `<<${Array.from(bits.buffer).join(", ")}>>`;
}
function inspectUtfCodepoint(codepoint2) {
  return `//utfcodepoint(${String.fromCodePoint(codepoint2.value)})`;
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function lowercase2(string3) {
  return lowercase(string3);
}
function starts_with2(string3, prefix) {
  return starts_with(string3, prefix);
}
function concat4(strings) {
  let _pipe = strings;
  let _pipe$1 = from_strings(_pipe);
  return to_string3(_pipe$1);
}
function join2(strings, separator) {
  return join(strings, separator);
}
function pop_grapheme2(string3) {
  return pop_grapheme(string3);
}
function split3(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = from_string(_pipe);
    let _pipe$2 = split2(_pipe$1, substring);
    return map2(_pipe$2, to_string3);
  }
}
function inspect2(term) {
  let _pipe = inspect(term);
  return to_string3(_pipe);
}

// build/dev/javascript/gleam_stdlib/gleam/io.mjs
function debug(term) {
  let _pipe = term;
  let _pipe$1 = inspect2(_pipe);
  print_debug(_pipe$1);
  return term;
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }
};
function regex_submatches(pattern, string3) {
  let _pipe = pattern;
  let _pipe$1 = compile(_pipe, new Options(true, false));
  let _pipe$2 = nil_error(_pipe$1);
  let _pipe$3 = map3(
    _pipe$2,
    (_capture) => {
      return scan(_capture, string3);
    }
  );
  let _pipe$4 = try$(_pipe$3, first);
  let _pipe$5 = map3(_pipe$4, (m) => {
    return m.submatches;
  });
  return unwrap2(_pipe$5, toList([]));
}
function noneify_query(x) {
  if (x instanceof None) {
    return new None();
  } else {
    let x$1 = x[0];
    let $ = pop_grapheme2(x$1);
    if ($.isOk() && $[0][0] === "?") {
      let query = $[0][1];
      return new Some(query);
    } else {
      return new None();
    }
  }
}
function noneify_empty_string(x) {
  if (x instanceof Some && x[0] === "") {
    return new None();
  } else if (x instanceof None) {
    return new None();
  } else {
    return x;
  }
}
function extra_required(loop$list, loop$remaining) {
  while (true) {
    let list2 = loop$list;
    let remaining = loop$remaining;
    if (remaining === 0) {
      return 0;
    } else if (list2.hasLength(0)) {
      return remaining;
    } else {
      let xs = list2.tail;
      loop$list = xs;
      loop$remaining = remaining - 1;
    }
  }
}
function pad_list(list2, size) {
  let _pipe = list2;
  return append(
    _pipe,
    repeat(new None(), extra_required(list2, size))
  );
}
function split_authority(authority) {
  let $ = unwrap(authority, "");
  if ($ === "") {
    return [new None(), new None(), new None()];
  } else if ($ === "//") {
    return [new None(), new Some(""), new None()];
  } else {
    let authority$1 = $;
    let matches = (() => {
      let _pipe = "^(//)?((.*)@)?(\\[[a-zA-Z0-9:.]*\\]|[^:]*)(:(\\d*))?";
      let _pipe$1 = regex_submatches(_pipe, authority$1);
      return pad_list(_pipe$1, 6);
    })();
    if (matches.hasLength(6)) {
      let userinfo = matches.tail.tail.head;
      let host = matches.tail.tail.tail.head;
      let port = matches.tail.tail.tail.tail.tail.head;
      let userinfo$1 = noneify_empty_string(userinfo);
      let host$1 = noneify_empty_string(host);
      let port$1 = (() => {
        let _pipe = port;
        let _pipe$1 = unwrap(_pipe, "");
        let _pipe$2 = parse(_pipe$1);
        return from_result(_pipe$2);
      })();
      return [userinfo$1, host$1, port$1];
    } else {
      return [new None(), new None(), new None()];
    }
  }
}
function do_parse(uri_string) {
  let pattern = "^(([a-z][a-z0-9\\+\\-\\.]*):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#.*)?";
  let matches = (() => {
    let _pipe = pattern;
    let _pipe$1 = regex_submatches(_pipe, uri_string);
    return pad_list(_pipe$1, 8);
  })();
  let $ = (() => {
    if (matches.hasLength(8)) {
      let scheme2 = matches.tail.head;
      let authority_with_slashes = matches.tail.tail.head;
      let path2 = matches.tail.tail.tail.tail.head;
      let query_with_question_mark = matches.tail.tail.tail.tail.tail.head;
      let fragment2 = matches.tail.tail.tail.tail.tail.tail.tail.head;
      return [
        scheme2,
        authority_with_slashes,
        path2,
        query_with_question_mark,
        fragment2
      ];
    } else {
      return [new None(), new None(), new None(), new None(), new None()];
    }
  })();
  let scheme = $[0];
  let authority = $[1];
  let path = $[2];
  let query = $[3];
  let fragment = $[4];
  let scheme$1 = noneify_empty_string(scheme);
  let path$1 = unwrap(path, "");
  let query$1 = noneify_query(query);
  let $1 = split_authority(authority);
  let userinfo = $1[0];
  let host = $1[1];
  let port = $1[2];
  let fragment$1 = (() => {
    let _pipe = fragment;
    let _pipe$1 = to_result(_pipe, void 0);
    let _pipe$2 = try$(_pipe$1, pop_grapheme2);
    let _pipe$3 = map3(_pipe$2, second);
    return from_result(_pipe$3);
  })();
  let scheme$2 = (() => {
    let _pipe = scheme$1;
    let _pipe$1 = noneify_empty_string(_pipe);
    return map(_pipe$1, lowercase2);
  })();
  return new Ok(
    new Uri(scheme$2, userinfo, host, port, path$1, query$1, fragment$1)
  );
}
function parse2(uri_string) {
  return do_parse(uri_string);
}
function parse_query2(query) {
  return parse_query(query);
}
function percent_encode2(value3) {
  return percent_encode(value3);
}
function query_pair(pair) {
  return from_strings(
    toList([percent_encode2(pair[0]), "=", percent_encode2(pair[1])])
  );
}
function query_to_string(query) {
  let _pipe = query;
  let _pipe$1 = map2(_pipe, query_pair);
  let _pipe$2 = intersperse(_pipe$1, from_string("&"));
  let _pipe$3 = concat3(_pipe$2);
  return to_string3(_pipe$3);
}
function do_remove_dot_segments(loop$input, loop$accumulator) {
  while (true) {
    let input3 = loop$input;
    let accumulator = loop$accumulator;
    if (input3.hasLength(0)) {
      return reverse(accumulator);
    } else {
      let segment = input3.head;
      let rest = input3.tail;
      let accumulator$1 = (() => {
        if (segment === "") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".." && accumulator.hasLength(0)) {
          return toList([]);
        } else if (segment === ".." && accumulator.atLeastLength(1)) {
          let accumulator$12 = accumulator.tail;
          return accumulator$12;
        } else {
          let segment$1 = segment;
          let accumulator$12 = accumulator;
          return prepend(segment$1, accumulator$12);
        }
      })();
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input3) {
  return do_remove_dot_segments(input3, toList([]));
}
function path_segments(path) {
  return remove_dot_segments(split3(path, "/"));
}
function to_string4(uri) {
  let parts = (() => {
    let $ = uri.fragment;
    if ($ instanceof Some) {
      let fragment = $[0];
      return toList(["#", fragment]);
    } else {
      return toList([]);
    }
  })();
  let parts$1 = (() => {
    let $ = uri.query;
    if ($ instanceof Some) {
      let query = $[0];
      return prepend("?", prepend(query, parts));
    } else {
      return parts;
    }
  })();
  let parts$2 = prepend(uri.path, parts$1);
  let parts$3 = (() => {
    let $ = uri.host;
    let $1 = starts_with2(uri.path, "/");
    if ($ instanceof Some && !$1 && $[0] !== "") {
      let host = $[0];
      return prepend("/", parts$2);
    } else {
      return parts$2;
    }
  })();
  let parts$4 = (() => {
    let $ = uri.host;
    let $1 = uri.port;
    if ($ instanceof Some && $1 instanceof Some) {
      let port = $1[0];
      return prepend(":", prepend(to_string2(port), parts$3));
    } else {
      return parts$3;
    }
  })();
  let parts$5 = (() => {
    let $ = uri.scheme;
    let $1 = uri.userinfo;
    let $2 = uri.host;
    if ($ instanceof Some && $1 instanceof Some && $2 instanceof Some) {
      let s = $[0];
      let u = $1[0];
      let h = $2[0];
      return prepend(
        s,
        prepend(
          "://",
          prepend(u, prepend("@", prepend(h, parts$4)))
        )
      );
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof Some) {
      let s = $[0];
      let h = $2[0];
      return prepend(s, prepend("://", prepend(h, parts$4)));
    } else if ($ instanceof Some && $1 instanceof Some && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof Some && $1 instanceof None && $2 instanceof None) {
      let s = $[0];
      return prepend(s, prepend(":", parts$4));
    } else if ($ instanceof None && $1 instanceof None && $2 instanceof Some) {
      let h = $2[0];
      return prepend("//", prepend(h, parts$4));
    } else {
      return parts$4;
    }
  })();
  return concat4(parts$5);
}
function drop_last(elements2) {
  return take(elements2, length(elements2) - 1);
}
function join_segments(segments) {
  return join2(prepend("", segments), "/");
}
function merge(base, relative2) {
  if (base instanceof Uri && base.scheme instanceof Some && base.host instanceof Some) {
    if (relative2 instanceof Uri && relative2.host instanceof Some) {
      let path = (() => {
        let _pipe = split3(relative2.path, "/");
        let _pipe$1 = remove_dot_segments(_pipe);
        return join_segments(_pipe$1);
      })();
      let resolved = new Uri(
        or(relative2.scheme, base.scheme),
        new None(),
        relative2.host,
        or(relative2.port, base.port),
        path,
        relative2.query,
        relative2.fragment
      );
      return new Ok(resolved);
    } else {
      let $ = (() => {
        let $1 = relative2.path;
        if ($1 === "") {
          return [base.path, or(relative2.query, base.query)];
        } else {
          let path_segments$1 = (() => {
            let $2 = starts_with2(relative2.path, "/");
            if ($2) {
              return split3(relative2.path, "/");
            } else {
              let _pipe = split3(base.path, "/");
              let _pipe$1 = drop_last(_pipe);
              return append(_pipe$1, split3(relative2.path, "/"));
            }
          })();
          let path = (() => {
            let _pipe = path_segments$1;
            let _pipe$1 = remove_dot_segments(_pipe);
            return join_segments(_pipe$1);
          })();
          return [path, relative2.query];
        }
      })();
      let new_path = $[0];
      let new_query = $[1];
      let resolved = new Uri(
        base.scheme,
        new None(),
        base.host,
        base.port,
        new_path,
        new_query,
        relative2.fragment
      );
      return new Ok(resolved);
    }
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function json_to_string(json) {
  return JSON.stringify(json);
}
function object(entries) {
  return Object.fromEntries(entries);
}
function identity2(x) {
  return x;
}
function array(list2) {
  return list2.toArray();
}
function do_null() {
  return null;
}
function decode(string3) {
  try {
    const result = JSON.parse(string3);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string3));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string3) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string3.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(byte, position) {
    super();
    this.byte = byte;
    this.position = position;
  }
};
var UnexpectedSequence = class extends CustomType {
  constructor(byte, position) {
    super();
    this.byte = byte;
    this.position = position;
  }
};
var UnexpectedFormat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_decode(json, decoder2) {
  return then$2(
    decode(json),
    (dynamic_value) => {
      let _pipe = decoder2(dynamic_value);
      return map_error(
        _pipe,
        (var0) => {
          return new UnexpectedFormat(var0);
        }
      );
    }
  );
}
function decode5(json, decoder2) {
  return do_decode(json, decoder2);
}
function to_string6(json) {
  return json_to_string(json);
}
function string2(input3) {
  return identity2(input3);
}
function null$() {
  return do_null();
}
function object2(entries) {
  return object(entries);
}
function preprocessed_array(from3) {
  return array(from3);
}
function array2(entries, inner_type) {
  let _pipe = entries;
  let _pipe$1 = map2(_pipe, inner_type);
  return preprocessed_array(_pipe$1);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all2) {
    super();
    this.all = all2;
  }
};
function from2(effect) {
  return new Effect(toList([(dispatch, _) => {
    return effect(dispatch);
  }]));
}
function none() {
  return new Effect(toList([]));
}
function batch(effects) {
  return new Effect(
    fold(
      effects,
      toList([]),
      (b, _use1) => {
        let a2 = _use1.all;
        return append(b, a2);
      }
    )
  );
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content2) {
    super();
    this.content = content2;
  }
};
var Element = class extends CustomType {
  constructor(key2, namespace, tag2, attrs, children, self_closing, void$) {
    super();
    this.key = key2;
    this.namespace = namespace;
    this.tag = tag2;
    this.attrs = attrs;
    this.children = children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name, value3) {
  return new Attribute(name, from(value3), false);
}
function property(name, value3) {
  return new Attribute(name, from(value3), true);
}
function on(name, handler) {
  return new Event("on" + name, handler);
}
function class$(name) {
  return attribute("class", name);
}
function id(name) {
  return attribute("id", name);
}
function type_(name) {
  return attribute("type", name);
}
function value(val) {
  return attribute("value", val);
}
function placeholder(text3) {
  return attribute("placeholder", text3);
}
function disabled(is_disabled) {
  return property("disabled", is_disabled);
}
function for$(id2) {
  return attribute("for", id2);
}
function href(uri) {
  return attribute("href", uri);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag2, attrs, children) {
  if (tag2 === "area") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "base") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "br") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "col") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "embed") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "hr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "img") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "input") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "link") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "meta") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "param") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "source") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "track") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else if (tag2 === "wbr") {
    return new Element("", "", tag2, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag2, attrs, children, false, false);
  }
}
function text(content2) {
  return new Text(content2);
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Shutdown = class extends CustomType {
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
function morph(prev, next, dispatch, isComponent = false) {
  let out;
  let stack2 = [{ prev, next, parent: prev.parentNode }];
  while (stack2.length) {
    let { prev: prev2, next: next2, parent } = stack2.pop();
    if (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack: stack2,
        isComponent
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    } else if (next2.elements !== void 0) {
      iterateElement(next2, (fragmentElement) => {
        stack2.unshift({ prev: prev2, next: fragmentElement, parent });
        prev2 = prev2?.nextSibling;
      });
    } else if (next2.subtree !== void 0) {
      stack2.push({ prev: prev2, next: next2, parent });
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack: stack2 }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el2 = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el2)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el2, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el2);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style3 = null;
  let innerHTML = null;
  for (const attr of next.attrs) {
    const name = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el2[name] !== value3)
        el2[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    } else if (name.startsWith("on")) {
      const eventName = name.slice(2);
      const callback = dispatch(value3);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name.startsWith("data-lustre-on-")) {
      const eventName = name.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el2.setAttribute(name, value3);
    } else if (name === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name === "style") {
      style3 = style3 === null ? value3 : style3 + value3;
    } else if (name === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (typeof value3 === "string")
        el2.setAttribute(name, value3);
      if (name === "value" || name === "selected")
        el2[name] = value3;
      if (canMorph)
        prevAttributes.delete(name);
    }
  }
  if (className !== null) {
    el2.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style3 !== null) {
    el2.setAttribute("style", style3);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el2.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el2.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.key !== void 0 && next.key !== "") {
    el2.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el2.innerHTML = innerHTML;
    return el2;
  }
  let prevChild = el2.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = next.children[Symbol.iterator]().next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
  }
  for (const child of next.children) {
    iterateElement(child, (currElement) => {
      if (currElement.key !== void 0 && seenKeys !== null) {
        prevChild = diffKeyedChild(
          prevChild,
          currElement,
          el2,
          stack2,
          incomingKeyedChildren,
          keyedChildren,
          seenKeys
        );
      } else {
        stack2.unshift({ prev: prevChild, next: currElement, parent: el2 });
        prevChild = prevChild?.nextSibling;
      }
    });
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = next2;
  }
  return el2;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el2 = event2.target;
  const tag2 = el2.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el2.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el2.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag: tag2,
    data: include.reduce(
      (data2, property2) => {
        const path = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el2) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el2) {
    for (const child of el2.children) {
      iterateElement(child, (currElement) => {
        const key2 = currElement?.key || currElement?.getAttribute?.("data-lustre-key");
        if (key2)
          keyedChildren.set(key2, currElement);
      });
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el2, stack2, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    iterateElement(child, (currChild) => {
      stack2.unshift({ prev: prevChild, next: currChild, parent: el2 });
      prevChild = prevChild?.nextSibling;
    });
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack2.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack2.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder2 = document.createTextNode("");
    el2.insertBefore(placeholder2, prevChild);
    stack2.unshift({ prev: placeholder2, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack2.unshift({ prev: prevChild, next: child, parent: el2 });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el2.insertBefore(keyedChild, prevChild);
  stack2.unshift({ prev: keyedChild, next: child, parent: el2 });
  return prevChild;
}
function iterateElement(element2, processElement) {
  if (element2.elements !== void 0) {
    for (const currElement of element2.elements) {
      processElement(currElement);
    }
  } else {
    processElement(element2);
  }
}

// build/dev/javascript/lustre/client-runtime.ffi.mjs
var LustreClientApplication2 = class _LustreClientApplication {
  #root = null;
  #queue = [];
  #effects = [];
  #didUpdate = false;
  #isComponent = false;
  #model = null;
  #update = null;
  #view = null;
  static start(flags, selector, init5, update3, view2) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root2 = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root2)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(init5(flags), update3, view2, root2);
    return new Ok((msg) => app.send(msg));
  }
  constructor([model, effects], update3, view2, root2 = document.body, isComponent = false) {
    this.#model = model;
    this.#update = update3;
    this.#view = view2;
    this.#root = root2;
    this.#effects = effects.all.toArray();
    this.#didUpdate = true;
    this.#isComponent = isComponent;
    window.requestAnimationFrame(() => this.#tick());
  }
  send(action) {
    switch (true) {
      case action instanceof Dispatch: {
        this.#queue.push(action[0]);
        this.#tick();
        return;
      }
      case action instanceof Shutdown: {
        this.#shutdown();
        return;
      }
      case action instanceof Debug: {
        this.#debug(action[0]);
        return;
      }
      default:
        return;
    }
  }
  emit(event2, data) {
    this.#root.dispatchEvent(
      new CustomEvent(event2, {
        bubbles: true,
        detail: data,
        composed: true
      })
    );
  }
  #tick() {
    this.#flush_queue();
    const vdom = this.#view(this.#model);
    const dispatch = (handler) => (e) => {
      const result = handler(e);
      if (result instanceof Ok) {
        this.send(new Dispatch(result[0]));
      }
    };
    this.#didUpdate = false;
    this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
  }
  #flush_queue(iterations = 0) {
    while (this.#queue.length) {
      const [next, effects] = this.#update(this.#model, this.#queue.shift());
      this.#didUpdate ||= !isEqual(this.#model, next);
      this.#model = next;
      this.#effects = this.#effects.concat(effects.all.toArray());
    }
    while (this.#effects.length) {
      this.#effects.shift()(
        (msg) => this.send(new Dispatch(msg)),
        (event2, data) => this.emit(event2, data)
      );
    }
    if (this.#queue.length) {
      if (iterations < 5) {
        this.#flush_queue(++iterations);
      } else {
        window.requestAnimationFrame(() => this.#tick());
      }
    }
  }
  #debug(action) {
    switch (true) {
      case action instanceof ForceModel: {
        const vdom = this.#view(action[0]);
        const dispatch = (handler) => (e) => {
          const result = handler(e);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0]));
          }
        };
        this.#queue = [];
        this.#effects = [];
        this.#didUpdate = false;
        this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
      }
    }
  }
  #shutdown() {
    this.#root.remove();
    this.#root = null;
    this.#model = null;
    this.#queue = [];
    this.#effects = [];
    this.#didUpdate = false;
    this.#update = () => {
    };
    this.#view = () => {
    };
  }
};
var start = (app, selector, flags) => LustreClientApplication2.start(
  flags,
  selector,
  app.init,
  app.update,
  app.view
);
var is_browser = () => window && window.document;
var prevent_default = (event2) => event2.preventDefault();

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init5, update3, view2, on_attribute_change) {
    super();
    this.init = init5;
    this.update = update3;
    this.view = view2;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init5, update3, view2) {
  return new App(init5, update3, view2, new None());
}
function start3(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content2) {
  return text(content2);
}
function style(attrs, css) {
  return element("style", attrs, toList([text2(css)]));
}
function h1(attrs, children) {
  return element("h1", attrs, children);
}
function h2(attrs, children) {
  return element("h2", attrs, children);
}
function nav(attrs, children) {
  return element("nav", attrs, children);
}
function div(attrs, children) {
  return element("div", attrs, children);
}
function li(attrs, children) {
  return element("li", attrs, children);
}
function ol(attrs, children) {
  return element("ol", attrs, children);
}
function p(attrs, children) {
  return element("p", attrs, children);
}
function ul(attrs, children) {
  return element("ul", attrs, children);
}
function a(attrs, children) {
  return element("a", attrs, children);
}
function span(attrs, children) {
  return element("span", attrs, children);
}
function button(attrs, children) {
  return element("button", attrs, children);
}
function form(attrs, children) {
  return element("form", attrs, children);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}
function label(attrs, children) {
  return element("label", attrs, children);
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name, handler) {
  return on(name, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map3(_pipe, msg);
    }
  );
}
function on_submit(msg) {
  return on2(
    "submit",
    (event2) => {
      let $ = prevent_default(event2);
      return new Ok(msg);
    }
  );
}

// build/dev/javascript/gleam_http/gleam/http.mjs
var Get = class extends CustomType {
};
var Post = class extends CustomType {
};
var Head = class extends CustomType {
};
var Put = class extends CustomType {
};
var Delete = class extends CustomType {
};
var Trace = class extends CustomType {
};
var Connect = class extends CustomType {
};
var Options2 = class extends CustomType {
};
var Patch = class extends CustomType {
};
var Http = class extends CustomType {
};
var Https = class extends CustomType {
};
function method_to_string(method) {
  if (method instanceof Connect) {
    return "connect";
  } else if (method instanceof Delete) {
    return "delete";
  } else if (method instanceof Get) {
    return "get";
  } else if (method instanceof Head) {
    return "head";
  } else if (method instanceof Options2) {
    return "options";
  } else if (method instanceof Patch) {
    return "patch";
  } else if (method instanceof Post) {
    return "post";
  } else if (method instanceof Put) {
    return "put";
  } else if (method instanceof Trace) {
    return "trace";
  } else {
    let s = method[0];
    return s;
  }
}
function scheme_to_string(scheme) {
  if (scheme instanceof Http) {
    return "http";
  } else {
    return "https";
  }
}
function scheme_from_string(scheme) {
  let $ = lowercase2(scheme);
  if ($ === "http") {
    return new Ok(new Http());
  } else if ($ === "https") {
    return new Ok(new Https());
  } else {
    return new Error(void 0);
  }
}

// build/dev/javascript/gleam_http/gleam/http/request.mjs
var Request = class extends CustomType {
  constructor(method, headers, body, scheme, host, port, path, query) {
    super();
    this.method = method;
    this.headers = headers;
    this.body = body;
    this.scheme = scheme;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
  }
};
function to_uri(request) {
  return new Uri(
    new Some(scheme_to_string(request.scheme)),
    new None(),
    new Some(request.host),
    request.port,
    request.path,
    request.query,
    new None()
  );
}
function from_uri(uri) {
  return then$2(
    (() => {
      let _pipe = uri.scheme;
      let _pipe$1 = unwrap(_pipe, "");
      return scheme_from_string(_pipe$1);
    })(),
    (scheme) => {
      return then$2(
        (() => {
          let _pipe = uri.host;
          return to_result(_pipe, void 0);
        })(),
        (host) => {
          let req = new Request(
            new Get(),
            toList([]),
            "",
            scheme,
            host,
            uri.port,
            uri.path,
            uri.query
          );
          return new Ok(req);
        }
      );
    }
  );
}
function set_header(request, key2, value3) {
  let headers = key_set(request.headers, lowercase2(key2), value3);
  return request.withFields({ headers });
}
function set_body(req, body) {
  let method = req.method;
  let headers = req.headers;
  let scheme = req.scheme;
  let host = req.host;
  let port = req.port;
  let path = req.path;
  let query = req.query;
  return new Request(method, headers, body, scheme, host, port, path, query);
}
function set_method(req, method) {
  return req.withFields({ method });
}
function to(url) {
  let _pipe = url;
  let _pipe$1 = parse2(_pipe);
  return then$2(_pipe$1, from_uri);
}

// build/dev/javascript/gleam_http/gleam/http/response.mjs
var Response = class extends CustomType {
  constructor(status, headers, body) {
    super();
    this.status = status;
    this.headers = headers;
    this.body = body;
  }
};

// build/dev/javascript/gleam_javascript/ffi.mjs
var PromiseLayer = class _PromiseLayer {
  constructor(promise) {
    this.promise = promise;
  }
  static wrap(value3) {
    return value3 instanceof Promise ? new _PromiseLayer(value3) : value3;
  }
  static unwrap(value3) {
    return value3 instanceof _PromiseLayer ? value3.promise : value3;
  }
};
function resolve(value3) {
  return Promise.resolve(PromiseLayer.wrap(value3));
}
function then(promise, fn) {
  return promise.then((value3) => fn(PromiseLayer.unwrap(value3)));
}
function map_promise(promise, fn) {
  return promise.then(
    (value3) => PromiseLayer.wrap(fn(PromiseLayer.unwrap(value3)))
  );
}
function rescue(promise, fn) {
  return promise.catch((error2) => fn(error2));
}

// build/dev/javascript/gleam_javascript/gleam/javascript/promise.mjs
function tap(promise, callback) {
  let _pipe = promise;
  return map_promise(
    _pipe,
    (a2) => {
      callback(a2);
      return a2;
    }
  );
}
function try_await(promise, callback) {
  let _pipe = promise;
  return then(
    _pipe,
    (result) => {
      if (result.isOk()) {
        let a2 = result[0];
        return callback(a2);
      } else {
        let e = result[0];
        return resolve(new Error(e));
      }
    }
  );
}

// build/dev/javascript/gleam_fetch/ffi.mjs
async function raw_send(request) {
  try {
    return new Ok(await fetch(request));
  } catch (error2) {
    return new Error(new NetworkError(error2.toString()));
  }
}
function from_fetch_response(response) {
  return new Response(
    response.status,
    List.fromArray([...response.headers]),
    response
  );
}
function to_fetch_request(request) {
  let url = to_string4(to_uri(request));
  let method = method_to_string(request.method).toUpperCase();
  let options = {
    headers: make_headers(request.headers),
    method
  };
  if (method !== "GET" && method !== "HEAD")
    options.body = request.body;
  return new globalThis.Request(url, options);
}
function make_headers(headersList) {
  let headers = new globalThis.Headers();
  for (let [k, v] of headersList)
    headers.append(k.toLowerCase(), v);
  return headers;
}
async function read_text_body(response) {
  let body;
  try {
    body = await response.body.text();
  } catch (error2) {
    return new Error(new UnableToReadBody());
  }
  return new Ok(response.withFields({ body }));
}

// build/dev/javascript/gleam_fetch/gleam/fetch.mjs
var NetworkError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UnableToReadBody = class extends CustomType {
};
function send(request) {
  let _pipe = request;
  let _pipe$1 = to_fetch_request(_pipe);
  let _pipe$2 = raw_send(_pipe$1);
  return try_await(
    _pipe$2,
    (resp) => {
      return resolve(new Ok(from_fetch_response(resp)));
    }
  );
}

// build/dev/javascript/lustre_http/lustre_http.mjs
var BadUrl = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InternalServerError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var JsonError = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NetworkError2 = class extends CustomType {
};
var NotFound = class extends CustomType {
};
var OtherError = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Unauthorized = class extends CustomType {
};
var ExpectTextResponse = class extends CustomType {
  constructor(run) {
    super();
    this.run = run;
  }
};
function do_send(req, expect, dispatch) {
  let _pipe = send(req);
  let _pipe$1 = try_await(_pipe, read_text_body);
  let _pipe$2 = map_promise(
    _pipe$1,
    (response) => {
      if (response.isOk()) {
        let res = response[0];
        return expect.run(new Ok(res));
      } else {
        return expect.run(new Error(new NetworkError2()));
      }
    }
  );
  let _pipe$3 = rescue(
    _pipe$2,
    (_) => {
      return expect.run(new Error(new NetworkError2()));
    }
  );
  tap(_pipe$3, dispatch);
  return void 0;
}
function get2(url, expect) {
  return from2(
    (dispatch) => {
      let $ = to(url);
      if ($.isOk()) {
        let req = $[0];
        return do_send(req, expect, dispatch);
      } else {
        return dispatch(expect.run(new Error(new BadUrl(url))));
      }
    }
  );
}
function post(url, body, expect) {
  return from2(
    (dispatch) => {
      let $ = to(url);
      if ($.isOk()) {
        let req = $[0];
        let _pipe = req;
        let _pipe$1 = set_method(_pipe, new Post());
        let _pipe$2 = set_header(
          _pipe$1,
          "Content-Type",
          "application/json"
        );
        let _pipe$3 = set_body(_pipe$2, to_string6(body));
        return do_send(_pipe$3, expect, dispatch);
      } else {
        return dispatch(expect.run(new Error(new BadUrl(url))));
      }
    }
  );
}
function response_to_result(response) {
  if (response instanceof Response && (200 <= response.status && response.status <= 299)) {
    let status = response.status;
    let body = response.body;
    return new Ok(body);
  } else if (response instanceof Response && response.status === 401) {
    return new Error(new Unauthorized());
  } else if (response instanceof Response && response.status === 404) {
    return new Error(new NotFound());
  } else if (response instanceof Response && response.status === 500) {
    let body = response.body;
    return new Error(new InternalServerError(body));
  } else {
    let code = response.status;
    let body = response.body;
    return new Error(new OtherError(code, body));
  }
}
function expect_json(decoder2, to_msg) {
  return new ExpectTextResponse(
    (response) => {
      let _pipe = response;
      let _pipe$1 = then$2(_pipe, response_to_result);
      let _pipe$2 = then$2(
        _pipe$1,
        (body) => {
          let $ = decode5(body, decoder2);
          if ($.isOk()) {
            let json = $[0];
            return new Ok(json);
          } else {
            let json_error = $[0];
            return new Error(new JsonError(json_error));
          }
        }
      );
      return to_msg(_pipe$2);
    }
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/button.mjs
function button2(attributes, children) {
  return button(
    prepend(
      class$("lustre-ui-button"),
      prepend(type_("button"), attributes)
    ),
    children
  );
}
function solid() {
  return class$("solid");
}
function error() {
  return attribute("data-variant", "error");
}

// build/dev/javascript/lustre_ui/lustre/ui/input.mjs
function input2(attributes) {
  return input(
    prepend(class$("lustre-ui-input"), attributes)
  );
}

// build/dev/javascript/lustre_ui/lustre/ui/layout/group.mjs
function of2(element2, attributes, children) {
  return element2(
    prepend(class$("lustre-ui-group"), attributes),
    children
  );
}
function group(attributes, children) {
  return of2(div, attributes, children);
}

// build/dev/javascript/lustre_ui/lustre/ui/prose.mjs
function of3(element2, attributes, children) {
  return element2(
    prepend(class$("lustre-ui-prose"), attributes),
    children
  );
}
function prose(attributes, children) {
  return of3(div, attributes, children);
}

// build/dev/javascript/gleam_community_colour/gleam_community/colour.mjs
var Rgba = class extends CustomType {
  constructor(r, g, b, a2) {
    super();
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a2;
  }
};
var light_red = new Rgba(
  0.9372549019607843,
  0.1607843137254902,
  0.1607843137254902,
  1
);
var red = new Rgba(0.8, 0, 0, 1);
var dark_red = new Rgba(0.6431372549019608, 0, 0, 1);
var light_orange = new Rgba(
  0.9882352941176471,
  0.6862745098039216,
  0.24313725490196078,
  1
);
var orange = new Rgba(0.9607843137254902, 0.4745098039215686, 0, 1);
var dark_orange = new Rgba(
  0.807843137254902,
  0.3607843137254902,
  0,
  1
);
var light_yellow = new Rgba(
  1,
  0.9137254901960784,
  0.30980392156862746,
  1
);
var yellow = new Rgba(0.9294117647058824, 0.8313725490196079, 0, 1);
var dark_yellow = new Rgba(
  0.7686274509803922,
  0.6274509803921569,
  0,
  1
);
var light_green = new Rgba(
  0.5411764705882353,
  0.8862745098039215,
  0.20392156862745098,
  1
);
var green = new Rgba(
  0.45098039215686275,
  0.8235294117647058,
  0.08627450980392157,
  1
);
var dark_green = new Rgba(
  0.3058823529411765,
  0.6039215686274509,
  0.023529411764705882,
  1
);
var light_blue = new Rgba(
  0.4470588235294118,
  0.6235294117647059,
  0.8117647058823529,
  1
);
var blue = new Rgba(
  0.20392156862745098,
  0.396078431372549,
  0.6431372549019608,
  1
);
var dark_blue = new Rgba(
  0.12549019607843137,
  0.2901960784313726,
  0.5294117647058824,
  1
);
var light_purple = new Rgba(
  0.6784313725490196,
  0.4980392156862745,
  0.6588235294117647,
  1
);
var purple = new Rgba(
  0.4588235294117647,
  0.3137254901960784,
  0.4823529411764706,
  1
);
var dark_purple = new Rgba(
  0.3607843137254902,
  0.20784313725490197,
  0.4,
  1
);
var light_brown = new Rgba(
  0.9137254901960784,
  0.7254901960784313,
  0.43137254901960786,
  1
);
var brown = new Rgba(
  0.7568627450980392,
  0.49019607843137253,
  0.06666666666666667,
  1
);
var dark_brown = new Rgba(
  0.5607843137254902,
  0.34901960784313724,
  0.00784313725490196,
  1
);
var black = new Rgba(0, 0, 0, 1);
var white = new Rgba(1, 1, 1, 1);
var light_grey = new Rgba(
  0.9333333333333333,
  0.9333333333333333,
  0.9254901960784314,
  1
);
var grey = new Rgba(
  0.8274509803921568,
  0.8431372549019608,
  0.8117647058823529,
  1
);
var dark_grey = new Rgba(
  0.7294117647058823,
  0.7411764705882353,
  0.7137254901960784,
  1
);
var light_gray = new Rgba(
  0.9333333333333333,
  0.9333333333333333,
  0.9254901960784314,
  1
);
var gray = new Rgba(
  0.8274509803921568,
  0.8431372549019608,
  0.8117647058823529,
  1
);
var dark_gray = new Rgba(
  0.7294117647058823,
  0.7411764705882353,
  0.7137254901960784,
  1
);
var light_charcoal = new Rgba(
  0.5333333333333333,
  0.5411764705882353,
  0.5215686274509804,
  1
);
var charcoal = new Rgba(
  0.3333333333333333,
  0.3411764705882353,
  0.3254901960784314,
  1
);
var dark_charcoal = new Rgba(
  0.1803921568627451,
  0.20392156862745098,
  0.21176470588235294,
  1
);
var pink = new Rgba(1, 0.6862745098039216, 0.9529411764705882, 1);

// build/dev/javascript/lustre_ui/lustre/ui.mjs
var button3 = button2;
var group2 = group;
var prose2 = prose;

// build/dev/javascript/lustre_ui/lustre/ui/util/styles.mjs
var element_css = '\n*,:after,:before{border:0 solid;box-sizing:border-box}html{-webkit-text-size-adjust:100%;font-feature-settings:normal;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-variation-settings:normal;line-height:1.5;-moz-tab-size:4;-o-tab-size:4;tab-size:4}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{font-feature-settings:inherit;color:inherit;font-family:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]{display:none}.bg-app{background-color:var(--app-background)}.bg-app-subtle{background-color:var(--app-background-subtle)}.bg-element{background-color:var(--element-background)}.bg-element-hover{background-color:var(--element-background-hover)}.bg-element-strong{background-color:var(--element-background-strong)}.bg-solid{background-color:var(--solid-background)}.bg-solid-hover{background-color:var(--solid-background-hover)}.border-app{border:1px solid var(--app-border)}.border-element-subtle{border:1px solid var(--element-border-subtle)}.border-element-strong{border:1px solid var(--element-border-strong)}.text-high-contrast{color:var(--text-high-contrast)}.text-low-contrast{color:var(--text-low-contrast)}.border-radius{border-radius:var(--border-radius)}.text-xs{font-size:var(--text-xs)}.text-sm{font-size:var(--text-sm)}.text-md{font-size:var(--text-md)}.text-lg{font-size:var(--text-lg)}.text-xl{font-size:var(--text-xl)}.text-2xl{font-size:var(--text-2xl)}.text-3xl{font-size:var(--text-3xl)}.text-4xl{font-size:var(--text-4xl)}.text-5xl{font-size:var(--text-5xl)}.p-2xs{padding:var(--space-2xs)}.p-xs{padding:var(--space-xs)}.p-sm{padding:var(--space-sm)}.p-md{padding:var(--space-md)}.p-lg{padding:var(--space-lg)}.p-xl{padding:var(--space-xl)}.p-2xl{padding:var(--space-2xl)}.p-3xl{padding:var(--space-3xl)}.p-4xl{padding:var(--space-4xl)}.p-5xl{padding:var(--space-5xl)}.px-2xs{padding-left:var(--space-2xs);padding-right:var(--space-2xs)}.px-xs{padding-left:var(--space-xs);padding-right:var(--space-xs)}.px-sm{padding-left:var(--space-sm);padding-right:var(--space-sm)}.px-md{padding-left:var(--space-md);padding-right:var(--space-md)}.px-lg{padding-left:var(--space-lg);padding-right:var(--space-lg)}.px-xl{padding-left:var(--space-xl);padding-right:var(--space-xl)}.px-2xl{padding-left:var(--space-2xl);padding-right:var(--space-2xl)}.px-3xl{padding-left:var(--space-3xl);padding-right:var(--space-3xl)}.px-4xl{padding-left:var(--space-4xl);padding-right:var(--space-4xl)}.px-5xl{padding-left:var(--space-5xl);padding-right:var(--space-5xl)}.py-2xs{padding-bottom:var(--space-2xs);padding-top:var(--space-2xs)}.py-xs{padding-bottom:var(--space-xs);padding-top:var(--space-xs)}.py-sm{padding-bottom:var(--space-sm);padding-top:var(--space-sm)}.py-md{padding-bottom:var(--space-md);padding-top:var(--space-md)}.py-lg{padding-bottom:var(--space-lg);padding-top:var(--space-lg)}.py-xl{padding-bottom:var(--space-xl);padding-top:var(--space-xl)}.py-2xl{padding-bottom:var(--space-2xl);padding-top:var(--space-2xl)}.py-3xl{padding-bottom:var(--space-3xl);padding-top:var(--space-3xl)}.py-4xl{padding-bottom:var(--space-4xl);padding-top:var(--space-4xl)}.py-5xl{padding-bottom:var(--space-5xl);padding-top:var(--space-5xl)}.pt-2xs{padding-top:var(--space-2xs)}.pt-xs{padding-top:var(--space-xs)}.pt-sm{padding-top:var(--space-sm)}.pt-md{padding-top:var(--space-md)}.pt-lg{padding-top:var(--space-lg)}.pt-xl{padding-top:var(--space-xl)}.pt-2xl{padding-top:var(--space-2xl)}.pt-3xl{padding-top:var(--space-3xl)}.pt-4xl{padding-top:var(--space-4xl)}.pt-5xl{padding-top:var(--space-5xl)}.pr-2xs{padding-right:var(--space-2xs)}.pr-xs{padding-right:var(--space-xs)}.pr-sm{padding-right:var(--space-sm)}.pr-md{padding-right:var(--space-md)}.pr-lg{padding-right:var(--space-lg)}.pr-xl{padding-right:var(--space-xl)}.pr-2xl{padding-right:var(--space-2xl)}.pr-3xl{padding-right:var(--space-3xl)}.pr-4xl{padding-right:var(--space-4xl)}.pr-5xl{padding-right:var(--space-5xl)}.pb-2xs{padding-bottom:var(--space-2xs)}.pb-xs{padding-bottom:var(--space-xs)}.pb-sm{padding-bottom:var(--space-sm)}.pb-md{padding-bottom:var(--space-md)}.pb-lg{padding-bottom:var(--space-lg)}.pb-xl{padding-bottom:var(--space-xl)}.pb-2xl{padding-bottom:var(--space-2xl)}.pb-3xl{padding-bottom:var(--space-3xl)}.pb-4xl{padding-bottom:var(--space-4xl)}.pb-5xl{padding-bottom:var(--space-5xl)}.m-2xs{margin:var(--space-2xs)}.m-xs{margin:var(--space-xs)}.m-sm{margin:var(--space-sm)}.m-md{margin:var(--space-md)}.m-lg{margin:var(--space-lg)}.m-xl{margin:var(--space-xl)}.m-2xl{margin:var(--space-2xl)}.m-3xl{margin:var(--space-3xl)}.m-4xl{margin:var(--space-4xl)}.m-5xl{margin:var(--space-5xl)}.mx-2xs{margin-left:var(--space-2xs);margin-right:var(--space-2xs)}.mx-xs{margin-left:var(--space-xs);margin-right:var(--space-xs)}.mx-sm{margin-left:var(--space-sm);margin-right:var(--space-sm)}.mx-md{margin-left:var(--space-md);margin-right:var(--space-md)}.mx-lg{margin-left:var(--space-lg);margin-right:var(--space-lg)}.mx-xl{margin-left:var(--space-xl);margin-right:var(--space-xl)}.mx-2xl{margin-left:var(--space-2xl);margin-right:var(--space-2xl)}.mx-3xl{margin-left:var(--space-3xl);margin-right:var(--space-3xl)}.mx-4xl{margin-left:var(--space-4xl);margin-right:var(--space-4xl)}.mx-5xl{margin-left:var(--space-5xl);margin-right:var(--space-5xl)}.my-2xs{margin-bottom:var(--space-2xs);margin-top:var(--space-2xs)}.my-xs{margin-bottom:var(--space-xs);margin-top:var(--space-xs)}.my-sm{margin-bottom:var(--space-sm);margin-top:var(--space-sm)}.my-md{margin-bottom:var(--space-md);margin-top:var(--space-md)}.my-lg{margin-bottom:var(--space-lg);margin-top:var(--space-lg)}.my-xl{margin-bottom:var(--space-xl);margin-top:var(--space-xl)}.my-2xl{margin-bottom:var(--space-2xl);margin-top:var(--space-2xl)}.my-3xl{margin-bottom:var(--space-3xl);margin-top:var(--space-3xl)}.my-4xl{margin-bottom:var(--space-4xl);margin-top:var(--space-4xl)}.my-5xl{margin-bottom:var(--space-5xl);margin-top:var(--space-5xl)}.mt-2xs{margin-top:var(--space-2xs)}.mt-xs{margin-top:var(--space-xs)}.mt-sm{margin-top:var(--space-sm)}.mt-md{margin-top:var(--space-md)}.mt-lg{margin-top:var(--space-lg)}.mt-xl{margin-top:var(--space-xl)}.mt-2xl{margin-top:var(--space-2xl)}.mt-3xl{margin-top:var(--space-3xl)}.mt-4xl{margin-top:var(--space-4xl)}.mt-5xl{margin-top:var(--space-5xl)}.mr-2xs{margin-right:var(--space-2xs)}.mr-xs{margin-right:var(--space-xs)}.mr-sm{margin-right:var(--space-sm)}.mr-md{margin-right:var(--space-md)}.mr-lg{margin-right:var(--space-lg)}.mr-xl{margin-right:var(--space-xl)}.mr-2xl{margin-right:var(--space-2xl)}.mr-3xl{margin-right:var(--space-3xl)}.mr-4xl{margin-right:var(--space-4xl)}.mr-5xl{margin-right:var(--space-5xl)}.mb-2xs{margin-bottom:var(--space-2xs)}.mb-xs{margin-bottom:var(--space-xs)}.mb-sm{margin-bottom:var(--space-sm)}.mb-md{margin-bottom:var(--space-md)}.mb-lg{margin-bottom:var(--space-lg)}.mb-xl{margin-bottom:var(--space-xl)}.mb-2xl{margin-bottom:var(--space-2xl)}.mb-3xl{margin-bottom:var(--space-3xl)}.mb-4xl{margin-bottom:var(--space-4xl)}.mb-5xl{margin-bottom:var(--space-5xl)}.ml-2xs{margin-left:var(--space-2xs)}.ml-xs{margin-left:var(--space-xs)}.ml-sm{margin-left:var(--space-sm)}.ml-md{margin-left:var(--space-md)}.ml-lg{margin-left:var(--space-lg)}.ml-xl{margin-left:var(--space-xl)}.ml-2xl{margin-left:var(--space-2xl)}.ml-3xl{margin-left:var(--space-3xl)}.ml-4xl{margin-left:var(--space-4xl)}.ml-5xl{margin-left:var(--space-5xl)}.font-base{font-family:var(--font-base)}.font-alt{font-family:var(--font-alt)}.font-mono{font-family:var(--font-mono)}.shadow-sm{box-shadow:var(--shadow-sm)}.shadow-md{box-shadow:var(--shadow-md)}.shadow-lg{box-shadow:var(--shadow-lg)}:root{--primary-app-background:#fdfdff;--primary-app-background-subtle:#fafaff;--primary-app-border:#d0d0fa;--primary-element-background:#f3f3ff;--primary-element-background-hover:#ebebfe;--primary-element-background-strong:#e0e0fd;--primary-element-border-subtle:#babbf5;--primary-element-border-strong:#9b9ef0;--primary-solid-background:#5b5bd6;--primary-solid-background-hover:#5353ce;--primary-text-high-contrast:#272962;--primary-text-low-contrast:#4747c2;--greyscale-app-background:#fcfcfd;--greyscale-app-background-subtle:#f9f9fb;--greyscale-app-border:#dddde3;--greyscale-element-background:#f2f2f5;--greyscale-element-background-hover:#ebebef;--greyscale-element-background-strong:#e4e4e9;--greyscale-element-border-subtle:#d3d4db;--greyscale-element-border-strong:#b9bbc6;--greyscale-solid-background:#8b8d98;--greyscale-solid-background-hover:#7e808a;--greyscale-text-high-contrast:#1c2024;--greyscale-text-low-contrast:#60646c;--error-app-background:#fffcfc;--error-app-background-subtle:#fff7f7;--error-app-border:#f9c6c6;--error-element-background:#ffefef;--error-element-background-hover:#ffe5e5;--error-element-background-strong:#fdd8d8;--error-element-border-subtle:#f3aeaf;--error-element-border-strong:#eb9091;--error-solid-background:#e5484d;--error-solid-background-hover:#d93d42;--error-text-high-contrast:#641723;--error-text-low-contrast:#c62a2f;--success-app-background:#fbfefc;--success-app-background-subtle:#f2fcf5;--success-app-border:#b4dfc4;--success-element-background:#e9f9ee;--success-element-background-hover:#ddf3e4;--success-element-background-strong:#ccebd7;--success-element-border-subtle:#92ceac;--success-element-border-strong:#5bb98c;--success-solid-background:#30a46c;--success-solid-background-hover:#299764;--success-text-high-contrast:#193b2d;--success-text-low-contrast:#18794e;--warning-app-background:#fdfdf9;--warning-app-background-subtle:#fffbe0;--warning-app-border:#ecdd85;--warning-element-background:#fff8c6;--warning-element-background-hover:#fcf3af;--warning-element-background-strong:#f7ea9b;--warning-element-border-subtle:#dac56e;--warning-element-border-strong:#c9aa45;--warning-solid-background:#fbe32d;--warning-solid-background-hover:#f9da10;--warning-text-high-contrast:#473b1f;--warning-text-low-contrast:#775f28;--info-app-background:#fbfdff;--info-app-background-subtle:#f5faff;--info-app-border:#b7d9f8;--info-element-background:#edf6ff;--info-element-background-hover:#e1f0ff;--info-element-background-strong:#cee7fe;--info-element-border-subtle:#96c7f2;--info-element-border-strong:#5eb0ef;--info-solid-background:#0091ff;--info-solid-background-hover:#0880ea;--info-text-high-contrast:#113264;--info-text-low-contrast:#0b68cb;--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast);--text-base:1.125rem;--text-ratio:1.215;--text-xs:calc(var(--text-base)/pow(var(--text-ratio), 2));--text-sm:calc(var(--text-base)/var(--text-ratio));--text-md:var(--text-base);--text-lg:calc(var(--text-base)*var(--text-ratio));--text-xl:calc(var(--text-md)*pow(var(--text-ratio), 2));--text-2xl:calc(var(--text-base)*pow(var(--text-ratio), 3));--text-3xl:calc(var(--text-base)*pow(var(--text-ratio), 4));--text-4xl:calc(var(--text-base)*pow(var(--text-ratio), 5));--text-5xl:calc(var(--text-base)*pow(var(--text-ratio), 6));--space-base:1rem;--space-ratio:1.618;--space-2xs:calc(var(--space-md)*0.25);--space-xs:calc(var(--space-md)*0.5);--space-sm:calc(var(--space-md)*0.75);--space-md:var(--space-base);--space-lg:calc(var(--space-md)*1.25);--space-xl:calc(var(--space-md)*2);--space-2xl:calc(var(--space-md)*3.25);--space-3xl:calc(var(--space-md)*5.25);--space-4xl:calc(var(--space-md)*8.5);--space-5xl:calc(var(--space-md)*13.75);--font-base:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji";--font-alt:ui-serif,Georgia,Cambria,"Times New Roman",Times,serif;--font-mono:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;--border-radius:4px;--shadow-sm:0 1px 2px 0 rgba(0,0,0,.05);--shadow-md:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);--shadow-lg:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);font-size:var(--text-md)}[data-variant=primary]{--app-background:var(--primary-app-background);--app-background-subtle:var(--primary-app-background-subtle);--app-border:var(--primary-app-border);--element-background:var(--primary-element-background);--element-background-hover:var(--primary-element-background-hover);--element-background-strong:var(--primary-element-background-strong);--element-border-subtle:var(--primary-element-border-subtle);--element-border-strong:var(--primary-element-border-strong);--solid-background:var(--primary-solid-background);--solid-background-hover:var(--primary-solid-background-hover);--text-high-contrast:var(--primary-text-high-contrast);--text-low-contrast:var(--primary-text-low-contrast)}[data-variant=greyscale]{--app-background:var(--greyscale-app-background);--app-background-subtle:var(--greyscale-app-background-subtle);--app-border:var(--greyscale-app-border);--element-background:var(--greyscale-element-background);--element-background-hover:var(--greyscale-element-background-hover);--element-background-strong:var(--greyscale-element-background-strong);--element-border-subtle:var(--greyscale-element-border-subtle);--element-border-strong:var(--greyscale-element-border-strong);--solid-background:var(--greyscale-solid-background);--solid-background-hover:var(--greyscale-solid-background-hover);--text-high-contrast:var(--greyscale-text-high-contrast);--text-low-contrast:var(--greyscale-text-low-contrast)}[data-variant=error]{--app-background:var(--error-app-background);--app-background-subtle:var(--error-app-background-subtle);--app-border:var(--error-app-border);--element-background:var(--error-element-background);--element-background-hover:var(--error-element-background-hover);--element-background-strong:var(--error-element-background-strong);--element-border-subtle:var(--error-element-border-subtle);--element-border-strong:var(--error-element-border-strong);--solid-background:var(--error-solid-background);--solid-background-hover:var(--error-solid-background-hover);--text-high-contrast:var(--error-text-high-contrast);--text-low-contrast:var(--error-text-low-contrast)}[data-variant=success]{--app-background:var(--success-app-background);--app-background-subtle:var(--success-app-background-subtle);--app-border:var(--success-app-border);--element-background:var(--success-element-background);--element-background-hover:var(--success-element-background-hover);--element-background-strong:var(--success-element-background-strong);--element-border-subtle:var(--success-element-border-subtle);--element-border-strong:var(--success-element-border-strong);--solid-background:var(--success-solid-background);--solid-background-hover:var(--success-solid-background-hover);--text-high-contrast:var(--success-text-high-contrast);--text-low-contrast:var(--success-text-low-contrast)}[data-variant=warning]{--app-background:var(--warning-app-background);--app-background-subtle:var(--warning-app-background-subtle);--app-border:var(--warning-app-border);--element-background:var(--warning-element-background);--element-background-hover:var(--warning-element-background-hover);--element-background-strong:var(--warning-element-background-strong);--element-border-subtle:var(--warning-element-border-subtle);--element-border-strong:var(--warning-element-border-strong);--solid-background:var(--warning-solid-background);--solid-background-hover:var(--warning-solid-background-hover);--text-high-contrast:var(--warning-text-high-contrast);--text-low-contrast:var(--warning-text-low-contrast)}[data-variant=info]{--app-background:var(--info-app-background);--app-background-subtle:var(--info-app-background-subtle);--app-border:var(--info-app-border);--element-background:var(--info-element-background);--element-background-hover:var(--info-element-background-hover);--element-background-strong:var(--info-element-background-strong);--element-border-subtle:var(--info-element-border-subtle);--element-border-strong:var(--info-element-border-strong);--solid-background:var(--info-solid-background);--solid-background-hover:var(--info-solid-background-hover);--text-high-contrast:var(--info-text-high-contrast);--text-low-contrast:var(--info-text-low-contrast)}.lustre-ui-alert,.use-lustre-ui .alert{--bg:var(--element-background);--border:var(--element-border-subtle);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border);border-radius:var(--border-radius);box-shadow:var(--shadow-sm);padding:var(--space-sm)}.clear:is(.use-lustre-ui .alert,.lustre-ui-alert){--bg:unsert}.lustre-ui-breadcrumbs,.use-lustre-ui .breadcrumbs{--gap:var(--space-sm);--align:center;align-items:var(--align);display:flex;flex-wrap:nowrap;gap:var(--gap);justify-content:start;overflow-x:auto}.tight:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-sm)}.loose:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--gap:var(--space-md)}.align-start:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:start}.align-center:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs),.align-centre:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:center}.align-end:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs){--align:end}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>*{flex:0 0 auto}:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs):not(:has(.active))>:last-child,:is(.use-lustre-ui .breadcrumbs,.lustre-ui-breadcrumbs)>.active{color:var(--text-low-contrast)}.lustre-ui-button,.use-lustre-ui .button,.use-lustre-ui button{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.small:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--padding-y:var(--space-2xs);--padding-x:var(--space-xs)}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):focus-within:active,.solid:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:var(--element-border-subtle)}.clear:is(.use-lustre-ui button,.use-lustre-ui .button,.lustre-ui-button){--bg:unset;--border:unset}.lustre-ui-field,.use-lustre-ui .field{--label:var(--text-high-contrast);--label-align:start;--message:var(--text-low-contrast);--message-align:end;--text-size:var(--text-md)}.small:is(.use-lustre-ui .field,.lustre-ui-field){--text-size:var(--text-sm)}.label-start:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:start}.label-center:is(.use-lustre-ui .field,.lustre-ui-field),.label-centre:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:center}.label-end:is(.use-lustre-ui .field,.lustre-ui-field){--label-align:end}.message-start:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:start}.message-center:is(.use-lustre-ui .field,.lustre-ui-field),.message-centre:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:center}.message-end:is(.use-lustre-ui .field,.lustre-ui-field){--message-align:end}:is(.use-lustre-ui .field,.lustre-ui-field):has(input:disabled)>:is(.label,.message){opacity:.5}:is(.use-lustre-ui .field,.lustre-ui-field)>:not(input){color:var(--label);font-size:var(--text-size)}:is(.use-lustre-ui .field,.lustre-ui-field)>.label{display:inline-flex;justify-content:var(--label-align)}:is(.use-lustre-ui .field,.lustre-ui-field)>.message{color:var(--message);display:inline-flex;justify-content:var(--message-align)}.lustre-ui-icon,.use-lustre-ui .icon{--size:1em;display:inline;height:var(--size);width:var(--size)}.xs:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xs)}.sm:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-sm)}.md:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-md)}.lg:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-lg)}.xl:is(.use-lustre-ui .icon,.lustre-ui-icon){--size:var(--text-xl)}.lustre-ui-input,.use-lustre-ui .input,.use-lustre-ui input:not([type~="checkbox file radio range"]){--border-active:var(--element-border-strong);--border:var(--element-border-subtle);--outline:var(--element-border-subtle);--text:var(--text-high-contrast);--text-placeholder:var(--text-low-contrast);--padding-y:var(--space-xs);--padding-x:var(--space-sm);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);padding:var(--padding-y) var(--padding-x)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):hover{border-color:var(--border-active)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):focus-within{border-color:var(--border-active);outline:1px solid var(--outline);outline-offset:2px}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::-moz-placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input)::placeholder{color:var(--text-placeholder)}:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input):disabled{opacity:.5}.clear:is(.use-lustre-ui input:not([type~="checkbox file radio range"]),.use-lustre-ui .input,.lustre-ui-input){--border:unset}.lustre-ui-prose,.use-lustre-ui .prose{--width:60ch;width:var(--width)}.wide:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:80ch}.full:is(.use-lustre-ui .prose,.lustre-ui-prose){--width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) *+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(h1,h2,h3,h4,h5,h6)+:is(h1,h2,h3,h4,h5,h6){margin-top:var(--space-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h1{font-size:var(--text-3xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h2{font-size:var(--text-2xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) h3{font-size:var(--text-xl)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(h4,h5,h6){font-size:var(--text-lg)}:is(.use-lustre-ui .prose,.lustre-ui-prose) img{border-radius:var(--border-radius);display:block;height:auto;-o-object-fit:cover;object-fit:cover;width:100%}:is(.use-lustre-ui .prose,.lustre-ui-prose) ul{list-style:disc}:is(.use-lustre-ui .prose,.lustre-ui-prose) ol{list-style:decimal}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl){padding-left:var(--space-xl)}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(ul,ol,dl))>*+*{margin-top:var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) li::marker{color:var(--text-low-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre{background-color:var(--greyscale-element-background);border-radius:var(--border-radius);overflow-x:auto;padding:var(--space-sm) var(--space-md)}:is(.use-lustre-ui .prose,.lustre-ui-prose) pre>code{background-color:transparent;border-radius:0;color:inherit;font-size:var(--text-md);padding:0}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote{border-left:4px solid var(--element-border-subtle);padding-left:var(--space-xl);quotes:"\\201C""\\201D""\\2018""\\2019"}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>*{font-style:italic}:is(:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote)>*+*{margin-top:var(--space-sm)}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:first-child:before{content:open-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) blockquote>:last-child:after{content:close-quote}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]{color:var(--text-low-contrast);text-decoration:underline}:is(.use-lustre-ui .prose,.lustre-ui-prose) a[href]:visited{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :is(code,kbd){background-color:var(--greyscale-element-background);border-radius:var(--border-radius)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code{color:var(--text-high-contrast)}:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:after,:is(.use-lustre-ui .prose,.lustre-ui-prose) :not(pre) code:before{content:"\\`"}:is(.use-lustre-ui .prose,.lustre-ui-prose) kbd{border-color:var(--greyscale-element-border-strong);border-width:1px;font-weight:700;padding:0 var(--space-2xs)}.lustre-ui-tag,.use-lustre-ui .tag{--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast);background-color:var(--bg);border:1px solid var(--border,var(--bg),var(--element-border-subtle));border-radius:var(--border-radius);color:var(--text);font-size:var(--text-sm);padding:0 var(--space-xs)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]){cursor:pointer;-webkit-user-select:none;-moz-user-select:none;user-select:none}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover{background-color:var(--bg-hover)}:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{background-color:var(--bg-active);border-color:var(--border-active)}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--solid-background-hover);--bg-hover:var(--solid-background-hover);--bg:var(--solid-background);--border-active:var(--solid-background-hover);--border:var(--solid-background);--text:#fff}.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):focus-within:active,.solid:is(.use-lustre-ui .tag,.lustre-ui-tag):is(button,a,[tabindex]):hover:active{--bg-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000);--border-active:color-mix(in srgb,var(--solid-background-hover) 90%,#000)}.soft:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg-active:var(--element-background-strong);--bg-hover:var(--element-background-hover);--bg:var(--element-background);--border-active:var(--bg-active);--border:var(--bg);--text:var(--text-high-contrast)}.outline:is(.use-lustre-ui .tag,.lustre-ui-tag){--bg:unset;--border:var(--element-border-subtle)}.lustre-ui-aside,.use-lustre-ui .aside{--align:start;--gap:var(--space-md);--dir:row;--wrap:wrap;--min:60%;align-items:var(--align);display:flex;flex-direction:var(--dir);flex-wrap:var(--wrap);gap:var(--gap)}.content-first:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row;--wrap:wrap}.content-last:is(.use-lustre-ui .aside,.lustre-ui-aside){--dir:row-reverse;--wrap:wrap-reverse}.align-start:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:start}.align-center:is(.use-lustre-ui .aside,.lustre-ui-aside),.align-centre:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:center}.align-end:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:end}.stretch:is(.use-lustre-ui .aside,.lustre-ui-aside){--align:stretch}.packed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:0}.tight:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-md)}.loose:is(.use-lustre-ui .aside,.lustre-ui-aside){--gap:var(--space-lg)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:first-child{flex-basis:0;flex-grow:999;min-inline-size:var(--min)}:is(.use-lustre-ui .aside,.lustre-ui-aside)>:last-child{flex-grow:1;max-height:-moz-max-content;max-height:max-content}.lustre-ui-box,.use-lustre-ui .box{--gap:var(--space-sm);padding:var(--gap)}.packed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:0}.tight:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-md)}.loose:is(.use-lustre-ui .box,.lustre-ui-box){--gap:var(--space-lg)}.lustre-ui-center,.lustre-ui-centre,.use-lustre-ui .center,.use-lustre-ui .centre{--display:flex;align-items:center;display:var(--display);justify-content:center}.inline:is(.use-lustre-ui .centre,.use-lustre-ui .center,.lustre-ui-centre,.lustre-ui-center){--display:inline-flex}.lustre-ui-cluster,.use-lustre-ui .cluster{--gap:var(--space-md);--dir:flex-start;--align:center;align-items:var(--align);display:flex;flex-wrap:wrap;gap:var(--gap);justify-content:var(--dir)}.packed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:0}.tight:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-md)}.loose:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--gap:var(--space-lg)}.from-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-start}.from-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--dir:flex-end}.align-start:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:start}.align-center:is(.use-lustre-ui .cluster,.lustre-ui-cluster),.align-centre:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:center}.align-end:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:end}.stretch:is(.use-lustre-ui .cluster,.lustre-ui-cluster){--align:stretch}.lustre-ui-group,.use-lustre-ui .group{align-items:stretch;display:inline-flex}:is(.use-lustre-ui .group,.lustre-ui-group)>:first-child{border-radius:var(--border-radius) 0 0 var(--border-radius)!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:not(:first-child):not(:last-child){border-radius:0!important}:is(.use-lustre-ui .group,.lustre-ui-group)>:last-child{border-radius:0 var(--border-radius) var(--border-radius) 0!important}.lustre-ui-sequence,.use-lustre-ui .sequence{--gap:var(--space-md);--break:30rem;display:flex;flex-wrap:wrap;gap:var(--gap)}.packed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:0}.tight:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-md)}.loose:is(.use-lustre-ui .sequence,.lustre-ui-sequence){--gap:var(--space-lg)}[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3),[data-split-at="3"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+3)~*{flex-basis:100%}[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4),[data-split-at="4"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+4)~*{flex-basis:100%}[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5),[data-split-at="5"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+5)~*{flex-basis:100%}[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6),[data-split-at="6"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+6)~*{flex-basis:100%}[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7),[data-split-at="7"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+7)~*{flex-basis:100%}[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8),[data-split-at="8"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+8)~*{flex-basis:100%}[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9),[data-split-at="9"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+9)~*{flex-basis:100%}[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10),[data-split-at="10"]:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>:nth-last-child(n+10)~*{flex-basis:100%}:is(.use-lustre-ui .sequence,.lustre-ui-sequence)>*{flex-basis:calc((var(--break) - 100%)*999);flex-grow:1}.lustre-ui-stack,.use-lustre-ui .stack{--gap:var(--space-md);display:flex;flex-direction:column;gap:var(--gap);justify-content:flex-start}.packed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:0}.tight:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-xs)}.relaxed:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-md)}.loose:is(.use-lustre-ui .stack,.lustre-ui-stack){--gap:var(--space-lg)}\n';
function elements() {
  return style(toList([]), element_css);
}

// build/dev/javascript/lustre_websocket/ffi.mjs
var init_websocket = (url, on_open, on_text, on_binary, on_close) => {
  let ws;
  if (typeof WebSocket === "function") {
    ws = new WebSocket(url);
  } else {
    ws = {};
  }
  ws.onopen = (_) => on_open(ws);
  ws.onmessage = (event2) => {
    if (typeof event2.data === "string") {
      on_text(event2.data);
    } else {
      on_binary(event2.data);
    }
  };
  ws.onclose = (event2) => on_close(event2.code);
};
var send_over_websocket = (ws, msg) => ws.send(msg);
var get_page_url = () => document.URL;

// build/dev/javascript/lustre_websocket/lustre_websocket.mjs
var Normal = class extends CustomType {
};
var GoingAway = class extends CustomType {
};
var ProtocolError = class extends CustomType {
};
var UnexpectedTypeOfData = class extends CustomType {
};
var NoCodeFromServer = class extends CustomType {
};
var AbnormalClose = class extends CustomType {
};
var IncomprehensibleFrame = class extends CustomType {
};
var PolicyViolated = class extends CustomType {
};
var MessageTooBig = class extends CustomType {
};
var FailedExtensionNegotation = class extends CustomType {
};
var UnexpectedFailure = class extends CustomType {
};
var FailedTLSHandshake = class extends CustomType {
};
var OtherCloseReason = class extends CustomType {
};
var InvalidUrl = class extends CustomType {
};
var OnOpen = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var OnTextMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var OnBinaryMessage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var OnClose = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function code_to_reason(code) {
  if (code === 1e3) {
    return new Normal();
  } else if (code === 1001) {
    return new GoingAway();
  } else if (code === 1002) {
    return new ProtocolError();
  } else if (code === 1003) {
    return new UnexpectedTypeOfData();
  } else if (code === 1005) {
    return new NoCodeFromServer();
  } else if (code === 1006) {
    return new AbnormalClose();
  } else if (code === 1007) {
    return new IncomprehensibleFrame();
  } else if (code === 1008) {
    return new PolicyViolated();
  } else if (code === 1009) {
    return new MessageTooBig();
  } else if (code === 1010) {
    return new FailedExtensionNegotation();
  } else if (code === 1011) {
    return new UnexpectedFailure();
  } else if (code === 1015) {
    return new FailedTLSHandshake();
  } else {
    return new OtherCloseReason();
  }
}
function convert_scheme(scheme) {
  if (scheme === "https") {
    return new Ok("wss");
  } else if (scheme === "http") {
    return new Ok("ws");
  } else if (scheme === "ws") {
    return new Ok(scheme);
  } else if (scheme === "wss") {
    return new Ok(scheme);
  } else {
    return new Error(void 0);
  }
}
function do_get_websocket_path(path, page_uri2) {
  let path_uri = (() => {
    let _pipe = parse2(path);
    return unwrap2(
      _pipe,
      new Uri(
        new None(),
        new None(),
        new None(),
        new None(),
        path,
        new None(),
        new None()
      )
    );
  })();
  return try$(
    merge(page_uri2, path_uri),
    (merged) => {
      return try$(
        to_result(merged.scheme, void 0),
        (merged_scheme) => {
          return try$(
            convert_scheme(merged_scheme),
            (ws_scheme) => {
              let _pipe = merged.withFields({ scheme: new Some(ws_scheme) });
              let _pipe$1 = to_string4(_pipe);
              return new Ok(_pipe$1);
            }
          );
        }
      );
    }
  );
}
function send2(ws, msg) {
  return from2((_) => {
    return send_over_websocket(ws, msg);
  });
}
function page_uri() {
  let _pipe = get_page_url();
  return parse2(_pipe);
}
function get_websocket_path(path) {
  let _pipe = page_uri();
  return try$(
    _pipe,
    (_capture) => {
      return do_get_websocket_path(path, _capture);
    }
  );
}
function init2(path, wrapper) {
  let _pipe = (dispatch) => {
    let $ = get_websocket_path(path);
    if ($.isOk()) {
      let url = $[0];
      return init_websocket(
        url,
        (ws) => {
          return dispatch(wrapper(new OnOpen(ws)));
        },
        (text3) => {
          return dispatch(wrapper(new OnTextMessage(text3)));
        },
        (data) => {
          return dispatch(wrapper(new OnBinaryMessage(data)));
        },
        (code) => {
          let _pipe2 = code;
          let _pipe$1 = code_to_reason(_pipe2);
          let _pipe$2 = new OnClose(_pipe$1);
          let _pipe$3 = wrapper(_pipe$2);
          return dispatch(_pipe$3);
        }
      );
    } else {
      let _pipe2 = new InvalidUrl();
      let _pipe$1 = wrapper(_pipe2);
      return dispatch(_pipe$1);
    }
  };
  return from2(_pipe);
}

// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = window?.location?.href;
var do_initial_uri = () => {
  if (!initial_location) {
    return new Error(void 0);
  } else {
    return new Ok(uri_from_url(new URL(initial_location)));
  }
};
var do_init = (dispatch, options = defaults) => {
  document.body.addEventListener("click", (event2) => {
    const a2 = find_anchor(event2.target);
    if (!a2)
      return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host;
      if (!options.handle_external_links && is_external)
        return;
      if (!options.handle_internal_links && !is_external)
        return;
      event2.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          }
        });
      }
      return dispatch(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    });
    dispatch(uri);
  });
};
var do_push = (uri) => {
  const url = to_string4(uri);
  console.log(url);
  window.history.pushState({}, "", url);
  window.requestAnimationFrame(() => {
    if (uri.fragment[0]) {
      document.getElementById(uri.fragment[0])?.scrollIntoView();
    }
  });
};
var find_anchor = (el2) => {
  if (el2.tagName === "BODY") {
    return null;
  } else if (el2.tagName === "A") {
    return el2;
  } else {
    return find_anchor(el2.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(
    /* scheme   */
    url.protocol ? new Some(url.protocol) : new None(),
    /* userinfo */
    new None(),
    /* host     */
    url.hostname ? new Some(url.hostname) : new None(),
    /* port     */
    url.port ? new Some(Number(url.port)) : new None(),
    /* path     */
    url.pathname,
    /* query    */
    url.search ? new Some(url.search.slice(1)) : new None(),
    /* fragment */
    url.hash ? new Some(url.hash.slice(1)) : new None()
  );
};

// build/dev/javascript/modem/modem.mjs
function init3(handler) {
  return from2(
    (dispatch) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_init(
            (uri) => {
              let _pipe = uri;
              let _pipe$1 = handler(_pipe);
              return dispatch(_pipe$1);
            }
          );
        }
      );
    }
  );
}
function push(uri) {
  return from2(
    (_) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_push(uri);
        }
      );
    }
  );
}

// build/dev/javascript/plinth/storage_ffi.mjs
function localStorage() {
  try {
    if (globalThis.Storage && globalThis.localStorage instanceof globalThis.Storage) {
      return new Ok(globalThis.localStorage);
    } else {
      return new Error(null);
    }
  } catch {
    return new Error(null);
  }
}
function getItem(storage, keyName) {
  return null_or(storage.getItem(keyName));
}
function setItem(storage, keyName, keyValue) {
  try {
    storage.setItem(keyName, keyValue);
    return new Ok(null);
  } catch {
    return new Error(null);
  }
}
function null_or(val) {
  if (val !== null) {
    return new Ok(val);
  } else {
    return new Error(null);
  }
}

// build/dev/javascript/shared/shared.mjs
var CreateRoomRequest = class extends CustomType {
};
var JoinRoomRequest = class extends CustomType {
  constructor(room_code) {
    super();
    this.room_code = room_code;
  }
};
var RoomResponse = class extends CustomType {
  constructor(room_code, player_id) {
    super();
    this.room_code = room_code;
    this.player_id = player_id;
  }
};
var AddWord = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ListWords = class extends CustomType {
};
var StartRound = class extends CustomType {
};
var SubmitOrderedWords = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var InitialRoomState = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var PlayersInRoom = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var WordList = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var RoundInfo = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ServerError = class extends CustomType {
  constructor(reason) {
    super();
    this.reason = reason;
  }
};
var Player = class extends CustomType {
  constructor(id2, name) {
    super();
    this.id = id2;
    this.name = name;
  }
};
var Round = class extends CustomType {
  constructor(words, leading_player, other_players) {
    super();
    this.words = words;
    this.leading_player = leading_player;
    this.other_players = other_players;
  }
};
var Room = class extends CustomType {
  constructor(room_code, players, word_list, round3) {
    super();
    this.room_code = room_code;
    this.players = players;
    this.word_list = word_list;
    this.round = round3;
  }
};
function player_from_json(player) {
  let _pipe = player;
  return decode2(
    (var0, var1) => {
      return new Player(var0, var1);
    },
    field("id", string),
    field("name", string)
  )(_pipe);
}
function player_with_preferences_from_json(player_with_prefs) {
  let _pipe = player_with_prefs;
  return decode2(
    (player, prefs) => {
      return [player, prefs];
    },
    field("player", player_from_json),
    field("wordOrder", list(string))
  )(_pipe);
}
function round_from_json(round3) {
  let _pipe = round3;
  return decode3(
    (var0, var1, var2) => {
      return new Round(var0, var1, var2);
    },
    field("words", list(string)),
    field("leadingPlayer", player_with_preferences_from_json),
    field(
      "otherPlayers",
      list(player_with_preferences_from_json)
    )
  )(_pipe);
}
function room_from_json(room) {
  let _pipe = room;
  return decode4(
    (var0, var1, var2, var3) => {
      return new Room(var0, var1, var2, var3);
    },
    field("roomCode", string),
    field("players", list(player_from_json)),
    field("wordList", list(string)),
    optional_field("round", round_from_json)
  )(_pipe);
}
function encode_http_request(request) {
  let $ = (() => {
    let _pipe = (() => {
      if (request instanceof CreateRoomRequest) {
        return ["createRoom", null$()];
      } else {
        let room_code = request.room_code;
        return ["joinRoom", string2(room_code)];
      }
    })();
    return map_first(_pipe, string2);
  })();
  let t = $[0];
  let message = $[1];
  return object2(toList([["type", t], ["message", message]]));
}
function encode_request(request) {
  let $ = (() => {
    let _pipe2 = (() => {
      if (request instanceof AddWord) {
        let word = request[0];
        return ["addWord", string2(word)];
      } else if (request instanceof ListWords) {
        return ["listWords", null$()];
      } else if (request instanceof StartRound) {
        return ["startRound", null$()];
      } else {
        let ordered_words = request[0];
        return ["submitOrderedWords", array2(ordered_words, string2)];
      }
    })();
    return map_first(_pipe2, string2);
  })();
  let t = $[0];
  let message = $[1];
  let _pipe = object2(toList([["type", t], ["message", message]]));
  return to_string6(_pipe);
}
function decode_http_response_json(response) {
  let type_decoder = decode2(
    (t, msg) => {
      return [t, msg];
    },
    field("type", string),
    field("message", dynamic)
  );
  let $ = type_decoder(response);
  if ($.isOk() && $[0][0] === "joinedRoom") {
    let msg = $[0][1];
    let _pipe = msg;
    return decode2(
      (var0, var1) => {
        return new RoomResponse(var0, var1);
      },
      field("roomCode", string),
      field("playerId", string)
    )(_pipe);
  } else if ($.isOk()) {
    let request_type = $[0][0];
    return new Error(
      toList([
        new DecodeError(
          "unknown request type",
          request_type,
          toList([])
        )
      ])
    );
  } else {
    let e = $[0];
    return new Error(e);
  }
}
function decode_errs_to_string(errs) {
  return fold(
    errs,
    "Error decoding message:",
    (err_string, err) => {
      let expected = err.expected;
      let found = err.found;
      return err_string + " expected: " + expected + ", found: " + found + ";";
    }
  );
}
function decode_websocket_response(text3) {
  let type_decoder = decode2(
    (t, msg) => {
      return [t, msg];
    },
    field("type", string),
    field("message", dynamic)
  );
  let response_with_type = decode5(text3, type_decoder);
  let _pipe = (() => {
    if (response_with_type.isOk() && response_with_type[0][0] === "room") {
      let msg = response_with_type[0][1];
      let _pipe2 = msg;
      return decode1(
        (var0) => {
          return new InitialRoomState(var0);
        },
        room_from_json
      )(_pipe2);
    } else if (response_with_type.isOk() && response_with_type[0][0] === "playersInRoom") {
      let msg = response_with_type[0][1];
      let _pipe2 = msg;
      return decode1(
        (var0) => {
          return new PlayersInRoom(var0);
        },
        list(player_from_json)
      )(_pipe2);
    } else if (response_with_type.isOk() && response_with_type[0][0] === "wordList") {
      let msg = response_with_type[0][1];
      let _pipe2 = msg;
      return decode1(
        (var0) => {
          return new WordList(var0);
        },
        list(string)
      )(_pipe2);
    } else if (response_with_type.isOk() && response_with_type[0][0] === "roundInfo") {
      let msg = response_with_type[0][1];
      let _pipe2 = msg;
      return decode1(
        (var0) => {
          return new RoundInfo(var0);
        },
        round_from_json
      )(_pipe2);
    } else if (response_with_type.isOk() && response_with_type[0][0] === "error") {
      let msg = response_with_type[0][1];
      let _pipe2 = msg;
      return decode1(
        (var0) => {
          return new ServerError(var0);
        },
        string
      )(_pipe2);
    } else if (response_with_type.isOk()) {
      let request_type = response_with_type[0][0];
      return new Error(
        toList([
          new DecodeError(
            "unknown request type",
            request_type,
            toList([])
          )
        ])
      );
    } else if (!response_with_type.isOk() && response_with_type[0] instanceof UnexpectedFormat) {
      let e = response_with_type[0][0];
      return new Error(e);
    } else if (!response_with_type.isOk() && response_with_type[0] instanceof UnexpectedByte) {
      let byte = response_with_type[0].byte;
      return new Error(
        toList([new DecodeError("invalid request", byte, toList([]))])
      );
    } else if (!response_with_type.isOk() && response_with_type[0] instanceof UnexpectedSequence) {
      let byte = response_with_type[0].byte;
      return new Error(
        toList([new DecodeError("invalid request", byte, toList([]))])
      );
    } else {
      return new Error(
        toList([
          new DecodeError(
            "bad request: unexpected end of input",
            "",
            toList([])
          )
        ])
      );
    }
  })();
  return map_error(_pipe, decode_errs_to_string);
}

// build/dev/javascript/client/client.mjs
var NotInRoom = class extends CustomType {
  constructor(uri, route, room_code_input) {
    super();
    this.uri = uri;
    this.route = route;
    this.room_code_input = room_code_input;
  }
};
var Disconnected = class extends CustomType {
  constructor(player_id, room_code, player_name) {
    super();
    this.player_id = player_id;
    this.room_code = room_code;
    this.player_name = player_name;
  }
};
var Connected = class extends CustomType {
  constructor(player_id, room_code, player_name, ws, room, round3, add_word_input) {
    super();
    this.player_id = player_id;
    this.room_code = room_code;
    this.player_name = player_name;
    this.ws = ws;
    this.room = room;
    this.round = round3;
    this.add_word_input = add_word_input;
  }
};
var RoundState = class extends CustomType {
  constructor(round3, ordered_words) {
    super();
    this.round = round3;
    this.ordered_words = ordered_words;
  }
};
var Home = class extends CustomType {
};
var Play = class extends CustomType {
  constructor(room_code) {
    super();
    this.room_code = room_code;
  }
};
var NotFound2 = class extends CustomType {
};
var OnRouteChange = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var WebSocketEvent = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var StartGame = class extends CustomType {
};
var JoinGame = class extends CustomType {
};
var JoinedRoom = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UpdateRoomCode = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UpdatePlayerName = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var SetPlayerName = class extends CustomType {
};
var UpdateAddWordInput = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var AddWord2 = class extends CustomType {
};
var StartRound2 = class extends CustomType {
};
var AddNextPreferedWord = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var ClearOrderedWords = class extends CustomType {
};
var SubmitOrderedWords2 = class extends CustomType {
};
function new_uri() {
  return new Uri(
    new None(),
    new None(),
    new None(),
    new None(),
    "",
    new None(),
    new None()
  );
}
function relative(path) {
  return new_uri().withFields({ path });
}
function handle_ws_message(model, msg) {
  if (model instanceof NotInRoom) {
    return [model, none()];
  } else if (model instanceof Disconnected) {
    return [model, none()];
  } else {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws = model.ws;
    let room = model.room;
    let round_state = model.round;
    let add_word_input = model.add_word_input;
    let $ = decode_websocket_response(msg);
    if ($.isOk() && $[0] instanceof InitialRoomState) {
      let room$1 = $[0][0];
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          ws,
          new Some(room$1),
          or(
            (() => {
              let _pipe = room$1.round;
              return map(
                _pipe,
                (round3) => {
                  return new RoundState(round3, toList([]));
                }
              );
            })(),
            round_state
          ),
          add_word_input
        ),
        none()
      ];
    } else if ($.isOk() && $[0] instanceof PlayersInRoom) {
      let player_list = $[0][0];
      let room$1 = map(
        room,
        (room2) => {
          return room2.withFields({ players: player_list });
        }
      );
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          ws,
          room$1,
          round_state,
          add_word_input
        ),
        none()
      ];
    } else if ($.isOk() && $[0] instanceof WordList) {
      let word_list = $[0][0];
      let room$1 = map(
        room,
        (room2) => {
          return room2.withFields({ word_list });
        }
      );
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          ws,
          room$1,
          round_state,
          add_word_input
        ),
        none()
      ];
    } else if ($.isOk() && $[0] instanceof RoundInfo) {
      let round3 = $[0][0];
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          ws,
          room,
          (() => {
            let _pipe = round_state;
            let _pipe$1 = map(
              _pipe,
              (round_state2) => {
                return round_state2.withFields({ round: round3 });
              }
            );
            let _pipe$2 = unwrap(
              _pipe$1,
              new RoundState(round3, toList([]))
            );
            return new Some(_pipe$2);
          })(),
          add_word_input
        ),
        none()
      ];
    } else if ($.isOk() && $[0] instanceof ServerError) {
      let reason = $[0].reason;
      debug(reason);
      return [model, none()];
    } else {
      let reason = $[0];
      debug(reason);
      return [model, none()];
    }
  }
}
function start_game() {
  return get2(
    "http://localhost:3000/createroom",
    expect_json(
      decode_http_response_json,
      (var0) => {
        return new JoinedRoom(var0);
      }
    )
  );
}
function join_game(room_code) {
  return post(
    "http://localhost:3000/joinroom",
    encode_http_request(new JoinRoomRequest(room_code)),
    expect_json(
      decode_http_response_json,
      (var0) => {
        return new JoinedRoom(var0);
      }
    )
  );
}
function update2(model, msg) {
  if (model instanceof NotInRoom && msg instanceof StartGame) {
    return [model, start_game()];
  } else if (model instanceof NotInRoom && msg instanceof JoinedRoom && msg[0].isOk() && msg[0][0] instanceof RoomResponse) {
    let uri = model.uri;
    let room_code = msg[0][0].room_code;
    let player_id = msg[0][0].player_id;
    return [
      new Disconnected(player_id, room_code, ""),
      push(
        relative("/play").withFields({
          query: new Some(query_to_string(toList([["game", room_code]])))
        })
      )
    ];
  } else if (model instanceof NotInRoom && msg instanceof JoinedRoom && !msg[0].isOk()) {
    let err = msg[0][0];
    debug(err);
    return [model, none()];
  } else if (model instanceof NotInRoom && msg instanceof OnRouteChange) {
    let room_code_input = model.room_code_input;
    let uri = msg[0];
    let route = msg[1];
    return [new NotInRoom(uri, route, room_code_input), none()];
  } else if (model instanceof NotInRoom && msg instanceof UpdateRoomCode) {
    let uri = model.uri;
    let route = model.route;
    let room_code = msg[0];
    return [new NotInRoom(uri, route, room_code), none()];
  } else if (model instanceof NotInRoom && msg instanceof JoinGame) {
    let room_code_input = model.room_code_input;
    return [model, join_game(room_code_input)];
  } else if (model instanceof NotInRoom && msg instanceof UpdatePlayerName) {
    return [model, none()];
  } else if (model instanceof NotInRoom) {
    return [model, none()];
  } else if (model instanceof Disconnected && msg instanceof UpdatePlayerName) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = msg[0];
    return [new Disconnected(player_id, room_code, player_name), none()];
  } else if (model instanceof Disconnected && msg instanceof SetPlayerName) {
    let player_id = model.player_id;
    let player_name = model.player_name;
    let $ = (() => {
      let _pipe = localStorage();
      return try$(
        _pipe,
        (local_storage) => {
          return all(
            toList([
              setItem(local_storage, "connection_id", player_id),
              setItem(local_storage, "player_name", player_name)
            ])
          );
        }
      );
    })();
    return [
      model,
      init2(
        "ws://localhost:3000/ws/" + player_id + "/" + player_name,
        (var0) => {
          return new WebSocketEvent(var0);
        }
      )
    ];
  } else if (model instanceof Disconnected && msg instanceof WebSocketEvent) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws_event = msg[0];
    if (ws_event instanceof InvalidUrl) {
      throw makeError(
        "panic",
        "client",
        195,
        "update",
        "panic expression evaluated",
        {}
      );
    } else if (ws_event instanceof OnOpen) {
      let socket = ws_event[0];
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          socket,
          new None(),
          new None(),
          ""
        ),
        none()
      ];
    } else if (ws_event instanceof OnTextMessage) {
      let msg$1 = ws_event[0];
      return handle_ws_message(model, msg$1);
    } else if (ws_event instanceof OnBinaryMessage) {
      return [model, none()];
    } else {
      return [
        new Disconnected(player_id, room_code, player_name),
        none()
      ];
    }
  } else if (model instanceof Connected && msg instanceof WebSocketEvent) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws_event = msg[0];
    if (ws_event instanceof InvalidUrl) {
      throw makeError(
        "panic",
        "client",
        195,
        "update",
        "panic expression evaluated",
        {}
      );
    } else if (ws_event instanceof OnOpen) {
      let socket = ws_event[0];
      return [
        new Connected(
          player_id,
          room_code,
          player_name,
          socket,
          new None(),
          new None(),
          ""
        ),
        none()
      ];
    } else if (ws_event instanceof OnTextMessage) {
      let msg$1 = ws_event[0];
      return handle_ws_message(model, msg$1);
    } else if (ws_event instanceof OnBinaryMessage) {
      return [model, none()];
    } else {
      return [
        new Disconnected(player_id, room_code, player_name),
        none()
      ];
    }
  } else if (model instanceof Connected && msg instanceof AddWord2) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws = model.ws;
    let room = model.room;
    let round3 = model.round;
    let add_word_input = model.add_word_input;
    return [
      new Connected(player_id, room_code, player_name, ws, room, round3, ""),
      send2(ws, encode_request(new AddWord(add_word_input)))
    ];
  } else if (model instanceof Connected && msg instanceof UpdateAddWordInput) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws = model.ws;
    let room = model.room;
    let round3 = model.round;
    let value3 = msg[0];
    return [
      new Connected(player_id, room_code, player_name, ws, room, round3, value3),
      none()
    ];
  } else if (model instanceof Connected && msg instanceof StartRound2) {
    let ws = model.ws;
    return [
      model,
      send2(ws, encode_request(new StartRound()))
    ];
  } else if (model instanceof Connected && model.round instanceof Some && msg instanceof AddNextPreferedWord) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws = model.ws;
    let room = model.room;
    let round_state = model.round[0];
    let add_word_input = model.add_word_input;
    let word = msg[0];
    return [
      new Connected(
        player_id,
        room_code,
        player_name,
        ws,
        room,
        new Some(
          round_state.withFields({
            ordered_words: prepend(
              word,
              (() => {
                let _pipe = round_state.ordered_words;
                return filter(
                  _pipe,
                  (existing_word) => {
                    return existing_word !== word;
                  }
                );
              })()
            )
          })
        ),
        add_word_input
      ),
      none()
    ];
  } else if (model instanceof Connected && model.round instanceof Some && msg instanceof ClearOrderedWords) {
    let player_id = model.player_id;
    let room_code = model.room_code;
    let player_name = model.player_name;
    let ws = model.ws;
    let room = model.room;
    let round_state = model.round[0];
    let add_word_input = model.add_word_input;
    return [
      new Connected(
        player_id,
        room_code,
        player_name,
        ws,
        room,
        new Some(round_state.withFields({ ordered_words: toList([]) })),
        add_word_input
      ),
      none()
    ];
  } else if (model instanceof Connected && model.round instanceof Some && msg instanceof SubmitOrderedWords2) {
    let ws = model.ws;
    let round_state = model.round[0];
    return [
      model,
      send2(
        ws,
        encode_request(
          new SubmitOrderedWords(round_state.ordered_words)
        )
      )
    ];
  } else if (model instanceof Connected) {
    return [model, none()];
  } else {
    return [model, none()];
  }
}
function get_route_from_uri(uri) {
  let room_code = (() => {
    let _pipe = uri.query;
    let _pipe$1 = map(_pipe, parse_query2);
    return then$(
      _pipe$1,
      (query) => {
        if (query.isOk() && query[0].hasLength(1) && query[0].head[0] === "game") {
          let room_code2 = query[0].head[1];
          return new Some(room_code2);
        } else {
          return new None();
        }
      }
    );
  })();
  let $ = path_segments(uri.path);
  if ($.hasLength(1) && $.head === "") {
    return new Home();
  } else if ($.hasLength(0)) {
    return new Home();
  } else if ($.hasLength(1) && $.head === "play") {
    let room_code$1 = room_code;
    return new Play(room_code$1);
  } else {
    return new NotFound2();
  }
}
function on_url_change(uri) {
  let _pipe = get_route_from_uri(uri);
  return ((_capture) => {
    return new OnRouteChange(uri, _capture);
  })(_pipe);
}
function init4(_) {
  let uri = do_initial_uri();
  let $ = (() => {
    let _pipe = uri;
    return map3(_pipe, get_route_from_uri);
  })();
  if (uri.isOk() && $.isOk() && $[0] instanceof Play && $[0].room_code instanceof Some) {
    let uri$1 = uri[0];
    let room_code = $[0].room_code[0];
    let rejoin = (() => {
      let _pipe = localStorage();
      return try$(
        _pipe,
        (local_storage) => {
          return try$(
            getItem(local_storage, "connection_id"),
            (id2) => {
              return map3(
                getItem(local_storage, "player_name"),
                (name) => {
                  return [
                    id2,
                    name,
                    init2(
                      "ws://localhost:3000/ws/" + id2 + "/" + name,
                      (var0) => {
                        return new WebSocketEvent(var0);
                      }
                    )
                  ];
                }
              );
            }
          );
        }
      );
    })();
    if (rejoin.isOk()) {
      let id2 = rejoin[0][0];
      let name = rejoin[0][1];
      let msg = rejoin[0][2];
      return [new Disconnected(id2, room_code, name), msg];
    } else {
      return [
        new NotInRoom(uri$1, new Play(new Some(room_code)), room_code),
        batch(
          toList([join_game(room_code), init3(on_url_change)])
        )
      ];
    }
  } else if (uri.isOk() && $.isOk()) {
    let uri$1 = uri[0];
    let route = $[0];
    return [new NotInRoom(uri$1, route, ""), init3(on_url_change)];
  } else if (!uri.isOk() && !uri[0]) {
    return [
      new NotInRoom(relative(""), new Home(), ""),
      init3(on_url_change)
    ];
  } else {
    return [
      new NotInRoom(relative(""), new Home(), ""),
      init3(on_url_change)
    ];
  }
}
function link(href2, content2) {
  return a(
    toList([
      class$("p-2 underline border-solid rounded m-2"),
      href(href2)
    ]),
    content2
  );
}
function header(model) {
  if (model instanceof NotInRoom && model.route instanceof Home) {
    return h1(
      toList([class$("text-4xl my-10 text-center")]),
      toList([text("A Full Fridge")])
    );
  } else if (model instanceof NotInRoom && model.route instanceof Play && model.route.room_code instanceof Some) {
    return div(
      toList([]),
      toList([
        nav(
          toList([class$("flex items-center")]),
          toList([link("/", toList([text("Home")]))])
        ),
        h1(
          toList([class$("text-2xl my-5")]),
          toList([text("Joining game...")])
        )
      ])
    );
  } else if (model instanceof NotInRoom && model.route instanceof Play && model.route.room_code instanceof None) {
    return div(
      toList([]),
      toList([
        nav(
          toList([class$("flex items-center")]),
          toList([link("/", toList([text("Home")]))])
        ),
        h1(
          toList([class$("text-2xl my-5")]),
          toList([text("Join game")])
        )
      ])
    );
  } else if (model instanceof Connected) {
    let room_code = model.room_code;
    return div(
      toList([]),
      toList([
        nav(toList([class$("flex items-center")]), toList([])),
        h1(
          toList([class$("text-2xl my-5")]),
          toList([text("Game: " + room_code)])
        )
      ])
    );
  } else if (model instanceof Disconnected) {
    let room_code = model.room_code;
    return div(
      toList([]),
      toList([
        nav(toList([class$("flex items-center")]), toList([])),
        h1(
          toList([class$("text-2xl my-5")]),
          toList([text("Game: " + room_code)])
        )
      ])
    );
  } else {
    return div(
      toList([]),
      toList([
        nav(
          toList([class$("flex items-center")]),
          toList([link("/", toList([text("Home")]))])
        ),
        h1(
          toList([class$("text-2xl my-5")]),
          toList([text("Page not found")])
        )
      ])
    );
  }
}
function get_choosing_player_text(player_id, leading_player) {
  let $ = leading_player.id === player_id;
  if ($) {
    return "You are choosing.";
  } else {
    return leading_player.name + " is choosing.";
  }
}
function content(model) {
  if (model instanceof NotInRoom && model.route instanceof Home) {
    return div(
      toList([]),
      toList([
        p(
          toList([class$("mx-4 text-lg")]),
          toList([
            text("Welcome to "),
            span(toList([]), toList([text("A Full Fridge")])),
            text(
              ", a game about preferences best played with friends."
            )
          ])
        ),
        button2(
          toList([on_click(new StartGame())]),
          toList([text("Start new game")])
        ),
        link("/play", toList([text("Join a game")]))
      ])
    );
  } else if (model instanceof NotInRoom && model.route instanceof Play && model.route.room_code instanceof Some) {
    let room_code = model.route.room_code[0];
    return text("Joining room " + room_code + "...");
  } else if (model instanceof NotInRoom && model.route instanceof Play && model.route.room_code instanceof None) {
    let room_code_input = model.room_code_input;
    return form(
      toList([
        on_submit(new JoinGame()),
        class$("flex flex-col m-4")
      ]),
      toList([
        label(
          toList([for$("room-code-input")]),
          toList([text("Enter game code:")])
        ),
        input2(
          toList([
            id("room-code-input"),
            placeholder("glittering-intelligent-iguana"),
            type_("text"),
            class$(
              "my-2 p-2 border-2 rounded placeholder:text-slate-300 placeholder:tracking-widest font-mono"
            ),
            on_input((var0) => {
              return new UpdateRoomCode(var0);
            }),
            value(room_code_input)
          ])
        ),
        button2(
          toList([type_("submit")]),
          toList([text("Join")])
        )
      ])
    );
  } else if (model instanceof Connected && model.room instanceof Some && model.round instanceof Some) {
    let player_id = model.player_id;
    let round_state = model.round[0];
    return div(
      toList([class$("flex flex-col m-4")]),
      toList([
        div(
          toList([]),
          toList([
            h2(
              toList([]),
              toList([
                text(
                  get_choosing_player_text(
                    player_id,
                    round_state.round.leading_player[0]
                  )
                )
              ])
            )
          ])
        ),
        prose2(
          toList([]),
          toList([
            h2(toList([]), toList([text("Words:")])),
            group2(
              toList([]),
              map2(
                round_state.round.words,
                (word) => {
                  return button3(
                    toList([on_click(new AddNextPreferedWord(word))]),
                    toList([text(word)])
                  );
                }
              )
            ),
            ol(
              toList([]),
              (() => {
                let _pipe = reverse(round_state.ordered_words);
                return map2(
                  _pipe,
                  (word) => {
                    return li(toList([]), toList([text(word)]));
                  }
                );
              })()
            ),
            button3(
              toList([
                on_click(new ClearOrderedWords()),
                disabled(
                  isEqual(round_state.ordered_words, toList([]))
                ),
                error()
              ]),
              toList([text("Clear")])
            ),
            button3(
              toList([
                on_click(new SubmitOrderedWords2()),
                disabled(
                  length(round_state.ordered_words) !== length(
                    round_state.round.words
                  )
                ),
                solid()
              ]),
              toList([text("Submit")])
            )
          ])
        )
      ])
    );
  } else if (model instanceof Connected && model.room instanceof Some && model.round instanceof None) {
    let player_id = model.player_id;
    let room = model.room[0];
    let add_word_input = model.add_word_input;
    return div(
      toList([class$("flex flex-col m-4")]),
      toList([
        div(
          toList([]),
          toList([
            button2(
              toList([on_click(new StartRound2())]),
              toList([text("Start game")])
            )
          ])
        ),
        div(
          toList([]),
          toList([
            h2(toList([]), toList([text("Players:")])),
            ul(
              toList([]),
              map2(
                room.players,
                (player) => {
                  let display = (() => {
                    let _pipe = (() => {
                      let $ = player.name;
                      let $1 = player.id;
                      if ($ === "" && $1 === player_id) {
                        let id2 = $1;
                        return id2 + " (you)";
                      } else if ($1 === player_id) {
                        let name = $;
                        let id2 = $1;
                        return name + " (you)";
                      } else if ($ === "") {
                        let id2 = $1;
                        return id2;
                      } else {
                        let name = $;
                        return name;
                      }
                    })();
                    return text(_pipe);
                  })();
                  return li(toList([]), toList([display]));
                }
              )
            )
          ])
        ),
        form(
          toList([on_submit(new AddWord2())]),
          toList([
            label(
              toList([for$("add-word-input")]),
              toList([text("Add word to list")])
            ),
            input2(
              toList([
                id("add-word-input"),
                type_("text"),
                class$(
                  "my-2 p-2 border-2 rounded placeholder:text-slate-300 placeholder:tracking-widest font-mono"
                ),
                on_input(
                  (var0) => {
                    return new UpdateAddWordInput(var0);
                  }
                ),
                value(add_word_input)
              ])
            ),
            button2(
              toList([type_("submit")]),
              toList([text("Add")])
            )
          ])
        ),
        div(
          toList([]),
          toList([
            h2(toList([]), toList([text("Words:")])),
            ul(
              toList([]),
              map2(
                room.word_list,
                (word) => {
                  return li(toList([]), toList([text(word)]));
                }
              )
            )
          ])
        )
      ])
    );
  } else if (model instanceof Disconnected) {
    let player_name = model.player_name;
    return div(
      toList([class$("flex flex-col m-4")]),
      toList([
        form(
          toList([
            on_submit(new SetPlayerName()),
            class$("flex flex-col m-4")
          ]),
          toList([
            label(
              toList([for$("name-input")]),
              toList([text("Name:")])
            ),
            input2(
              toList([
                id("name-input"),
                placeholder("Enter name..."),
                on_input(
                  (var0) => {
                    return new UpdatePlayerName(var0);
                  }
                ),
                value(player_name),
                type_("text"),
                class$(
                  "my-2 p-2 border-2 rounded placeholder:text-slate-300"
                )
              ])
            ),
            button2(
              toList([type_("submit")]),
              toList([text("Set name")])
            )
          ])
        )
      ])
    );
  } else if (model instanceof Connected && model.room instanceof None) {
    let room_code = model.room_code;
    let player_name = model.player_name;
    return div(
      toList([class$("flex flex-col m-4")]),
      toList([
        div(
          toList([]),
          toList([
            h2(toList([]), toList([text(player_name)])),
            text("Connecting to room " + room_code + "...")
          ])
        )
      ])
    );
  } else if (model instanceof NotInRoom && model.route instanceof NotFound2) {
    return text("Page not found");
  } else {
    return text("Page not found");
  }
}
function view(model) {
  let content$1 = content(model);
  return div(
    toList([]),
    toList([elements(), header(model), content$1])
  );
}
function main() {
  let app = application(init4, update2, view);
  let $ = start3(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "client",
      73,
      "main",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
