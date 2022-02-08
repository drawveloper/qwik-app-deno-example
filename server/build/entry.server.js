/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
const EMPTY_ARRAY = [];
const EMPTY_OBJ = {};
{
  Object.freeze(EMPTY_ARRAY);
  Object.freeze(EMPTY_OBJ);
}
function isQrl(value) {
  return value instanceof QRLInternal;
}
class QRL {
  constructor(chunk, symbol, symbolRef, symbolFn, capture, captureRef, guard, guardRef) {
    this.chunk = chunk;
    this.symbol = symbol;
    this.symbolRef = symbolRef;
    this.symbolFn = symbolFn;
    this.capture = capture;
    this.captureRef = captureRef;
    this.guard = guard;
    this.guardRef = guardRef;
    this.canonicalChunk = chunk.replace(FIND_EXT, "");
  }
}
const QRLInternal = QRL;
const FIND_EXT = /\.[\w?=&]+$/;
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function assertDefined(value, text) {
  {
    if (value != null)
      return;
    throw newError(text || "Expected defined value.");
  }
}
function assertNotEqual(value1, value2, text) {
  {
    if (value1 !== value2)
      return;
    throw newError(text || `Expected '${value1}' !== '${value2}'.`);
  }
}
function assertEqual(value1, value2, text) {
  {
    if (value1 === value2)
      return;
    throw newError(text || `Expected '${value1}' === '${value2}'.`);
  }
}
function assertGreaterOrEqual(value1, value2, text) {
  {
    if (value1 >= value2)
      return;
    throw newError(text || `Expected '${value1}' >= '${value2}'.`);
  }
}
function assertGreater(value1, value2, text) {
  {
    if (value1 > value2)
      return;
    throw newError(text || `Expected '${value1}' > '${value2}'.`);
  }
}
function newError(text) {
  debugger;
  const error = new Error(text);
  console.error(error);
  return error;
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
let runtimeSymbolId = 0;
const RUNTIME_QRL = "/runtimeQRL";
const EXTRACT_IMPORT_PATH = /\(\s*(['"])([^\1]+)\1\s*\)/;
const EXTRACT_SELF_IMPORT = /Promise\s*\.\s*resolve/;
const EXTRACT_FILE_NAME = /[\\/(]([\w\d.\-_]+\.(js|ts)x?):/;
function toInternalQRL(qrl2) {
  assertEqual(isQrl(qrl2), true);
  return qrl2;
}
function staticQrl(chunkOrFn, symbol, lexicalScopeCapture = EMPTY_ARRAY) {
  let chunk;
  let symbolFn = null;
  if (typeof chunkOrFn === "string") {
    chunk = chunkOrFn;
  } else if (typeof chunkOrFn === "function") {
    symbolFn = chunkOrFn;
    let match;
    const srcCode = String(chunkOrFn);
    if ((match = srcCode.match(EXTRACT_IMPORT_PATH)) && match[2]) {
      chunk = match[2];
    } else if (match = srcCode.match(EXTRACT_SELF_IMPORT)) {
      const ref = "QWIK-SELF";
      const frames = new Error(ref).stack.split("\n");
      const start = frames.findIndex((f) => f.includes(ref));
      const frame = frames[start + 2];
      match = frame.match(EXTRACT_FILE_NAME);
      if (!match) {
        chunk = "main";
      } else {
        chunk = match[1];
      }
    } else {
      throw new Error("Q-ERROR: Dynamic import not found: " + srcCode);
    }
  } else {
    throw new Error("Q-ERROR: Unknown type argument: " + chunkOrFn);
  }
  return new QRLInternal(chunk, symbol, null, symbolFn, null, lexicalScopeCapture, null, null);
}
function runtimeQrl(symbol, lexicalScopeCapture = EMPTY_ARRAY) {
  return new QRLInternal(RUNTIME_QRL, "s" + runtimeSymbolId++, symbol, null, null, lexicalScopeCapture, null, null);
}
function stringifyQRL(qrl2, element) {
  const qrl_ = toInternalQRL(qrl2);
  const parts = [qrl_.chunk];
  const symbol = qrl_.symbol;
  if (symbol && symbol !== "default") {
    parts.push("#", symbol);
  }
  const guard = qrl_.guard;
  guard === null || guard === void 0 ? void 0 : guard.forEach((value, key) => parts.push("|", key, value && value.length ? "." + value.join(".") : ""));
  const capture = qrl_.capture;
  capture && capture.length && parts.push(JSON.stringify(capture));
  const qrlString = parts.join("");
  if (qrl_.chunk === RUNTIME_QRL && element) {
    const qrls = element.__qrls__ || (element.__qrls__ = new Set());
    qrls.add(qrl2);
  }
  return qrlString;
}
function parseQRL(qrl2, element) {
  if (element) {
    const qrls = element.__qrls__;
    if (qrls) {
      for (const runtimeQrl2 of qrls) {
        if (stringifyQRL(runtimeQrl2) == qrl2) {
          return runtimeQrl2;
        }
      }
    }
  }
  const endIdx = qrl2.length;
  const hashIdx = indexOf(qrl2, 0, "#");
  const guardIdx = indexOf(qrl2, hashIdx, "|");
  const captureIdx = indexOf(qrl2, guardIdx, "[");
  const chunkEndIdx = Math.min(hashIdx, guardIdx, captureIdx);
  const chunk = qrl2.substring(0, chunkEndIdx);
  const symbolStartIdx = hashIdx == endIdx ? hashIdx : hashIdx + 1;
  const symbolEndIdx = Math.min(guardIdx, captureIdx);
  const symbol = symbolStartIdx == symbolEndIdx ? "default" : qrl2.substring(symbolStartIdx, symbolEndIdx);
  const guardStartIdx = guardIdx;
  const guardEndIdx = captureIdx;
  const guard = guardStartIdx < guardEndIdx ? parseGuard(qrl2.substring(guardStartIdx, guardEndIdx)) : null;
  const captureStartIdx = captureIdx;
  const captureEndIdx = endIdx;
  const capture = captureStartIdx === captureEndIdx ? EMPTY_ARRAY : JSONparse(qrl2.substring(captureStartIdx, captureEndIdx));
  if (chunk === RUNTIME_QRL) {
    console.error(`Q-ERROR: '${qrl2}' is runtime but no instance found on element.`);
  }
  return new QRLInternal(chunk, symbol, null, null, capture, null, guard, null);
}
function JSONparse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("JSON:", json);
    throw e;
  }
}
function parseGuard(text) {
  let map = null;
  if (text) {
    text.split("|").forEach((obj) => {
      if (obj) {
        const parts = obj.split(".");
        const id = parts.shift();
        if (!map)
          map = new Map();
        map.set(id, parts);
      }
    });
  }
  return map;
}
function indexOf(text, startIdx, char) {
  const endIdx = text.length;
  const charIdx = text.indexOf(char, startIdx == endIdx ? 0 : startIdx);
  return charIdx == -1 ? endIdx : charIdx;
}
function toQrlOrError(symbolOrQrl) {
  if (!isQrl(symbolOrQrl)) {
    if (typeof symbolOrQrl == "function" || typeof symbolOrQrl == "string") {
      symbolOrQrl = runtimeQrl(symbolOrQrl);
    } else {
      throw new Error(`Q-ERROR Only 'function's and 'string's are supported.`);
    }
  }
  return symbolOrQrl;
}
function isDomElementWithTagName(node, tagName) {
  return isHtmlElement(node) && node.tagName.toUpperCase() == tagName.toUpperCase();
}
function isTemplateElement(node) {
  return isDomElementWithTagName(node, "template");
}
function isQSLotTemplateElement(node) {
  return isTemplateElement(node) && node.hasAttribute("q:slot");
}
function isComponentElement(node) {
  return isHtmlElement(node) && node.hasAttribute("on:q-render");
}
function isHtmlElement(node) {
  return node ? node.nodeType === 1 : false;
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function isNode(value) {
  return value && typeof value.nodeType == "number";
}
function isDocument(value) {
  return value && value.nodeType == 9;
}
function isElement(value) {
  return isNode(value) && value.nodeType == 1;
}
function isComment(value) {
  return isNode(value) && value.nodeType == 8;
}
const createPlatform$1 = (doc) => {
  let queuePromise;
  let storePromise;
  const moduleCache = new Map();
  return {
    importSymbol(element, url, symbolName) {
      const urlDoc = toUrl(element.ownerDocument, element, url).toString();
      const urlCopy = new URL(urlDoc);
      urlCopy.hash = "";
      urlCopy.search = "";
      const importURL = urlCopy.href;
      const mod = moduleCache.get(importURL);
      if (mod) {
        return mod[symbolName];
      }
      return import(
        /* @vite-ignore */
        importURL
      ).then((mod2) => {
        moduleCache.set(importURL, mod2);
        return mod2[symbolName];
      });
    },
    queueRender: (renderMarked2) => {
      if (!queuePromise) {
        queuePromise = new Promise((resolve, reject) => doc.defaultView.requestAnimationFrame(() => {
          queuePromise = null;
          renderMarked2(doc).then(resolve, reject);
        }));
      }
      return queuePromise;
    },
    queueStoreFlush: (flushStore) => {
      if (!storePromise) {
        storePromise = new Promise((resolve, reject) => doc.defaultView.requestAnimationFrame(() => {
          storePromise = null;
          flushStore(doc).then(resolve, reject);
        }));
      }
      return storePromise;
    }
  };
};
function toUrl(doc, element, url) {
  let _url;
  let _base = void 0;
  if (url === void 0) {
    if (element) {
      _url = element.getAttribute("q:base");
      _base = toUrl(doc, element.parentNode && element.parentNode.closest("[q\\:base]"));
    } else {
      _url = doc.baseURI;
    }
  } else if (url) {
    _url = url, _base = toUrl(doc, element.closest("[q\\:base]"));
  } else {
    throw new Error("INTERNAL ERROR");
  }
  return new URL(String(_url), _base);
}
const setPlatform = (doc, plt) => doc[DocumentPlatform] = plt;
const getPlatform = (docOrNode) => {
  const doc = isDocument(docOrNode) ? docOrNode : docOrNode.ownerDocument;
  return doc[DocumentPlatform] || (doc[DocumentPlatform] = createPlatform$1(doc));
};
const DocumentPlatform = /* @__PURE__ */ Symbol();
async function qrlImport(element, qrl2) {
  const qrl_ = toInternalQRL(qrl2);
  if (qrl_.symbolRef)
    return qrl_.symbolRef;
  const doc = element.ownerDocument;
  if (qrl_.symbolFn) {
    return qrl_.symbolRef = qrl_.symbolFn().then((module) => module[qrl_.symbol]);
  } else {
    return qrl_.symbolRef = await getPlatform(doc).importSymbol(element, qrl_.chunk, qrl_.symbol);
  }
}
function $(expression) {
  return runtimeQrl(expression);
}
const qrl = staticQrl;
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function stringifyDebug(value) {
  if (value == null)
    return String(value);
  if (typeof value === "function")
    return value.name;
  if (isHtmlElement(value))
    return stringifyElement(value);
  if (value instanceof URL)
    return String(value);
  if (typeof value === "object")
    return JSON.stringify(value, function(key, value2) {
      if (isHtmlElement(value2))
        return stringifyElement(value2);
      return value2;
    });
  return String(value);
}
function stringifyElement(element) {
  let html = "<" + element.tagName.toLowerCase();
  const attributes = element.attributes;
  const names = [];
  for (let i = 0; i < attributes.length; i++) {
    names.push(attributes[i].name);
  }
  names.sort();
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    let value = element.getAttribute(name);
    if (value === null || value === void 0 ? void 0 : value.startsWith("file:/")) {
      value = value.replace(/(file:\/\/).*(\/.*)$/, (all, protocol, file) => protocol + "..." + file);
    }
    html += " " + name + (value == null || value == "" ? "" : "='" + value.replace("'", "&apos;") + "'");
  }
  return html + ">";
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function qError(code, ...args) {
  {
    const text = codeToText(code);
    const parts = text.split("{}");
    const error = parts.map((value, index) => {
      return value + (index === parts.length - 1 ? "" : stringifyDebug(args[index]));
    }).join("");
    debugger;
    return new Error(error);
  }
}
function codeToText(code) {
  const area = {
    0: "ERROR",
    1: "QRL-ERROR",
    2: "INJECTOR-ERROR",
    3: "SERVICE-ERROR",
    4: "COMPONENT-ERROR",
    5: "PROVIDER-ERROR",
    6: "RENDER-ERROR",
    7: "EVENT-ERROR"
  }[Math.floor(code / 100)];
  const text = {
    [1]: "QConfig not found in path '{}'.",
    [2]: "Unrecognized stack format '{}'",
    [3]: "Could not find entity state '{}' at '{}' or any of it's parents.",
    [4]: "Could not find entity state '{}' ( or entity provider '{}') at '{}' or any of it's parents.",
    [5]: "Missing property '{}' in props '{}'.",
    [6]: "Missing export '{}' from '{}'. Exported symbols are: {}",
    [100]: "QRL '${}' should point to function, was '{}'.",
    [200]: "Can't find host element above '{}'.",
    [201]: "Provider is expecting '{}' but got '{}'.",
    [202]: "Expected 'Element' was '{}'.",
    [203]: "Expected injection 'this' to be of type '{}', but was of type '{}'.",
    [204]: "Entity key '{}' is found on '{}' but does not contain state. Was 'serializeState()' not run during dehydration?",
    [206]: "No injector can be found starting at '{}'.",
    [207]: "EventInjector does not support serialization.",
    [300]: "Data key '{}' is not a valid key.\n  - Data key can only contain characters (preferably lowercase) or number\n  - Data key is prefixed with entity name\n  - Data key is made up from parts that are separated with ':'.",
    [301]: "A entity with key '{}' already exists.",
    [303]: "'{}' is not a valid attribute. Attributes can only contain 'a-z' (lowercase), '0-9', '-' and '_'.",
    [304]: "Found '{}' but expando did not have entity and attribute did not have state.",
    [305]: "Element '{}' is missing entity attribute definition '{}'.",
    [306]: "Unable to create state for entity '{}' with props '{}' because no state found and '$newState()' method was not defined on entity.",
    [307]: "'{}' is not an instance of 'Entity'.",
    [308]: "'{}' overrides 'constructor' property preventing 'EntityType' retrieval.",
    [311]: "Entity '{}' does not define '$keyProps'.",
    [310]: "Entity '{}' must have static '$type' property defining the name of the entity.",
    [312]: "Entity '{}' must have static '$qrl' property defining the import location of the entity.",
    [313]: "Name collision. Already have entity named '{}' with QRL '{}' but expected QRL '{}'.",
    [309]: "Entity key '{}' is missing values. Expecting '{}:someValue'.",
    [314]: "Entity '{}' defines '$keyProps' as  '{}'. Actual key '{}' has more parts than entity defines.",
    [315]: "Key '{}' belongs to entity named '{}', but expected entity '{}' with name '{}'.",
    [316]: "Entity state is missing '$key'. Are you sure you passed in state? Got '{}'.",
    [400]: `'bind:' must have an key. (Example: 'bind:key="propertyName"').`,
    [401]: `'bind:id' must have a property name. (Example: 'bind:key="propertyName"').`,
    [402]: "Can't find state on host element.",
    [403]: "Components must be instantiated inside an injection context. Use '{}.new(...)' for creation.",
    [404]: "Property '{}' not found in '{}' on component '{}'.",
    [405]: "Unable to find '{}' component.",
    [406]: "Requesting component type '{}' does not match existing component instance '{}'.",
    [408]: "Unable to create state for component '{}' with props '{}' because no state found and '$newState()' method was not defined on component.",
    [500]: "Unrecognized expression format '{}'.",
    [600]: "Unexpected JSXNode<{}> type.",
    [601]: "Value '{}' can't be written into '{}' attribute.",
    [602]: "Expecting entity object, got '{}'.",
    [603]: "Expecting array of entities, got '{}'.",
    [604]: "Expecting Entity or Component got '{}'.",
    [699]: "Render state machine did not advance.",
    [700]: "Missing '$type' attribute in the '{}' url.",
    [701]: "Re-emitting event '{}' but no listener found at '{}' or any of its parents."
  }[code];
  let textCode = "000" + code;
  textCode = textCode.substr(textCode.length - 3);
  return `${area}(Q-${textCode}): ${text}`;
}
function arrayInsert2(array, index, value1, value2) {
  let end = array.length;
  if (end == index) {
    array.push(value1, value2);
  } else if (end === 1) {
    array.push(value2, array[0]);
    array[0] = value1;
  } else {
    end--;
    array.push(array[end - 1], array[end]);
    while (end > index) {
      const previousEnd = end - 2;
      array[end] = array[previousEnd];
      end--;
    }
    array[index] = value1;
    array[index + 1] = value2;
  }
}
function keyValueArrayGet(keyValueArray, key, notFoundFactory) {
  const index = keyValueArrayIndexOf(keyValueArray, key);
  if (index >= 0) {
    return keyValueArray[index | 1];
  }
  if (notFoundFactory) {
    const value = notFoundFactory();
    arrayInsert2(keyValueArray, ~index, key, value);
    return value;
  }
  return void 0;
}
function keyValueArrayIndexOf(keyValueArray, key) {
  return _arrayIndexOfSorted(keyValueArray, key, 1);
}
function _arrayIndexOfSorted(array, value, shift) {
  let start = 0;
  let end = array.length >> shift;
  while (end !== start) {
    const middle = start + (end - start >> 1);
    const current = array[middle << shift];
    if (value === current) {
      return middle << shift;
    } else if (current > value) {
      end = middle;
    } else {
      start = middle + 1;
    }
  }
  return ~(end << shift);
}
function isSlotMap(value) {
  return Array.isArray(value);
}
function getSlotMap(component2) {
  const slots = [];
  const host = component2.hostElement;
  const firstChild = host.firstElementChild;
  if (isQSlotTemplate(firstChild)) {
    slotMapAddChildren(slots, firstChild.content, null);
  }
  const previousSlots = [];
  host.querySelectorAll("Q\\:SLOT").forEach((qSlot) => {
    for (const parent of previousSlots) {
      if (parent.contains(qSlot)) {
        return;
      }
    }
    previousSlots.push(qSlot);
    const name = qSlot.getAttribute("name") || "";
    slotMapAddChildren(slots, qSlot, name);
  });
  return slots;
}
function isQSlotTemplate(node) {
  return isDomElementWithTagName(node, "template") && node.hasAttribute("q:slot");
}
function slotMapAddChildren(slots, parent, name) {
  _slotParent = parent;
  let child = parent.firstChild;
  if (name !== null) {
    keyValueArrayGet(slots, name, emptyArrayFactory);
  }
  while (child) {
    const slotName = name !== null ? name : isHtmlElement(child) && child.getAttribute("q:slot") || "";
    keyValueArrayGet(slots, slotName, emptyArrayFactory).push(child);
    child = child.nextSibling;
  }
  _slotParent = void 0;
}
let _slotParent;
function emptyArrayFactory() {
  return [-1, _slotParent];
}
function cursorForParent(parent) {
  let firstChild = parent.firstChild;
  if (firstChild && firstChild.nodeType === 10) {
    firstChild = firstChild.nextSibling;
  }
  return newCursor(parent, firstChild, null);
}
function newCursor(parent, node, end) {
  return { parent, node, end };
}
function getNode(cursor) {
  const node = cursor.node;
  return cursor.end == node ? null : node;
}
function setNode(cursor, node) {
  cursor.node = cursor.end == node ? null : node;
}
function cursorClone(cursor) {
  return newCursor(cursor.parent, cursor.node, cursor.end);
}
function cursorForComponent(componentHost) {
  assertEqual(isComponentElement(componentHost), true);
  let firstNonTemplate = componentHost.firstChild;
  if (isQSLotTemplateElement(firstNonTemplate)) {
    firstNonTemplate = firstNonTemplate.nextSibling;
  }
  return newCursor(componentHost, firstNonTemplate, null);
}
function cursorReconcileElement(cursor, component2, expectTag, expectProps, componentRenderQueue) {
  let node = getNode(cursor);
  assertNotEqual(node, void 0, "Cursor already closed");
  if (isSlotMap(node)) {
    assertDefined(cursor.parent);
    return slotMapReconcileSlots(cursor.parent, node, cursor.end, component2, expectTag, expectProps, componentRenderQueue);
  } else {
    assertNotEqual(node, void 0, "Cursor already closed");
    node = _reconcileElement(cursor.parent, node, cursor.end, component2, expectTag, expectProps, componentRenderQueue);
    assertDefined(node);
    setNode(cursor, node.nextSibling);
    return _reconcileElementChildCursor(node, !!componentRenderQueue);
  }
}
function slotMapReconcileSlots(parent, slots, end, component2, expectTag, expectProps, componentRenderQueue) {
  const slotName = expectProps["q:slot"] || "";
  const namedSlot = keyValueArrayGet(slots, slotName);
  let childNode;
  if (namedSlot) {
    assertGreaterOrEqual(namedSlot.length, 2);
    const parent2 = namedSlot[1];
    let index = namedSlot[0];
    if (index == -1) {
      index = 2;
    }
    childNode = namedSlot.length > index ? namedSlot[index] : null;
    const node = _reconcileElement(parent2, childNode, end, component2, expectTag, expectProps, componentRenderQueue);
    if (childNode !== node) {
      namedSlot[index] = node;
      childNode = node;
    }
    namedSlot[0] = index + 1;
  } else {
    const template = getUnSlottedStorage(parent);
    childNode = _reconcileElement(template.content, null, end, component2, expectTag, expectProps, true);
    assertDefined(childNode);
  }
  return _reconcileElementChildCursor(childNode, !!componentRenderQueue);
}
function _reconcileElement(parent, existing, end, component2, expectTag, expectProps, componentRenderQueue) {
  let shouldDescendIntoComponent;
  let reconciledElement;
  if (isDomElementWithTagName(existing, expectTag)) {
    const props = getProps(existing);
    Object.assign(props, expectProps);
    shouldDescendIntoComponent = didQPropsChange(props) && !!componentRenderQueue;
    reconciledElement = existing;
  } else {
    reconciledElement = replaceNode(parent, existing, (isDocument(parent) ? parent : parent.ownerDocument).createElement(expectTag), end);
    shouldDescendIntoComponent = !!componentRenderQueue;
    Object.assign(getProps(reconciledElement), expectProps);
  }
  component2 && component2.styleClass && reconciledElement.classList.add(component2.styleClass);
  if (shouldDescendIntoComponent) {
    const hostComponent = getQComponent(reconciledElement);
    hostComponent.styleHostClass && reconciledElement.classList.add(hostComponent.styleHostClass);
    if (Array.isArray(componentRenderQueue)) {
      componentRenderQueue.push(hostComponent.render());
    } else if (reconciledElement.getAttribute("on:q-render")) {
      reconciledElement.setAttribute("on:q-render-notify", "");
    }
  }
  return reconciledElement;
}
function _reconcileElementChildCursor(node, isComponent) {
  assertDefined(node);
  if (isComponent) {
    return newCursor(node, getSlotMap(getQComponent(node)), null);
  } else {
    return cursorForParent(node);
  }
}
function cursorReconcileText(cursor, expectText) {
  let node = getNode(cursor);
  assertNotEqual(node, void 0, "Cursor already closed");
  assertDefined(cursor.parent);
  if (isSlotMap(node)) {
    let parent;
    let childNode;
    const namedSlot = keyValueArrayGet(node, "");
    if (namedSlot) {
      assertGreaterOrEqual(namedSlot.length, 2);
      parent = namedSlot[1];
      let index = namedSlot[0];
      if (index == -1) {
        index = 2;
      }
      childNode = namedSlot.length > index ? namedSlot[index] : null;
      node = _reconcileText(parent, childNode, cursor.end, expectText);
      if (childNode !== node) {
        namedSlot[index] = node;
      }
      namedSlot[0] = index + 1;
    } else {
      const template = getUnSlottedStorage(cursor.parent);
      _reconcileText(template.content, null, cursor.end, expectText);
    }
  } else {
    node = _reconcileText(cursor.parent, node, cursor.end, expectText);
    setNode(cursor, node.nextSibling);
  }
}
function _reconcileText(parent, node, beforeNode, expectText) {
  if (node && node.nodeType == 3) {
    if (node.textContent !== expectText) {
      node.textContent = expectText;
    }
  } else {
    node = replaceNode(parent, node, parent.ownerDocument.createTextNode(expectText), beforeNode);
  }
  return node;
}
function cursorReconcileEnd(cursor) {
  let node = getNode(cursor);
  if (isSlotMap(node)) {
    for (let i = 0; i < node.length; i = i + 2) {
      const namedSlot = node[i + 1];
      if (namedSlot[0] !== -1) {
        assertGreater(namedSlot[0], 1);
        for (let k = namedSlot[0]; k < namedSlot.length; k++) {
          namedSlot[1].removeChild(namedSlot[k]);
        }
      }
    }
  } else {
    while (node) {
      const next = node.nextSibling;
      cursor.parent.removeChild(node);
      node = next;
    }
  }
  setNode(cursor, void 0);
}
function getUnSlottedStorage(componentElement) {
  assertEqual(isComponentElement(componentElement), true, "Must be component element");
  let template = componentElement === null || componentElement === void 0 ? void 0 : componentElement.firstElementChild;
  if (!isDomElementWithTagName(template, "template") || !template.hasAttribute("q:slot")) {
    template = componentElement.insertBefore(componentElement.ownerDocument.createElement("template"), template);
    template.setAttribute("q:slot", "");
  }
  return template;
}
const V_NODE_START = "<node:";
const V_NODE_END = "</node:";
function cursorReconcileVirtualNode(cursor) {
  var _a;
  let node = getNode(cursor);
  if (isSlotMap(node)) {
    throw new Error("Not expecting slot map here");
  } else {
    if (isComment(node) && ((_a = node.textContent) === null || _a === void 0 ? void 0 : _a.startsWith(V_NODE_START))) {
      throw new Error("IMPLEMENT");
    } else {
      const id = Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
      const parent = cursor.parent;
      const doc = parent.ownerDocument;
      const startVNode = doc.createComment(V_NODE_START + id + ">");
      const endVNode = doc.createComment(V_NODE_END + id + ">");
      node = replaceNode(cursor.parent, node, endVNode, null);
      cursor.parent.insertBefore(startVNode, endVNode);
      setNode(cursor, endVNode.nextSibling);
      return newCursor(parent, startVNode, endVNode);
    }
  }
}
function cursorReconcileStartVirtualNode(cursor) {
  const node = getNode(cursor);
  assertEqual(isComment(node) && node.textContent.startsWith(V_NODE_START), true);
  setNode(cursor, node && node.nextSibling);
}
function replaceNode(parentNode, existingNode, newNode, insertBefore) {
  parentNode.insertBefore(newNode, existingNode || insertBefore);
  if (existingNode) {
    parentNode.removeChild(existingNode);
  }
  return newNode;
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function flattenArray(array, dst) {
  if (!dst)
    dst = [];
  for (const item of array) {
    if (Array.isArray(item)) {
      flattenArray(item, dst);
    } else {
      dst.push(item);
    }
  }
  return dst;
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function flattenPromiseTree(tree) {
  return Promise.all(tree).then((values) => {
    const flatArray = flattenArray(values);
    for (let i = 0; i < flatArray.length; i++) {
      if (isPromise(flatArray[i])) {
        return flattenPromiseTree(flatArray);
      }
    }
    return flatArray;
  });
}
function isPromise(value) {
  return value instanceof Promise;
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
const Host = { __brand__: "host" };
function jsx(type, props, key) {
  return new JSXNodeImpl(type, props, key);
}
class JSXNodeImpl {
  constructor(type, props, key) {
    this.type = type;
    this.props = props;
    this.key = key;
    if (props && props.children !== void 0) {
      if (Array.isArray(props.children)) {
        this.children = props.children;
      } else {
        this.children = [props.children];
      }
    } else {
      this.children = EMPTY_ARRAY;
    }
  }
}
const isJSXNode = (n) => {
  {
    if (n instanceof JSXNodeImpl) {
      return true;
    }
    if (n && typeof n === "object" && n.constructor.name === JSXNodeImpl.name) {
      throw new Error(`Duplicate implementations of "JSXNodeImpl" found`);
    }
    return false;
  }
};
const Fragment = {};
const Slot = {
  __brand__: "slot"
};
function visitJsxNode(component2, renderQueue, cursor, jsxNode) {
  if (isJSXNode(jsxNode)) {
    const nodeType = jsxNode.type;
    if (nodeType == null)
      return;
    if (typeof nodeType === "string") {
      visitJsxLiteralNode(component2, renderQueue, cursor, jsxNode);
    } else if (nodeType === Fragment || nodeType == null) {
      const jsxChildren = jsxNode.children || EMPTY_ARRAY;
      for (const jsxChild of jsxChildren) {
        visitJsxNode(component2, renderQueue, cursor, jsxChild);
      }
    } else if (jsxNode.type === Host) {
      const props = getProps(cursor.parent);
      Object.assign(props, jsxNode.props);
      const jsxChildren = jsxNode.children || EMPTY_ARRAY;
      for (const jsxChild of jsxChildren) {
        visitJsxNode(component2, renderQueue, cursor, jsxChild);
      }
      didQPropsChange(props);
    } else if (jsxNode.type === Slot) {
      component2 && visitQSlotJsxNode(component2, renderQueue, cursor, jsxNode);
    } else if (typeof jsxNode.type === "function") {
      visitJsxNode(component2, renderQueue, cursor, jsxNode.type(jsxNode.props));
    } else {
      throw qError(600, nodeType);
    }
  } else if (isPromise(jsxNode)) {
    const vNodeCursor = cursorReconcileVirtualNode(cursor);
    const render2 = (jsxNode2) => {
      cursorReconcileStartVirtualNode(vNodeCursor);
      visitJsxNode(component2, renderQueue, vNodeCursor, jsxNode2);
      cursorReconcileEnd(vNodeCursor);
    };
    jsxNode.then(render2, render2);
    if (jsxNode.whilePending) {
      const vNodePending = cursorClone(vNodeCursor);
      cursorReconcileStartVirtualNode(vNodePending);
      visitJsxNode(component2, renderQueue, vNodePending, jsxNode.whilePending);
      cursorReconcileEnd(vNodePending);
    }
  } else if (Array.isArray(jsxNode)) {
    const jsxChildren = jsxNode;
    for (const jsxChild of jsxChildren) {
      visitJsxNode(component2, renderQueue, cursor, jsxChild);
    }
  } else if (typeof jsxNode === "string" || typeof jsxNode === "number") {
    cursorReconcileText(cursor, String(jsxNode));
  }
}
function visitJsxLiteralNode(component2, renderQueue, cursor, jsxNode) {
  const jsxTag = jsxNode.type;
  const isQComponent = "on:qRender" in jsxNode.props;
  const elementCursor = cursorReconcileElement(cursor, component2, jsxTag, jsxNode.props, isQComponent ? renderQueue : null);
  if (!hasInnerHtmlOrTextBinding(jsxNode)) {
    const jsxChildren = jsxNode.children || EMPTY_ARRAY;
    for (const jsxChild of jsxChildren) {
      visitJsxNode(component2, renderQueue, elementCursor, jsxChild);
    }
    cursorReconcileEnd(elementCursor);
  } else if (isQComponent) {
    throw new Error("innerHTML/innerText bindings not supported on component content");
  }
}
function hasInnerHtmlOrTextBinding(jsxNode) {
  return "innerHTML" in jsxNode.props || "innerText" in jsxNode.props;
}
function visitQSlotJsxNode(component2, renderQueue, cursor, jsxNode) {
  const slotName = jsxNode.props.name || "";
  const slotCursor = cursorReconcileElement(cursor, component2, "Q:SLOT", Object.assign({ ["name"]: slotName }, jsxNode.props), null);
  const slotMap = getSlotMap(component2);
  const namedSlot = keyValueArrayGet(slotMap, slotName);
  if (namedSlot && namedSlot.length > 2) {
    const cursorParent = slotCursor.parent;
    if (namedSlot[1] !== cursorParent) {
      cursorReconcileEnd(slotCursor);
      for (let i = 2; i < namedSlot.length; i++) {
        const node = namedSlot[i];
        cursorParent.appendChild(node);
      }
      cursorReconcileEnd(slotCursor);
    }
    cursorParent.querySelectorAll("[on\\:q-render-notify]").forEach((compElem) => {
      renderQueue.push(getQComponent(compElem).render());
    });
  } else {
    const jsxChildren = jsxNode.children;
    for (const jsxChild of jsxChildren) {
      visitJsxNode(component2, renderQueue, slotCursor, jsxChild);
    }
    cursorReconcileEnd(slotCursor);
  }
}
function hashCode(text, hash = 0) {
  if (text.length === 0)
    return hash;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Number(Math.abs(hash)).toString(36);
}
function styleKey(qStyles) {
  return qStyles && String(hashCode(qStyles.symbol));
}
function styleHost(styleId) {
  return styleId && "\u{1F4E6}" + styleId;
}
function styleContent(styleId) {
  return styleId && "\u{1F3F7}\uFE0F" + styleId;
}
function safeQSubscribe(qObject2) {
  assertNotEqual(unwrapProxy(qObject2), qObject2, "Expecting Proxy");
  _context && _context.subscriptions && qObject2 && _context.subscriptions.add(qObject2);
}
let _context;
function getInvokeContext() {
  if (!_context) {
    const context = typeof document !== "undefined" && document && document.__q_context__;
    if (!context) {
      throw new Error("Q-ERROR: invoking 'use*()' method outside of invocation context.");
    }
    if (Array.isArray(context)) {
      const element = context[0].closest("[on\\:q\\-render]");
      assertDefined(element);
      return document.__q_context__ = newInvokeContext(element, context[1], context[2]);
    }
    return context;
  }
  return _context;
}
function useInvoke(context, fn, ...args) {
  const previousContext = _context;
  let returnValue;
  try {
    _context = context;
    returnValue = fn.apply(null, args);
  } finally {
    const currentCtx = _context;
    const subscriptions = currentCtx.subscriptions;
    if (subscriptions) {
      const element = currentCtx.hostElement;
      element && (getProps(element)[":subscriptions"] = subscriptions);
    }
    _context = previousContext;
    if (currentCtx.waitOn && currentCtx.waitOn.length > 0) {
      return Promise.all(currentCtx.waitOn).then(() => returnValue);
    }
  }
  return returnValue;
}
function newInvokeContext(hostElement, event, url) {
  return {
    hostElement,
    event,
    url: url || null,
    qrl: void 0,
    subscriptions: event === "qRender" ? new Set() : void 0
  };
}
function useWaitOn(promise) {
  const ctx = getInvokeContext();
  (ctx.waitOn || (ctx.waitOn = [])).push(promise);
}
class QComponentCtx {
  constructor(hostElement) {
    this.styleId = void 0;
    this.styleClass = null;
    this.styleHostClass = null;
    this.hostElement = hostElement;
  }
  async render() {
    const hostElement = this.hostElement;
    const props = getProps(hostElement);
    const onRender2 = props["on:qRender"];
    assertDefined(onRender2);
    hostElement.removeAttribute("on:q-render-notify");
    const renderQueue = [];
    try {
      const event = "qRender";
      const jsxNode = await useInvoke(newInvokeContext(hostElement, event), onRender2);
      if (this.styleId === void 0) {
        const scopedStyleId = this.styleId = hostElement.getAttribute("q:sstyle");
        if (scopedStyleId) {
          this.styleHostClass = styleHost(scopedStyleId);
          this.styleClass = styleContent(scopedStyleId);
        }
      }
      const cursor = cursorForComponent(this.hostElement);
      visitJsxNode(this, renderQueue, cursor, jsxNode);
      cursorReconcileEnd(cursor);
    } catch (e) {
      console.log(e);
    }
    return [this.hostElement, ...await flattenPromiseTree(renderQueue)];
  }
}
const COMPONENT_PROP = "__qComponent__";
function getQComponent(hostElement) {
  const element = hostElement;
  let component2 = element[COMPONENT_PROP];
  if (!component2)
    component2 = element[COMPONENT_PROP] = new QComponentCtx(hostElement);
  return component2;
}
function notifyRender(hostElement) {
  assertDefined(hostElement.getAttribute("on:q-render"));
  hostElement.setAttribute("on:q-render-notify", "");
  return scheduleRender(hostElement.ownerDocument);
}
function scheduleRender(doc) {
  return getPlatform(doc).queueRender(renderMarked);
}
async function renderMarked(doc) {
  const hosts = Array.from(doc.querySelectorAll("[on\\:q-render-notify]"));
  return Promise.all(hosts.map((hostElement) => {
    hostElement.removeAttribute("on:q-render-notify");
    const cmp = getQComponent(hostElement);
    return cmp && cmp.render();
  }));
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
function debugStringify(value) {
  if (value != null && typeof value == "object") {
    return String(value.constructor.name) + "\n" + safeJSONStringify(value);
  }
  return String(value);
}
function safeJSONStringify(value) {
  try {
    return JSON.stringify(value, null, "  ");
  } catch (e) {
    return String(e);
  }
}
function qObject(obj) {
  assertEqual(unwrapProxy(obj), obj, "Unexpected proxy at this location");
  if (obj == null || typeof obj !== "object") {
    throw new Error(`Q-ERROR: Only objects can be wrapped in 'QObject', got ` + debugStringify(obj));
  }
  if (obj.constructor !== Object) {
    throw new Error(`Q-ERROR: Only objects literals can be wrapped in 'QObject', got ` + debugStringify(obj));
  }
  const proxy = readWriteProxy(obj, generateId());
  Object.assign(proxy, obj);
  return proxy;
}
function _restoreQObject(obj, id) {
  return readWriteProxy(obj, id);
}
function QObject_notifyWrite(id, doc) {
  if (doc) {
    doc.querySelectorAll(idToComponentSelector(id)).forEach(notifyRender);
  }
}
function QObject_notifyRead(target) {
  const proxy = proxyMap.get(target);
  assertDefined(proxy);
  safeQSubscribe(proxy);
}
function QObject_addDoc(qObj, doc) {
  assertNotEqual(unwrapProxy(qObj), qObj, "Expected Proxy");
  qObj[QObjectDocumentSymbol] = doc;
}
function getQObjectId(obj) {
  let id;
  if (obj && typeof obj === "object") {
    id = obj[QObjectIdSymbol];
    if (!id && isElement(obj)) {
      id = obj.getAttribute("q:id");
      if (id == null) {
        obj.setAttribute("q:id", id = generateId());
      }
      id = "#" + id;
    }
  }
  return id || null;
}
function idToComponentSelector(id) {
  id = id.replace(/([^\w\d])/g, (_, v) => "\\" + v);
  return "[q\\:obj*=\\!" + id + "]";
}
function readWriteProxy(target, id) {
  if (!target || typeof target !== "object")
    return target;
  let proxy = proxyMap.get(target);
  if (proxy)
    return proxy;
  proxy = new Proxy(target, new ReadWriteProxyHandler(id));
  proxyMap.set(target, proxy);
  return proxy;
}
const QOjectTargetSymbol = ":target:";
const QOjectTransientsSymbol = ":transients:";
const QObjectIdSymbol = ":id:";
const QObjectDocumentSymbol = ":doc:";
function unwrapProxy(proxy) {
  if (proxy && typeof proxy == "object") {
    const value = proxy[QOjectTargetSymbol];
    if (value)
      return value;
  }
  return proxy;
}
function wrap(value) {
  if (value && typeof value === "object") {
    const nakedValue = unwrapProxy(value);
    if (nakedValue !== value) {
      return value;
    }
    const proxy = proxyMap.get(value);
    return proxy ? proxy : readWriteProxy(value, generateId());
  } else {
    return value;
  }
}
class ReadWriteProxyHandler {
  constructor(id) {
    this.doc = null;
    this.transients = null;
    this.id = id;
  }
  get(target, prop) {
    if (prop === QOjectTargetSymbol)
      return target;
    if (prop === QObjectIdSymbol)
      return this.id;
    if (prop === QOjectTransientsSymbol) {
      return this.transients || (this.transients = new WeakMap());
    }
    const value = target[prop];
    QObject_notifyRead(target);
    return wrap(value);
  }
  set(target, prop, newValue) {
    if (prop === QObjectDocumentSymbol) {
      this.doc = newValue;
    } else if (prop == QObjectIdSymbol) {
      this.id = newValue;
    } else {
      const unwrappedNewValue = unwrapProxy(newValue);
      const oldValue = target[prop];
      if (oldValue !== unwrappedNewValue) {
        target[prop] = unwrappedNewValue;
        QObject_notifyWrite(this.id, this.doc);
      }
    }
    return true;
  }
  has(target, property) {
    if (property === QOjectTargetSymbol)
      return true;
    return Object.prototype.hasOwnProperty.call(target, property);
  }
  ownKeys(target) {
    return Object.getOwnPropertyNames(target);
  }
}
const proxyMap = new WeakMap();
function generateId() {
  return Math.round(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
}
const JSON_OBJ_PREFIX = "";
const ATTR_OBJ_PREFIX = "*";
function qJsonStringify(obj, map) {
  if (obj == void 0)
    return String(obj);
  if (typeof obj == "number")
    return String(obj);
  if (typeof obj == "boolean")
    return String(obj);
  const id = getQObjectId(obj);
  if (id) {
    map && map.set(id, obj);
    return ATTR_OBJ_PREFIX + id;
  }
  if (typeof obj == "string") {
    const ch = obj.charCodeAt(0);
    if (isDash(ch) || isDigit(ch) || isObj(ch) || isReserved(obj) || containsEscape(obj)) {
      return "'" + obj.replace(/'/g, "\\'").replace(/\//g, "\\") + "'";
    }
    return obj;
  }
  return JSON.stringify(obj, function(key, value) {
    const id2 = getQObjectId(value);
    if (id2) {
      assertDefined(map);
      map && map.set(id2, value);
      return JSON_OBJ_PREFIX + id2;
    }
    return value;
  });
}
function qJsonParse(txt, map) {
  if (txt == "")
    return "";
  if (txt == "null")
    return null;
  if (txt == "undefined")
    return void 0;
  if (txt == "false")
    return false;
  if (txt == "true")
    return true;
  const ch = txt.charCodeAt(0);
  if (isDigit(ch) || isDash(ch)) {
    return Number(txt);
  }
  if (isAttrObj(ch)) {
    const id = txt.substr(1);
    if (!map) {
      throw new Error("Map needs to be present when parsing QObjects");
    }
    const obj = map.get(id);
    assertDefined(obj);
    return obj;
  }
  if (isQuote(ch)) {
    return txt.substring(1, txt.length - 1).replace(/\\(.)/, (v) => v);
  }
  if (isObj(ch)) {
    return JSON.parse(txt, function(key, value) {
      if (typeof value == "string" && isJsonObj(value.charCodeAt(0))) {
        if (!map) {
          throw new Error("Map needs to be present when parsing QObjects");
        }
        value = map.get(value.substr(1));
        assertDefined(value);
      }
      return value;
    });
  }
  return txt;
}
function qDeflate(obj, map) {
  if (obj && typeof obj === "object") {
    let id = getQObjectId(obj);
    if (!id) {
      obj = qObject(obj);
      id = getQObjectId(obj);
    }
    map.set(id, obj);
    return JSON_OBJ_PREFIX + id;
  }
  return obj;
}
function qInflate(obj, map) {
  if (typeof obj === "string" && obj.charAt(0) === JSON_OBJ_PREFIX) {
    const prefix = obj.charAt(1);
    if (prefix == "#" || prefix == "&") {
      const id = obj.substring(2);
      const selector = '[q\\:id="{}"]'.replace("{}", id);
      const element = map.element;
      const ourElement = element.closest(selector) || element.querySelector(selector) || element.ownerDocument.querySelector(selector);
      if (!ourElement) {
        throw new Error(`Q-ERROR: Element with '${selector}' can not be located.`);
      }
      return prefix == "&" ? getProps(ourElement) : ourElement;
    } else {
      const id = obj.substring(1);
      const ref = map.get(id);
      if (!ref) {
        throw new Error(`Q-ERROR: Unable to located object with id '${id}'.`);
      }
      return ref;
    }
  }
  return obj;
}
function isDash(ch) {
  return ch == "-".charCodeAt(0);
}
function isObj(ch) {
  return ch == "[".charCodeAt(0) || ch == "{".charCodeAt(0);
}
function isQuote(ch) {
  return ch == "'".charCodeAt(0);
}
function isDigit(ch) {
  return "0".charCodeAt(0) <= ch && ch <= "9".charCodeAt(0);
}
function isAttrObj(ch) {
  return ch == ATTR_OBJ_PREFIX.charCodeAt(0);
}
function isJsonObj(ch) {
  return ch == JSON_OBJ_PREFIX.charCodeAt(0);
}
function isReserved(obj) {
  return obj === "null" || obj === "undefined" || obj == "true" || obj == "false";
}
function containsEscape(obj) {
  return obj.indexOf("'") != -1 || obj.indexOf("\\") != -1;
}
function QStore_hydrate(doc) {
  const script = doc.querySelector('script[type="qwik/json"]');
  let map = null;
  doc.dehydrate = () => QStore_dehydrate(doc);
  if (script) {
    script.parentElement.removeChild(script);
    map = JSON.parse(script.textContent || "{}");
    reviveQObjects(map);
    reviveNestedQObjects(map, map);
  }
  return map;
}
function QStore_dehydrate(doc) {
  const map = {};
  doc.querySelectorAll("[q\\:obj]").forEach((node) => {
    const props = getProps(node);
    const qMap = props.__qRefs__;
    clearQProps(node);
    assertDefined(qMap);
    qMap.forEach((v, k) => {
      map[k] = v.obj;
      collectQObjects(v, new Set(), (k2, v2) => map[k2] = v2);
    });
  });
  const script = doc.createElement("script");
  script.setAttribute("type", "qwik/json");
  script.textContent = JSON.stringify(map, function(key, value) {
    if (this === map)
      return value;
    if (key.startsWith("__"))
      return void 0;
    const id = getQObjectId(value);
    if (id)
      return JSON_OBJ_PREFIX + id;
    return value;
  }, "  ");
  doc.body.appendChild(script);
  clearQPropsMap(doc);
}
function reviveQObjects(map) {
  for (const key in map) {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      const value = map[key];
      map[key] = _restoreQObject(value, key);
    }
  }
}
function reviveNestedQObjects(obj, map) {
  if (obj && typeof obj == "object") {
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        const value = obj[i];
        if (typeof value == "string" && value.startsWith(JSON_OBJ_PREFIX)) {
          obj[i] = map[value.substring(JSON_OBJ_PREFIX.length)];
        } else {
          reviveNestedQObjects(value, map);
        }
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          if (typeof value == "string" && value.startsWith(JSON_OBJ_PREFIX)) {
            obj[key] = map[value.substring(JSON_OBJ_PREFIX.length)];
          } else {
            reviveNestedQObjects(value, map);
          }
        }
      }
    }
  }
}
function collectQObjects(obj, seen, foundFn) {
  if (obj && typeof obj == "object") {
    if (seen.has(obj))
      return;
    seen.add(obj);
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        collectQObjects(obj[i], seen, foundFn);
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const id = getQObjectId(value);
          if (id)
            foundFn(id, value);
          collectQObjects(value, seen, foundFn);
        }
      }
    }
  }
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
const camelToKebabCase = new Map();
function fromCamelToKebabCase(text, includeFirst = false) {
  if (typeof text != "string")
    return text;
  const value = camelToKebabCase.get(text);
  if (value != null)
    return value;
  let converted = "";
  for (let x = 0; x < text.length; x++) {
    const ch = text.charAt(x);
    if (isUpperCase(ch)) {
      converted += (x != 0 || includeFirst ? "-" : "") + ch.toLowerCase();
    } else {
      converted += ch;
    }
  }
  camelToKebabCase.set(text, converted);
  return converted;
}
function isUpperCase(ch) {
  return "A" <= ch && ch <= "Z";
}
const Q_OBJECT_ATTR = "q:obj";
function updateSubscriptions(element, map, idSubscriptionSet) {
  map.forEach((value, key) => {
    const qObj = value.obj;
    if (idSubscriptionSet.has(value.obj)) {
      if (!value.isSub) {
        setMapFacade(map, getQObjectId(qObj), qObj, element, true, 1);
      }
    } else if (value.isSub) {
      value.isSub = false;
      releaseRef(value, map, key);
    }
    idSubscriptionSet.delete(qObj);
  });
  idSubscriptionSet.forEach((qObj) => setMapFacade(map, getQObjectId(qObj), qObj, element, true, 1));
  writeQObjAttr(element, map);
}
function writeQObjAttr(element, map) {
  const list = [];
  map.forEach((v, k) => {
    if (v.isSub)
      k = "!" + k;
    v.count == 1 ? list.push(k) : list.push("#" + v.count, k);
  });
  if (list.length) {
    element.setAttribute(Q_OBJECT_ATTR, list.join(" "));
  } else {
    element.removeAttribute(Q_OBJECT_ATTR);
  }
}
function newQObjectMap(element, map) {
  return {
    element,
    forEach(fn) {
      return map.forEach((v, k) => {
        fn(v.obj, k);
      });
    },
    get(key) {
      const value = map.get(key);
      return value === null || value === void 0 ? void 0 : value.obj;
    },
    set(key, qObj) {
      if (!isDomId(key)) {
        setMapFacade(map, key, qObj, element, false, 1);
        writeQObjAttr(element, map);
      }
    }
  };
}
function isDomId(key) {
  const prefix = key.charAt(0);
  return prefix === "#" || prefix === "&";
}
function setMapFacade(map, key, qObj, element, subscribed, count) {
  assertDefined(key);
  let value = map.get(key);
  if (qObj) {
    QObject_addDoc(qObj, element.ownerDocument);
    if (value) {
      value.count += count;
      value.isSub = value.isSub || subscribed;
    } else {
      map.set(key, value = { obj: qObj, count, isSub: subscribed });
    }
  } else {
    if (value) {
      value = releaseRef(value, map, key);
    }
  }
  return value;
}
function releaseRef(value, map, key) {
  value.count--;
  if (value.count == 0) {
    map.delete(key);
    return void 0;
  }
  return value;
}
function loadObjectsFromState(element, storeMap) {
  const getProps2 = newQProps(element);
  const objs = element.getAttribute(Q_OBJECT_ATTR);
  if (objs) {
    const parts = objs.split(" ");
    const qMap = getProps2.__qRefs__;
    let lastCount = 1;
    parts.forEach((key) => {
      if (key.startsWith("#")) {
        lastCount = Number(key.substr(1));
      } else {
        let isSubscribed = false;
        if (key.startsWith("!")) {
          key = key.substr(1);
          isSubscribed = true;
        }
        const qObj = storeMap[key];
        setMapFacade(qMap, key, qObj, element, isSubscribed, lastCount);
      }
    });
  }
}
const ON_PREFIX = "on:";
const ON_PREFIX_$ = "on$:";
const ON_DOCUMENT_PREFIX = "onDocument:";
const ON_DOCUMENT_PREFIX_$ = "onDocument$:";
const ON_WINDOW_PREFIX = "onWindow:";
const ON_WINDOW_PREFIX_$ = "onWindow$:";
function isOnProp(prop) {
  return prop.startsWith(ON_PREFIX) || prop.startsWith(ON_DOCUMENT_PREFIX) || prop.startsWith(ON_WINDOW_PREFIX);
}
function isOn$Prop(prop) {
  return prop.startsWith(ON_PREFIX_$) || prop.startsWith(ON_DOCUMENT_PREFIX_$) || prop.startsWith(ON_WINDOW_PREFIX_$);
}
function isQrlFactory(value) {
  return typeof value === "function" && value.__brand__ === "QRLFactory";
}
function qPropReadQRL(cache, map, prop) {
  const existingQRLs = getExistingQRLs(cache, prop);
  if (existingQRLs.length === 0)
    return null;
  return () => {
    const context = getInvokeContext();
    const qrls = getExistingQRLs(cache, prop);
    return Promise.all(qrls.map(async (qrlOrPromise) => {
      const qrl2 = await qrlOrPromise;
      context.qrl = qrl2;
      if (!qrl2.symbolRef) {
        qrl2.symbolRef = await qrlImport(cache.__element__, qrl2);
      }
      return useInvoke(context, qrl2.symbolRef);
    }));
  };
}
function qPropWriteQRL(cache, map, prop, value) {
  if (!value)
    return;
  prop = prop.replace("$:", ":");
  if (typeof value == "string") {
    value = parseQRL(value);
  }
  const existingQRLs = getExistingQRLs(cache, prop);
  if (Array.isArray(value)) {
    value.forEach((value2) => qPropWriteQRL(cache, map, prop, value2));
  } else if (isQrl(value)) {
    const capture = value.capture;
    if (capture == null) {
      const captureRef = value.captureRef;
      value.capture = captureRef && captureRef.length ? captureRef.map((ref) => qDeflate(ref, map)) : EMPTY_ARRAY;
    }
    for (let i = 0; i < existingQRLs.length; i++) {
      const qrl2 = existingQRLs[i];
      if (!isPromise(qrl2) && qrl2.canonicalChunk === value.canonicalChunk && qrl2.symbol === value.symbol) {
        existingQRLs.splice(i, 1);
        i--;
      }
    }
    existingQRLs.push(value);
  } else if (isQrlFactory(value)) {
    if (existingQRLs.length === 0) {
      qPropWriteQRL(cache, map, prop, value(cache.__element__));
    }
  } else if (isPromise(value)) {
    const writePromise = value.then((qrl2) => {
      existingQRLs.splice(existingQRLs.indexOf(writePromise), 1);
      qPropWriteQRL(cache, map, prop, qrl2);
      return qrl2;
    });
    existingQRLs.push(writePromise);
  } else {
    throw new Error(`Not QRLInternal: prop: ${prop}; value: ` + value);
  }
  const kababProp = fromCamelToKebabCase(prop);
  cache.__element__.setAttribute(kababProp, serializeQRLs(existingQRLs, map));
}
function getExistingQRLs(cache, prop) {
  if (prop in cache)
    return cache[prop];
  const kebabProp = fromCamelToKebabCase(prop);
  const parts = [];
  const element = cache.__element__;
  (element.getAttribute(kebabProp) || "").split("\n").forEach((qrl2) => {
    if (qrl2) {
      parts.push(parseQRL(qrl2, element));
    }
  });
  return cache[prop] = parts;
}
function serializeQRLs(existingQRLs, map) {
  const element = map.element;
  return existingQRLs.map((qrl2) => isPromise(qrl2) ? "" : stringifyQRL(qrl2, element)).filter((v) => !!v).join("\n");
}
Error.stackTraceLimit = 9999;
const Q_IS_HYDRATED = "__isHydrated__";
const Q_PROP = "getProps";
function hydrateIfNeeded(element) {
  const doc = element.ownerDocument;
  const isHydrated = doc[Q_IS_HYDRATED];
  if (!isHydrated) {
    doc[Q_IS_HYDRATED] = true;
    const map = QStore_hydrate(element.ownerDocument);
    if (map) {
      doc.querySelectorAll(Q_OBJECT_ATTR_SELECTOR).forEach((element2) => {
        loadObjectsFromState(element2, map);
      });
    }
  }
}
function clearQPropsMap(doc) {
  doc[Q_IS_HYDRATED] = void 0;
}
function clearQProps(element) {
  element[Q_PROP] = void 0;
}
const Q_MAP = "__qMap__";
const Q_OBJECT_ATTR_SELECTOR = "[q\\:obj]";
const QProps_ = class QProps {
  constructor(__element__, __qRefs__, __qMap__) {
    this.__element__ = __element__;
    this.__qRefs__ = __qRefs__;
    this.__qMap__ = __qMap__;
    this.__mutation__ = false;
    this.__self__ = null;
  }
};
function newQProps(element) {
  const qObjRefMap = new Map();
  const qObjMap = newQObjectMap(element, qObjRefMap);
  const cache = new QProps_(element, qObjRefMap, qObjMap);
  return element[Q_PROP] = cache.__self__ = new Proxy(cache, {
    get: (target, prop) => {
      if (typeof prop == "string") {
        if (prop === "__mutation__") {
          const mutation = target.__mutation__;
          target.__mutation__ = false;
          return mutation;
        } else if (prop === "__qMap__") {
          return target.__qMap__;
        } else if (prop == "__parent__") {
          const parent = element.parentElement;
          return parent && getProps(parent);
        } else if (isOnProp(prop)) {
          return qPropReadQRL(cache, qObjMap, prop);
        } else if (prop === QObjectIdSymbol) {
          const id = getQObjectId(element);
          assertEqual(id.charAt(0), "#");
          return "&" + id.substring(1);
        }
        if (prop in cache) {
          return target[prop];
        }
        return cache[prop] = readAttribute(element, qObjMap, prop);
      }
    },
    set: (target, prop, value) => {
      if (typeof prop == "string") {
        if (prop === "children")
          return true;
        if (isOnProp(prop)) {
          qPropWriteQRL(cache, qObjMap, prop, value);
        } else if (isOn$Prop(prop)) {
          qPropWriteQRL(cache, qObjMap, prop.replace("$", ""), $(value));
        } else if (prop === ":subscriptions") {
          updateSubscriptions(element, qObjRefMap, value);
        } else {
          value = wrap(value);
          const existingValue = prop in target ? target[prop] : target[prop] = readAttribute(element, qObjMap, prop);
          if (value !== existingValue) {
            const existingId = getQObjectId(existingValue);
            existingId && qObjMap.set(existingId, null);
            writeAttribute(element, qObjMap, prop, target[prop] = value);
            target.__mutation__ = true;
          }
        }
        return true;
      } else {
        throw new Error("Only string keys are supported");
      }
    }
  });
}
function readAttribute(element, map, propName) {
  if (isOnProp(propName)) {
    const attrName = fromCamelToKebabCase(propName.split(":")[1]);
    const attrValue = element.getAttribute(attrName);
    const listeners = [];
    attrValue === null || attrValue === void 0 ? void 0 : attrValue.split("\n").forEach((qrl2) => {
      listeners.push(parseQRL(qrl2));
    });
    return listeners;
  } else {
    const attrName = fromCamelToKebabCase(propName);
    const attrValue = element.getAttribute(attrName);
    if (attrValue === null) {
      return void 0;
    } else {
      return qJsonParse(attrValue, map);
    }
  }
}
function writeAttribute(element, map, propName, value) {
  const attrName = fromCamelToKebabCase(propName);
  if (propName == "class") {
    element.setAttribute("class", stringifyClassOrStyle(value, true));
  } else if (propName == "style") {
    element.setAttribute("style", stringifyClassOrStyle(value, false));
  } else if (propName === "innerHTML" || propName === "innerText") {
    element.setAttribute(attrName, "");
    element[propName] = value;
  } else {
    const newValue = qJsonStringify(value, map);
    if (value === void 0) {
      element.removeAttribute(attrName);
    } else {
      element.setAttribute(attrName, newValue);
    }
  }
  if ((propName == "value" || propName == "checked") && element.tagName === "INPUT") {
    element[propName] = value;
  }
}
function didQPropsChange(getProps2) {
  return getProps2.__mutation__;
}
function stringifyClassOrStyle(obj, isClass) {
  if (obj == null)
    return "";
  if (typeof obj == "object") {
    let text = "";
    let sep = "";
    if (Array.isArray(obj)) {
      if (!isClass) {
        throw qError(601, obj, "style");
      }
      for (let i = 0; i < obj.length; i++) {
        text += sep + obj[i];
        sep = " ";
      }
    } else {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          text += isClass ? value ? sep + key : "" : sep + key + ":" + value;
          sep = isClass ? " " : ";";
        }
      }
    }
    return text;
  }
  return String(obj);
}
function getProps(element) {
  hydrateIfNeeded(element);
  let getProps2 = element[Q_PROP];
  if (!getProps2) {
    getProps2 = newQProps(element);
  }
  return getProps2;
}
function h(type, props, ...children) {
  const normalizedProps = {
    children: arguments.length > 2 ? flattenArray(children) : EMPTY_ARRAY
  };
  let key;
  let i;
  for (i in props) {
    if (i == "key")
      key = props[i];
    else
      normalizedProps[i] = props[i];
  }
  return new JSXNodeImpl(type, normalizedProps, key);
}
function useHostElement() {
  const element = getInvokeContext().hostElement;
  assertDefined(element);
  return element;
}
function onRender(renderFn) {
  return toQrlOrError(renderFn);
}
function withStyles(styles2) {
  _withStyles(styles2, false);
}
function component(tagNameOrONMount, onMount) {
  const hasTagName = typeof tagNameOrONMount == "string";
  const tagName = hasTagName ? tagNameOrONMount : "div";
  const onMount_ = hasTagName ? onMount : tagNameOrONMount;
  return function QComponent(props) {
    const onRenderFactory = async (hostElement) => {
      const onMountQrl = toQrlOrError(onMount_);
      const onMount2 = await resolveQrl(hostElement, onMountQrl);
      const componentProps = Object.assign(getProps(hostElement), props);
      const invokeCtx = newInvokeContext(hostElement);
      return useInvoke(invokeCtx, onMount2, componentProps);
    };
    onRenderFactory.__brand__ = "QRLFactory";
    return h(tagName, Object.assign({ "on:qRender": onRenderFactory }, props));
  };
}
function resolveQrl(hostElement, onMountQrl) {
  return onMountQrl.symbolRef ? Promise.resolve(onMountQrl.symbolRef) : Promise.resolve(null).then(() => {
    return qrlImport(hostElement, onMountQrl);
  });
}
function _withStyles(styles2, scoped) {
  const styleQrl = toQrlOrError(styles2);
  const styleId = styleKey(styleQrl);
  const hostElement = useHostElement();
  if (scoped) {
    hostElement.setAttribute("q:sstyle", styleId);
  }
  useWaitOn(qrlImport(hostElement, styleQrl).then((styleText) => {
    const document2 = hostElement.ownerDocument;
    const head = document2.querySelector("head");
    if (head && !head.querySelector(`style[q\\:style="${styleId}"]`)) {
      const style = document2.createElement("style");
      style.setAttribute("q:style", styleId);
      style.textContent = scoped ? styleText.replace(/�/g, styleId) : styleText;
      head.appendChild(style);
    }
  }));
}
function dehydrate(document2) {
  QStore_dehydrate(document2);
}
async function render$1(parent, jsxNode) {
  const renderQueue = [];
  let firstChild = parent.firstChild;
  while (firstChild && firstChild.nodeType > 8) {
    firstChild = firstChild.nextSibling;
  }
  const cursor = cursorForParent(parent);
  visitJsxNode(null, renderQueue, cursor, jsxNode);
  return flattenPromiseTree(renderQueue);
}
function useEvent(expectEventType) {
  const event = getInvokeContext().event;
  expectEventType && assertEqual(event.type, expectEventType);
  return event;
}
function useQRL() {
  return getInvokeContext().qrl || null;
}
function useURL() {
  const url = getInvokeContext().url;
  if (!url) {
    throw new Error("Q-ERROR: no URL is associated with the execution context");
  }
  return url;
}
function useLexicalScope() {
  const qrl2 = useQRL() || parseQRL(decodeURIComponent(String(useURL())));
  if (qrl2.captureRef == null) {
    const props = getProps(useHostElement());
    const qMap = props[Q_MAP];
    assertDefined(qrl2.capture);
    qrl2.captureRef = qrl2.capture.map((obj) => qInflate(obj, qMap));
  }
  return qrl2.captureRef;
}
function createStore(initialState) {
  return qObject(initialState);
}
/**
 * @license
 * Copyright Builder.io, Inc. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/BuilderIO/qwik/blob/main/LICENSE
 */
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};
var require_global = __commonJS({
  "scripts/shim/global.js"() {
    if (typeof global == "undefined") {
      const e = typeof globalThis != "undefined" ? globalThis : typeof window != "undefined" ? window : typeof self != "undefined" ? self : {};
      e.global = e;
    }
  }
});
__toModule(require_global());
__toModule(require_global());
__toModule(require_global());
var O = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports);
var zt = O((_f, Li) => {
  Li.exports = Dt;
  Dt.CAPTURING_PHASE = 1;
  Dt.AT_TARGET = 2;
  Dt.BUBBLING_PHASE = 3;
  function Dt(e, t) {
    if (this.type = "", this.target = null, this.currentTarget = null, this.eventPhase = Dt.AT_TARGET, this.bubbles = false, this.cancelable = false, this.isTrusted = false, this.defaultPrevented = false, this.timeStamp = Date.now(), this._propagationStopped = false, this._immediatePropagationStopped = false, this._initialized = true, this._dispatching = false, e && (this.type = e), t)
      for (var r in t)
        this[r] = t[r];
  }
  Dt.prototype = Object.create(Object.prototype, { constructor: { value: Dt }, stopPropagation: { value: function() {
    this._propagationStopped = true;
  } }, stopImmediatePropagation: { value: function() {
    this._propagationStopped = true, this._immediatePropagationStopped = true;
  } }, preventDefault: { value: function() {
    this.cancelable && (this.defaultPrevented = true);
  } }, initEvent: { value: function(t, r, n) {
    this._initialized = true, !this._dispatching && (this._propagationStopped = false, this._immediatePropagationStopped = false, this.defaultPrevented = false, this.isTrusted = false, this.target = null, this.type = t, this.bubbles = r, this.cancelable = n);
  } } });
});
var Kn = O((Ef, Mi) => {
  var Di = zt();
  Mi.exports = $n;
  function $n() {
    Di.call(this), this.view = null, this.detail = 0;
  }
  $n.prototype = Object.create(Di.prototype, { constructor: { value: $n }, initUIEvent: { value: function(e, t, r, n, l) {
    this.initEvent(e, t, r), this.view = n, this.detail = l;
  } } });
});
var Qn = O((vf, Ii) => {
  var Ri = Kn();
  Ii.exports = Xn;
  function Xn() {
    Ri.call(this), this.screenX = this.screenY = this.clientX = this.clientY = 0, this.ctrlKey = this.altKey = this.shiftKey = this.metaKey = false, this.button = 0, this.buttons = 1, this.relatedTarget = null;
  }
  Xn.prototype = Object.create(Ri.prototype, { constructor: { value: Xn }, initMouseEvent: { value: function(e, t, r, n, l, f, _, y, w, S, D, ae, ce, g, re) {
    switch (this.initEvent(e, t, r, n, l), this.screenX = f, this.screenY = _, this.clientX = y, this.clientY = w, this.ctrlKey = S, this.altKey = D, this.shiftKey = ae, this.metaKey = ce, this.button = g, g) {
      case 0:
        this.buttons = 1;
        break;
      case 1:
        this.buttons = 4;
        break;
      case 2:
        this.buttons = 2;
        break;
      default:
        this.buttons = 0;
        break;
    }
    this.relatedTarget = re;
  } }, getModifierState: { value: function(e) {
    switch (e) {
      case "Alt":
        return this.altKey;
      case "Control":
        return this.ctrlKey;
      case "Shift":
        return this.shiftKey;
      case "Meta":
        return this.metaKey;
      default:
        return false;
    }
  } } });
});
var Xr = O((yf, qi) => {
  qi.exports = $r;
  var Ll = 1, Dl = 3, Ml = 4, Rl = 5, Il = 7, Ol = 8, ql = 9, Fl = 11, Hl = 12, Pl = 13, Bl = 14, Ul = 15, Vl = 17, zl = 18, jl = 19, Wl = 20, Gl = 21, Yl = 22, $l = 23, Kl = 24, Xl = 25, Ql = [null, "INDEX_SIZE_ERR", null, "HIERARCHY_REQUEST_ERR", "WRONG_DOCUMENT_ERR", "INVALID_CHARACTER_ERR", null, "NO_MODIFICATION_ALLOWED_ERR", "NOT_FOUND_ERR", "NOT_SUPPORTED_ERR", "INUSE_ATTRIBUTE_ERR", "INVALID_STATE_ERR", "SYNTAX_ERR", "INVALID_MODIFICATION_ERR", "NAMESPACE_ERR", "INVALID_ACCESS_ERR", null, "TYPE_MISMATCH_ERR", "SECURITY_ERR", "NETWORK_ERR", "ABORT_ERR", "URL_MISMATCH_ERR", "QUOTA_EXCEEDED_ERR", "TIMEOUT_ERR", "INVALID_NODE_TYPE_ERR", "DATA_CLONE_ERR"], Zl = [null, "INDEX_SIZE_ERR (1): the index is not in the allowed range", null, "HIERARCHY_REQUEST_ERR (3): the operation would yield an incorrect nodes model", "WRONG_DOCUMENT_ERR (4): the object is in the wrong Document, a call to importNode is required", "INVALID_CHARACTER_ERR (5): the string contains invalid characters", null, "NO_MODIFICATION_ALLOWED_ERR (7): the object can not be modified", "NOT_FOUND_ERR (8): the object can not be found here", "NOT_SUPPORTED_ERR (9): this operation is not supported", "INUSE_ATTRIBUTE_ERR (10): setAttributeNode called on owned Attribute", "INVALID_STATE_ERR (11): the object is in an invalid state", "SYNTAX_ERR (12): the string did not match the expected pattern", "INVALID_MODIFICATION_ERR (13): the object can not be modified in this way", "NAMESPACE_ERR (14): the operation is not allowed by Namespaces in XML", "INVALID_ACCESS_ERR (15): the object does not support the operation or argument", null, "TYPE_MISMATCH_ERR (17): the type of the object does not match the expected type", "SECURITY_ERR (18): the operation is insecure", "NETWORK_ERR (19): a network error occurred", "ABORT_ERR (20): the user aborted an operation", "URL_MISMATCH_ERR (21): the given URL does not match another URL", "QUOTA_EXCEEDED_ERR (22): the quota has been exceeded", "TIMEOUT_ERR (23): a timeout occurred", "INVALID_NODE_TYPE_ERR (24): the supplied node is invalid or has an invalid ancestor for this operation", "DATA_CLONE_ERR (25): the object can not be cloned."], Oi = { INDEX_SIZE_ERR: Ll, DOMSTRING_SIZE_ERR: 2, HIERARCHY_REQUEST_ERR: Dl, WRONG_DOCUMENT_ERR: Ml, INVALID_CHARACTER_ERR: Rl, NO_DATA_ALLOWED_ERR: 6, NO_MODIFICATION_ALLOWED_ERR: Il, NOT_FOUND_ERR: Ol, NOT_SUPPORTED_ERR: ql, INUSE_ATTRIBUTE_ERR: 10, INVALID_STATE_ERR: Fl, SYNTAX_ERR: Hl, INVALID_MODIFICATION_ERR: Pl, NAMESPACE_ERR: Bl, INVALID_ACCESS_ERR: Ul, VALIDATION_ERR: 16, TYPE_MISMATCH_ERR: Vl, SECURITY_ERR: zl, NETWORK_ERR: jl, ABORT_ERR: Wl, URL_MISMATCH_ERR: Gl, QUOTA_EXCEEDED_ERR: Yl, TIMEOUT_ERR: $l, INVALID_NODE_TYPE_ERR: Kl, DATA_CLONE_ERR: Xl };
  function $r(e) {
    Error.call(this), Error.captureStackTrace(this, this.constructor), this.code = e, this.message = Zl[e], this.name = Ql[e];
  }
  $r.prototype.__proto__ = Error.prototype;
  for (Kr in Oi)
    Zn = { value: Oi[Kr] }, Object.defineProperty($r, Kr, Zn), Object.defineProperty($r.prototype, Kr, Zn);
  var Zn, Kr;
});
var Qr = O((Fi) => {
  Fi.isApiWritable = !global.__domino_frozen__;
});
var he = O((Z) => {
  var de = Xr(), me = de, Jl = Qr().isApiWritable;
  Z.NAMESPACE = { HTML: "http://www.w3.org/1999/xhtml", XML: "http://www.w3.org/XML/1998/namespace", XMLNS: "http://www.w3.org/2000/xmlns/", MATHML: "http://www.w3.org/1998/Math/MathML", SVG: "http://www.w3.org/2000/svg", XLINK: "http://www.w3.org/1999/xlink" };
  Z.IndexSizeError = function() {
    throw new de(me.INDEX_SIZE_ERR);
  };
  Z.HierarchyRequestError = function() {
    throw new de(me.HIERARCHY_REQUEST_ERR);
  };
  Z.WrongDocumentError = function() {
    throw new de(me.WRONG_DOCUMENT_ERR);
  };
  Z.InvalidCharacterError = function() {
    throw new de(me.INVALID_CHARACTER_ERR);
  };
  Z.NoModificationAllowedError = function() {
    throw new de(me.NO_MODIFICATION_ALLOWED_ERR);
  };
  Z.NotFoundError = function() {
    throw new de(me.NOT_FOUND_ERR);
  };
  Z.NotSupportedError = function() {
    throw new de(me.NOT_SUPPORTED_ERR);
  };
  Z.InvalidStateError = function() {
    throw new de(me.INVALID_STATE_ERR);
  };
  Z.SyntaxError = function() {
    throw new de(me.SYNTAX_ERR);
  };
  Z.InvalidModificationError = function() {
    throw new de(me.INVALID_MODIFICATION_ERR);
  };
  Z.NamespaceError = function() {
    throw new de(me.NAMESPACE_ERR);
  };
  Z.InvalidAccessError = function() {
    throw new de(me.INVALID_ACCESS_ERR);
  };
  Z.TypeMismatchError = function() {
    throw new de(me.TYPE_MISMATCH_ERR);
  };
  Z.SecurityError = function() {
    throw new de(me.SECURITY_ERR);
  };
  Z.NetworkError = function() {
    throw new de(me.NETWORK_ERR);
  };
  Z.AbortError = function() {
    throw new de(me.ABORT_ERR);
  };
  Z.UrlMismatchError = function() {
    throw new de(me.URL_MISMATCH_ERR);
  };
  Z.QuotaExceededError = function() {
    throw new de(me.QUOTA_EXCEEDED_ERR);
  };
  Z.TimeoutError = function() {
    throw new de(me.TIMEOUT_ERR);
  };
  Z.InvalidNodeTypeError = function() {
    throw new de(me.INVALID_NODE_TYPE_ERR);
  };
  Z.DataCloneError = function() {
    throw new de(me.DATA_CLONE_ERR);
  };
  Z.nyi = function() {
    throw new Error("NotYetImplemented");
  };
  Z.shouldOverride = function() {
    throw new Error("Abstract function; should be overriding in subclass.");
  };
  Z.assert = function(e, t) {
    if (!e)
      throw new Error("Assertion failed: " + (t || "") + `
` + new Error().stack);
  };
  Z.expose = function(e, t) {
    for (var r in e)
      Object.defineProperty(t.prototype, r, { value: e[r], writable: Jl });
  };
  Z.merge = function(e, t) {
    for (var r in t)
      e[r] = t[r];
  };
  Z.documentOrder = function(e, t) {
    return 3 - (e.compareDocumentPosition(t) & 6);
  };
  Z.toASCIILowerCase = function(e) {
    return e.replace(/[A-Z]+/g, function(t) {
      return t.toLowerCase();
    });
  };
  Z.toASCIIUpperCase = function(e) {
    return e.replace(/[a-z]+/g, function(t) {
      return t.toUpperCase();
    });
  };
});
var Jn = O((kf, Pi) => {
  var Mt = zt(), eu = Qn(), tu = he();
  Pi.exports = Hi;
  function Hi() {
  }
  Hi.prototype = { addEventListener: function(t, r, n) {
    if (!!r) {
      n === void 0 && (n = false), this._listeners || (this._listeners = Object.create(null)), this._listeners[t] || (this._listeners[t] = []);
      for (var l = this._listeners[t], f = 0, _ = l.length; f < _; f++) {
        var y = l[f];
        if (y.listener === r && y.capture === n)
          return;
      }
      var w = { listener: r, capture: n };
      typeof r == "function" && (w.f = r), l.push(w);
    }
  }, removeEventListener: function(t, r, n) {
    if (n === void 0 && (n = false), this._listeners) {
      var l = this._listeners[t];
      if (l)
        for (var f = 0, _ = l.length; f < _; f++) {
          var y = l[f];
          if (y.listener === r && y.capture === n) {
            l.length === 1 ? this._listeners[t] = void 0 : l.splice(f, 1);
            return;
          }
        }
    }
  }, dispatchEvent: function(t) {
    return this._dispatchEvent(t, false);
  }, _dispatchEvent: function(t, r) {
    typeof r != "boolean" && (r = false);
    function n(S, D) {
      var ae = D.type, ce = D.eventPhase;
      if (D.currentTarget = S, ce !== Mt.CAPTURING_PHASE && S._handlers && S._handlers[ae]) {
        var g = S._handlers[ae], re;
        if (typeof g == "function")
          re = g.call(D.currentTarget, D);
        else {
          var $2 = g.handleEvent;
          if (typeof $2 != "function")
            throw new TypeError("handleEvent property of event handler object isnot a function.");
          re = $2.call(g, D);
        }
        switch (D.type) {
          case "mouseover":
            re === true && D.preventDefault();
            break;
          case "beforeunload":
          default:
            re === false && D.preventDefault();
            break;
        }
      }
      var V = S._listeners && S._listeners[ae];
      if (!!V) {
        V = V.slice();
        for (var ve = 0, U = V.length; ve < U; ve++) {
          if (D._immediatePropagationStopped)
            return;
          var ie = V[ve];
          if (!(ce === Mt.CAPTURING_PHASE && !ie.capture || ce === Mt.BUBBLING_PHASE && ie.capture))
            if (ie.f)
              ie.f.call(D.currentTarget, D);
            else {
              var be = ie.listener.handleEvent;
              if (typeof be != "function")
                throw new TypeError("handleEvent property of event listener object is not a function.");
              be.call(ie.listener, D);
            }
        }
      }
    }
    (!t._initialized || t._dispatching) && tu.InvalidStateError(), t.isTrusted = r, t._dispatching = true, t.target = this;
    for (var l = [], f = this.parentNode; f; f = f.parentNode)
      l.push(f);
    t.eventPhase = Mt.CAPTURING_PHASE;
    for (var _ = l.length - 1; _ >= 0 && (n(l[_], t), !t._propagationStopped); _--)
      ;
    if (t._propagationStopped || (t.eventPhase = Mt.AT_TARGET, n(this, t)), t.bubbles && !t._propagationStopped) {
      t.eventPhase = Mt.BUBBLING_PHASE;
      for (var y = 0, w = l.length; y < w && (n(l[y], t), !t._propagationStopped); y++)
        ;
    }
    if (t._dispatching = false, t.eventPhase = Mt.AT_TARGET, t.currentTarget = null, r && !t.defaultPrevented && t instanceof eu)
      switch (t.type) {
        case "mousedown":
          this._armed = { x: t.clientX, y: t.clientY, t: t.timeStamp };
          break;
        case "mouseout":
        case "mouseover":
          this._armed = null;
          break;
        case "mouseup":
          this._isClick(t) && this._doClick(t), this._armed = null;
          break;
      }
    return !t.defaultPrevented;
  }, _isClick: function(e) {
    return this._armed !== null && e.type === "mouseup" && e.isTrusted && e.button === 0 && e.timeStamp - this._armed.t < 1e3 && Math.abs(e.clientX - this._armed.x) < 10 && Math.abs(e.clientY - this._armed.Y) < 10;
  }, _doClick: function(e) {
    if (!this._click_in_progress) {
      this._click_in_progress = true;
      for (var t = this; t && !t._post_click_activation_steps; )
        t = t.parentNode;
      t && t._pre_click_activation_steps && t._pre_click_activation_steps();
      var r = this.ownerDocument.createEvent("MouseEvent");
      r.initMouseEvent("click", true, true, this.ownerDocument.defaultView, 1, e.screenX, e.screenY, e.clientX, e.clientY, e.ctrlKey, e.altKey, e.shiftKey, e.metaKey, e.button, null);
      var n = this._dispatchEvent(r, true);
      t && (n ? t._post_click_activation_steps && t._post_click_activation_steps(r) : t._cancelled_activation_steps && t._cancelled_activation_steps());
    }
  }, _setEventHandler: function(t, r) {
    this._handlers || (this._handlers = Object.create(null)), this._handlers[t] = r;
  }, _getEventHandler: function(t) {
    return this._handlers && this._handlers[t] || null;
  } };
});
var ea = O((Sf, Bi) => {
  var ot = he(), Ve = Bi.exports = { valid: function(e) {
    return ot.assert(e, "list falsy"), ot.assert(e._previousSibling, "previous falsy"), ot.assert(e._nextSibling, "next falsy"), true;
  }, insertBefore: function(e, t) {
    ot.assert(Ve.valid(e) && Ve.valid(t));
    var r = e, n = e._previousSibling, l = t, f = t._previousSibling;
    r._previousSibling = f, n._nextSibling = l, f._nextSibling = r, l._previousSibling = n, ot.assert(Ve.valid(e) && Ve.valid(t));
  }, replace: function(e, t) {
    ot.assert(Ve.valid(e) && (t === null || Ve.valid(t))), t !== null && Ve.insertBefore(t, e), Ve.remove(e), ot.assert(Ve.valid(e) && (t === null || Ve.valid(t)));
  }, remove: function(e) {
    ot.assert(Ve.valid(e));
    var t = e._previousSibling;
    if (t !== e) {
      var r = e._nextSibling;
      t._nextSibling = r, r._previousSibling = t, e._previousSibling = e._nextSibling = e, ot.assert(Ve.valid(e));
    }
  } };
});
var ta = O((Nf, Vi) => {
  Vi.exports = { serializeOne: cu };
  var Ui = he(), Rt = Ui.NAMESPACE, ru = { STYLE: true, SCRIPT: true, XMP: true, IFRAME: true, NOEMBED: true, NOFRAMES: true, PLAINTEXT: true }, nu = { area: true, base: true, basefont: true, bgsound: true, br: true, col: true, embed: true, frame: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true }, au = {};
  function iu(e) {
    return e.replace(/[&<>\u00A0]/g, function(t) {
      switch (t) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case "\xA0":
          return "&nbsp;";
      }
    });
  }
  function su(e) {
    var t = /[&"\u00A0]/g;
    return t.test(e) ? e.replace(t, function(r) {
      switch (r) {
        case "&":
          return "&amp;";
        case '"':
          return "&quot;";
        case "\xA0":
          return "&nbsp;";
      }
    }) : e;
  }
  function ou(e) {
    var t = e.namespaceURI;
    return t ? t === Rt.XML ? "xml:" + e.localName : t === Rt.XLINK ? "xlink:" + e.localName : t === Rt.XMLNS ? e.localName === "xmlns" ? "xmlns" : "xmlns:" + e.localName : e.name : e.localName;
  }
  function cu(e, t) {
    var r = "";
    switch (e.nodeType) {
      case 1:
        var n = e.namespaceURI, l = n === Rt.HTML, f = l || n === Rt.SVG || n === Rt.MATHML ? e.localName : e.tagName;
        r += "<" + f;
        for (var _ = 0, y = e._numattrs; _ < y; _++) {
          var w = e._attr(_);
          r += " " + ou(w), w.value !== void 0 && (r += '="' + su(w.value) + '"');
        }
        if (r += ">", !(l && nu[f])) {
          var S = e.serialize();
          l && au[f] && S.charAt(0) === `
` && (r += `
`), r += S, r += "</" + f + ">";
        }
        break;
      case 3:
      case 4:
        var D;
        t.nodeType === 1 && t.namespaceURI === Rt.HTML ? D = t.tagName : D = "", ru[D] || D === "NOSCRIPT" && t.ownerDocument._scripting_enabled ? r += e.data : r += iu(e.data);
        break;
      case 8:
        r += "<!--" + e.data + "-->";
        break;
      case 7:
        r += "<?" + e.target + " " + e.data + "?>";
        break;
      case 10:
        r += "<!DOCTYPE " + e.name, r += ">";
        break;
      default:
        Ui.InvalidStateError();
    }
    return r;
  }
});
var Te = O((Cf, $i) => {
  $i.exports = xe;
  var zi = Jn(), Zr = ea(), ji = ta(), J = he();
  function xe() {
    zi.call(this), this.parentNode = null, this._nextSibling = this._previousSibling = this, this._index = void 0;
  }
  var Me = xe.ELEMENT_NODE = 1, ra = xe.ATTRIBUTE_NODE = 2, Jr = xe.TEXT_NODE = 3, lu = xe.CDATA_SECTION_NODE = 4, uu = xe.ENTITY_REFERENCE_NODE = 5, na = xe.ENTITY_NODE = 6, Wi = xe.PROCESSING_INSTRUCTION_NODE = 7, Gi = xe.COMMENT_NODE = 8, hr = xe.DOCUMENT_NODE = 9, ze = xe.DOCUMENT_TYPE_NODE = 10, vt = xe.DOCUMENT_FRAGMENT_NODE = 11, aa = xe.NOTATION_NODE = 12, ia = xe.DOCUMENT_POSITION_DISCONNECTED = 1, sa = xe.DOCUMENT_POSITION_PRECEDING = 2, oa = xe.DOCUMENT_POSITION_FOLLOWING = 4, Yi = xe.DOCUMENT_POSITION_CONTAINS = 8, ca = xe.DOCUMENT_POSITION_CONTAINED_BY = 16, la = xe.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
  xe.prototype = Object.create(zi.prototype, { baseURI: { get: J.nyi }, parentElement: { get: function() {
    return this.parentNode && this.parentNode.nodeType === Me ? this.parentNode : null;
  } }, hasChildNodes: { value: J.shouldOverride }, firstChild: { get: J.shouldOverride }, lastChild: { get: J.shouldOverride }, previousSibling: { get: function() {
    var e = this.parentNode;
    return !e || this === e.firstChild ? null : this._previousSibling;
  } }, nextSibling: { get: function() {
    var e = this.parentNode, t = this._nextSibling;
    return !e || t === e.firstChild ? null : t;
  } }, textContent: { get: function() {
    return null;
  }, set: function(e) {
  } }, _countChildrenOfType: { value: function(e) {
    for (var t = 0, r = this.firstChild; r !== null; r = r.nextSibling)
      r.nodeType === e && t++;
    return t;
  } }, _ensureInsertValid: { value: function(t, r, n) {
    var l = this, f, _;
    if (!t.nodeType)
      throw new TypeError("not a node");
    switch (l.nodeType) {
      case hr:
      case vt:
      case Me:
        break;
      default:
        J.HierarchyRequestError();
    }
    switch (t.isAncestor(l) && J.HierarchyRequestError(), (r !== null || !n) && r.parentNode !== l && J.NotFoundError(), t.nodeType) {
      case vt:
      case ze:
      case Me:
      case Jr:
      case Wi:
      case Gi:
        break;
      default:
        J.HierarchyRequestError();
    }
    if (l.nodeType === hr)
      switch (t.nodeType) {
        case Jr:
          J.HierarchyRequestError();
          break;
        case vt:
          switch (t._countChildrenOfType(Jr) > 0 && J.HierarchyRequestError(), t._countChildrenOfType(Me)) {
            case 0:
              break;
            case 1:
              if (r !== null)
                for (n && r.nodeType === ze && J.HierarchyRequestError(), _ = r.nextSibling; _ !== null; _ = _.nextSibling)
                  _.nodeType === ze && J.HierarchyRequestError();
              f = l._countChildrenOfType(Me), n ? f > 0 && J.HierarchyRequestError() : (f > 1 || f === 1 && r.nodeType !== Me) && J.HierarchyRequestError();
              break;
            default:
              J.HierarchyRequestError();
          }
          break;
        case Me:
          if (r !== null)
            for (n && r.nodeType === ze && J.HierarchyRequestError(), _ = r.nextSibling; _ !== null; _ = _.nextSibling)
              _.nodeType === ze && J.HierarchyRequestError();
          f = l._countChildrenOfType(Me), n ? f > 0 && J.HierarchyRequestError() : (f > 1 || f === 1 && r.nodeType !== Me) && J.HierarchyRequestError();
          break;
        case ze:
          if (r === null)
            l._countChildrenOfType(Me) && J.HierarchyRequestError();
          else
            for (_ = l.firstChild; _ !== null && _ !== r; _ = _.nextSibling)
              _.nodeType === Me && J.HierarchyRequestError();
          f = l._countChildrenOfType(ze), n ? f > 0 && J.HierarchyRequestError() : (f > 1 || f === 1 && r.nodeType !== ze) && J.HierarchyRequestError();
          break;
      }
    else
      t.nodeType === ze && J.HierarchyRequestError();
  } }, insertBefore: { value: function(t, r) {
    var n = this;
    n._ensureInsertValid(t, r, true);
    var l = r;
    return l === t && (l = t.nextSibling), n.doc.adoptNode(t), t._insertOrReplace(n, l, false), t;
  } }, appendChild: { value: function(e) {
    return this.insertBefore(e, null);
  } }, _appendChild: { value: function(e) {
    e._insertOrReplace(this, null, false);
  } }, removeChild: { value: function(t) {
    var r = this;
    if (!t.nodeType)
      throw new TypeError("not a node");
    return t.parentNode !== r && J.NotFoundError(), t.remove(), t;
  } }, replaceChild: { value: function(t, r) {
    var n = this;
    return n._ensureInsertValid(t, r, false), t.doc !== n.doc && n.doc.adoptNode(t), t._insertOrReplace(n, r, true), r;
  } }, contains: { value: function(t) {
    return t === null ? false : this === t ? true : (this.compareDocumentPosition(t) & ca) != 0;
  } }, compareDocumentPosition: { value: function(t) {
    if (this === t)
      return 0;
    if (this.doc !== t.doc || this.rooted !== t.rooted)
      return ia + la;
    for (var r = [], n = [], l = this; l !== null; l = l.parentNode)
      r.push(l);
    for (l = t; l !== null; l = l.parentNode)
      n.push(l);
    if (r.reverse(), n.reverse(), r[0] !== n[0])
      return ia + la;
    l = Math.min(r.length, n.length);
    for (var f = 1; f < l; f++)
      if (r[f] !== n[f])
        return r[f].index < n[f].index ? oa : sa;
    return r.length < n.length ? oa + ca : sa + Yi;
  } }, isSameNode: { value: function(t) {
    return this === t;
  } }, isEqualNode: { value: function(t) {
    if (!t || t.nodeType !== this.nodeType || !this.isEqual(t))
      return false;
    for (var r = this.firstChild, n = t.firstChild; r && n; r = r.nextSibling, n = n.nextSibling)
      if (!r.isEqualNode(n))
        return false;
    return r === null && n === null;
  } }, cloneNode: { value: function(e) {
    var t = this.clone();
    if (e)
      for (var r = this.firstChild; r !== null; r = r.nextSibling)
        t._appendChild(r.cloneNode(true));
    return t;
  } }, lookupPrefix: { value: function(t) {
    var r;
    if (t === "" || t === null || t === void 0)
      return null;
    switch (this.nodeType) {
      case Me:
        return this._lookupNamespacePrefix(t, this);
      case hr:
        return r = this.documentElement, r ? r.lookupPrefix(t) : null;
      case na:
      case aa:
      case vt:
      case ze:
        return null;
      case ra:
        return r = this.ownerElement, r ? r.lookupPrefix(t) : null;
      default:
        return r = this.parentElement, r ? r.lookupPrefix(t) : null;
    }
  } }, lookupNamespaceURI: { value: function(t) {
    (t === "" || t === void 0) && (t = null);
    var r;
    switch (this.nodeType) {
      case Me:
        return J.shouldOverride();
      case hr:
        return r = this.documentElement, r ? r.lookupNamespaceURI(t) : null;
      case na:
      case aa:
      case ze:
      case vt:
        return null;
      case ra:
        return r = this.ownerElement, r ? r.lookupNamespaceURI(t) : null;
      default:
        return r = this.parentElement, r ? r.lookupNamespaceURI(t) : null;
    }
  } }, isDefaultNamespace: { value: function(t) {
    (t === "" || t === void 0) && (t = null);
    var r = this.lookupNamespaceURI(null);
    return r === t;
  } }, index: { get: function() {
    var e = this.parentNode;
    if (this === e.firstChild)
      return 0;
    var t = e.childNodes;
    if (this._index === void 0 || t[this._index] !== this) {
      for (var r = 0; r < t.length; r++)
        t[r]._index = r;
      J.assert(t[this._index] === this);
    }
    return this._index;
  } }, isAncestor: { value: function(e) {
    if (this.doc !== e.doc || this.rooted !== e.rooted)
      return false;
    for (var t = e; t; t = t.parentNode)
      if (t === this)
        return true;
    return false;
  } }, ensureSameDoc: { value: function(e) {
    e.ownerDocument === null ? e.ownerDocument = this.doc : e.ownerDocument !== this.doc && J.WrongDocumentError();
  } }, removeChildren: { value: J.shouldOverride }, _insertOrReplace: { value: function(t, r, n) {
    var l = this, f, _;
    if (l.nodeType === vt && l.rooted && J.HierarchyRequestError(), t._childNodes && (f = r === null ? t._childNodes.length : r.index, l.parentNode === t)) {
      var y = l.index;
      y < f && f--;
    }
    n && (r.rooted && r.doc.mutateRemove(r), r.parentNode = null);
    var w = r;
    w === null && (w = t.firstChild);
    var S = l.rooted && t.rooted;
    if (l.nodeType === vt) {
      for (var D = [0, n ? 1 : 0], ae, ce = l.firstChild; ce !== null; ce = ae)
        ae = ce.nextSibling, D.push(ce), ce.parentNode = t;
      var g = D.length;
      if (n ? Zr.replace(w, g > 2 ? D[2] : null) : g > 2 && w !== null && Zr.insertBefore(D[2], w), t._childNodes)
        for (D[0] = r === null ? t._childNodes.length : r._index, t._childNodes.splice.apply(t._childNodes, D), _ = 2; _ < g; _++)
          D[_]._index = D[0] + (_ - 2);
      else
        t._firstChild === r && (g > 2 ? t._firstChild = D[2] : n && (t._firstChild = null));
      if (l._childNodes ? l._childNodes.length = 0 : l._firstChild = null, t.rooted)
        for (t.modify(), _ = 2; _ < g; _++)
          t.doc.mutateInsert(D[_]);
    } else {
      if (r === l)
        return;
      S ? l._remove() : l.parentNode && l.remove(), l.parentNode = t, n ? (Zr.replace(w, l), t._childNodes ? (l._index = f, t._childNodes[f] = l) : t._firstChild === r && (t._firstChild = l)) : (w !== null && Zr.insertBefore(l, w), t._childNodes ? (l._index = f, t._childNodes.splice(f, 0, l)) : t._firstChild === r && (t._firstChild = l)), S ? (t.modify(), t.doc.mutateMove(l)) : t.rooted && (t.modify(), t.doc.mutateInsert(l));
    }
  } }, lastModTime: { get: function() {
    return this._lastModTime || (this._lastModTime = this.doc.modclock), this._lastModTime;
  } }, modify: { value: function() {
    if (this.doc.modclock)
      for (var e = ++this.doc.modclock, t = this; t; t = t.parentElement)
        t._lastModTime && (t._lastModTime = e);
  } }, doc: { get: function() {
    return this.ownerDocument || this;
  } }, rooted: { get: function() {
    return !!this._nid;
  } }, normalize: { value: function() {
    for (var e, t = this.firstChild; t !== null; t = e)
      if (e = t.nextSibling, t.normalize && t.normalize(), t.nodeType === xe.TEXT_NODE) {
        if (t.nodeValue === "") {
          this.removeChild(t);
          continue;
        }
        var r = t.previousSibling;
        r !== null && r.nodeType === xe.TEXT_NODE && (r.appendData(t.nodeValue), this.removeChild(t));
      }
  } }, serialize: { value: function() {
    for (var e = "", t = this.firstChild; t !== null; t = t.nextSibling)
      e += ji.serializeOne(t, this);
    return e;
  } }, outerHTML: { get: function() {
    return ji.serializeOne(this, { nodeType: 0 });
  }, set: J.nyi }, ELEMENT_NODE: { value: Me }, ATTRIBUTE_NODE: { value: ra }, TEXT_NODE: { value: Jr }, CDATA_SECTION_NODE: { value: lu }, ENTITY_REFERENCE_NODE: { value: uu }, ENTITY_NODE: { value: na }, PROCESSING_INSTRUCTION_NODE: { value: Wi }, COMMENT_NODE: { value: Gi }, DOCUMENT_NODE: { value: hr }, DOCUMENT_TYPE_NODE: { value: ze }, DOCUMENT_FRAGMENT_NODE: { value: vt }, NOTATION_NODE: { value: aa }, DOCUMENT_POSITION_DISCONNECTED: { value: ia }, DOCUMENT_POSITION_PRECEDING: { value: sa }, DOCUMENT_POSITION_FOLLOWING: { value: oa }, DOCUMENT_POSITION_CONTAINS: { value: Yi }, DOCUMENT_POSITION_CONTAINED_BY: { value: ca }, DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: { value: la } });
});
var Xi = O((Lf, Ki) => {
  Ki.exports = class extends Array {
    constructor(t) {
      super(t && t.length || 0);
      if (t)
        for (var r in t)
          this[r] = t[r];
    }
    item(t) {
      return this[t] || null;
    }
  };
});
var Zi = O((Df, Qi) => {
  function fu(e) {
    return this[e] || null;
  }
  function du(e) {
    return e || (e = []), e.item = fu, e;
  }
  Qi.exports = du;
});
var It = O((Mf, Ji) => {
  var ua;
  try {
    ua = Xi();
  } catch (e) {
    ua = Zi();
  }
  Ji.exports = ua;
});
var en = O((Rf, rs) => {
  rs.exports = ts;
  var es = Te(), hu = It();
  function ts() {
    es.call(this), this._firstChild = this._childNodes = null;
  }
  ts.prototype = Object.create(es.prototype, { hasChildNodes: { value: function() {
    return this._childNodes ? this._childNodes.length > 0 : this._firstChild !== null;
  } }, childNodes: { get: function() {
    return this._ensureChildNodes(), this._childNodes;
  } }, firstChild: { get: function() {
    return this._childNodes ? this._childNodes.length === 0 ? null : this._childNodes[0] : this._firstChild;
  } }, lastChild: { get: function() {
    var e = this._childNodes, t;
    return e ? e.length === 0 ? null : e[e.length - 1] : (t = this._firstChild, t === null ? null : t._previousSibling);
  } }, _ensureChildNodes: { value: function() {
    if (!this._childNodes) {
      var e = this._firstChild, t = e, r = this._childNodes = new hu();
      if (e)
        do
          r.push(t), t = t._nextSibling;
        while (t !== e);
      this._firstChild = null;
    }
  } }, removeChildren: { value: function() {
    for (var t = this.rooted ? this.ownerDocument : null, r = this.firstChild, n; r !== null; )
      n = r, r = n.nextSibling, t && t.mutateRemove(n), n.parentNode = null;
    this._childNodes ? this._childNodes.length = 0 : this._firstChild = null, this.modify();
  } } });
});
var tn = O((ha) => {
  ha.isValidName = Eu;
  ha.isValidQName = vu;
  var xu = /^[_:A-Za-z][-.:\w]+$/, pu = /^([_A-Za-z][-.\w]+|[_A-Za-z][-.\w]+:[_A-Za-z][-.\w]+)$/, xr = "_A-Za-z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD", pr = "-._A-Za-z0-9\xB7\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0300-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD", Ot = "[" + xr + "][" + pr + "]*", fa = xr + ":", da = pr + ":", mu = new RegExp("^[" + fa + "][" + da + "]*$"), gu = new RegExp("^(" + Ot + "|" + Ot + ":" + Ot + ")$"), ns = /[\uD800-\uDB7F\uDC00-\uDFFF]/, as = /[\uD800-\uDB7F\uDC00-\uDFFF]/g, is = /[\uD800-\uDB7F][\uDC00-\uDFFF]/g;
  xr += "\uD800-\u{EFC00}-\uDFFF";
  pr += "\uD800-\u{EFC00}-\uDFFF";
  Ot = "[" + xr + "][" + pr + "]*";
  fa = xr + ":";
  da = pr + ":";
  var bu = new RegExp("^[" + fa + "][" + da + "]*$"), _u = new RegExp("^(" + Ot + "|" + Ot + ":" + Ot + ")$");
  function Eu(e) {
    if (xu.test(e) || mu.test(e))
      return true;
    if (!ns.test(e) || !bu.test(e))
      return false;
    var t = e.match(as), r = e.match(is);
    return r !== null && 2 * r.length === t.length;
  }
  function vu(e) {
    if (pu.test(e) || gu.test(e))
      return true;
    if (!ns.test(e) || !_u.test(e))
      return false;
    var t = e.match(as), r = e.match(is);
    return r !== null && 2 * r.length === t.length;
  }
});
var pa = O((xa) => {
  var ss = he();
  xa.property = function(e) {
    if (Array.isArray(e.type)) {
      var t = Object.create(null);
      e.type.forEach(function(l) {
        t[l.value || l] = l.alias || l;
      });
      var r = e.missing;
      r === void 0 && (r = null);
      var n = e.invalid;
      return n === void 0 && (n = r), { get: function() {
        var l = this._getattr(e.name);
        return l === null ? r : (l = t[l.toLowerCase()], l !== void 0 ? l : n !== null ? n : l);
      }, set: function(l) {
        this._setattr(e.name, l);
      } };
    } else {
      if (e.type === Boolean)
        return { get: function() {
          return this.hasAttribute(e.name);
        }, set: function(l) {
          l ? this._setattr(e.name, "") : this.removeAttribute(e.name);
        } };
      if (e.type === Number || e.type === "long" || e.type === "unsigned long" || e.type === "limited unsigned long with fallback")
        return yu(e);
      if (!e.type || e.type === String)
        return { get: function() {
          return this._getattr(e.name) || "";
        }, set: function(l) {
          e.treatNullAsEmptyString && l === null && (l = ""), this._setattr(e.name, l);
        } };
      if (typeof e.type == "function")
        return e.type(e.name, e);
    }
    throw new Error("Invalid attribute definition");
  };
  function yu(e) {
    var t;
    typeof e.default == "function" ? t = e.default : typeof e.default == "number" ? t = function() {
      return e.default;
    } : t = function() {
      ss.assert(false, typeof e.default);
    };
    var r = e.type === "unsigned long", n = e.type === "long", l = e.type === "limited unsigned long with fallback", f = e.min, _ = e.max, y = e.setmin;
    return f === void 0 && (r && (f = 0), n && (f = -2147483648), l && (f = 1)), _ === void 0 && (r || n || l) && (_ = 2147483647), { get: function() {
      var w = this._getattr(e.name), S = e.float ? parseFloat(w) : parseInt(w, 10);
      if (w === null || !isFinite(S) || f !== void 0 && S < f || _ !== void 0 && S > _)
        return t.call(this);
      if (r || n || l) {
        if (!/^[ \t\n\f\r]*[-+]?[0-9]/.test(w))
          return t.call(this);
        S = S | 0;
      }
      return S;
    }, set: function(w) {
      e.float || (w = Math.floor(w)), y !== void 0 && w < y && ss.IndexSizeError(e.name + " set to " + w), r ? w = w < 0 || w > 2147483647 ? t.call(this) : w | 0 : l ? w = w < 1 || w > 2147483647 ? t.call(this) : w | 0 : n && (w = w < -2147483648 || w > 2147483647 ? t.call(this) : w | 0), this._setattr(e.name, String(w));
    } };
  }
  xa.registerChangeHandler = function(e, t, r) {
    var n = e.prototype;
    Object.prototype.hasOwnProperty.call(n, "_attributeChangeHandlers") || (n._attributeChangeHandlers = Object.create(n._attributeChangeHandlers || null)), n._attributeChangeHandlers[t] = r;
  };
});
var ls = O((qf, cs) => {
  cs.exports = os;
  var Tu = Te();
  function os(e, t) {
    this.root = e, this.filter = t, this.lastModTime = e.lastModTime, this.done = false, this.cache = [], this.traverse();
  }
  os.prototype = Object.create(Object.prototype, { length: { get: function() {
    return this.checkcache(), this.done || this.traverse(), this.cache.length;
  } }, item: { value: function(e) {
    return this.checkcache(), !this.done && e >= this.cache.length && this.traverse(), this.cache[e];
  } }, checkcache: { value: function() {
    if (this.lastModTime !== this.root.lastModTime) {
      for (var e = this.cache.length - 1; e >= 0; e--)
        this[e] = void 0;
      this.cache.length = 0, this.done = false, this.lastModTime = this.root.lastModTime;
    }
  } }, traverse: { value: function(e) {
    e !== void 0 && e++;
    for (var t; (t = this.next()) !== null; )
      if (this[this.cache.length] = t, this.cache.push(t), e && this.cache.length === e)
        return;
    this.done = true;
  } }, next: { value: function() {
    var e = this.cache.length === 0 ? this.root : this.cache[this.cache.length - 1], t;
    for (e.nodeType === Tu.DOCUMENT_NODE ? t = e.documentElement : t = e.nextElement(this.root); t; ) {
      if (this.filter(t))
        return t;
      t = t.nextElement(this.root);
    }
    return null;
  } } });
});
var ga = O((Ff, ds) => {
  var ma = he();
  ds.exports = us;
  function us(e, t) {
    this._getString = e, this._setString = t, this._length = 0, this._lastStringValue = "", this._update();
  }
  Object.defineProperties(us.prototype, { length: { get: function() {
    return this._length;
  } }, item: { value: function(e) {
    var t = jt(this);
    return e < 0 || e >= t.length ? null : t[e];
  } }, contains: { value: function(e) {
    e = String(e);
    var t = jt(this);
    return t.indexOf(e) > -1;
  } }, add: { value: function() {
    for (var e = jt(this), t = 0, r = arguments.length; t < r; t++) {
      var n = mr(arguments[t]);
      e.indexOf(n) < 0 && e.push(n);
    }
    this._update(e);
  } }, remove: { value: function() {
    for (var e = jt(this), t = 0, r = arguments.length; t < r; t++) {
      var n = mr(arguments[t]), l = e.indexOf(n);
      l > -1 && e.splice(l, 1);
    }
    this._update(e);
  } }, toggle: { value: function(t, r) {
    return t = mr(t), this.contains(t) ? r === void 0 || r === false ? (this.remove(t), false) : true : r === void 0 || r === true ? (this.add(t), true) : false;
  } }, replace: { value: function(t, r) {
    String(r) === "" && ma.SyntaxError(), t = mr(t), r = mr(r);
    var n = jt(this), l = n.indexOf(t);
    if (l < 0)
      return false;
    var f = n.indexOf(r);
    return f < 0 ? n[l] = r : l < f ? (n[l] = r, n.splice(f, 1)) : n.splice(l, 1), this._update(n), true;
  } }, toString: { value: function() {
    return this._getString();
  } }, value: { get: function() {
    return this._getString();
  }, set: function(e) {
    this._setString(e), this._update();
  } }, _update: { value: function(e) {
    e ? (fs(this, e), this._setString(e.join(" ").trim())) : fs(this, jt(this)), this._lastStringValue = this._getString();
  } } });
  function fs(e, t) {
    var r = e._length, n;
    for (e._length = t.length, n = 0; n < t.length; n++)
      e[n] = t[n];
    for (; n < r; n++)
      e[n] = void 0;
  }
  function mr(e) {
    return e = String(e), e === "" && ma.SyntaxError(), /[ \t\r\n\f]/.test(e) && ma.InvalidCharacterError(), e;
  }
  function wu(e) {
    for (var t = e._length, r = Array(t), n = 0; n < t; n++)
      r[n] = e[n];
    return r;
  }
  function jt(e) {
    var t = e._getString();
    if (t === e._lastStringValue)
      return wu(e);
    var r = t.replace(/(^[ \t\r\n\f]+)|([ \t\r\n\f]+$)/g, "");
    if (r === "")
      return [];
    var n = Object.create(null);
    return r.split(/[ \t\r\n\f]+/g).filter(function(l) {
      var f = "$" + l;
      return n[f] ? false : (n[f] = true, true);
    });
  }
});
var sn = O((Yt, bs) => {
  var rn = Object.create(null, { location: { get: function() {
    throw new Error("window.location is not supported.");
  } } }), ku = function(e, t) {
    return e.compareDocumentPosition(t);
  }, Su = function(e, t) {
    return ku(e, t) & 2 ? 1 : -1;
  }, nn = function(e) {
    for (; (e = e.nextSibling) && e.nodeType !== 1; )
      ;
    return e;
  }, Wt = function(e) {
    for (; (e = e.previousSibling) && e.nodeType !== 1; )
      ;
    return e;
  }, Nu = function(e) {
    if (e = e.firstChild)
      for (; e.nodeType !== 1 && (e = e.nextSibling); )
        ;
    return e;
  }, Cu = function(e) {
    if (e = e.lastChild)
      for (; e.nodeType !== 1 && (e = e.previousSibling); )
        ;
    return e;
  }, Gt = function(e) {
    if (!e.parentNode)
      return false;
    var t = e.parentNode.nodeType;
    return t === 1 || t === 9;
  }, hs = function(e) {
    if (!e)
      return e;
    var t = e[0];
    return t === '"' || t === "'" ? (e[e.length - 1] === t ? e = e.slice(1, -1) : e = e.slice(1), e.replace(P.str_escape, function(r) {
      var n = /^\\(?:([0-9A-Fa-f]+)|([\r\n\f]+))/.exec(r);
      if (!n)
        return r.slice(1);
      if (n[2])
        return "";
      var l = parseInt(n[1], 16);
      return String.fromCodePoint ? String.fromCodePoint(l) : String.fromCharCode(l);
    })) : P.ident.test(e) ? yt(e) : e;
  }, yt = function(e) {
    return e.replace(P.escape, function(t) {
      var r = /^\\([0-9A-Fa-f]+)/.exec(t);
      if (!r)
        return t[1];
      var n = parseInt(r[1], 16);
      return String.fromCodePoint ? String.fromCodePoint(n) : String.fromCharCode(n);
    });
  }, Au = function() {
    return Array.prototype.indexOf ? Array.prototype.indexOf : function(e, t) {
      for (var r = this.length; r--; )
        if (this[r] === t)
          return r;
      return -1;
    };
  }(), xs = function(e, t) {
    var r = P.inside.source.replace(/</g, e).replace(/>/g, t);
    return new RegExp(r);
  }, Re = function(e, t, r) {
    return e = e.source, e = e.replace(t, r.source || r), new RegExp(e);
  }, ps = function(e, t) {
    return e.replace(/^(?:\w+:\/\/|\/+)/, "").replace(/(?:\/+|\/*#.*?)$/, "").split("/", t).join("/");
  }, Lu = function(e, t) {
    var r = e.replace(/\s+/g, ""), n;
    return r === "even" ? r = "2n+0" : r === "odd" ? r = "2n+1" : r.indexOf("n") === -1 && (r = "0n" + r), n = /^([+-])?(\d+)?n([+-])?(\d+)?$/.exec(r), { group: n[1] === "-" ? -(n[2] || 1) : +(n[2] || 1), offset: n[4] ? n[3] === "-" ? -n[4] : +n[4] : 0 };
  }, ba = function(e, t, r) {
    var n = Lu(e), l = n.group, f = n.offset, _ = r ? Cu : Nu, y = r ? Wt : nn;
    return function(w) {
      if (!!Gt(w))
        for (var S = _(w.parentNode), D = 0; S; ) {
          if (t(S, w) && D++, S === w)
            return D -= f, l && D ? D % l == 0 && D < 0 == l < 0 : !D;
          S = y(S);
        }
    };
  }, _e = { "*": function() {
    return function() {
      return true;
    };
  }(), type: function(e) {
    return e = e.toLowerCase(), function(t) {
      return t.nodeName.toLowerCase() === e;
    };
  }, attr: function(e, t, r, n) {
    return t = ms[t], function(l) {
      var f;
      switch (e) {
        case "for":
          f = l.htmlFor;
          break;
        case "class":
          f = l.className, f === "" && l.getAttribute("class") == null && (f = null);
          break;
        case "href":
        case "src":
          f = l.getAttribute(e, 2);
          break;
        case "title":
          f = l.getAttribute("title") || null;
          break;
        case "id":
        case "lang":
        case "dir":
        case "accessKey":
        case "hidden":
        case "tabIndex":
        case "style":
          if (l.getAttribute) {
            f = l.getAttribute(e);
            break;
          }
        default:
          if (l.hasAttribute && !l.hasAttribute(e))
            break;
          f = l[e] != null ? l[e] : l.getAttribute && l.getAttribute(e);
          break;
      }
      if (f != null)
        return f = f + "", n && (f = f.toLowerCase(), r = r.toLowerCase()), t(f, r);
    };
  }, ":first-child": function(e) {
    return !Wt(e) && Gt(e);
  }, ":last-child": function(e) {
    return !nn(e) && Gt(e);
  }, ":only-child": function(e) {
    return !Wt(e) && !nn(e) && Gt(e);
  }, ":nth-child": function(e, t) {
    return ba(e, function() {
      return true;
    }, t);
  }, ":nth-last-child": function(e) {
    return _e[":nth-child"](e, true);
  }, ":root": function(e) {
    return e.ownerDocument.documentElement === e;
  }, ":empty": function(e) {
    return !e.firstChild;
  }, ":not": function(e) {
    var t = Ea(e);
    return function(r) {
      return !t(r);
    };
  }, ":first-of-type": function(e) {
    if (!!Gt(e)) {
      for (var t = e.nodeName; e = Wt(e); )
        if (e.nodeName === t)
          return;
      return true;
    }
  }, ":last-of-type": function(e) {
    if (!!Gt(e)) {
      for (var t = e.nodeName; e = nn(e); )
        if (e.nodeName === t)
          return;
      return true;
    }
  }, ":only-of-type": function(e) {
    return _e[":first-of-type"](e) && _e[":last-of-type"](e);
  }, ":nth-of-type": function(e, t) {
    return ba(e, function(r, n) {
      return r.nodeName === n.nodeName;
    }, t);
  }, ":nth-last-of-type": function(e) {
    return _e[":nth-of-type"](e, true);
  }, ":checked": function(e) {
    return !!(e.checked || e.selected);
  }, ":indeterminate": function(e) {
    return !_e[":checked"](e);
  }, ":enabled": function(e) {
    return !e.disabled && e.type !== "hidden";
  }, ":disabled": function(e) {
    return !!e.disabled;
  }, ":target": function(e) {
    return e.id === rn.location.hash.substring(1);
  }, ":focus": function(e) {
    return e === e.ownerDocument.activeElement;
  }, ":is": function(e) {
    return Ea(e);
  }, ":matches": function(e) {
    return _e[":is"](e);
  }, ":nth-match": function(e, t) {
    var r = e.split(/\s*,\s*/), n = r.shift(), l = Ea(r.join(","));
    return ba(n, l, t);
  }, ":nth-last-match": function(e) {
    return _e[":nth-match"](e, true);
  }, ":links-here": function(e) {
    return e + "" == rn.location + "";
  }, ":lang": function(e) {
    return function(t) {
      for (; t; ) {
        if (t.lang)
          return t.lang.indexOf(e) === 0;
        t = t.parentNode;
      }
    };
  }, ":dir": function(e) {
    return function(t) {
      for (; t; ) {
        if (t.dir)
          return t.dir === e;
        t = t.parentNode;
      }
    };
  }, ":scope": function(e, t) {
    var r = t || e.ownerDocument;
    return r.nodeType === 9 ? e === r.documentElement : e === r;
  }, ":any-link": function(e) {
    return typeof e.href == "string";
  }, ":local-link": function(e) {
    if (e.nodeName)
      return e.href && e.host === rn.location.host;
    var t = +e + 1;
    return function(r) {
      if (!!r.href) {
        var n = rn.location + "", l = r + "";
        return ps(n, t) === ps(l, t);
      }
    };
  }, ":default": function(e) {
    return !!e.defaultSelected;
  }, ":valid": function(e) {
    return e.willValidate || e.validity && e.validity.valid;
  }, ":invalid": function(e) {
    return !_e[":valid"](e);
  }, ":in-range": function(e) {
    return e.value > e.min && e.value <= e.max;
  }, ":out-of-range": function(e) {
    return !_e[":in-range"](e);
  }, ":required": function(e) {
    return !!e.required;
  }, ":optional": function(e) {
    return !e.required;
  }, ":read-only": function(e) {
    if (e.readOnly)
      return true;
    var t = e.getAttribute("contenteditable"), r = e.contentEditable, n = e.nodeName.toLowerCase();
    return n = n !== "input" && n !== "textarea", (n || e.disabled) && t == null && r !== "true";
  }, ":read-write": function(e) {
    return !_e[":read-only"](e);
  }, ":hover": function() {
    throw new Error(":hover is not supported.");
  }, ":active": function() {
    throw new Error(":active is not supported.");
  }, ":link": function() {
    throw new Error(":link is not supported.");
  }, ":visited": function() {
    throw new Error(":visited is not supported.");
  }, ":column": function() {
    throw new Error(":column is not supported.");
  }, ":nth-column": function() {
    throw new Error(":nth-column is not supported.");
  }, ":nth-last-column": function() {
    throw new Error(":nth-last-column is not supported.");
  }, ":current": function() {
    throw new Error(":current is not supported.");
  }, ":past": function() {
    throw new Error(":past is not supported.");
  }, ":future": function() {
    throw new Error(":future is not supported.");
  }, ":contains": function(e) {
    return function(t) {
      var r = t.innerText || t.textContent || t.value || "";
      return r.indexOf(e) !== -1;
    };
  }, ":has": function(e) {
    return function(t) {
      return gs(e, t).length > 0;
    };
  } }, ms = { "-": function() {
    return true;
  }, "=": function(e, t) {
    return e === t;
  }, "*=": function(e, t) {
    return e.indexOf(t) !== -1;
  }, "~=": function(e, t) {
    var r, n, l, f;
    for (n = 0; ; n = r + 1) {
      if (r = e.indexOf(t, n), r === -1)
        return false;
      if (l = e[r - 1], f = e[r + t.length], (!l || l === " ") && (!f || f === " "))
        return true;
    }
  }, "|=": function(e, t) {
    var r = e.indexOf(t), n;
    if (r === 0)
      return n = e[r + t.length], n === "-" || !n;
  }, "^=": function(e, t) {
    return e.indexOf(t) === 0;
  }, "$=": function(e, t) {
    var r = e.lastIndexOf(t);
    return r !== -1 && r + t.length === e.length;
  }, "!=": function(e, t) {
    return e !== t;
  } }, gr = { " ": function(e) {
    return function(t) {
      for (; t = t.parentNode; )
        if (e(t))
          return t;
    };
  }, ">": function(e) {
    return function(t) {
      if (t = t.parentNode)
        return e(t) && t;
    };
  }, "+": function(e) {
    return function(t) {
      if (t = Wt(t))
        return e(t) && t;
    };
  }, "~": function(e) {
    return function(t) {
      for (; t = Wt(t); )
        if (e(t))
          return t;
    };
  }, noop: function(e) {
    return function(t) {
      return e(t) && t;
    };
  }, ref: function(e, t) {
    var r;
    function n(l) {
      for (var f = l.ownerDocument, _ = f.getElementsByTagName("*"), y = _.length; y--; )
        if (r = _[y], n.test(l))
          return r = null, true;
      r = null;
    }
    return n.combinator = function(l) {
      if (!(!r || !r.getAttribute)) {
        var f = r.getAttribute(t) || "";
        if (f[0] === "#" && (f = f.substring(1)), f === l.id && e(r))
          return r;
      }
    }, n;
  } }, P = { escape: /\\(?:[^0-9A-Fa-f\r\n]|[0-9A-Fa-f]{1,6}[\r\n\t ]?)/g, str_escape: /(escape)|\\(\n|\r\n?|\f)/g, nonascii: /[\u00A0-\uFFFF]/, cssid: /(?:(?!-?[0-9])(?:escape|nonascii|[-_a-zA-Z0-9])+)/, qname: /^ *(cssid|\*)/, simple: /^(?:([.#]cssid)|pseudo|attr)/, ref: /^ *\/(cssid)\/ */, combinator: /^(?: +([^ \w*.#\\]) +|( )+|([^ \w*.#\\]))(?! *$)/, attr: /^\[(cssid)(?:([^\w]?=)(inside))?\]/, pseudo: /^(:cssid)(?:\((inside)\))?/, inside: /(?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|<[^"'>]*>|\\["'>]|[^"'>])*/, ident: /^(cssid)$/ };
  P.cssid = Re(P.cssid, "nonascii", P.nonascii);
  P.cssid = Re(P.cssid, "escape", P.escape);
  P.qname = Re(P.qname, "cssid", P.cssid);
  P.simple = Re(P.simple, "cssid", P.cssid);
  P.ref = Re(P.ref, "cssid", P.cssid);
  P.attr = Re(P.attr, "cssid", P.cssid);
  P.pseudo = Re(P.pseudo, "cssid", P.cssid);
  P.inside = Re(P.inside, `[^"'>]*`, P.inside);
  P.attr = Re(P.attr, "inside", xs("\\[", "\\]"));
  P.pseudo = Re(P.pseudo, "inside", xs("\\(", "\\)"));
  P.simple = Re(P.simple, "pseudo", P.pseudo);
  P.simple = Re(P.simple, "attr", P.attr);
  P.ident = Re(P.ident, "cssid", P.cssid);
  P.str_escape = Re(P.str_escape, "escape", P.escape);
  var br = function(e) {
    for (var t = e.replace(/^\s+|\s+$/g, ""), r, n = [], l = [], f, _, y, w, S; t; ) {
      if (y = P.qname.exec(t))
        t = t.substring(y[0].length), _ = yt(y[1]), l.push(an(_, true));
      else if (y = P.simple.exec(t))
        t = t.substring(y[0].length), _ = "*", l.push(an(_, true)), l.push(an(y));
      else
        throw new SyntaxError("Invalid selector.");
      for (; y = P.simple.exec(t); )
        t = t.substring(y[0].length), l.push(an(y));
      if (t[0] === "!" && (t = t.substring(1), f = Mu(), f.qname = _, l.push(f.simple)), y = P.ref.exec(t)) {
        t = t.substring(y[0].length), S = gr.ref(_a(l), yt(y[1])), n.push(S.combinator), l = [];
        continue;
      }
      if (y = P.combinator.exec(t)) {
        if (t = t.substring(y[0].length), w = y[1] || y[2] || y[3], w === ",") {
          n.push(gr.noop(_a(l)));
          break;
        }
      } else
        w = "noop";
      if (!gr[w])
        throw new SyntaxError("Bad combinator.");
      n.push(gr[w](_a(l))), l = [];
    }
    return r = Du(n), r.qname = _, r.sel = t, f && (f.lname = r.qname, f.test = r, f.qname = f.qname, f.sel = r.sel, r = f), S && (S.test = r, S.qname = r.qname, S.sel = r.sel, r = S), r;
  }, an = function(e, t) {
    if (t)
      return e === "*" ? _e["*"] : _e.type(e);
    if (e[1])
      return e[1][0] === "." ? _e.attr("class", "~=", yt(e[1].substring(1)), false) : _e.attr("id", "=", yt(e[1].substring(1)), false);
    if (e[2])
      return e[3] ? _e[yt(e[2])](hs(e[3])) : _e[yt(e[2])];
    if (e[4]) {
      var r = e[6], n = /["'\s]\s*I$/i.test(r);
      return n && (r = r.replace(/\s*I$/i, "")), _e.attr(yt(e[4]), e[5] || "-", hs(r), n);
    }
    throw new SyntaxError("Unknown Selector.");
  }, _a = function(e) {
    var t = e.length, r;
    return t < 2 ? e[0] : function(n) {
      if (!!n) {
        for (r = 0; r < t; r++)
          if (!e[r](n))
            return;
        return true;
      }
    };
  }, Du = function(e) {
    return e.length < 2 ? function(t) {
      return !!e[0](t);
    } : function(t) {
      for (var r = e.length; r--; )
        if (!(t = e[r](t)))
          return;
      return true;
    };
  }, Mu = function() {
    var e;
    function t(r) {
      for (var n = r.ownerDocument, l = n.getElementsByTagName(t.lname), f = l.length; f--; )
        if (t.test(l[f]) && e === r)
          return e = null, true;
      e = null;
    }
    return t.simple = function(r) {
      return e = r, true;
    }, t;
  }, Ea = function(e) {
    for (var t = br(e), r = [t]; t.sel; )
      t = br(t.sel), r.push(t);
    return r.length < 2 ? t : function(n) {
      for (var l = r.length, f = 0; f < l; f++)
        if (r[f](n))
          return true;
    };
  }, gs = function(e, t) {
    for (var r = [], n = br(e), l = t.getElementsByTagName(n.qname), f = 0, _; _ = l[f++]; )
      n(_) && r.push(_);
    if (n.sel) {
      for (; n.sel; )
        for (n = br(n.sel), l = t.getElementsByTagName(n.qname), f = 0; _ = l[f++]; )
          n(_) && Au.call(r, _) === -1 && r.push(_);
      r.sort(Su);
    }
    return r;
  };
  bs.exports = Yt = function(e, t) {
    var r, n;
    if (t.nodeType !== 11 && e.indexOf(" ") === -1) {
      if (e[0] === "#" && t.rooted && /^#[A-Z_][-A-Z0-9_]*$/i.test(e) && t.doc._hasMultipleElementsWithId && (r = e.substring(1), !t.doc._hasMultipleElementsWithId(r)))
        return n = t.doc.getElementById(r), n ? [n] : [];
      if (e[0] === "." && /^\.\w+$/.test(e))
        return t.getElementsByClassName(e.substring(1));
      if (/^\w+$/.test(e))
        return t.getElementsByTagName(e);
    }
    return gs(e, t);
  };
  Yt.selectors = _e;
  Yt.operators = ms;
  Yt.combinators = gr;
  Yt.matches = function(e, t) {
    var r = { sel: t };
    do
      if (r = br(r.sel), r(e))
        return true;
    while (r.sel);
    return false;
  };
});
var on = O((Hf, _s) => {
  var Ru = Te(), Iu = ea(), va = function(e, t) {
    for (var r = e.createDocumentFragment(), n = 0; n < t.length; n++) {
      var l = t[n], f = l instanceof Ru;
      r.appendChild(f ? l : e.createTextNode(String(l)));
    }
    return r;
  }, Ou = { after: { value: function() {
    var t = Array.prototype.slice.call(arguments), r = this.parentNode, n = this.nextSibling;
    if (r !== null) {
      for (; n && t.some(function(f) {
        return f === n;
      }); )
        n = n.nextSibling;
      var l = va(this.doc, t);
      r.insertBefore(l, n);
    }
  } }, before: { value: function() {
    var t = Array.prototype.slice.call(arguments), r = this.parentNode, n = this.previousSibling;
    if (r !== null) {
      for (; n && t.some(function(_) {
        return _ === n;
      }); )
        n = n.previousSibling;
      var l = va(this.doc, t), f = n ? n.nextSibling : r.firstChild;
      r.insertBefore(l, f);
    }
  } }, remove: { value: function() {
    this.parentNode !== null && (this.doc && (this.doc._preremoveNodeIterators(this), this.rooted && this.doc.mutateRemove(this)), this._remove(), this.parentNode = null);
  } }, _remove: { value: function() {
    var t = this.parentNode;
    t !== null && (t._childNodes ? t._childNodes.splice(this.index, 1) : t._firstChild === this && (this._nextSibling === this ? t._firstChild = null : t._firstChild = this._nextSibling), Iu.remove(this), t.modify());
  } }, replaceWith: { value: function() {
    var t = Array.prototype.slice.call(arguments), r = this.parentNode, n = this.nextSibling;
    if (r !== null) {
      for (; n && t.some(function(f) {
        return f === n;
      }); )
        n = n.nextSibling;
      var l = va(this.doc, t);
      this.parentNode === r ? r.replaceChild(l, this) : r.insertBefore(l, n);
    }
  } } };
  _s.exports = Ou;
});
var ya = O((Pf, vs) => {
  var Es = Te(), qu = { nextElementSibling: { get: function() {
    if (this.parentNode) {
      for (var e = this.nextSibling; e !== null; e = e.nextSibling)
        if (e.nodeType === Es.ELEMENT_NODE)
          return e;
    }
    return null;
  } }, previousElementSibling: { get: function() {
    if (this.parentNode) {
      for (var e = this.previousSibling; e !== null; e = e.previousSibling)
        if (e.nodeType === Es.ELEMENT_NODE)
          return e;
    }
    return null;
  } } };
  vs.exports = qu;
});
var Ta = O((Bf, Ts) => {
  Ts.exports = ys;
  var $t = he();
  function ys(e) {
    this.element = e;
  }
  Object.defineProperties(ys.prototype, { length: { get: $t.shouldOverride }, item: { value: $t.shouldOverride }, getNamedItem: { value: function(t) {
    return this.element.getAttributeNode(t);
  } }, getNamedItemNS: { value: function(t, r) {
    return this.element.getAttributeNodeNS(t, r);
  } }, setNamedItem: { value: $t.nyi }, setNamedItemNS: { value: $t.nyi }, removeNamedItem: { value: function(t) {
    var r = this.element.getAttributeNode(t);
    if (r)
      return this.element.removeAttribute(t), r;
    $t.NotFoundError();
  } }, removeNamedItemNS: { value: function(t, r) {
    var n = this.element.getAttributeNodeNS(t, r);
    if (n)
      return this.element.removeAttributeNS(t, r), n;
    $t.NotFoundError();
  } } });
});
var Xt = O((Uf, As) => {
  As.exports = Tt;
  var wa = tn(), ue = he(), tt = ue.NAMESPACE, cn = pa(), Ye = Te(), ka = It(), Fu = ta(), ln = ls(), Kt = Xr(), Hu = ga(), Sa = sn(), ws = en(), Pu = on(), Bu = ya(), ks = Ta(), Ss = Object.create(null);
  function Tt(e, t, r, n) {
    ws.call(this), this.nodeType = Ye.ELEMENT_NODE, this.ownerDocument = e, this.localName = t, this.namespaceURI = r, this.prefix = n, this._tagName = void 0, this._attrsByQName = Object.create(null), this._attrsByLName = Object.create(null), this._attrKeys = [];
  }
  function Ns(e, t) {
    if (e.nodeType === Ye.TEXT_NODE)
      t.push(e._data);
    else
      for (var r = 0, n = e.childNodes.length; r < n; r++)
        Ns(e.childNodes[r], t);
  }
  Tt.prototype = Object.create(ws.prototype, { isHTML: { get: function() {
    return this.namespaceURI === tt.HTML && this.ownerDocument.isHTML;
  } }, tagName: { get: function() {
    if (this._tagName === void 0) {
      var t;
      if (this.prefix === null ? t = this.localName : t = this.prefix + ":" + this.localName, this.isHTML) {
        var r = Ss[t];
        r || (Ss[t] = r = ue.toASCIIUpperCase(t)), t = r;
      }
      this._tagName = t;
    }
    return this._tagName;
  } }, nodeName: { get: function() {
    return this.tagName;
  } }, nodeValue: { get: function() {
    return null;
  }, set: function() {
  } }, textContent: { get: function() {
    var e = [];
    return Ns(this, e), e.join("");
  }, set: function(e) {
    this.removeChildren(), e != null && e !== "" && this._appendChild(this.ownerDocument.createTextNode(e));
  } }, innerHTML: { get: function() {
    return this.serialize();
  }, set: ue.nyi }, outerHTML: { get: function() {
    return Fu.serializeOne(this, { nodeType: 0 });
  }, set: function(e) {
    var t = this.ownerDocument, r = this.parentNode;
    if (r !== null) {
      r.nodeType === Ye.DOCUMENT_NODE && ue.NoModificationAllowedError(), r.nodeType === Ye.DOCUMENT_FRAGMENT_NODE && (r = r.ownerDocument.createElement("body"));
      var n = t.implementation.mozHTMLParser(t._address, r);
      n.parse(e === null ? "" : String(e), true), this.replaceWith(n._asDocumentFragment());
    }
  } }, _insertAdjacent: { value: function(t, r) {
    var n = false;
    switch (t) {
      case "beforebegin":
        n = true;
      case "afterend":
        var l = this.parentNode;
        return l === null ? null : l.insertBefore(r, n ? this : this.nextSibling);
      case "afterbegin":
        n = true;
      case "beforeend":
        return this.insertBefore(r, n ? this.firstChild : null);
      default:
        return ue.SyntaxError();
    }
  } }, insertAdjacentElement: { value: function(t, r) {
    if (r.nodeType !== Ye.ELEMENT_NODE)
      throw new TypeError("not an element");
    return t = ue.toASCIILowerCase(String(t)), this._insertAdjacent(t, r);
  } }, insertAdjacentText: { value: function(t, r) {
    var n = this.ownerDocument.createTextNode(r);
    t = ue.toASCIILowerCase(String(t)), this._insertAdjacent(t, n);
  } }, insertAdjacentHTML: { value: function(t, r) {
    t = ue.toASCIILowerCase(String(t)), r = String(r);
    var n;
    switch (t) {
      case "beforebegin":
      case "afterend":
        n = this.parentNode, (n === null || n.nodeType === Ye.DOCUMENT_NODE) && ue.NoModificationAllowedError();
        break;
      case "afterbegin":
      case "beforeend":
        n = this;
        break;
      default:
        ue.SyntaxError();
    }
    (!(n instanceof Tt) || n.ownerDocument.isHTML && n.localName === "html" && n.namespaceURI === tt.HTML) && (n = n.ownerDocument.createElementNS(tt.HTML, "body"));
    var l = this.ownerDocument.implementation.mozHTMLParser(this.ownerDocument._address, n);
    l.parse(r, true), this._insertAdjacent(t, l._asDocumentFragment());
  } }, children: { get: function() {
    return this._children || (this._children = new Cs(this)), this._children;
  } }, attributes: { get: function() {
    return this._attributes || (this._attributes = new Na(this)), this._attributes;
  } }, firstElementChild: { get: function() {
    for (var e = this.firstChild; e !== null; e = e.nextSibling)
      if (e.nodeType === Ye.ELEMENT_NODE)
        return e;
    return null;
  } }, lastElementChild: { get: function() {
    for (var e = this.lastChild; e !== null; e = e.previousSibling)
      if (e.nodeType === Ye.ELEMENT_NODE)
        return e;
    return null;
  } }, childElementCount: { get: function() {
    return this.children.length;
  } }, nextElement: { value: function(e) {
    e || (e = this.ownerDocument.documentElement);
    var t = this.firstElementChild;
    if (!t) {
      if (this === e)
        return null;
      t = this.nextElementSibling;
    }
    if (t)
      return t;
    for (var r = this.parentElement; r && r !== e; r = r.parentElement)
      if (t = r.nextElementSibling, t)
        return t;
    return null;
  } }, getElementsByTagName: { value: function(t) {
    var r;
    return t ? (t === "*" ? r = function() {
      return true;
    } : this.isHTML ? r = Uu(t) : r = Ca(t), new ln(this, r)) : new ka();
  } }, getElementsByTagNameNS: { value: function(t, r) {
    var n;
    return t === "*" && r === "*" ? n = function() {
      return true;
    } : t === "*" ? n = Ca(r) : r === "*" ? n = Vu(t) : n = zu(t, r), new ln(this, n);
  } }, getElementsByClassName: { value: function(t) {
    if (t = String(t).trim(), t === "") {
      var r = new ka();
      return r;
    }
    return t = t.split(/[ \t\r\n\f]+/), new ln(this, ju(t));
  } }, getElementsByName: { value: function(t) {
    return new ln(this, Wu(String(t)));
  } }, clone: { value: function() {
    var t;
    this.namespaceURI !== tt.HTML || this.prefix || !this.ownerDocument.isHTML ? t = this.ownerDocument.createElementNS(this.namespaceURI, this.prefix !== null ? this.prefix + ":" + this.localName : this.localName) : t = this.ownerDocument.createElement(this.localName);
    for (var r = 0, n = this._attrKeys.length; r < n; r++) {
      var l = this._attrKeys[r], f = this._attrsByLName[l], _ = f.cloneNode();
      _._setOwnerElement(t), t._attrsByLName[l] = _, t._addQName(_);
    }
    return t._attrKeys = this._attrKeys.concat(), t;
  } }, isEqual: { value: function(t) {
    if (this.localName !== t.localName || this.namespaceURI !== t.namespaceURI || this.prefix !== t.prefix || this._numattrs !== t._numattrs)
      return false;
    for (var r = 0, n = this._numattrs; r < n; r++) {
      var l = this._attr(r);
      if (!t.hasAttributeNS(l.namespaceURI, l.localName) || t.getAttributeNS(l.namespaceURI, l.localName) !== l.value)
        return false;
    }
    return true;
  } }, _lookupNamespacePrefix: { value: function(t, r) {
    if (this.namespaceURI && this.namespaceURI === t && this.prefix !== null && r.lookupNamespaceURI(this.prefix) === t)
      return this.prefix;
    for (var n = 0, l = this._numattrs; n < l; n++) {
      var f = this._attr(n);
      if (f.prefix === "xmlns" && f.value === t && r.lookupNamespaceURI(f.localName) === t)
        return f.localName;
    }
    var _ = this.parentElement;
    return _ ? _._lookupNamespacePrefix(t, r) : null;
  } }, lookupNamespaceURI: { value: function(t) {
    if ((t === "" || t === void 0) && (t = null), this.namespaceURI !== null && this.prefix === t)
      return this.namespaceURI;
    for (var r = 0, n = this._numattrs; r < n; r++) {
      var l = this._attr(r);
      if (l.namespaceURI === tt.XMLNS && (l.prefix === "xmlns" && l.localName === t || t === null && l.prefix === null && l.localName === "xmlns"))
        return l.value || null;
    }
    var f = this.parentElement;
    return f ? f.lookupNamespaceURI(t) : null;
  } }, getAttribute: { value: function(t) {
    var r = this.getAttributeNode(t);
    return r ? r.value : null;
  } }, getAttributeNS: { value: function(t, r) {
    var n = this.getAttributeNodeNS(t, r);
    return n ? n.value : null;
  } }, getAttributeNode: { value: function(t) {
    t = String(t), /[A-Z]/.test(t) && this.isHTML && (t = ue.toASCIILowerCase(t));
    var r = this._attrsByQName[t];
    return r ? (Array.isArray(r) && (r = r[0]), r) : null;
  } }, getAttributeNodeNS: { value: function(t, r) {
    t = t == null ? "" : String(t), r = String(r);
    var n = this._attrsByLName[t + "|" + r];
    return n || null;
  } }, hasAttribute: { value: function(t) {
    return t = String(t), /[A-Z]/.test(t) && this.isHTML && (t = ue.toASCIILowerCase(t)), this._attrsByQName[t] !== void 0;
  } }, hasAttributeNS: { value: function(t, r) {
    t = t == null ? "" : String(t), r = String(r);
    var n = t + "|" + r;
    return this._attrsByLName[n] !== void 0;
  } }, hasAttributes: { value: function() {
    return this._numattrs > 0;
  } }, toggleAttribute: { value: function(t, r) {
    t = String(t), wa.isValidName(t) || ue.InvalidCharacterError(), /[A-Z]/.test(t) && this.isHTML && (t = ue.toASCIILowerCase(t));
    var n = this._attrsByQName[t];
    return n === void 0 ? r === void 0 || r === true ? (this._setAttribute(t, ""), true) : false : r === void 0 || r === false ? (this.removeAttribute(t), false) : true;
  } }, _setAttribute: { value: function(t, r) {
    var n = this._attrsByQName[t], l;
    n ? Array.isArray(n) && (n = n[0]) : (n = this._newattr(t), l = true), n.value = r, this._attributes && (this._attributes[t] = n), l && this._newattrhook && this._newattrhook(t, r);
  } }, setAttribute: { value: function(t, r) {
    t = String(t), wa.isValidName(t) || ue.InvalidCharacterError(), /[A-Z]/.test(t) && this.isHTML && (t = ue.toASCIILowerCase(t)), this._setAttribute(t, String(r));
  } }, _setAttributeNS: { value: function(t, r, n) {
    var l = r.indexOf(":"), f, _;
    l < 0 ? (f = null, _ = r) : (f = r.substring(0, l), _ = r.substring(l + 1)), (t === "" || t === void 0) && (t = null);
    var y = (t === null ? "" : t) + "|" + _, w = this._attrsByLName[y], S;
    w || (w = new _r(this, _, f, t), S = true, this._attrsByLName[y] = w, this._attributes && (this._attributes[this._attrKeys.length] = w), this._attrKeys.push(y), this._addQName(w)), w.value = n, S && this._newattrhook && this._newattrhook(r, n);
  } }, setAttributeNS: { value: function(t, r, n) {
    t = t == null || t === "" ? null : String(t), r = String(r), wa.isValidQName(r) || ue.InvalidCharacterError();
    var l = r.indexOf(":"), f = l < 0 ? null : r.substring(0, l);
    (f !== null && t === null || f === "xml" && t !== tt.XML || (r === "xmlns" || f === "xmlns") && t !== tt.XMLNS || t === tt.XMLNS && !(r === "xmlns" || f === "xmlns")) && ue.NamespaceError(), this._setAttributeNS(t, r, String(n));
  } }, setAttributeNode: { value: function(t) {
    if (t.ownerElement !== null && t.ownerElement !== this)
      throw new Kt(Kt.INUSE_ATTRIBUTE_ERR);
    var r = null, n = this._attrsByQName[t.name];
    if (n) {
      if (Array.isArray(n) || (n = [n]), n.some(function(l) {
        return l === t;
      }))
        return t;
      if (t.ownerElement !== null)
        throw new Kt(Kt.INUSE_ATTRIBUTE_ERR);
      n.forEach(function(l) {
        this.removeAttributeNode(l);
      }, this), r = n[0];
    }
    return this.setAttributeNodeNS(t), r;
  } }, setAttributeNodeNS: { value: function(t) {
    if (t.ownerElement !== null)
      throw new Kt(Kt.INUSE_ATTRIBUTE_ERR);
    var r = t.namespaceURI, n = (r === null ? "" : r) + "|" + t.localName, l = this._attrsByLName[n];
    return l && this.removeAttributeNode(l), t._setOwnerElement(this), this._attrsByLName[n] = t, this._attributes && (this._attributes[this._attrKeys.length] = t), this._attrKeys.push(n), this._addQName(t), this._newattrhook && this._newattrhook(t.name, t.value), l || null;
  } }, removeAttribute: { value: function(t) {
    t = String(t), /[A-Z]/.test(t) && this.isHTML && (t = ue.toASCIILowerCase(t));
    var r = this._attrsByQName[t];
    if (!!r) {
      Array.isArray(r) ? r.length > 2 ? r = r.shift() : (this._attrsByQName[t] = r[1], r = r[0]) : this._attrsByQName[t] = void 0;
      var n = r.namespaceURI, l = (n === null ? "" : n) + "|" + r.localName;
      this._attrsByLName[l] = void 0;
      var f = this._attrKeys.indexOf(l);
      this._attributes && (Array.prototype.splice.call(this._attributes, f, 1), this._attributes[t] = void 0), this._attrKeys.splice(f, 1);
      var _ = r.onchange;
      r._setOwnerElement(null), _ && _.call(r, this, r.localName, r.value, null), this.rooted && this.ownerDocument.mutateRemoveAttr(r);
    }
  } }, removeAttributeNS: { value: function(t, r) {
    t = t == null ? "" : String(t), r = String(r);
    var n = t + "|" + r, l = this._attrsByLName[n];
    if (!!l) {
      this._attrsByLName[n] = void 0;
      var f = this._attrKeys.indexOf(n);
      this._attributes && Array.prototype.splice.call(this._attributes, f, 1), this._attrKeys.splice(f, 1), this._removeQName(l);
      var _ = l.onchange;
      l._setOwnerElement(null), _ && _.call(l, this, l.localName, l.value, null), this.rooted && this.ownerDocument.mutateRemoveAttr(l);
    }
  } }, removeAttributeNode: { value: function(t) {
    var r = t.namespaceURI, n = (r === null ? "" : r) + "|" + t.localName;
    return this._attrsByLName[n] !== t && ue.NotFoundError(), this.removeAttributeNS(r, t.localName), t;
  } }, getAttributeNames: { value: function() {
    var t = this;
    return this._attrKeys.map(function(r) {
      return t._attrsByLName[r].name;
    });
  } }, _getattr: { value: function(t) {
    var r = this._attrsByQName[t];
    return r ? r.value : null;
  } }, _setattr: { value: function(t, r) {
    var n = this._attrsByQName[t], l;
    n || (n = this._newattr(t), l = true), n.value = String(r), this._attributes && (this._attributes[t] = n), l && this._newattrhook && this._newattrhook(t, r);
  } }, _newattr: { value: function(t) {
    var r = new _r(this, t, null, null), n = "|" + t;
    return this._attrsByQName[t] = r, this._attrsByLName[n] = r, this._attributes && (this._attributes[this._attrKeys.length] = r), this._attrKeys.push(n), r;
  } }, _addQName: { value: function(e) {
    var t = e.name, r = this._attrsByQName[t];
    r ? Array.isArray(r) ? r.push(e) : this._attrsByQName[t] = [r, e] : this._attrsByQName[t] = e, this._attributes && (this._attributes[t] = e);
  } }, _removeQName: { value: function(e) {
    var t = e.name, r = this._attrsByQName[t];
    if (Array.isArray(r)) {
      var n = r.indexOf(e);
      ue.assert(n !== -1), r.length === 2 ? (this._attrsByQName[t] = r[1 - n], this._attributes && (this._attributes[t] = this._attrsByQName[t])) : (r.splice(n, 1), this._attributes && this._attributes[t] === e && (this._attributes[t] = r[0]));
    } else
      ue.assert(r === e), this._attrsByQName[t] = void 0, this._attributes && (this._attributes[t] = void 0);
  } }, _numattrs: { get: function() {
    return this._attrKeys.length;
  } }, _attr: { value: function(e) {
    return this._attrsByLName[this._attrKeys[e]];
  } }, id: cn.property({ name: "id" }), className: cn.property({ name: "class" }), classList: { get: function() {
    var e = this;
    if (this._classList)
      return this._classList;
    var t = new Hu(function() {
      return e.className || "";
    }, function(r) {
      e.className = r;
    });
    return this._classList = t, t;
  }, set: function(e) {
    this.className = e;
  } }, matches: { value: function(e) {
    return Sa.matches(this, e);
  } }, closest: { value: function(e) {
    var t = this;
    do {
      if (t.matches && t.matches(e))
        return t;
      t = t.parentElement || t.parentNode;
    } while (t !== null && t.nodeType === Ye.ELEMENT_NODE);
    return null;
  } }, querySelector: { value: function(e) {
    return Sa(e, this)[0];
  } }, querySelectorAll: { value: function(e) {
    var t = Sa(e, this);
    return t.item ? t : new ka(t);
  } } });
  Object.defineProperties(Tt.prototype, Pu);
  Object.defineProperties(Tt.prototype, Bu);
  cn.registerChangeHandler(Tt, "id", function(e, t, r, n) {
    e.rooted && (r && e.ownerDocument.delId(r, e), n && e.ownerDocument.addId(n, e));
  });
  cn.registerChangeHandler(Tt, "class", function(e, t, r, n) {
    e._classList && e._classList._update();
  });
  function _r(e, t, r, n, l) {
    this.localName = t, this.prefix = r === null || r === "" ? null : "" + r, this.namespaceURI = n === null || n === "" ? null : "" + n, this.data = l, this._setOwnerElement(e);
  }
  _r.prototype = Object.create(Object.prototype, { ownerElement: { get: function() {
    return this._ownerElement;
  } }, _setOwnerElement: { value: function(t) {
    this._ownerElement = t, this.prefix === null && this.namespaceURI === null && t ? this.onchange = t._attributeChangeHandlers[this.localName] : this.onchange = null;
  } }, name: { get: function() {
    return this.prefix ? this.prefix + ":" + this.localName : this.localName;
  } }, specified: { get: function() {
    return true;
  } }, value: { get: function() {
    return this.data;
  }, set: function(e) {
    var t = this.data;
    e = e === void 0 ? "" : e + "", e !== t && (this.data = e, this.ownerElement && (this.onchange && this.onchange(this.ownerElement, this.localName, t, e), this.ownerElement.rooted && this.ownerElement.ownerDocument.mutateAttr(this, t)));
  } }, cloneNode: { value: function(t) {
    return new _r(null, this.localName, this.prefix, this.namespaceURI, this.data);
  } }, nodeType: { get: function() {
    return Ye.ATTRIBUTE_NODE;
  } }, nodeName: { get: function() {
    return this.name;
  } }, nodeValue: { get: function() {
    return this.value;
  }, set: function(e) {
    this.value = e;
  } }, textContent: { get: function() {
    return this.value;
  }, set: function(e) {
    e == null && (e = ""), this.value = e;
  } } });
  Tt._Attr = _r;
  function Na(e) {
    ks.call(this, e);
    for (var t in e._attrsByQName)
      this[t] = e._attrsByQName[t];
    for (var r = 0; r < e._attrKeys.length; r++)
      this[r] = e._attrsByLName[e._attrKeys[r]];
  }
  Na.prototype = Object.create(ks.prototype, { length: { get: function() {
    return this.element._attrKeys.length;
  }, set: function() {
  } }, item: { value: function(e) {
    return e = e >>> 0, e >= this.length ? null : this.element._attrsByLName[this.element._attrKeys[e]];
  } } });
  global.Symbol && global.Symbol.iterator && (Na.prototype[global.Symbol.iterator] = function() {
    var e = 0, t = this.length, r = this;
    return { next: function() {
      return e < t ? { value: r.item(e++) } : { done: true };
    } };
  });
  function Cs(e) {
    this.element = e, this.updateCache();
  }
  Cs.prototype = Object.create(Object.prototype, { length: { get: function() {
    return this.updateCache(), this.childrenByNumber.length;
  } }, item: { value: function(t) {
    return this.updateCache(), this.childrenByNumber[t] || null;
  } }, namedItem: { value: function(t) {
    return this.updateCache(), this.childrenByName[t] || null;
  } }, namedItems: { get: function() {
    return this.updateCache(), this.childrenByName;
  } }, updateCache: { value: function() {
    var t = /^(a|applet|area|embed|form|frame|frameset|iframe|img|object)$/;
    if (this.lastModTime !== this.element.lastModTime) {
      this.lastModTime = this.element.lastModTime;
      for (var r = this.childrenByNumber && this.childrenByNumber.length || 0, n = 0; n < r; n++)
        this[n] = void 0;
      this.childrenByNumber = [], this.childrenByName = Object.create(null);
      for (var l = this.element.firstChild; l !== null; l = l.nextSibling)
        if (l.nodeType === Ye.ELEMENT_NODE) {
          this[this.childrenByNumber.length] = l, this.childrenByNumber.push(l);
          var f = l.getAttribute("id");
          f && !this.childrenByName[f] && (this.childrenByName[f] = l);
          var _ = l.getAttribute("name");
          _ && this.element.namespaceURI === tt.HTML && t.test(this.element.localName) && !this.childrenByName[_] && (this.childrenByName[f] = l);
        }
    }
  } } });
  function Ca(e) {
    return function(t) {
      return t.localName === e;
    };
  }
  function Uu(e) {
    var t = ue.toASCIILowerCase(e);
    return t === e ? Ca(e) : function(r) {
      return r.isHTML ? r.localName === t : r.localName === e;
    };
  }
  function Vu(e) {
    return function(t) {
      return t.namespaceURI === e;
    };
  }
  function zu(e, t) {
    return function(r) {
      return r.namespaceURI === e && r.localName === t;
    };
  }
  function ju(e) {
    return function(t) {
      return e.every(function(r) {
        return t.classList.contains(r);
      });
    };
  }
  function Wu(e) {
    return function(t) {
      return t.namespaceURI !== tt.HTML ? false : t.getAttribute("name") === e;
    };
  }
});
var Aa = O((Vf, Is) => {
  Is.exports = Rs;
  var Ls = Te(), Gu = It(), Ds = he(), Ms = Ds.HierarchyRequestError, Yu = Ds.NotFoundError;
  function Rs() {
    Ls.call(this);
  }
  Rs.prototype = Object.create(Ls.prototype, { hasChildNodes: { value: function() {
    return false;
  } }, firstChild: { value: null }, lastChild: { value: null }, insertBefore: { value: function(e, t) {
    if (!e.nodeType)
      throw new TypeError("not a node");
    Ms();
  } }, replaceChild: { value: function(e, t) {
    if (!e.nodeType)
      throw new TypeError("not a node");
    Ms();
  } }, removeChild: { value: function(e) {
    if (!e.nodeType)
      throw new TypeError("not a node");
    Yu();
  } }, removeChildren: { value: function() {
  } }, childNodes: { get: function() {
    return this._childNodes || (this._childNodes = new Gu()), this._childNodes;
  } } });
});
var Er = O((zf, Fs) => {
  Fs.exports = un;
  var Os = Aa(), qs = he(), $u = on(), Ku = ya();
  function un() {
    Os.call(this);
  }
  un.prototype = Object.create(Os.prototype, { substringData: { value: function(t, r) {
    if (arguments.length < 2)
      throw new TypeError("Not enough arguments");
    return t = t >>> 0, r = r >>> 0, (t > this.data.length || t < 0 || r < 0) && qs.IndexSizeError(), this.data.substring(t, t + r);
  } }, appendData: { value: function(t) {
    if (arguments.length < 1)
      throw new TypeError("Not enough arguments");
    this.data += String(t);
  } }, insertData: { value: function(t, r) {
    return this.replaceData(t, 0, r);
  } }, deleteData: { value: function(t, r) {
    return this.replaceData(t, r, "");
  } }, replaceData: { value: function(t, r, n) {
    var l = this.data, f = l.length;
    t = t >>> 0, r = r >>> 0, n = String(n), (t > f || t < 0) && qs.IndexSizeError(), t + r > f && (r = f - t);
    var _ = l.substring(0, t), y = l.substring(t + r);
    this.data = _ + n + y;
  } }, isEqual: { value: function(t) {
    return this._data === t._data;
  } }, length: { get: function() {
    return this.data.length;
  } } });
  Object.defineProperties(un.prototype, $u);
  Object.defineProperties(un.prototype, Ku);
});
var Da = O((jf, Us) => {
  Us.exports = La;
  var Hs = he(), Ps = Te(), Bs = Er();
  function La(e, t) {
    Bs.call(this), this.nodeType = Ps.TEXT_NODE, this.ownerDocument = e, this._data = t, this._index = void 0;
  }
  var fn = { get: function() {
    return this._data;
  }, set: function(e) {
    e == null ? e = "" : e = String(e), e !== this._data && (this._data = e, this.rooted && this.ownerDocument.mutateValue(this), this.parentNode && this.parentNode._textchangehook && this.parentNode._textchangehook(this));
  } };
  La.prototype = Object.create(Bs.prototype, { nodeName: { value: "#text" }, nodeValue: fn, textContent: fn, data: { get: fn.get, set: function(e) {
    fn.set.call(this, e === null ? "" : String(e));
  } }, splitText: { value: function(t) {
    (t > this._data.length || t < 0) && Hs.IndexSizeError();
    var r = this._data.substring(t), n = this.ownerDocument.createTextNode(r);
    this.data = this.data.substring(0, t);
    var l = this.parentNode;
    return l !== null && l.insertBefore(n, this.nextSibling), n;
  } }, wholeText: { get: function() {
    for (var t = this.textContent, r = this.nextSibling; r && r.nodeType === Ps.TEXT_NODE; r = r.nextSibling)
      t += r.textContent;
    return t;
  } }, replaceWholeText: { value: Hs.nyi }, clone: { value: function() {
    return new La(this.ownerDocument, this._data);
  } } });
});
var Ra = O((Wf, zs) => {
  zs.exports = Ma;
  var Xu = Te(), Vs = Er();
  function Ma(e, t) {
    Vs.call(this), this.nodeType = Xu.COMMENT_NODE, this.ownerDocument = e, this._data = t;
  }
  var dn = { get: function() {
    return this._data;
  }, set: function(e) {
    e == null ? e = "" : e = String(e), this._data = e, this.rooted && this.ownerDocument.mutateValue(this);
  } };
  Ma.prototype = Object.create(Vs.prototype, { nodeName: { value: "#comment" }, nodeValue: dn, textContent: dn, data: { get: dn.get, set: function(e) {
    dn.set.call(this, e === null ? "" : String(e));
  } }, clone: { value: function() {
    return new Ma(this.ownerDocument, this._data);
  } } });
});
var qa = O((Gf, Gs) => {
  Gs.exports = Oa;
  var Qu = Te(), Zu = It(), js = en(), Ia = Xt(), Ju = sn(), Ws = he();
  function Oa(e) {
    js.call(this), this.nodeType = Qu.DOCUMENT_FRAGMENT_NODE, this.ownerDocument = e;
  }
  Oa.prototype = Object.create(js.prototype, { nodeName: { value: "#document-fragment" }, nodeValue: { get: function() {
    return null;
  }, set: function() {
  } }, textContent: Object.getOwnPropertyDescriptor(Ia.prototype, "textContent"), querySelector: { value: function(e) {
    var t = this.querySelectorAll(e);
    return t.length ? t[0] : null;
  } }, querySelectorAll: { value: function(e) {
    var t = Object.create(this);
    t.isHTML = true, t.getElementsByTagName = Ia.prototype.getElementsByTagName, t.nextElement = Object.getOwnPropertyDescriptor(Ia.prototype, "firstElementChild").get;
    var r = Ju(e, t);
    return r.item ? r : new Zu(r);
  } }, clone: { value: function() {
    return new Oa(this.ownerDocument);
  } }, isEqual: { value: function(t) {
    return true;
  } }, innerHTML: { get: function() {
    return this.serialize();
  }, set: Ws.nyi }, outerHTML: { get: function() {
    return this.serialize();
  }, set: Ws.nyi } });
});
var Ha = O((Yf, $s) => {
  $s.exports = Fa;
  var e0 = Te(), Ys = Er();
  function Fa(e, t, r) {
    Ys.call(this), this.nodeType = e0.PROCESSING_INSTRUCTION_NODE, this.ownerDocument = e, this.target = t, this._data = r;
  }
  var hn = { get: function() {
    return this._data;
  }, set: function(e) {
    e == null ? e = "" : e = String(e), this._data = e, this.rooted && this.ownerDocument.mutateValue(this);
  } };
  Fa.prototype = Object.create(Ys.prototype, { nodeName: { get: function() {
    return this.target;
  } }, nodeValue: hn, textContent: hn, data: { get: hn.get, set: function(e) {
    hn.set.call(this, e === null ? "" : String(e));
  } }, clone: { value: function() {
    return new Fa(this.ownerDocument, this.target, this._data);
  } }, isEqual: { value: function(t) {
    return this.target === t.target && this._data === t._data;
  } } });
});
var vr = O(($f, Ks) => {
  var Pa = { FILTER_ACCEPT: 1, FILTER_REJECT: 2, FILTER_SKIP: 3, SHOW_ALL: 4294967295, SHOW_ELEMENT: 1, SHOW_ATTRIBUTE: 2, SHOW_TEXT: 4, SHOW_CDATA_SECTION: 8, SHOW_ENTITY_REFERENCE: 16, SHOW_ENTITY: 32, SHOW_PROCESSING_INSTRUCTION: 64, SHOW_COMMENT: 128, SHOW_DOCUMENT: 256, SHOW_DOCUMENT_TYPE: 512, SHOW_DOCUMENT_FRAGMENT: 1024, SHOW_NOTATION: 2048 };
  Ks.exports = Pa.constructor = Pa.prototype = Pa;
});
var Ua = O((Xf, Qs) => {
  Qs.exports = { nextSkippingChildren: t0, nextAncestorSibling: Ba, next: r0, previous: n0, deepLastChild: Xs };
  function t0(e, t) {
    return e === t ? null : e.nextSibling !== null ? e.nextSibling : Ba(e, t);
  }
  function Ba(e, t) {
    for (e = e.parentNode; e !== null; e = e.parentNode) {
      if (e === t)
        return null;
      if (e.nextSibling !== null)
        return e.nextSibling;
    }
    return null;
  }
  function r0(e, t) {
    var r;
    return r = e.firstChild, r !== null ? r : e === t ? null : (r = e.nextSibling, r !== null ? r : Ba(e, t));
  }
  function Xs(e) {
    for (; e.lastChild; )
      e = e.lastChild;
    return e;
  }
  function n0(e, t) {
    var r;
    return r = e.previousSibling, r !== null ? Xs(r) : (r = e.parentNode, r === t ? null : r);
  }
});
var ao = O((Qf, no) => {
  no.exports = ro;
  var a0 = Te(), we = vr(), Zs = Ua(), Js = he(), Va = { first: "firstChild", last: "lastChild", next: "firstChild", previous: "lastChild" }, za = { first: "nextSibling", last: "previousSibling", next: "nextSibling", previous: "previousSibling" };
  function eo(e, t) {
    var r, n, l, f, _;
    for (n = e._currentNode[Va[t]]; n !== null; ) {
      if (f = e._internalFilter(n), f === we.FILTER_ACCEPT)
        return e._currentNode = n, n;
      if (f === we.FILTER_SKIP && (r = n[Va[t]], r !== null)) {
        n = r;
        continue;
      }
      for (; n !== null; ) {
        if (_ = n[za[t]], _ !== null) {
          n = _;
          break;
        }
        if (l = n.parentNode, l === null || l === e.root || l === e._currentNode)
          return null;
        n = l;
      }
    }
    return null;
  }
  function to(e, t) {
    var r, n, l;
    if (r = e._currentNode, r === e.root)
      return null;
    for (; ; ) {
      for (l = r[za[t]]; l !== null; ) {
        if (r = l, n = e._internalFilter(r), n === we.FILTER_ACCEPT)
          return e._currentNode = r, r;
        l = r[Va[t]], (n === we.FILTER_REJECT || l === null) && (l = r[za[t]]);
      }
      if (r = r.parentNode, r === null || r === e.root || e._internalFilter(r) === we.FILTER_ACCEPT)
        return null;
    }
  }
  function ro(e, t, r) {
    (!e || !e.nodeType) && Js.NotSupportedError(), this._root = e, this._whatToShow = Number(t) || 0, this._filter = r || null, this._active = false, this._currentNode = e;
  }
  Object.defineProperties(ro.prototype, { root: { get: function() {
    return this._root;
  } }, whatToShow: { get: function() {
    return this._whatToShow;
  } }, filter: { get: function() {
    return this._filter;
  } }, currentNode: { get: function() {
    return this._currentNode;
  }, set: function(t) {
    if (!(t instanceof a0))
      throw new TypeError("Not a Node");
    this._currentNode = t;
  } }, _internalFilter: { value: function(t) {
    var r, n;
    if (this._active && Js.InvalidStateError(), !(1 << t.nodeType - 1 & this._whatToShow))
      return we.FILTER_SKIP;
    if (n = this._filter, n === null)
      r = we.FILTER_ACCEPT;
    else {
      this._active = true;
      try {
        typeof n == "function" ? r = n(t) : r = n.acceptNode(t);
      } finally {
        this._active = false;
      }
    }
    return +r;
  } }, parentNode: { value: function() {
    for (var t = this._currentNode; t !== this.root; ) {
      if (t = t.parentNode, t === null)
        return null;
      if (this._internalFilter(t) === we.FILTER_ACCEPT)
        return this._currentNode = t, t;
    }
    return null;
  } }, firstChild: { value: function() {
    return eo(this, "first");
  } }, lastChild: { value: function() {
    return eo(this, "last");
  } }, previousSibling: { value: function() {
    return to(this, "previous");
  } }, nextSibling: { value: function() {
    return to(this, "next");
  } }, previousNode: { value: function() {
    var t, r, n, l;
    for (t = this._currentNode; t !== this._root; ) {
      for (n = t.previousSibling; n; n = t.previousSibling)
        if (t = n, r = this._internalFilter(t), r !== we.FILTER_REJECT) {
          for (l = t.lastChild; l && (t = l, r = this._internalFilter(t), r !== we.FILTER_REJECT); l = t.lastChild)
            ;
          if (r === we.FILTER_ACCEPT)
            return this._currentNode = t, t;
        }
      if (t === this.root || t.parentNode === null)
        return null;
      if (t = t.parentNode, this._internalFilter(t) === we.FILTER_ACCEPT)
        return this._currentNode = t, t;
    }
    return null;
  } }, nextNode: { value: function() {
    var t, r, n, l;
    t = this._currentNode, r = we.FILTER_ACCEPT;
    e:
      for (; ; ) {
        for (n = t.firstChild; n; n = t.firstChild) {
          if (t = n, r = this._internalFilter(t), r === we.FILTER_ACCEPT)
            return this._currentNode = t, t;
          if (r === we.FILTER_REJECT)
            break;
        }
        for (l = Zs.nextSkippingChildren(t, this.root); l; l = Zs.nextSkippingChildren(t, this.root)) {
          if (t = l, r = this._internalFilter(t), r === we.FILTER_ACCEPT)
            return this._currentNode = t, t;
          if (r === we.FILTER_SKIP)
            continue e;
        }
        return null;
      }
  } }, toString: { value: function() {
    return "[object TreeWalker]";
  } } });
});
var uo = O((Zf, lo) => {
  lo.exports = co;
  var ja = vr(), Wa = Ua(), io = he();
  function i0(e, t, r) {
    return r ? Wa.next(e, t) : e === t ? null : Wa.previous(e, null);
  }
  function so(e, t) {
    for (; t; t = t.parentNode)
      if (e === t)
        return true;
    return false;
  }
  function oo(e, t) {
    var r, n;
    for (r = e._referenceNode, n = e._pointerBeforeReferenceNode; ; ) {
      if (n === t)
        n = !n;
      else if (r = i0(r, e._root, t), r === null)
        return null;
      var l = e._internalFilter(r);
      if (l === ja.FILTER_ACCEPT)
        break;
    }
    return e._referenceNode = r, e._pointerBeforeReferenceNode = n, r;
  }
  function co(e, t, r) {
    (!e || !e.nodeType) && io.NotSupportedError(), this._root = e, this._referenceNode = e, this._pointerBeforeReferenceNode = true, this._whatToShow = Number(t) || 0, this._filter = r || null, this._active = false, e.doc._attachNodeIterator(this);
  }
  Object.defineProperties(co.prototype, { root: { get: function() {
    return this._root;
  } }, referenceNode: { get: function() {
    return this._referenceNode;
  } }, pointerBeforeReferenceNode: { get: function() {
    return this._pointerBeforeReferenceNode;
  } }, whatToShow: { get: function() {
    return this._whatToShow;
  } }, filter: { get: function() {
    return this._filter;
  } }, _internalFilter: { value: function(t) {
    var r, n;
    if (this._active && io.InvalidStateError(), !(1 << t.nodeType - 1 & this._whatToShow))
      return ja.FILTER_SKIP;
    if (n = this._filter, n === null)
      r = ja.FILTER_ACCEPT;
    else {
      this._active = true;
      try {
        typeof n == "function" ? r = n(t) : r = n.acceptNode(t);
      } finally {
        this._active = false;
      }
    }
    return +r;
  } }, _preremove: { value: function(t) {
    if (!so(t, this._root) && !!so(t, this._referenceNode)) {
      if (this._pointerBeforeReferenceNode) {
        for (var r = t; r.lastChild; )
          r = r.lastChild;
        if (r = Wa.next(r, this.root), r) {
          this._referenceNode = r;
          return;
        }
        this._pointerBeforeReferenceNode = false;
      }
      if (t.previousSibling === null)
        this._referenceNode = t.parentNode;
      else {
        this._referenceNode = t.previousSibling;
        var n;
        for (n = this._referenceNode.lastChild; n; n = this._referenceNode.lastChild)
          this._referenceNode = n;
      }
    }
  } }, nextNode: { value: function() {
    return oo(this, true);
  } }, previousNode: { value: function() {
    return oo(this, false);
  } }, detach: { value: function() {
  } }, toString: { value: function() {
    return "[object NodeIterator]";
  } } });
});
var xn = O((Jf, fo) => {
  fo.exports = ke;
  function ke(e) {
    if (!e)
      return Object.create(ke.prototype);
    this.url = e.replace(/^[ \t\n\r\f]+|[ \t\n\r\f]+$/g, "");
    var t = ke.pattern.exec(this.url);
    if (t) {
      if (t[2] && (this.scheme = t[2]), t[4]) {
        var r = t[4].match(ke.userinfoPattern);
        if (r && (this.username = r[1], this.password = r[3], t[4] = t[4].substring(r[0].length)), t[4].match(ke.portPattern)) {
          var n = t[4].lastIndexOf(":");
          this.host = t[4].substring(0, n), this.port = t[4].substring(n + 1);
        } else
          this.host = t[4];
      }
      t[5] && (this.path = t[5]), t[6] && (this.query = t[7]), t[8] && (this.fragment = t[9]);
    }
  }
  ke.pattern = /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/;
  ke.userinfoPattern = /^([^@:]*)(:([^@]*))?@/;
  ke.portPattern = /:\d+$/;
  ke.authorityPattern = /^[^:\/?#]+:\/\//;
  ke.hierarchyPattern = /^[^:\/?#]+:\//;
  ke.percentEncode = function(t) {
    var r = t.charCodeAt(0);
    if (r < 256)
      return "%" + r.toString(16);
    throw Error("can't percent-encode codepoints > 255 yet");
  };
  ke.prototype = { constructor: ke, isAbsolute: function() {
    return !!this.scheme;
  }, isAuthorityBased: function() {
    return ke.authorityPattern.test(this.url);
  }, isHierarchical: function() {
    return ke.hierarchyPattern.test(this.url);
  }, toString: function() {
    var e = "";
    return this.scheme !== void 0 && (e += this.scheme + ":"), this.isAbsolute() && (e += "//", (this.username || this.password) && (e += this.username || "", this.password && (e += ":" + this.password), e += "@"), this.host && (e += this.host)), this.port !== void 0 && (e += ":" + this.port), this.path !== void 0 && (e += this.path), this.query !== void 0 && (e += "?" + this.query), this.fragment !== void 0 && (e += "#" + this.fragment), e;
  }, resolve: function(e) {
    var t = this, r = new ke(e), n = new ke();
    return r.scheme !== void 0 ? (n.scheme = r.scheme, n.username = r.username, n.password = r.password, n.host = r.host, n.port = r.port, n.path = f(r.path), n.query = r.query) : (n.scheme = t.scheme, r.host !== void 0 ? (n.username = r.username, n.password = r.password, n.host = r.host, n.port = r.port, n.path = f(r.path), n.query = r.query) : (n.username = t.username, n.password = t.password, n.host = t.host, n.port = t.port, r.path ? (r.path.charAt(0) === "/" ? n.path = f(r.path) : (n.path = l(t.path, r.path), n.path = f(n.path)), n.query = r.query) : (n.path = t.path, r.query !== void 0 ? n.query = r.query : n.query = t.query))), n.fragment = r.fragment, n.toString();
    function l(_, y) {
      if (t.host !== void 0 && !t.path)
        return "/" + y;
      var w = _.lastIndexOf("/");
      return w === -1 ? y : _.substring(0, w + 1) + y;
    }
    function f(_) {
      if (!_)
        return _;
      for (var y = ""; _.length > 0; ) {
        if (_ === "." || _ === "..") {
          _ = "";
          break;
        }
        var w = _.substring(0, 2), S = _.substring(0, 3), D = _.substring(0, 4);
        if (S === "../")
          _ = _.substring(3);
        else if (w === "./")
          _ = _.substring(2);
        else if (S === "/./")
          _ = "/" + _.substring(3);
        else if (w === "/." && _.length === 2)
          _ = "/";
        else if (D === "/../" || S === "/.." && _.length === 3)
          _ = "/" + _.substring(4), y = y.replace(/\/?[^\/]*$/, "");
        else {
          var ae = _.match(/(\/?([^\/]*))/)[0];
          y += ae, _ = _.substring(ae.length);
        }
      }
      return y;
    }
  } };
});
var po = O((ed, xo) => {
  xo.exports = Ga;
  var ho = zt();
  function Ga(e, t) {
    ho.call(this, e, t);
  }
  Ga.prototype = Object.create(ho.prototype, { constructor: { value: Ga } });
});
var Ya = O((td, mo) => {
  mo.exports = { Event: zt(), UIEvent: Kn(), MouseEvent: Qn(), CustomEvent: po() };
});
var bo = O((go) => {
  var ct = Object.create(null);
  (function() {
    function e() {
      this._listeners = Object.create(null);
    }
    e.prototype = { constructor: e, addListener: function(f, _) {
      this._listeners[f] || (this._listeners[f] = []), this._listeners[f].push(_);
    }, fire: function(f) {
      if (typeof f == "string" && (f = { type: f }), typeof f.target != "undefined" && (f.target = this), typeof f.type == "undefined")
        throw new Error("Event object missing 'type' property.");
      if (this._listeners[f.type])
        for (var _ = this._listeners[f.type].concat(), y = 0, w = _.length; y < w; y++)
          _[y].call(this, f);
    }, removeListener: function(f, _) {
      if (this._listeners[f]) {
        for (var y = this._listeners[f], w = 0, S = y.length; w < S; w++)
          if (y[w] === _) {
            y.splice(w, 1);
            break;
          }
      }
    } };
    function t(f) {
      this._input = f.replace(/(\r|\n){1,2}/g, `
`), this._line = 1, this._col = 1, this._cursor = 0;
    }
    t.prototype = { constructor: t, getCol: function() {
      return this._col;
    }, getLine: function() {
      return this._line;
    }, eof: function() {
      return this._cursor === this._input.length;
    }, peek: function(f) {
      var _ = null;
      return f = typeof f == "undefined" ? 1 : f, this._cursor < this._input.length && (_ = this._input.charAt(this._cursor + f - 1)), _;
    }, read: function() {
      var f = null;
      return this._cursor < this._input.length && (this._input.charAt(this._cursor) === `
` ? (this._line++, this._col = 1) : this._col++, f = this._input.charAt(this._cursor++)), f;
    }, mark: function() {
      this._bookmark = { cursor: this._cursor, line: this._line, col: this._col };
    }, reset: function() {
      this._bookmark && (this._cursor = this._bookmark.cursor, this._line = this._bookmark.line, this._col = this._bookmark.col, delete this._bookmark);
    }, readTo: function(f) {
      for (var _ = "", y; _.length < f.length || _.lastIndexOf(f) !== _.length - f.length; )
        if (y = this.read(), y)
          _ += y;
        else
          throw new Error('Expected "' + f + '" at line ' + this._line + ", col " + this._col + ".");
      return _;
    }, readWhile: function(f) {
      for (var _ = "", y = this.read(); y !== null && f(y); )
        _ += y, y = this.read();
      return _;
    }, readMatch: function(f) {
      var _ = this._input.substring(this._cursor), y = null;
      return typeof f == "string" ? _.indexOf(f) === 0 && (y = this.readCount(f.length)) : f instanceof RegExp && f.test(_) && (y = this.readCount(RegExp.lastMatch.length)), y;
    }, readCount: function(f) {
      for (var _ = ""; f--; )
        _ += this.read();
      return _;
    } };
    function r(f, _, y) {
      Error.call(this), this.name = this.constructor.name, this.col = y, this.line = _, this.message = f;
    }
    r.prototype = Object.create(Error.prototype), r.prototype.constructor = r;
    function n(f, _, y, w) {
      this.col = y, this.line = _, this.text = f, this.type = w;
    }
    n.fromToken = function(f) {
      return new n(f.value, f.startLine, f.startCol);
    }, n.prototype = { constructor: n, valueOf: function() {
      return this.toString();
    }, toString: function() {
      return this.text;
    } };
    function l(f, _) {
      this._reader = f ? new t(f.toString()) : null, this._token = null, this._tokenData = _, this._lt = [], this._ltIndex = 0, this._ltIndexCache = [];
    }
    l.createTokenData = function(f) {
      var _ = [], y = Object.create(null), w = f.concat([]), S = 0, D = w.length + 1;
      for (w.UNKNOWN = -1, w.unshift({ name: "EOF" }); S < D; S++)
        _.push(w[S].name), w[w[S].name] = S, w[S].text && (y[w[S].text] = S);
      return w.name = function(ae) {
        return _[ae];
      }, w.type = function(ae) {
        return y[ae];
      }, w;
    }, l.prototype = { constructor: l, match: function(f, _) {
      f instanceof Array || (f = [f]);
      for (var y = this.get(_), w = 0, S = f.length; w < S; )
        if (y === f[w++])
          return true;
      return this.unget(), false;
    }, mustMatch: function(f, _) {
      var y;
      if (f instanceof Array || (f = [f]), !this.match.apply(this, arguments))
        throw y = this.LT(1), new r("Expected " + this._tokenData[f[0]].name + " at line " + y.startLine + ", col " + y.startCol + ".", y.startLine, y.startCol);
    }, advance: function(f, _) {
      for (; this.LA(0) !== 0 && !this.match(f, _); )
        this.get();
      return this.LA(0);
    }, get: function(f) {
      var _ = this._tokenData, y = 0, w, S;
      if (this._lt.length && this._ltIndex >= 0 && this._ltIndex < this._lt.length) {
        for (y++, this._token = this._lt[this._ltIndex++], S = _[this._token.type]; S.channel !== void 0 && f !== S.channel && this._ltIndex < this._lt.length; )
          this._token = this._lt[this._ltIndex++], S = _[this._token.type], y++;
        if ((S.channel === void 0 || f === S.channel) && this._ltIndex <= this._lt.length)
          return this._ltIndexCache.push(y), this._token.type;
      }
      return w = this._getToken(), w.type > -1 && !_[w.type].hide && (w.channel = _[w.type].channel, this._token = w, this._lt.push(w), this._ltIndexCache.push(this._lt.length - this._ltIndex + y), this._lt.length > 5 && this._lt.shift(), this._ltIndexCache.length > 5 && this._ltIndexCache.shift(), this._ltIndex = this._lt.length), S = _[w.type], S && (S.hide || S.channel !== void 0 && f !== S.channel) ? this.get(f) : w.type;
    }, LA: function(f) {
      var _ = f, y;
      if (f > 0) {
        if (f > 5)
          throw new Error("Too much lookahead.");
        for (; _; )
          y = this.get(), _--;
        for (; _ < f; )
          this.unget(), _++;
      } else if (f < 0)
        if (this._lt[this._ltIndex + f])
          y = this._lt[this._ltIndex + f].type;
        else
          throw new Error("Too much lookbehind.");
      else
        y = this._token.type;
      return y;
    }, LT: function(f) {
      return this.LA(f), this._lt[this._ltIndex + f - 1];
    }, peek: function() {
      return this.LA(1);
    }, token: function() {
      return this._token;
    }, tokenName: function(f) {
      return f < 0 || f > this._tokenData.length ? "UNKNOWN_TOKEN" : this._tokenData[f].name;
    }, tokenType: function(f) {
      return this._tokenData[f] || -1;
    }, unget: function() {
      if (this._ltIndexCache.length)
        this._ltIndex -= this._ltIndexCache.pop(), this._token = this._lt[this._ltIndex - 1];
      else
        throw new Error("Too much lookahead.");
    } }, ct.util = { __proto__: null, StringReader: t, SyntaxError: r, SyntaxUnit: n, EventTarget: e, TokenStreamBase: l };
  })();
  (function() {
    var e = ct.util.EventTarget, t = ct.util.TokenStreamBase;
    ct.util.StringReader;
    var n = ct.util.SyntaxError, l = ct.util.SyntaxUnit, f = { __proto__: null, aliceblue: "#f0f8ff", antiquewhite: "#faebd7", aqua: "#00ffff", aquamarine: "#7fffd4", azure: "#f0ffff", beige: "#f5f5dc", bisque: "#ffe4c4", black: "#000000", blanchedalmond: "#ffebcd", blue: "#0000ff", blueviolet: "#8a2be2", brown: "#a52a2a", burlywood: "#deb887", cadetblue: "#5f9ea0", chartreuse: "#7fff00", chocolate: "#d2691e", coral: "#ff7f50", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cyan: "#00ffff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", darkgrey: "#a9a9a9", darkgreen: "#006400", darkkhaki: "#bdb76b", darkmagenta: "#8b008b", darkolivegreen: "#556b2f", darkorange: "#ff8c00", darkorchid: "#9932cc", darkred: "#8b0000", darksalmon: "#e9967a", darkseagreen: "#8fbc8f", darkslateblue: "#483d8b", darkslategray: "#2f4f4f", darkslategrey: "#2f4f4f", darkturquoise: "#00ced1", darkviolet: "#9400d3", deeppink: "#ff1493", deepskyblue: "#00bfff", dimgray: "#696969", dimgrey: "#696969", dodgerblue: "#1e90ff", firebrick: "#b22222", floralwhite: "#fffaf0", forestgreen: "#228b22", fuchsia: "#ff00ff", gainsboro: "#dcdcdc", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gray: "#808080", grey: "#808080", green: "#008000", greenyellow: "#adff2f", honeydew: "#f0fff0", hotpink: "#ff69b4", indianred: "#cd5c5c", indigo: "#4b0082", ivory: "#fffff0", khaki: "#f0e68c", lavender: "#e6e6fa", lavenderblush: "#fff0f5", lawngreen: "#7cfc00", lemonchiffon: "#fffacd", lightblue: "#add8e6", lightcoral: "#f08080", lightcyan: "#e0ffff", lightgoldenrodyellow: "#fafad2", lightgray: "#d3d3d3", lightgrey: "#d3d3d3", lightgreen: "#90ee90", lightpink: "#ffb6c1", lightsalmon: "#ffa07a", lightseagreen: "#20b2aa", lightskyblue: "#87cefa", lightslategray: "#778899", lightslategrey: "#778899", lightsteelblue: "#b0c4de", lightyellow: "#ffffe0", lime: "#00ff00", limegreen: "#32cd32", linen: "#faf0e6", magenta: "#ff00ff", maroon: "#800000", mediumaquamarine: "#66cdaa", mediumblue: "#0000cd", mediumorchid: "#ba55d3", mediumpurple: "#9370d8", mediumseagreen: "#3cb371", mediumslateblue: "#7b68ee", mediumspringgreen: "#00fa9a", mediumturquoise: "#48d1cc", mediumvioletred: "#c71585", midnightblue: "#191970", mintcream: "#f5fffa", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", navajowhite: "#ffdead", navy: "#000080", oldlace: "#fdf5e6", olive: "#808000", olivedrab: "#6b8e23", orange: "#ffa500", orangered: "#ff4500", orchid: "#da70d6", palegoldenrod: "#eee8aa", palegreen: "#98fb98", paleturquoise: "#afeeee", palevioletred: "#d87093", papayawhip: "#ffefd5", peachpuff: "#ffdab9", peru: "#cd853f", pink: "#ffc0cb", plum: "#dda0dd", powderblue: "#b0e0e6", purple: "#800080", red: "#ff0000", rosybrown: "#bc8f8f", royalblue: "#4169e1", saddlebrown: "#8b4513", salmon: "#fa8072", sandybrown: "#f4a460", seagreen: "#2e8b57", seashell: "#fff5ee", sienna: "#a0522d", silver: "#c0c0c0", skyblue: "#87ceeb", slateblue: "#6a5acd", slategray: "#708090", slategrey: "#708090", snow: "#fffafa", springgreen: "#00ff7f", steelblue: "#4682b4", tan: "#d2b48c", teal: "#008080", thistle: "#d8bfd8", tomato: "#ff6347", turquoise: "#40e0d0", violet: "#ee82ee", wheat: "#f5deb3", white: "#ffffff", whitesmoke: "#f5f5f5", yellow: "#ffff00", yellowgreen: "#9acd32", currentColor: "The value of the 'color' property.", activeBorder: "Active window border.", activecaption: "Active window caption.", appworkspace: "Background color of multiple document interface.", background: "Desktop background.", buttonface: "The face background color for 3-D elements that appear 3-D due to one layer of surrounding border.", buttonhighlight: "The color of the border facing the light source for 3-D elements that appear 3-D due to one layer of surrounding border.", buttonshadow: "The color of the border away from the light source for 3-D elements that appear 3-D due to one layer of surrounding border.", buttontext: "Text on push buttons.", captiontext: "Text in caption, size box, and scrollbar arrow box.", graytext: "Grayed (disabled) text. This color is set to #000 if the current display driver does not support a solid gray color.", greytext: "Greyed (disabled) text. This color is set to #000 if the current display driver does not support a solid grey color.", highlight: "Item(s) selected in a control.", highlighttext: "Text of item(s) selected in a control.", inactiveborder: "Inactive window border.", inactivecaption: "Inactive window caption.", inactivecaptiontext: "Color of text in an inactive caption.", infobackground: "Background color for tooltip controls.", infotext: "Text color for tooltip controls.", menu: "Menu background.", menutext: "Text in menus.", scrollbar: "Scroll bar gray area.", threeddarkshadow: "The color of the darker (generally outer) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.", threedface: "The face background color for 3-D elements that appear 3-D due to two concentric layers of surrounding border.", threedhighlight: "The color of the lighter (generally outer) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.", threedlightshadow: "The color of the darker (generally inner) of the two borders facing the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.", threedshadow: "The color of the lighter (generally inner) of the two borders away from the light source for 3-D elements that appear 3-D due to two concentric layers of surrounding border.", window: "Window background.", windowframe: "Window frame.", windowtext: "Text in windows." };
    function _(c, h2, m) {
      l.call(this, c, h2, m, S.COMBINATOR_TYPE), this.type = "unknown", /^\s+$/.test(c) ? this.type = "descendant" : c === ">" ? this.type = "child" : c === "+" ? this.type = "adjacent-sibling" : c === "~" && (this.type = "sibling");
    }
    _.prototype = new l(), _.prototype.constructor = _;
    function y(c, h2) {
      l.call(this, "(" + c + (h2 !== null ? ":" + h2 : "") + ")", c.startLine, c.startCol, S.MEDIA_FEATURE_TYPE), this.name = c, this.value = h2;
    }
    y.prototype = new l(), y.prototype.constructor = y;
    function w(c, h2, m, a, o) {
      l.call(this, (c ? c + " " : "") + (h2 || "") + (h2 && m.length > 0 ? " and " : "") + m.join(" and "), a, o, S.MEDIA_QUERY_TYPE), this.modifier = c, this.mediaType = h2, this.features = m;
    }
    w.prototype = new l(), w.prototype.constructor = w;
    function S(c) {
      e.call(this), this.options = c || {}, this._tokenStream = null;
    }
    S.DEFAULT_TYPE = 0, S.COMBINATOR_TYPE = 1, S.MEDIA_FEATURE_TYPE = 2, S.MEDIA_QUERY_TYPE = 3, S.PROPERTY_NAME_TYPE = 4, S.PROPERTY_VALUE_TYPE = 5, S.PROPERTY_VALUE_PART_TYPE = 6, S.SELECTOR_TYPE = 7, S.SELECTOR_PART_TYPE = 8, S.SELECTOR_SUB_PART_TYPE = 9, S.prototype = function() {
      var c = new e(), h2, m = { __proto__: null, constructor: S, DEFAULT_TYPE: 0, COMBINATOR_TYPE: 1, MEDIA_FEATURE_TYPE: 2, MEDIA_QUERY_TYPE: 3, PROPERTY_NAME_TYPE: 4, PROPERTY_VALUE_TYPE: 5, PROPERTY_VALUE_PART_TYPE: 6, SELECTOR_TYPE: 7, SELECTOR_PART_TYPE: 8, SELECTOR_SUB_PART_TYPE: 9, _stylesheet: function() {
        var a = this._tokenStream, o, u, b;
        for (this.fire("startstylesheet"), this._charset(), this._skipCruft(); a.peek() === d.IMPORT_SYM; )
          this._import(), this._skipCruft();
        for (; a.peek() === d.NAMESPACE_SYM; )
          this._namespace(), this._skipCruft();
        for (b = a.peek(); b > d.EOF; ) {
          try {
            switch (b) {
              case d.MEDIA_SYM:
                this._media(), this._skipCruft();
                break;
              case d.PAGE_SYM:
                this._page(), this._skipCruft();
                break;
              case d.FONT_FACE_SYM:
                this._font_face(), this._skipCruft();
                break;
              case d.KEYFRAMES_SYM:
                this._keyframes(), this._skipCruft();
                break;
              case d.VIEWPORT_SYM:
                this._viewport(), this._skipCruft();
                break;
              case d.DOCUMENT_SYM:
                this._document(), this._skipCruft();
                break;
              case d.UNKNOWN_SYM:
                if (a.get(), this.options.strict)
                  throw new n("Unknown @ rule.", a.LT(0).startLine, a.LT(0).startCol);
                for (this.fire({ type: "error", error: null, message: "Unknown @ rule: " + a.LT(0).value + ".", line: a.LT(0).startLine, col: a.LT(0).startCol }), o = 0; a.advance([d.LBRACE, d.RBRACE]) === d.LBRACE; )
                  o++;
                for (; o; )
                  a.advance([d.RBRACE]), o--;
                break;
              case d.S:
                this._readWhitespace();
                break;
              default:
                if (!this._ruleset())
                  switch (b) {
                    case d.CHARSET_SYM:
                      throw u = a.LT(1), this._charset(false), new n("@charset not allowed here.", u.startLine, u.startCol);
                    case d.IMPORT_SYM:
                      throw u = a.LT(1), this._import(false), new n("@import not allowed here.", u.startLine, u.startCol);
                    case d.NAMESPACE_SYM:
                      throw u = a.LT(1), this._namespace(false), new n("@namespace not allowed here.", u.startLine, u.startCol);
                    default:
                      a.get(), this._unexpectedToken(a.token());
                  }
            }
          } catch (T) {
            if (T instanceof n && !this.options.strict)
              this.fire({ type: "error", error: T, message: T.message, line: T.line, col: T.col });
            else
              throw T;
          }
          b = a.peek();
        }
        b !== d.EOF && this._unexpectedToken(a.token()), this.fire("endstylesheet");
      }, _charset: function(a) {
        var o = this._tokenStream, u, b, T, I;
        o.match(d.CHARSET_SYM) && (T = o.token().startLine, I = o.token().startCol, this._readWhitespace(), o.mustMatch(d.STRING), b = o.token(), u = b.value, this._readWhitespace(), o.mustMatch(d.SEMICOLON), a !== false && this.fire({ type: "charset", charset: u, line: T, col: I }));
      }, _import: function(a) {
        var o = this._tokenStream, u, b, T = [];
        o.mustMatch(d.IMPORT_SYM), b = o.token(), this._readWhitespace(), o.mustMatch([d.STRING, d.URI]), u = o.token().value.replace(/^(?:url\()?["']?([^"']+?)["']?\)?$/, "$1"), this._readWhitespace(), T = this._media_query_list(), o.mustMatch(d.SEMICOLON), this._readWhitespace(), a !== false && this.fire({ type: "import", uri: u, media: T, line: b.startLine, col: b.startCol });
      }, _namespace: function(a) {
        var o = this._tokenStream, u, b, T, I;
        o.mustMatch(d.NAMESPACE_SYM), u = o.token().startLine, b = o.token().startCol, this._readWhitespace(), o.match(d.IDENT) && (T = o.token().value, this._readWhitespace()), o.mustMatch([d.STRING, d.URI]), I = o.token().value.replace(/(?:url\()?["']([^"']+)["']\)?/, "$1"), this._readWhitespace(), o.mustMatch(d.SEMICOLON), this._readWhitespace(), a !== false && this.fire({ type: "namespace", prefix: T, uri: I, line: u, col: b });
      }, _media: function() {
        var a = this._tokenStream, o, u, b;
        for (a.mustMatch(d.MEDIA_SYM), o = a.token().startLine, u = a.token().startCol, this._readWhitespace(), b = this._media_query_list(), a.mustMatch(d.LBRACE), this._readWhitespace(), this.fire({ type: "startmedia", media: b, line: o, col: u }); ; )
          if (a.peek() === d.PAGE_SYM)
            this._page();
          else if (a.peek() === d.FONT_FACE_SYM)
            this._font_face();
          else if (a.peek() === d.VIEWPORT_SYM)
            this._viewport();
          else if (a.peek() === d.DOCUMENT_SYM)
            this._document();
          else if (!this._ruleset())
            break;
        a.mustMatch(d.RBRACE), this._readWhitespace(), this.fire({ type: "endmedia", media: b, line: o, col: u });
      }, _media_query_list: function() {
        var a = this._tokenStream, o = [];
        for (this._readWhitespace(), (a.peek() === d.IDENT || a.peek() === d.LPAREN) && o.push(this._media_query()); a.match(d.COMMA); )
          this._readWhitespace(), o.push(this._media_query());
        return o;
      }, _media_query: function() {
        var a = this._tokenStream, o = null, u = null, b = null, T = [];
        if (a.match(d.IDENT) && (u = a.token().value.toLowerCase(), u !== "only" && u !== "not" ? (a.unget(), u = null) : b = a.token()), this._readWhitespace(), a.peek() === d.IDENT ? (o = this._media_type(), b === null && (b = a.token())) : a.peek() === d.LPAREN && (b === null && (b = a.LT(1)), T.push(this._media_expression())), o === null && T.length === 0)
          return null;
        for (this._readWhitespace(); a.match(d.IDENT); )
          a.token().value.toLowerCase() !== "and" && this._unexpectedToken(a.token()), this._readWhitespace(), T.push(this._media_expression());
        return new w(u, o, T, b.startLine, b.startCol);
      }, _media_type: function() {
        return this._media_feature();
      }, _media_expression: function() {
        var a = this._tokenStream, o = null, u, b = null;
        return a.mustMatch(d.LPAREN), o = this._media_feature(), this._readWhitespace(), a.match(d.COLON) && (this._readWhitespace(), u = a.LT(1), b = this._expression()), a.mustMatch(d.RPAREN), this._readWhitespace(), new y(o, b ? new l(b, u.startLine, u.startCol) : null);
      }, _media_feature: function() {
        var a = this._tokenStream;
        return this._readWhitespace(), a.mustMatch(d.IDENT), l.fromToken(a.token());
      }, _page: function() {
        var a = this._tokenStream, o, u, b = null, T = null;
        a.mustMatch(d.PAGE_SYM), o = a.token().startLine, u = a.token().startCol, this._readWhitespace(), a.match(d.IDENT) && (b = a.token().value, b.toLowerCase() === "auto" && this._unexpectedToken(a.token())), a.peek() === d.COLON && (T = this._pseudo_page()), this._readWhitespace(), this.fire({ type: "startpage", id: b, pseudo: T, line: o, col: u }), this._readDeclarations(true, true), this.fire({ type: "endpage", id: b, pseudo: T, line: o, col: u });
      }, _margin: function() {
        var a = this._tokenStream, o, u, b = this._margin_sym();
        return b ? (o = a.token().startLine, u = a.token().startCol, this.fire({ type: "startpagemargin", margin: b, line: o, col: u }), this._readDeclarations(true), this.fire({ type: "endpagemargin", margin: b, line: o, col: u }), true) : false;
      }, _margin_sym: function() {
        var a = this._tokenStream;
        return a.match([d.TOPLEFTCORNER_SYM, d.TOPLEFT_SYM, d.TOPCENTER_SYM, d.TOPRIGHT_SYM, d.TOPRIGHTCORNER_SYM, d.BOTTOMLEFTCORNER_SYM, d.BOTTOMLEFT_SYM, d.BOTTOMCENTER_SYM, d.BOTTOMRIGHT_SYM, d.BOTTOMRIGHTCORNER_SYM, d.LEFTTOP_SYM, d.LEFTMIDDLE_SYM, d.LEFTBOTTOM_SYM, d.RIGHTTOP_SYM, d.RIGHTMIDDLE_SYM, d.RIGHTBOTTOM_SYM]) ? l.fromToken(a.token()) : null;
      }, _pseudo_page: function() {
        var a = this._tokenStream;
        return a.mustMatch(d.COLON), a.mustMatch(d.IDENT), a.token().value;
      }, _font_face: function() {
        var a = this._tokenStream, o, u;
        a.mustMatch(d.FONT_FACE_SYM), o = a.token().startLine, u = a.token().startCol, this._readWhitespace(), this.fire({ type: "startfontface", line: o, col: u }), this._readDeclarations(true), this.fire({ type: "endfontface", line: o, col: u });
      }, _viewport: function() {
        var a = this._tokenStream, o, u;
        a.mustMatch(d.VIEWPORT_SYM), o = a.token().startLine, u = a.token().startCol, this._readWhitespace(), this.fire({ type: "startviewport", line: o, col: u }), this._readDeclarations(true), this.fire({ type: "endviewport", line: o, col: u });
      }, _document: function() {
        var a = this._tokenStream, o, u = [], b = "";
        for (a.mustMatch(d.DOCUMENT_SYM), o = a.token(), /^@\-([^\-]+)\-/.test(o.value) && (b = RegExp.$1), this._readWhitespace(), u.push(this._document_function()); a.match(d.COMMA); )
          this._readWhitespace(), u.push(this._document_function());
        for (a.mustMatch(d.LBRACE), this._readWhitespace(), this.fire({ type: "startdocument", functions: u, prefix: b, line: o.startLine, col: o.startCol }); ; )
          if (a.peek() === d.PAGE_SYM)
            this._page();
          else if (a.peek() === d.FONT_FACE_SYM)
            this._font_face();
          else if (a.peek() === d.VIEWPORT_SYM)
            this._viewport();
          else if (a.peek() === d.MEDIA_SYM)
            this._media();
          else if (!this._ruleset())
            break;
        a.mustMatch(d.RBRACE), this._readWhitespace(), this.fire({ type: "enddocument", functions: u, prefix: b, line: o.startLine, col: o.startCol });
      }, _document_function: function() {
        var a = this._tokenStream, o;
        return a.match(d.URI) ? (o = a.token().value, this._readWhitespace()) : o = this._function(), o;
      }, _operator: function(a) {
        var o = this._tokenStream, u = null;
        return (o.match([d.SLASH, d.COMMA]) || a && o.match([d.PLUS, d.STAR, d.MINUS])) && (u = o.token(), this._readWhitespace()), u ? re.fromToken(u) : null;
      }, _combinator: function() {
        var a = this._tokenStream, o = null, u;
        return a.match([d.PLUS, d.GREATER, d.TILDE]) && (u = a.token(), o = new _(u.value, u.startLine, u.startCol), this._readWhitespace()), o;
      }, _unary_operator: function() {
        var a = this._tokenStream;
        return a.match([d.MINUS, d.PLUS]) ? a.token().value : null;
      }, _property: function() {
        var a = this._tokenStream, o = null, u = null, b, T, I, L;
        return a.peek() === d.STAR && this.options.starHack && (a.get(), T = a.token(), u = T.value, I = T.startLine, L = T.startCol), a.match(d.IDENT) && (T = a.token(), b = T.value, b.charAt(0) === "_" && this.options.underscoreHack && (u = "_", b = b.substring(1)), o = new ae(b, u, I || T.startLine, L || T.startCol), this._readWhitespace()), o;
      }, _ruleset: function() {
        var a = this._tokenStream, o, u;
        try {
          u = this._selectors_group();
        } catch (b) {
          if (b instanceof n && !this.options.strict) {
            if (this.fire({ type: "error", error: b, message: b.message, line: b.line, col: b.col }), o = a.advance([d.RBRACE]), o !== d.RBRACE)
              throw b;
          } else
            throw b;
          return true;
        }
        return u && (this.fire({ type: "startrule", selectors: u, line: u[0].line, col: u[0].col }), this._readDeclarations(true), this.fire({ type: "endrule", selectors: u, line: u[0].line, col: u[0].col })), u;
      }, _selectors_group: function() {
        var a = this._tokenStream, o = [], u;
        if (u = this._selector(), u !== null)
          for (o.push(u); a.match(d.COMMA); )
            this._readWhitespace(), u = this._selector(), u !== null ? o.push(u) : this._unexpectedToken(a.LT(1));
        return o.length ? o : null;
      }, _selector: function() {
        var a = this._tokenStream, o = [], u = null, b = null, T = null;
        if (u = this._simple_selector_sequence(), u === null)
          return null;
        o.push(u);
        do
          if (b = this._combinator(), b !== null)
            o.push(b), u = this._simple_selector_sequence(), u === null ? this._unexpectedToken(a.LT(1)) : o.push(u);
          else if (this._readWhitespace())
            T = new _(a.token().value, a.token().startLine, a.token().startCol), b = this._combinator(), u = this._simple_selector_sequence(), u === null ? b !== null && this._unexpectedToken(a.LT(1)) : (b !== null ? o.push(b) : o.push(T), o.push(u));
          else
            break;
        while (true);
        return new V(o, o[0].line, o[0].col);
      }, _simple_selector_sequence: function() {
        var a = this._tokenStream, o = null, u = [], b = "", T = [function() {
          return a.match(d.HASH) ? new U(a.token().value, "id", a.token().startLine, a.token().startCol) : null;
        }, this._class, this._attrib, this._pseudo, this._negation], I = 0, L = T.length, oe = null, We, dt;
        for (We = a.LT(1).startLine, dt = a.LT(1).startCol, o = this._type_selector(), o || (o = this._universal()), o !== null && (b += o); a.peek() !== d.S; ) {
          for (; I < L && oe === null; )
            oe = T[I++].call(this);
          if (oe === null) {
            if (b === "")
              return null;
            break;
          } else
            I = 0, u.push(oe), b += oe.toString(), oe = null;
        }
        return b !== "" ? new ve(o, u, b, We, dt) : null;
      }, _type_selector: function() {
        var a = this._tokenStream, o = this._namespace_prefix(), u = this._element_name();
        return u ? (o && (u.text = o + u.text, u.col -= o.length), u) : (o && (a.unget(), o.length > 1 && a.unget()), null);
      }, _class: function() {
        var a = this._tokenStream, o;
        return a.match(d.DOT) ? (a.mustMatch(d.IDENT), o = a.token(), new U("." + o.value, "class", o.startLine, o.startCol - 1)) : null;
      }, _element_name: function() {
        var a = this._tokenStream, o;
        return a.match(d.IDENT) ? (o = a.token(), new U(o.value, "elementName", o.startLine, o.startCol)) : null;
      }, _namespace_prefix: function() {
        var a = this._tokenStream, o = "";
        return (a.LA(1) === d.PIPE || a.LA(2) === d.PIPE) && (a.match([d.IDENT, d.STAR]) && (o += a.token().value), a.mustMatch(d.PIPE), o += "|"), o.length ? o : null;
      }, _universal: function() {
        var a = this._tokenStream, o = "", u;
        return u = this._namespace_prefix(), u && (o += u), a.match(d.STAR) && (o += "*"), o.length ? o : null;
      }, _attrib: function() {
        var a = this._tokenStream, o = null, u, b;
        return a.match(d.LBRACKET) ? (b = a.token(), o = b.value, o += this._readWhitespace(), u = this._namespace_prefix(), u && (o += u), a.mustMatch(d.IDENT), o += a.token().value, o += this._readWhitespace(), a.match([d.PREFIXMATCH, d.SUFFIXMATCH, d.SUBSTRINGMATCH, d.EQUALS, d.INCLUDES, d.DASHMATCH]) && (o += a.token().value, o += this._readWhitespace(), a.mustMatch([d.IDENT, d.STRING]), o += a.token().value, o += this._readWhitespace()), a.mustMatch(d.RBRACKET), new U(o + "]", "attribute", b.startLine, b.startCol)) : null;
      }, _pseudo: function() {
        var a = this._tokenStream, o = null, u = ":", b, T;
        return a.match(d.COLON) && (a.match(d.COLON) && (u += ":"), a.match(d.IDENT) ? (o = a.token().value, b = a.token().startLine, T = a.token().startCol - u.length) : a.peek() === d.FUNCTION && (b = a.LT(1).startLine, T = a.LT(1).startCol - u.length, o = this._functional_pseudo()), o && (o = new U(u + o, "pseudo", b, T))), o;
      }, _functional_pseudo: function() {
        var a = this._tokenStream, o = null;
        return a.match(d.FUNCTION) && (o = a.token().value, o += this._readWhitespace(), o += this._expression(), a.mustMatch(d.RPAREN), o += ")"), o;
      }, _expression: function() {
        for (var a = this._tokenStream, o = ""; a.match([d.PLUS, d.MINUS, d.DIMENSION, d.NUMBER, d.STRING, d.IDENT, d.LENGTH, d.FREQ, d.ANGLE, d.TIME, d.RESOLUTION, d.SLASH]); )
          o += a.token().value, o += this._readWhitespace();
        return o.length ? o : null;
      }, _negation: function() {
        var a = this._tokenStream, o, u, b = "", T, I = null;
        return a.match(d.NOT) && (b = a.token().value, o = a.token().startLine, u = a.token().startCol, b += this._readWhitespace(), T = this._negation_arg(), b += T, b += this._readWhitespace(), a.match(d.RPAREN), b += a.token().value, I = new U(b, "not", o, u), I.args.push(T)), I;
      }, _negation_arg: function() {
        var a = this._tokenStream, o = [this._type_selector, this._universal, function() {
          return a.match(d.HASH) ? new U(a.token().value, "id", a.token().startLine, a.token().startCol) : null;
        }, this._class, this._attrib, this._pseudo], u = null, b = 0, T = o.length, I, L, oe;
        for (I = a.LT(1).startLine, L = a.LT(1).startCol; b < T && u === null; )
          u = o[b].call(this), b++;
        return u === null && this._unexpectedToken(a.LT(1)), u.type === "elementName" ? oe = new ve(u, [], u.toString(), I, L) : oe = new ve(null, [u], u.toString(), I, L), oe;
      }, _declaration: function() {
        var a = this._tokenStream, o = null, u = null, b = null, T = null, I = "";
        if (o = this._property(), o !== null) {
          a.mustMatch(d.COLON), this._readWhitespace(), u = this._expr(), (!u || u.length === 0) && this._unexpectedToken(a.LT(1)), b = this._prio(), I = o.toString(), (this.options.starHack && o.hack === "*" || this.options.underscoreHack && o.hack === "_") && (I = o.text);
          try {
            this._validateProperty(I, u);
          } catch (L) {
            T = L;
          }
          return this.fire({ type: "property", property: o, value: u, important: b, line: o.line, col: o.col, invalid: T }), true;
        } else
          return false;
      }, _prio: function() {
        var a = this._tokenStream, o = a.match(d.IMPORTANT_SYM);
        return this._readWhitespace(), o;
      }, _expr: function(a) {
        var o = [], u = null, b = null;
        if (u = this._term(a), u !== null) {
          o.push(u);
          do {
            if (b = this._operator(a), b && o.push(b), u = this._term(a), u === null)
              break;
            o.push(u);
          } while (true);
        }
        return o.length > 0 ? new ce(o, o[0].line, o[0].col) : null;
      }, _term: function(a) {
        var o = this._tokenStream, u = null, b = null, T = null, I, L, oe;
        return u = this._unary_operator(), u !== null && (L = o.token().startLine, oe = o.token().startCol), o.peek() === d.IE_FUNCTION && this.options.ieFilters ? (b = this._ie_function(), u === null && (L = o.token().startLine, oe = o.token().startCol)) : a && o.match([d.LPAREN, d.LBRACE, d.LBRACKET]) ? (I = o.token(), T = I.endChar, b = I.value + this._expr(a).text, u === null && (L = o.token().startLine, oe = o.token().startCol), o.mustMatch(d.type(T)), b += T, this._readWhitespace()) : o.match([d.NUMBER, d.PERCENTAGE, d.LENGTH, d.ANGLE, d.TIME, d.FREQ, d.STRING, d.IDENT, d.URI, d.UNICODE_RANGE]) ? (b = o.token().value, u === null && (L = o.token().startLine, oe = o.token().startCol), this._readWhitespace()) : (I = this._hexcolor(), I === null ? (u === null && (L = o.LT(1).startLine, oe = o.LT(1).startCol), b === null && (o.LA(3) === d.EQUALS && this.options.ieFilters ? b = this._ie_function() : b = this._function())) : (b = I.value, u === null && (L = I.startLine, oe = I.startCol))), b !== null ? new re(u !== null ? u + b : b, L, oe) : null;
      }, _function: function() {
        var a = this._tokenStream, o = null, u = null, b;
        if (a.match(d.FUNCTION)) {
          if (o = a.token().value, this._readWhitespace(), u = this._expr(true), o += u, this.options.ieFilters && a.peek() === d.EQUALS)
            do
              for (this._readWhitespace() && (o += a.token().value), a.LA(0) === d.COMMA && (o += a.token().value), a.match(d.IDENT), o += a.token().value, a.match(d.EQUALS), o += a.token().value, b = a.peek(); b !== d.COMMA && b !== d.S && b !== d.RPAREN; )
                a.get(), o += a.token().value, b = a.peek();
            while (a.match([d.COMMA, d.S]));
          a.match(d.RPAREN), o += ")", this._readWhitespace();
        }
        return o;
      }, _ie_function: function() {
        var a = this._tokenStream, o = null, u;
        if (a.match([d.IE_FUNCTION, d.FUNCTION])) {
          o = a.token().value;
          do
            for (this._readWhitespace() && (o += a.token().value), a.LA(0) === d.COMMA && (o += a.token().value), a.match(d.IDENT), o += a.token().value, a.match(d.EQUALS), o += a.token().value, u = a.peek(); u !== d.COMMA && u !== d.S && u !== d.RPAREN; )
              a.get(), o += a.token().value, u = a.peek();
          while (a.match([d.COMMA, d.S]));
          a.match(d.RPAREN), o += ")", this._readWhitespace();
        }
        return o;
      }, _hexcolor: function() {
        var a = this._tokenStream, o = null, u;
        if (a.match(d.HASH)) {
          if (o = a.token(), u = o.value, !/#[a-f0-9]{3,6}/i.test(u))
            throw new n("Expected a hex color but found '" + u + "' at line " + o.startLine + ", col " + o.startCol + ".", o.startLine, o.startCol);
          this._readWhitespace();
        }
        return o;
      }, _keyframes: function() {
        var a = this._tokenStream, o, u, b, T = "";
        for (a.mustMatch(d.KEYFRAMES_SYM), o = a.token(), /^@\-([^\-]+)\-/.test(o.value) && (T = RegExp.$1), this._readWhitespace(), b = this._keyframe_name(), this._readWhitespace(), a.mustMatch(d.LBRACE), this.fire({ type: "startkeyframes", name: b, prefix: T, line: o.startLine, col: o.startCol }), this._readWhitespace(), u = a.peek(); u === d.IDENT || u === d.PERCENTAGE; )
          this._keyframe_rule(), this._readWhitespace(), u = a.peek();
        this.fire({ type: "endkeyframes", name: b, prefix: T, line: o.startLine, col: o.startCol }), this._readWhitespace(), a.mustMatch(d.RBRACE);
      }, _keyframe_name: function() {
        var a = this._tokenStream;
        return a.mustMatch([d.IDENT, d.STRING]), l.fromToken(a.token());
      }, _keyframe_rule: function() {
        var a = this._key_list();
        this.fire({ type: "startkeyframerule", keys: a, line: a[0].line, col: a[0].col }), this._readDeclarations(true), this.fire({ type: "endkeyframerule", keys: a, line: a[0].line, col: a[0].col });
      }, _key_list: function() {
        var a = this._tokenStream, o = [];
        for (o.push(this._key()), this._readWhitespace(); a.match(d.COMMA); )
          this._readWhitespace(), o.push(this._key()), this._readWhitespace();
        return o;
      }, _key: function() {
        var a = this._tokenStream, o;
        if (a.match(d.PERCENTAGE))
          return l.fromToken(a.token());
        if (a.match(d.IDENT)) {
          if (o = a.token(), /from|to/i.test(o.value))
            return l.fromToken(o);
          a.unget();
        }
        this._unexpectedToken(a.LT(1));
      }, _skipCruft: function() {
        for (; this._tokenStream.match([d.S, d.CDO, d.CDC]); )
          ;
      }, _readDeclarations: function(a, o) {
        var u = this._tokenStream, b;
        this._readWhitespace(), a && u.mustMatch(d.LBRACE), this._readWhitespace();
        try {
          for (; ; ) {
            if (!(u.match(d.SEMICOLON) || o && this._margin()))
              if (this._declaration()) {
                if (!u.match(d.SEMICOLON))
                  break;
              } else
                break;
            this._readWhitespace();
          }
          u.mustMatch(d.RBRACE), this._readWhitespace();
        } catch (T) {
          if (T instanceof n && !this.options.strict) {
            if (this.fire({ type: "error", error: T, message: T.message, line: T.line, col: T.col }), b = u.advance([d.SEMICOLON, d.RBRACE]), b === d.SEMICOLON)
              this._readDeclarations(false, o);
            else if (b !== d.RBRACE)
              throw T;
          } else
            throw T;
        }
      }, _readWhitespace: function() {
        for (var a = this._tokenStream, o = ""; a.match(d.S); )
          o += a.token().value;
        return o;
      }, _unexpectedToken: function(a) {
        throw new n("Unexpected token '" + a.value + "' at line " + a.startLine + ", col " + a.startCol + ".", a.startLine, a.startCol);
      }, _verifyEnd: function() {
        this._tokenStream.LA(1) !== d.EOF && this._unexpectedToken(this._tokenStream.LT(1));
      }, _validateProperty: function(a, o) {
        Xe.validate(a, o);
      }, parse: function(a) {
        this._tokenStream = new p(a, d), this._stylesheet();
      }, parseStyleSheet: function(a) {
        return this.parse(a);
      }, parseMediaQuery: function(a) {
        this._tokenStream = new p(a, d);
        var o = this._media_query();
        return this._verifyEnd(), o;
      }, parsePropertyValue: function(a) {
        this._tokenStream = new p(a, d), this._readWhitespace();
        var o = this._expr();
        return this._readWhitespace(), this._verifyEnd(), o;
      }, parseRule: function(a) {
        this._tokenStream = new p(a, d), this._readWhitespace();
        var o = this._ruleset();
        return this._readWhitespace(), this._verifyEnd(), o;
      }, parseSelector: function(a) {
        this._tokenStream = new p(a, d), this._readWhitespace();
        var o = this._selector();
        return this._readWhitespace(), this._verifyEnd(), o;
      }, parseStyleAttribute: function(a) {
        a += "}", this._tokenStream = new p(a, d), this._readDeclarations();
      } };
      for (h2 in m)
        Object.prototype.hasOwnProperty.call(m, h2) && (c[h2] = m[h2]);
      return c;
    }();
    var D = { __proto__: null, "align-items": "flex-start | flex-end | center | baseline | stretch", "align-content": "flex-start | flex-end | center | space-between | space-around | stretch", "align-self": "auto | flex-start | flex-end | center | baseline | stretch", "-webkit-align-items": "flex-start | flex-end | center | baseline | stretch", "-webkit-align-content": "flex-start | flex-end | center | space-between | space-around | stretch", "-webkit-align-self": "auto | flex-start | flex-end | center | baseline | stretch", "alignment-adjust": "auto | baseline | before-edge | text-before-edge | middle | central | after-edge | text-after-edge | ideographic | alphabetic | hanging | mathematical | <percentage> | <length>", "alignment-baseline": "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical", animation: 1, "animation-delay": { multi: "<time>", comma: true }, "animation-direction": { multi: "normal | alternate", comma: true }, "animation-duration": { multi: "<time>", comma: true }, "animation-fill-mode": { multi: "none | forwards | backwards | both", comma: true }, "animation-iteration-count": { multi: "<number> | infinite", comma: true }, "animation-name": { multi: "none | <ident>", comma: true }, "animation-play-state": { multi: "running | paused", comma: true }, "animation-timing-function": 1, "-moz-animation-delay": { multi: "<time>", comma: true }, "-moz-animation-direction": { multi: "normal | alternate", comma: true }, "-moz-animation-duration": { multi: "<time>", comma: true }, "-moz-animation-iteration-count": { multi: "<number> | infinite", comma: true }, "-moz-animation-name": { multi: "none | <ident>", comma: true }, "-moz-animation-play-state": { multi: "running | paused", comma: true }, "-ms-animation-delay": { multi: "<time>", comma: true }, "-ms-animation-direction": { multi: "normal | alternate", comma: true }, "-ms-animation-duration": { multi: "<time>", comma: true }, "-ms-animation-iteration-count": { multi: "<number> | infinite", comma: true }, "-ms-animation-name": { multi: "none | <ident>", comma: true }, "-ms-animation-play-state": { multi: "running | paused", comma: true }, "-webkit-animation-delay": { multi: "<time>", comma: true }, "-webkit-animation-direction": { multi: "normal | alternate", comma: true }, "-webkit-animation-duration": { multi: "<time>", comma: true }, "-webkit-animation-fill-mode": { multi: "none | forwards | backwards | both", comma: true }, "-webkit-animation-iteration-count": { multi: "<number> | infinite", comma: true }, "-webkit-animation-name": { multi: "none | <ident>", comma: true }, "-webkit-animation-play-state": { multi: "running | paused", comma: true }, "-o-animation-delay": { multi: "<time>", comma: true }, "-o-animation-direction": { multi: "normal | alternate", comma: true }, "-o-animation-duration": { multi: "<time>", comma: true }, "-o-animation-iteration-count": { multi: "<number> | infinite", comma: true }, "-o-animation-name": { multi: "none | <ident>", comma: true }, "-o-animation-play-state": { multi: "running | paused", comma: true }, appearance: "icon | window | desktop | workspace | document | tooltip | dialog | button | push-button | hyperlink | radio | radio-button | checkbox | menu-item | tab | menu | menubar | pull-down-menu | pop-up-menu | list-menu | radio-group | checkbox-group | outline-tree | range | field | combo-box | signature | password | normal | none | inherit", azimuth: function(c) {
      var h2 = "<angle> | leftwards | rightwards | inherit", m = "left-side | far-left | left | center-left | center | center-right | right | far-right | right-side", a = false, o = false, u;
      if (A.isAny(c, h2) || (A.isAny(c, "behind") && (a = true, o = true), A.isAny(c, m) && (o = true, a || A.isAny(c, "behind"))), c.hasNext())
        throw u = c.next(), o ? new se("Expected end of value but found '" + u + "'.", u.line, u.col) : new se("Expected (<'azimuth'>) but found '" + u + "'.", u.line, u.col);
    }, "backface-visibility": "visible | hidden", background: 1, "background-attachment": { multi: "<attachment>", comma: true }, "background-clip": { multi: "<box>", comma: true }, "background-color": "<color> | inherit", "background-image": { multi: "<bg-image>", comma: true }, "background-origin": { multi: "<box>", comma: true }, "background-position": { multi: "<bg-position>", comma: true }, "background-repeat": { multi: "<repeat-style>" }, "background-size": { multi: "<bg-size>", comma: true }, "baseline-shift": "baseline | sub | super | <percentage> | <length>", behavior: 1, binding: 1, bleed: "<length>", "bookmark-label": "<content> | <attr> | <string>", "bookmark-level": "none | <integer>", "bookmark-state": "open | closed", "bookmark-target": "none | <uri> | <attr>", border: "<border-width> || <border-style> || <color>", "border-bottom": "<border-width> || <border-style> || <color>", "border-bottom-color": "<color> | inherit", "border-bottom-left-radius": "<x-one-radius>", "border-bottom-right-radius": "<x-one-radius>", "border-bottom-style": "<border-style>", "border-bottom-width": "<border-width>", "border-collapse": "collapse | separate | inherit", "border-color": { multi: "<color> | inherit", max: 4 }, "border-image": 1, "border-image-outset": { multi: "<length> | <number>", max: 4 }, "border-image-repeat": { multi: "stretch | repeat | round", max: 2 }, "border-image-slice": function(c) {
      var h2 = false, m = "<number> | <percentage>", a = false, o = 0, u = 4, b;
      for (A.isAny(c, "fill") && (a = true, h2 = true); c.hasNext() && o < u && (h2 = A.isAny(c, m), !!h2); )
        o++;
      if (a ? h2 = true : A.isAny(c, "fill"), c.hasNext())
        throw b = c.next(), h2 ? new se("Expected end of value but found '" + b + "'.", b.line, b.col) : new se("Expected ([<number> | <percentage>]{1,4} && fill?) but found '" + b + "'.", b.line, b.col);
    }, "border-image-source": "<image> | none", "border-image-width": { multi: "<length> | <percentage> | <number> | auto", max: 4 }, "border-left": "<border-width> || <border-style> || <color>", "border-left-color": "<color> | inherit", "border-left-style": "<border-style>", "border-left-width": "<border-width>", "border-radius": function(c) {
      for (var h2 = false, m = "<length> | <percentage> | inherit", a = false, o = 0, u = 8, b; c.hasNext() && o < u; ) {
        if (h2 = A.isAny(c, m), !h2)
          if (String(c.peek()) === "/" && o > 0 && !a)
            a = true, u = o + 5, c.next();
          else
            break;
        o++;
      }
      if (c.hasNext())
        throw b = c.next(), h2 ? new se("Expected end of value but found '" + b + "'.", b.line, b.col) : new se("Expected (<'border-radius'>) but found '" + b + "'.", b.line, b.col);
    }, "border-right": "<border-width> || <border-style> || <color>", "border-right-color": "<color> | inherit", "border-right-style": "<border-style>", "border-right-width": "<border-width>", "border-spacing": { multi: "<length> | inherit", max: 2 }, "border-style": { multi: "<border-style>", max: 4 }, "border-top": "<border-width> || <border-style> || <color>", "border-top-color": "<color> | inherit", "border-top-left-radius": "<x-one-radius>", "border-top-right-radius": "<x-one-radius>", "border-top-style": "<border-style>", "border-top-width": "<border-width>", "border-width": { multi: "<border-width>", max: 4 }, bottom: "<margin-width> | inherit", "-moz-box-align": "start | end | center | baseline | stretch", "-moz-box-decoration-break": "slice |clone", "-moz-box-direction": "normal | reverse | inherit", "-moz-box-flex": "<number>", "-moz-box-flex-group": "<integer>", "-moz-box-lines": "single | multiple", "-moz-box-ordinal-group": "<integer>", "-moz-box-orient": "horizontal | vertical | inline-axis | block-axis | inherit", "-moz-box-pack": "start | end | center | justify", "-o-box-decoration-break": "slice | clone", "-webkit-box-align": "start | end | center | baseline | stretch", "-webkit-box-decoration-break": "slice |clone", "-webkit-box-direction": "normal | reverse | inherit", "-webkit-box-flex": "<number>", "-webkit-box-flex-group": "<integer>", "-webkit-box-lines": "single | multiple", "-webkit-box-ordinal-group": "<integer>", "-webkit-box-orient": "horizontal | vertical | inline-axis | block-axis | inherit", "-webkit-box-pack": "start | end | center | justify", "box-decoration-break": "slice | clone", "box-shadow": function(c) {
      var h2;
      if (!A.isAny(c, "none"))
        Xe.multiProperty("<shadow>", c, true, 1 / 0);
      else if (c.hasNext())
        throw h2 = c.next(), new se("Expected end of value but found '" + h2 + "'.", h2.line, h2.col);
    }, "box-sizing": "content-box | border-box | inherit", "break-after": "auto | always | avoid | left | right | page | column | avoid-page | avoid-column", "break-before": "auto | always | avoid | left | right | page | column | avoid-page | avoid-column", "break-inside": "auto | avoid | avoid-page | avoid-column", "caption-side": "top | bottom | inherit", clear: "none | right | left | both | inherit", clip: 1, color: "<color> | inherit", "color-profile": 1, "column-count": "<integer> | auto", "column-fill": "auto | balance", "column-gap": "<length> | normal", "column-rule": "<border-width> || <border-style> || <color>", "column-rule-color": "<color>", "column-rule-style": "<border-style>", "column-rule-width": "<border-width>", "column-span": "none | all", "column-width": "<length> | auto", columns: 1, content: 1, "counter-increment": 1, "counter-reset": 1, crop: "<shape> | auto", cue: "cue-after | cue-before | inherit", "cue-after": 1, "cue-before": 1, cursor: 1, direction: "ltr | rtl | inherit", display: "inline | block | list-item | inline-block | table | inline-table | table-row-group | table-header-group | table-footer-group | table-row | table-column-group | table-column | table-cell | table-caption | grid | inline-grid | run-in | ruby | ruby-base | ruby-text | ruby-base-container | ruby-text-container | contents | none | inherit | -moz-box | -moz-inline-block | -moz-inline-box | -moz-inline-grid | -moz-inline-stack | -moz-inline-table | -moz-grid | -moz-grid-group | -moz-grid-line | -moz-groupbox | -moz-deck | -moz-popup | -moz-stack | -moz-marker | -webkit-box | -webkit-inline-box | -ms-flexbox | -ms-inline-flexbox | flex | -webkit-flex | inline-flex | -webkit-inline-flex", "dominant-baseline": 1, "drop-initial-after-adjust": "central | middle | after-edge | text-after-edge | ideographic | alphabetic | mathematical | <percentage> | <length>", "drop-initial-after-align": "baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical", "drop-initial-before-adjust": "before-edge | text-before-edge | central | middle | hanging | mathematical | <percentage> | <length>", "drop-initial-before-align": "caps-height | baseline | use-script | before-edge | text-before-edge | after-edge | text-after-edge | central | middle | ideographic | alphabetic | hanging | mathematical", "drop-initial-size": "auto | line | <length> | <percentage>", "drop-initial-value": "initial | <integer>", elevation: "<angle> | below | level | above | higher | lower | inherit", "empty-cells": "show | hide | inherit", filter: 1, fit: "fill | hidden | meet | slice", "fit-position": 1, flex: "<flex>", "flex-basis": "<width>", "flex-direction": "row | row-reverse | column | column-reverse", "flex-flow": "<flex-direction> || <flex-wrap>", "flex-grow": "<number>", "flex-shrink": "<number>", "flex-wrap": "nowrap | wrap | wrap-reverse", "-webkit-flex": "<flex>", "-webkit-flex-basis": "<width>", "-webkit-flex-direction": "row | row-reverse | column | column-reverse", "-webkit-flex-flow": "<flex-direction> || <flex-wrap>", "-webkit-flex-grow": "<number>", "-webkit-flex-shrink": "<number>", "-webkit-flex-wrap": "nowrap | wrap | wrap-reverse", "-ms-flex": "<flex>", "-ms-flex-align": "start | end | center | stretch | baseline", "-ms-flex-direction": "row | row-reverse | column | column-reverse | inherit", "-ms-flex-order": "<number>", "-ms-flex-pack": "start | end | center | justify", "-ms-flex-wrap": "nowrap | wrap | wrap-reverse", float: "left | right | none | inherit", "float-offset": 1, font: 1, "font-family": 1, "font-feature-settings": "<feature-tag-value> | normal | inherit", "font-kerning": "auto | normal | none | initial | inherit | unset", "font-size": "<absolute-size> | <relative-size> | <length> | <percentage> | inherit", "font-size-adjust": "<number> | none | inherit", "font-stretch": "normal | ultra-condensed | extra-condensed | condensed | semi-condensed | semi-expanded | expanded | extra-expanded | ultra-expanded | inherit", "font-style": "normal | italic | oblique | inherit", "font-variant": "normal | small-caps | inherit", "font-variant-caps": "normal | small-caps | all-small-caps | petite-caps | all-petite-caps | unicase | titling-caps", "font-variant-position": "normal | sub | super | inherit | initial | unset", "font-weight": "normal | bold | bolder | lighter | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | inherit", grid: 1, "grid-area": 1, "grid-auto-columns": 1, "grid-auto-flow": 1, "grid-auto-position": 1, "grid-auto-rows": 1, "grid-cell-stacking": "columns | rows | layer", "grid-column": 1, "grid-columns": 1, "grid-column-align": "start | end | center | stretch", "grid-column-sizing": 1, "grid-column-start": 1, "grid-column-end": 1, "grid-column-span": "<integer>", "grid-flow": "none | rows | columns", "grid-layer": "<integer>", "grid-row": 1, "grid-rows": 1, "grid-row-align": "start | end | center | stretch", "grid-row-start": 1, "grid-row-end": 1, "grid-row-span": "<integer>", "grid-row-sizing": 1, "grid-template": 1, "grid-template-areas": 1, "grid-template-columns": 1, "grid-template-rows": 1, "hanging-punctuation": 1, height: "<margin-width> | <content-sizing> | inherit", "hyphenate-after": "<integer> | auto", "hyphenate-before": "<integer> | auto", "hyphenate-character": "<string> | auto", "hyphenate-lines": "no-limit | <integer>", "hyphenate-resource": 1, hyphens: "none | manual | auto", icon: 1, "image-orientation": "angle | auto", "image-rendering": 1, "image-resolution": 1, "ime-mode": "auto | normal | active | inactive | disabled | inherit", "inline-box-align": "initial | last | <integer>", "justify-content": "flex-start | flex-end | center | space-between | space-around", "-webkit-justify-content": "flex-start | flex-end | center | space-between | space-around", left: "<margin-width> | inherit", "letter-spacing": "<length> | normal | inherit", "line-height": "<number> | <length> | <percentage> | normal | inherit", "line-break": "auto | loose | normal | strict", "line-stacking": 1, "line-stacking-ruby": "exclude-ruby | include-ruby", "line-stacking-shift": "consider-shifts | disregard-shifts", "line-stacking-strategy": "inline-line-height | block-line-height | max-height | grid-height", "list-style": 1, "list-style-image": "<uri> | none | inherit", "list-style-position": "inside | outside | inherit", "list-style-type": "disc | circle | square | decimal | decimal-leading-zero | lower-roman | upper-roman | lower-greek | lower-latin | upper-latin | armenian | georgian | lower-alpha | upper-alpha | none | inherit", margin: { multi: "<margin-width> | inherit", max: 4 }, "margin-bottom": "<margin-width> | inherit", "margin-left": "<margin-width> | inherit", "margin-right": "<margin-width> | inherit", "margin-top": "<margin-width> | inherit", mark: 1, "mark-after": 1, "mark-before": 1, marks: 1, "marquee-direction": 1, "marquee-play-count": 1, "marquee-speed": 1, "marquee-style": 1, "max-height": "<length> | <percentage> | <content-sizing> | none | inherit", "max-width": "<length> | <percentage> | <content-sizing> | none | inherit", "min-height": "<length> | <percentage> | <content-sizing> | contain-floats | -moz-contain-floats | -webkit-contain-floats | inherit", "min-width": "<length> | <percentage> | <content-sizing> | contain-floats | -moz-contain-floats | -webkit-contain-floats | inherit", "move-to": 1, "nav-down": 1, "nav-index": 1, "nav-left": 1, "nav-right": 1, "nav-up": 1, "object-fit": "fill | contain | cover | none | scale-down", "object-position": "<bg-position>", opacity: "<number> | inherit", order: "<integer>", "-webkit-order": "<integer>", orphans: "<integer> | inherit", outline: 1, "outline-color": "<color> | invert | inherit", "outline-offset": 1, "outline-style": "<border-style> | inherit", "outline-width": "<border-width> | inherit", overflow: "visible | hidden | scroll | auto | inherit", "overflow-style": 1, "overflow-wrap": "normal | break-word", "overflow-x": 1, "overflow-y": 1, padding: { multi: "<padding-width> | inherit", max: 4 }, "padding-bottom": "<padding-width> | inherit", "padding-left": "<padding-width> | inherit", "padding-right": "<padding-width> | inherit", "padding-top": "<padding-width> | inherit", page: 1, "page-break-after": "auto | always | avoid | left | right | inherit", "page-break-before": "auto | always | avoid | left | right | inherit", "page-break-inside": "auto | avoid | inherit", "page-policy": 1, pause: 1, "pause-after": 1, "pause-before": 1, perspective: 1, "perspective-origin": 1, phonemes: 1, pitch: 1, "pitch-range": 1, "play-during": 1, "pointer-events": "auto | none | visiblePainted | visibleFill | visibleStroke | visible | painted | fill | stroke | all | inherit", position: "static | relative | absolute | fixed | inherit", "presentation-level": 1, "punctuation-trim": 1, quotes: 1, "rendering-intent": 1, resize: 1, rest: 1, "rest-after": 1, "rest-before": 1, richness: 1, right: "<margin-width> | inherit", rotation: 1, "rotation-point": 1, "ruby-align": 1, "ruby-overhang": 1, "ruby-position": 1, "ruby-span": 1, size: 1, speak: "normal | none | spell-out | inherit", "speak-header": "once | always | inherit", "speak-numeral": "digits | continuous | inherit", "speak-punctuation": "code | none | inherit", "speech-rate": 1, src: 1, stress: 1, "string-set": 1, "table-layout": "auto | fixed | inherit", "tab-size": "<integer> | <length>", target: 1, "target-name": 1, "target-new": 1, "target-position": 1, "text-align": "left | right | center | justify | match-parent | start | end | inherit", "text-align-last": 1, "text-decoration": 1, "text-emphasis": 1, "text-height": 1, "text-indent": "<length> | <percentage> | inherit", "text-justify": "auto | none | inter-word | inter-ideograph | inter-cluster | distribute | kashida", "text-outline": 1, "text-overflow": 1, "text-rendering": "auto | optimizeSpeed | optimizeLegibility | geometricPrecision | inherit", "text-shadow": 1, "text-transform": "capitalize | uppercase | lowercase | none | inherit", "text-wrap": "normal | none | avoid", top: "<margin-width> | inherit", "-ms-touch-action": "auto | none | pan-x | pan-y | pan-left | pan-right | pan-up | pan-down | manipulation", "touch-action": "auto | none | pan-x | pan-y | pan-left | pan-right | pan-up | pan-down | manipulation", transform: 1, "transform-origin": 1, "transform-style": 1, transition: 1, "transition-delay": 1, "transition-duration": 1, "transition-property": 1, "transition-timing-function": 1, "unicode-bidi": "normal | embed | isolate | bidi-override | isolate-override | plaintext | inherit", "user-modify": "read-only | read-write | write-only | inherit", "user-select": "none | text | toggle | element | elements | all | inherit", "vertical-align": "auto | use-script | baseline | sub | super | top | text-top | central | middle | bottom | text-bottom | <percentage> | <length> | inherit", visibility: "visible | hidden | collapse | inherit", "voice-balance": 1, "voice-duration": 1, "voice-family": 1, "voice-pitch": 1, "voice-pitch-range": 1, "voice-rate": 1, "voice-stress": 1, "voice-volume": 1, volume: 1, "white-space": "normal | pre | nowrap | pre-wrap | pre-line | inherit | -pre-wrap | -o-pre-wrap | -moz-pre-wrap | -hp-pre-wrap", "white-space-collapse": 1, widows: "<integer> | inherit", width: "<length> | <percentage> | <content-sizing> | auto | inherit", "will-change": { multi: "<ident>", comma: true }, "word-break": "normal | keep-all | break-all", "word-spacing": "<length> | normal | inherit", "word-wrap": "normal | break-word", "writing-mode": "horizontal-tb | vertical-rl | vertical-lr | lr-tb | rl-tb | tb-rl | bt-rl | tb-lr | bt-lr | lr-bt | rl-bt | lr | rl | tb | inherit", "z-index": "<integer> | auto | inherit", zoom: "<number> | <percentage> | normal" };
    function ae(c, h2, m, a) {
      l.call(this, c, m, a, S.PROPERTY_NAME_TYPE), this.hack = h2;
    }
    ae.prototype = new l(), ae.prototype.constructor = ae, ae.prototype.toString = function() {
      return (this.hack ? this.hack : "") + this.text;
    };
    function ce(c, h2, m) {
      l.call(this, c.join(" "), h2, m, S.PROPERTY_VALUE_TYPE), this.parts = c;
    }
    ce.prototype = new l(), ce.prototype.constructor = ce;
    function g(c) {
      this._i = 0, this._parts = c.parts, this._marks = [], this.value = c;
    }
    g.prototype.count = function() {
      return this._parts.length;
    }, g.prototype.isFirst = function() {
      return this._i === 0;
    }, g.prototype.hasNext = function() {
      return this._i < this._parts.length;
    }, g.prototype.mark = function() {
      this._marks.push(this._i);
    }, g.prototype.peek = function(c) {
      return this.hasNext() ? this._parts[this._i + (c || 0)] : null;
    }, g.prototype.next = function() {
      return this.hasNext() ? this._parts[this._i++] : null;
    }, g.prototype.previous = function() {
      return this._i > 0 ? this._parts[--this._i] : null;
    }, g.prototype.restore = function() {
      this._marks.length && (this._i = this._marks.pop());
    };
    function re(c, h2, m) {
      l.call(this, c, h2, m, S.PROPERTY_VALUE_PART_TYPE), this.type = "unknown";
      var a;
      if (/^([+\-]?[\d\.]+)([a-z]+)$/i.test(c))
        switch (this.type = "dimension", this.value = +RegExp.$1, this.units = RegExp.$2, this.units.toLowerCase()) {
          case "em":
          case "rem":
          case "ex":
          case "px":
          case "cm":
          case "mm":
          case "in":
          case "pt":
          case "pc":
          case "ch":
          case "vh":
          case "vw":
          case "vmax":
          case "vmin":
            this.type = "length";
            break;
          case "fr":
            this.type = "grid";
            break;
          case "deg":
          case "rad":
          case "grad":
            this.type = "angle";
            break;
          case "ms":
          case "s":
            this.type = "time";
            break;
          case "hz":
          case "khz":
            this.type = "frequency";
            break;
          case "dpi":
          case "dpcm":
            this.type = "resolution";
            break;
        }
      else
        /^([+\-]?[\d\.]+)%$/i.test(c) ? (this.type = "percentage", this.value = +RegExp.$1) : /^([+\-]?\d+)$/i.test(c) ? (this.type = "integer", this.value = +RegExp.$1) : /^([+\-]?[\d\.]+)$/i.test(c) ? (this.type = "number", this.value = +RegExp.$1) : /^#([a-f0-9]{3,6})/i.test(c) ? (this.type = "color", a = RegExp.$1, a.length === 3 ? (this.red = parseInt(a.charAt(0) + a.charAt(0), 16), this.green = parseInt(a.charAt(1) + a.charAt(1), 16), this.blue = parseInt(a.charAt(2) + a.charAt(2), 16)) : (this.red = parseInt(a.substring(0, 2), 16), this.green = parseInt(a.substring(2, 4), 16), this.blue = parseInt(a.substring(4, 6), 16))) : /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.test(c) ? (this.type = "color", this.red = +RegExp.$1, this.green = +RegExp.$2, this.blue = +RegExp.$3) : /^rgb\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(c) ? (this.type = "color", this.red = +RegExp.$1 * 255 / 100, this.green = +RegExp.$2 * 255 / 100, this.blue = +RegExp.$3 * 255 / 100) : /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d\.]+)\s*\)/i.test(c) ? (this.type = "color", this.red = +RegExp.$1, this.green = +RegExp.$2, this.blue = +RegExp.$3, this.alpha = +RegExp.$4) : /^rgba\(\s*(\d+)%\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(c) ? (this.type = "color", this.red = +RegExp.$1 * 255 / 100, this.green = +RegExp.$2 * 255 / 100, this.blue = +RegExp.$3 * 255 / 100, this.alpha = +RegExp.$4) : /^hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i.test(c) ? (this.type = "color", this.hue = +RegExp.$1, this.saturation = +RegExp.$2 / 100, this.lightness = +RegExp.$3 / 100) : /^hsla\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*,\s*([\d\.]+)\s*\)/i.test(c) ? (this.type = "color", this.hue = +RegExp.$1, this.saturation = +RegExp.$2 / 100, this.lightness = +RegExp.$3 / 100, this.alpha = +RegExp.$4) : /^url\(["']?([^\)"']+)["']?\)/i.test(c) ? (this.type = "uri", this.uri = RegExp.$1) : /^([^\(]+)\(/i.test(c) ? (this.type = "function", this.name = RegExp.$1, this.value = c) : /^"([^\n\r\f\\"]|\\\r\n|\\[^\r0-9a-f]|\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?)*"/i.test(c) ? (this.type = "string", this.value = re.parseString(c)) : /^'([^\n\r\f\\']|\\\r\n|\\[^\r0-9a-f]|\\[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?)*'/i.test(c) ? (this.type = "string", this.value = re.parseString(c)) : f[c.toLowerCase()] ? (this.type = "color", a = f[c.toLowerCase()].substring(1), this.red = parseInt(a.substring(0, 2), 16), this.green = parseInt(a.substring(2, 4), 16), this.blue = parseInt(a.substring(4, 6), 16)) : /^[\,\/]$/.test(c) ? (this.type = "operator", this.value = c) : /^[a-z\-_\u0080-\uFFFF][a-z0-9\-_\u0080-\uFFFF]*$/i.test(c) && (this.type = "identifier", this.value = c);
    }
    re.prototype = new l(), re.prototype.constructor = re, re.parseString = function(c) {
      c = c.slice(1, -1);
      var h2 = function(m, a) {
        if (/^(\n|\r\n|\r|\f)$/.test(a))
          return "";
        var o = /^[0-9a-f]{1,6}/i.exec(a);
        if (o) {
          var u = parseInt(o[0], 16);
          return String.fromCodePoint ? String.fromCodePoint(u) : String.fromCharCode(u);
        }
        return a;
      };
      return c.replace(/\\(\r\n|[^\r0-9a-f]|[0-9a-f]{1,6}(\r\n|[ \n\r\t\f])?)/ig, h2);
    }, re.serializeString = function(c) {
      var h2 = function(m, a) {
        if (a === '"')
          return "\\" + a;
        var o = String.codePointAt ? String.codePointAt(0) : String.charCodeAt(0);
        return "\\" + o.toString(16) + " ";
      };
      return '"' + c.replace(/["\r\n\f]/g, h2) + '"';
    }, re.fromToken = function(c) {
      return new re(c.value, c.startLine, c.startCol);
    };
    var $2 = { __proto__: null, ":first-letter": 1, ":first-line": 1, ":before": 1, ":after": 1 };
    $2.ELEMENT = 1, $2.CLASS = 2, $2.isElement = function(c) {
      return c.indexOf("::") === 0 || $2[c.toLowerCase()] === $2.ELEMENT;
    };
    function V(c, h2, m) {
      l.call(this, c.join(" "), h2, m, S.SELECTOR_TYPE), this.parts = c, this.specificity = ie.calculate(this);
    }
    V.prototype = new l(), V.prototype.constructor = V;
    function ve(c, h2, m, a, o) {
      l.call(this, m, a, o, S.SELECTOR_PART_TYPE), this.elementName = c, this.modifiers = h2;
    }
    ve.prototype = new l(), ve.prototype.constructor = ve;
    function U(c, h2, m, a) {
      l.call(this, c, m, a, S.SELECTOR_SUB_PART_TYPE), this.type = h2, this.args = [];
    }
    U.prototype = new l(), U.prototype.constructor = U;
    function ie(c, h2, m, a) {
      this.a = c, this.b = h2, this.c = m, this.d = a;
    }
    ie.prototype = { constructor: ie, compare: function(c) {
      var h2 = ["a", "b", "c", "d"], m, a;
      for (m = 0, a = h2.length; m < a; m++) {
        if (this[h2[m]] < c[h2[m]])
          return -1;
        if (this[h2[m]] > c[h2[m]])
          return 1;
      }
      return 0;
    }, valueOf: function() {
      return this.a * 1e3 + this.b * 100 + this.c * 10 + this.d;
    }, toString: function() {
      return this.a + "," + this.b + "," + this.c + "," + this.d;
    } }, ie.calculate = function(c) {
      var h2, m, a, o = 0, u = 0, b = 0;
      function T(I) {
        var L, oe, We, dt, He = I.elementName ? I.elementName.text : "", kt;
        for (He && He.charAt(He.length - 1) !== "*" && b++, L = 0, We = I.modifiers.length; L < We; L++)
          switch (kt = I.modifiers[L], kt.type) {
            case "class":
            case "attribute":
              u++;
              break;
            case "id":
              o++;
              break;
            case "pseudo":
              $2.isElement(kt.text) ? b++ : u++;
              break;
            case "not":
              for (oe = 0, dt = kt.args.length; oe < dt; oe++)
                T(kt.args[oe]);
          }
      }
      for (h2 = 0, m = c.parts.length; h2 < m; h2++)
        a = c.parts[h2], a instanceof ve && T(a);
      return new ie(0, o, u, b);
    };
    var be = /^[0-9a-fA-F]$/, ne = /\n|\r\n|\r|\f/;
    function Oe(c) {
      return c !== null && be.test(c);
    }
    function qe(c) {
      return c !== null && /\d/.test(c);
    }
    function Le(c) {
      return c !== null && /\s/.test(c);
    }
    function De(c) {
      return c !== null && ne.test(c);
    }
    function ft(c) {
      return c !== null && /[a-z_\u0080-\uFFFF\\]/i.test(c);
    }
    function k(c) {
      return c !== null && (ft(c) || /[0-9\-\\]/.test(c));
    }
    function Fe(c) {
      return c !== null && (ft(c) || /\-\\/.test(c));
    }
    function je(c, h2) {
      for (var m in h2)
        Object.prototype.hasOwnProperty.call(h2, m) && (c[m] = h2[m]);
      return c;
    }
    function p(c) {
      t.call(this, c, d);
    }
    p.prototype = je(new t(), { _getToken: function(c) {
      var h2, m = this._reader, a = null, o = m.getLine(), u = m.getCol();
      for (h2 = m.read(); h2; ) {
        switch (h2) {
          case "/":
            m.peek() === "*" ? a = this.commentToken(h2, o, u) : a = this.charToken(h2, o, u);
            break;
          case "|":
          case "~":
          case "^":
          case "$":
          case "*":
            m.peek() === "=" ? a = this.comparisonToken(h2, o, u) : a = this.charToken(h2, o, u);
            break;
          case '"':
          case "'":
            a = this.stringToken(h2, o, u);
            break;
          case "#":
            k(m.peek()) ? a = this.hashToken(h2, o, u) : a = this.charToken(h2, o, u);
            break;
          case ".":
            qe(m.peek()) ? a = this.numberToken(h2, o, u) : a = this.charToken(h2, o, u);
            break;
          case "-":
            m.peek() === "-" ? a = this.htmlCommentEndToken(h2, o, u) : ft(m.peek()) ? a = this.identOrFunctionToken(h2, o, u) : a = this.charToken(h2, o, u);
            break;
          case "!":
            a = this.importantToken(h2, o, u);
            break;
          case "@":
            a = this.atRuleToken(h2, o, u);
            break;
          case ":":
            a = this.notToken(h2, o, u);
            break;
          case "<":
            a = this.htmlCommentStartToken(h2, o, u);
            break;
          case "U":
          case "u":
            if (m.peek() === "+") {
              a = this.unicodeRangeToken(h2, o, u);
              break;
            }
          default:
            qe(h2) ? a = this.numberToken(h2, o, u) : Le(h2) ? a = this.whitespaceToken(h2, o, u) : Fe(h2) ? a = this.identOrFunctionToken(h2, o, u) : a = this.charToken(h2, o, u);
        }
        break;
      }
      return !a && h2 === null && (a = this.createToken(d.EOF, null, o, u)), a;
    }, createToken: function(c, h2, m, a, o) {
      var u = this._reader;
      return o = o || {}, { value: h2, type: c, channel: o.channel, endChar: o.endChar, hide: o.hide || false, startLine: m, startCol: a, endLine: u.getLine(), endCol: u.getCol() };
    }, atRuleToken: function(c, h2, m) {
      var a = c, o = this._reader, u = d.CHAR, b;
      return o.mark(), b = this.readName(), a = c + b, u = d.type(a.toLowerCase()), (u === d.CHAR || u === d.UNKNOWN) && (a.length > 1 ? u = d.UNKNOWN_SYM : (u = d.CHAR, a = c, o.reset())), this.createToken(u, a, h2, m);
    }, charToken: function(c, h2, m) {
      var a = d.type(c), o = {};
      return a === -1 ? a = d.CHAR : o.endChar = d[a].endChar, this.createToken(a, c, h2, m, o);
    }, commentToken: function(c, h2, m) {
      var a = this.readComment(c);
      return this.createToken(d.COMMENT, a, h2, m);
    }, comparisonToken: function(c, h2, m) {
      var a = this._reader, o = c + a.read(), u = d.type(o) || d.CHAR;
      return this.createToken(u, o, h2, m);
    }, hashToken: function(c, h2, m) {
      var a = this.readName(c);
      return this.createToken(d.HASH, a, h2, m);
    }, htmlCommentStartToken: function(c, h2, m) {
      var a = this._reader, o = c;
      return a.mark(), o += a.readCount(3), o === "<!--" ? this.createToken(d.CDO, o, h2, m) : (a.reset(), this.charToken(c, h2, m));
    }, htmlCommentEndToken: function(c, h2, m) {
      var a = this._reader, o = c;
      return a.mark(), o += a.readCount(2), o === "-->" ? this.createToken(d.CDC, o, h2, m) : (a.reset(), this.charToken(c, h2, m));
    }, identOrFunctionToken: function(c, h2, m) {
      var a = this._reader, o = this.readName(c), u = d.IDENT, b = ["url(", "url-prefix(", "domain("];
      return a.peek() === "(" ? (o += a.read(), b.indexOf(o.toLowerCase()) > -1 ? (u = d.URI, o = this.readURI(o), b.indexOf(o.toLowerCase()) > -1 && (u = d.FUNCTION)) : u = d.FUNCTION) : a.peek() === ":" && o.toLowerCase() === "progid" && (o += a.readTo("("), u = d.IE_FUNCTION), this.createToken(u, o, h2, m);
    }, importantToken: function(c, h2, m) {
      var a = this._reader, o = c, u = d.CHAR, b, T;
      for (a.mark(), T = a.read(); T; ) {
        if (T === "/") {
          if (a.peek() !== "*")
            break;
          if (b = this.readComment(T), b === "")
            break;
        } else if (Le(T))
          o += T + this.readWhitespace();
        else if (/i/i.test(T)) {
          b = a.readCount(8), /mportant/i.test(b) && (o += T + b, u = d.IMPORTANT_SYM);
          break;
        } else
          break;
        T = a.read();
      }
      return u === d.CHAR ? (a.reset(), this.charToken(c, h2, m)) : this.createToken(u, o, h2, m);
    }, notToken: function(c, h2, m) {
      var a = this._reader, o = c;
      return a.mark(), o += a.readCount(4), o.toLowerCase() === ":not(" ? this.createToken(d.NOT, o, h2, m) : (a.reset(), this.charToken(c, h2, m));
    }, numberToken: function(c, h2, m) {
      var a = this._reader, o = this.readNumber(c), u, b = d.NUMBER, T = a.peek();
      return Fe(T) ? (u = this.readName(a.read()), o += u, /^em$|^ex$|^px$|^gd$|^rem$|^vw$|^vh$|^vmax$|^vmin$|^ch$|^cm$|^mm$|^in$|^pt$|^pc$/i.test(u) ? b = d.LENGTH : /^deg|^rad$|^grad$/i.test(u) ? b = d.ANGLE : /^ms$|^s$/i.test(u) ? b = d.TIME : /^hz$|^khz$/i.test(u) ? b = d.FREQ : /^dpi$|^dpcm$/i.test(u) ? b = d.RESOLUTION : b = d.DIMENSION) : T === "%" && (o += a.read(), b = d.PERCENTAGE), this.createToken(b, o, h2, m);
    }, stringToken: function(c, h2, m) {
      for (var a = c, o = c, u = this._reader, b = c, T = d.STRING, I = u.read(); I && (o += I, !(I === a && b !== "\\")); ) {
        if (De(u.peek()) && I !== "\\") {
          T = d.INVALID;
          break;
        }
        b = I, I = u.read();
      }
      return I === null && (T = d.INVALID), this.createToken(T, o, h2, m);
    }, unicodeRangeToken: function(c, h2, m) {
      var a = this._reader, o = c, u, b = d.CHAR;
      return a.peek() === "+" && (a.mark(), o += a.read(), o += this.readUnicodeRangePart(true), o.length === 2 ? a.reset() : (b = d.UNICODE_RANGE, o.indexOf("?") === -1 && a.peek() === "-" && (a.mark(), u = a.read(), u += this.readUnicodeRangePart(false), u.length === 1 ? a.reset() : o += u))), this.createToken(b, o, h2, m);
    }, whitespaceToken: function(c, h2, m) {
      var a = c + this.readWhitespace();
      return this.createToken(d.S, a, h2, m);
    }, readUnicodeRangePart: function(c) {
      for (var h2 = this._reader, m = "", a = h2.peek(); Oe(a) && m.length < 6; )
        h2.read(), m += a, a = h2.peek();
      if (c)
        for (; a === "?" && m.length < 6; )
          h2.read(), m += a, a = h2.peek();
      return m;
    }, readWhitespace: function() {
      for (var c = this._reader, h2 = "", m = c.peek(); Le(m); )
        c.read(), h2 += m, m = c.peek();
      return h2;
    }, readNumber: function(c) {
      for (var h2 = this._reader, m = c, a = c === ".", o = h2.peek(); o; ) {
        if (qe(o))
          m += h2.read();
        else if (o === ".") {
          if (a)
            break;
          a = true, m += h2.read();
        } else
          break;
        o = h2.peek();
      }
      return m;
    }, readString: function() {
      for (var c = this._reader, h2 = c.read(), m = h2, a = h2, o = c.peek(); o && (o = c.read(), m += o, !(o === h2 && a !== "\\")); ) {
        if (De(c.peek()) && o !== "\\") {
          m = "";
          break;
        }
        a = o, o = c.peek();
      }
      return o === null && (m = ""), m;
    }, readURI: function(c) {
      var h2 = this._reader, m = c, a = "", o = h2.peek();
      for (h2.mark(); o && Le(o); )
        h2.read(), o = h2.peek();
      for (o === "'" || o === '"' ? a = this.readString() : a = this.readURL(), o = h2.peek(); o && Le(o); )
        h2.read(), o = h2.peek();
      return a === "" || o !== ")" ? (m = c, h2.reset()) : m += a + h2.read(), m;
    }, readURL: function() {
      for (var c = this._reader, h2 = "", m = c.peek(); /^[!#$%&\\*-~]$/.test(m); )
        h2 += c.read(), m = c.peek();
      return h2;
    }, readName: function(c) {
      for (var h2 = this._reader, m = c || "", a = h2.peek(); ; )
        if (a === "\\")
          m += this.readEscape(h2.read()), a = h2.peek();
        else if (a && k(a))
          m += h2.read(), a = h2.peek();
        else
          break;
      return m;
    }, readEscape: function(c) {
      var h2 = this._reader, m = c || "", a = 0, o = h2.peek();
      if (Oe(o))
        do
          m += h2.read(), o = h2.peek();
        while (o && Oe(o) && ++a < 6);
      return m.length === 3 && /\s/.test(o) || m.length === 7 || m.length === 1 ? h2.read() : o = "", m + o;
    }, readComment: function(c) {
      var h2 = this._reader, m = c || "", a = h2.read();
      if (a === "*") {
        for (; a; ) {
          if (m += a, m.length > 2 && a === "*" && h2.peek() === "/") {
            m += h2.read();
            break;
          }
          a = h2.read();
        }
        return m;
      } else
        return "";
    } });
    var d = [{ name: "CDO" }, { name: "CDC" }, { name: "S", whitespace: true }, { name: "COMMENT", comment: true, hide: true, channel: "comment" }, { name: "INCLUDES", text: "~=" }, { name: "DASHMATCH", text: "|=" }, { name: "PREFIXMATCH", text: "^=" }, { name: "SUFFIXMATCH", text: "$=" }, { name: "SUBSTRINGMATCH", text: "*=" }, { name: "STRING" }, { name: "IDENT" }, { name: "HASH" }, { name: "IMPORT_SYM", text: "@import" }, { name: "PAGE_SYM", text: "@page" }, { name: "MEDIA_SYM", text: "@media" }, { name: "FONT_FACE_SYM", text: "@font-face" }, { name: "CHARSET_SYM", text: "@charset" }, { name: "NAMESPACE_SYM", text: "@namespace" }, { name: "VIEWPORT_SYM", text: ["@viewport", "@-ms-viewport", "@-o-viewport"] }, { name: "DOCUMENT_SYM", text: ["@document", "@-moz-document"] }, { name: "UNKNOWN_SYM" }, { name: "KEYFRAMES_SYM", text: ["@keyframes", "@-webkit-keyframes", "@-moz-keyframes", "@-o-keyframes"] }, { name: "IMPORTANT_SYM" }, { name: "LENGTH" }, { name: "ANGLE" }, { name: "TIME" }, { name: "FREQ" }, { name: "DIMENSION" }, { name: "PERCENTAGE" }, { name: "NUMBER" }, { name: "URI" }, { name: "FUNCTION" }, { name: "UNICODE_RANGE" }, { name: "INVALID" }, { name: "PLUS", text: "+" }, { name: "GREATER", text: ">" }, { name: "COMMA", text: "," }, { name: "TILDE", text: "~" }, { name: "NOT" }, { name: "TOPLEFTCORNER_SYM", text: "@top-left-corner" }, { name: "TOPLEFT_SYM", text: "@top-left" }, { name: "TOPCENTER_SYM", text: "@top-center" }, { name: "TOPRIGHT_SYM", text: "@top-right" }, { name: "TOPRIGHTCORNER_SYM", text: "@top-right-corner" }, { name: "BOTTOMLEFTCORNER_SYM", text: "@bottom-left-corner" }, { name: "BOTTOMLEFT_SYM", text: "@bottom-left" }, { name: "BOTTOMCENTER_SYM", text: "@bottom-center" }, { name: "BOTTOMRIGHT_SYM", text: "@bottom-right" }, { name: "BOTTOMRIGHTCORNER_SYM", text: "@bottom-right-corner" }, { name: "LEFTTOP_SYM", text: "@left-top" }, { name: "LEFTMIDDLE_SYM", text: "@left-middle" }, { name: "LEFTBOTTOM_SYM", text: "@left-bottom" }, { name: "RIGHTTOP_SYM", text: "@right-top" }, { name: "RIGHTMIDDLE_SYM", text: "@right-middle" }, { name: "RIGHTBOTTOM_SYM", text: "@right-bottom" }, { name: "RESOLUTION", state: "media" }, { name: "IE_FUNCTION" }, { name: "CHAR" }, { name: "PIPE", text: "|" }, { name: "SLASH", text: "/" }, { name: "MINUS", text: "-" }, { name: "STAR", text: "*" }, { name: "LBRACE", endChar: "}", text: "{" }, { name: "RBRACE", text: "}" }, { name: "LBRACKET", endChar: "]", text: "[" }, { name: "RBRACKET", text: "]" }, { name: "EQUALS", text: "=" }, { name: "COLON", text: ":" }, { name: "SEMICOLON", text: ";" }, { name: "LPAREN", endChar: ")", text: "(" }, { name: "RPAREN", text: ")" }, { name: "DOT", text: "." }];
    (function() {
      var c = [], h2 = Object.create(null);
      d.UNKNOWN = -1, d.unshift({ name: "EOF" });
      for (var m = 0, a = d.length; m < a; m++)
        if (c.push(d[m].name), d[d[m].name] = m, d[m].text)
          if (d[m].text instanceof Array)
            for (var o = 0; o < d[m].text.length; o++)
              h2[d[m].text[o]] = m;
          else
            h2[d[m].text] = m;
      d.name = function(u) {
        return c[u];
      }, d.type = function(u) {
        return h2[u] || -1;
      };
    })();
    var Xe = { validate: function(c, h2) {
      var m = c.toString().toLowerCase(), a = new g(h2), o = D[m];
      if (o)
        typeof o != "number" && (typeof o == "string" ? o.indexOf("||") > -1 ? this.groupProperty(o, a) : this.singleProperty(o, a, 1) : o.multi ? this.multiProperty(o.multi, a, o.comma, o.max || 1 / 0) : typeof o == "function" && o(a));
      else if (m.indexOf("-") !== 0)
        throw new se("Unknown property '" + c + "'.", c.line, c.col);
    }, singleProperty: function(c, h2, m, a) {
      for (var o = false, u = h2.value, b = 0, T; h2.hasNext() && b < m && (o = A.isAny(h2, c), !!o); )
        b++;
      if (o) {
        if (h2.hasNext())
          throw T = h2.next(), new se("Expected end of value but found '" + T + "'.", T.line, T.col);
      } else
        throw h2.hasNext() && !h2.isFirst() ? (T = h2.peek(), new se("Expected end of value but found '" + T + "'.", T.line, T.col)) : new se("Expected (" + c + ") but found '" + u + "'.", u.line, u.col);
    }, multiProperty: function(c, h2, m, a) {
      for (var o = false, u = h2.value, b = 0, T; h2.hasNext() && !o && b < a && A.isAny(h2, c); )
        if (b++, !h2.hasNext())
          o = true;
        else if (m)
          if (String(h2.peek()) === ",")
            T = h2.next();
          else
            break;
      if (o) {
        if (h2.hasNext())
          throw T = h2.next(), new se("Expected end of value but found '" + T + "'.", T.line, T.col);
      } else
        throw h2.hasNext() && !h2.isFirst() ? (T = h2.peek(), new se("Expected end of value but found '" + T + "'.", T.line, T.col)) : (T = h2.previous(), m && String(T) === "," ? new se("Expected end of value but found '" + T + "'.", T.line, T.col) : new se("Expected (" + c + ") but found '" + u + "'.", u.line, u.col));
    }, groupProperty: function(c, h2, m) {
      for (var a = false, o = h2.value, u = c.split("||").length, b = { count: 0 }, T = false, I, L; h2.hasNext() && !a && (I = A.isAnyOfGroup(h2, c), I); ) {
        if (b[I])
          break;
        b[I] = 1, b.count++, T = true, (b.count === u || !h2.hasNext()) && (a = true);
      }
      if (a) {
        if (h2.hasNext())
          throw L = h2.next(), new se("Expected end of value but found '" + L + "'.", L.line, L.col);
      } else
        throw T && h2.hasNext() ? (L = h2.peek(), new se("Expected end of value but found '" + L + "'.", L.line, L.col)) : new se("Expected (" + c + ") but found '" + o + "'.", o.line, o.col);
    } };
    function se(c, h2, m) {
      this.col = m, this.line = h2, this.message = c;
    }
    se.prototype = new Error();
    var A = { isLiteral: function(c, h2) {
      var m = c.text.toString().toLowerCase(), a = h2.split(" | "), o, u, b = false;
      for (o = 0, u = a.length; o < u && !b; o++)
        m === a[o].toLowerCase() && (b = true);
      return b;
    }, isSimple: function(c) {
      return !!this.simple[c];
    }, isComplex: function(c) {
      return !!this.complex[c];
    }, isAny: function(c, h2) {
      var m = h2.split(" | "), a, o, u = false;
      for (a = 0, o = m.length; a < o && !u && c.hasNext(); a++)
        u = this.isType(c, m[a]);
      return u;
    }, isAnyOfGroup: function(c, h2) {
      var m = h2.split(" || "), a, o, u = false;
      for (a = 0, o = m.length; a < o && !u; a++)
        u = this.isType(c, m[a]);
      return u ? m[a - 1] : false;
    }, isType: function(c, h2) {
      var m = c.peek(), a = false;
      return h2.charAt(0) !== "<" ? (a = this.isLiteral(m, h2), a && c.next()) : this.simple[h2] ? (a = this.simple[h2](m), a && c.next()) : a = this.complex[h2](c), a;
    }, simple: { __proto__: null, "<absolute-size>": function(c) {
      return A.isLiteral(c, "xx-small | x-small | small | medium | large | x-large | xx-large");
    }, "<attachment>": function(c) {
      return A.isLiteral(c, "scroll | fixed | local");
    }, "<attr>": function(c) {
      return c.type === "function" && c.name === "attr";
    }, "<bg-image>": function(c) {
      return this["<image>"](c) || this["<gradient>"](c) || String(c) === "none";
    }, "<gradient>": function(c) {
      return c.type === "function" && /^(?:\-(?:ms|moz|o|webkit)\-)?(?:repeating\-)?(?:radial\-|linear\-)?gradient/i.test(c);
    }, "<box>": function(c) {
      return A.isLiteral(c, "padding-box | border-box | content-box");
    }, "<content>": function(c) {
      return c.type === "function" && c.name === "content";
    }, "<relative-size>": function(c) {
      return A.isLiteral(c, "smaller | larger");
    }, "<ident>": function(c) {
      return c.type === "identifier";
    }, "<length>": function(c) {
      return c.type === "function" && /^(?:\-(?:ms|moz|o|webkit)\-)?calc/i.test(c) ? true : c.type === "length" || c.type === "number" || c.type === "integer" || String(c) === "0";
    }, "<color>": function(c) {
      return c.type === "color" || String(c) === "transparent" || String(c) === "currentColor";
    }, "<number>": function(c) {
      return c.type === "number" || this["<integer>"](c);
    }, "<integer>": function(c) {
      return c.type === "integer";
    }, "<line>": function(c) {
      return c.type === "integer";
    }, "<angle>": function(c) {
      return c.type === "angle";
    }, "<uri>": function(c) {
      return c.type === "uri";
    }, "<image>": function(c) {
      return this["<uri>"](c);
    }, "<percentage>": function(c) {
      return c.type === "percentage" || String(c) === "0";
    }, "<border-width>": function(c) {
      return this["<length>"](c) || A.isLiteral(c, "thin | medium | thick");
    }, "<border-style>": function(c) {
      return A.isLiteral(c, "none | hidden | dotted | dashed | solid | double | groove | ridge | inset | outset");
    }, "<content-sizing>": function(c) {
      return A.isLiteral(c, "fill-available | -moz-available | -webkit-fill-available | max-content | -moz-max-content | -webkit-max-content | min-content | -moz-min-content | -webkit-min-content | fit-content | -moz-fit-content | -webkit-fit-content");
    }, "<margin-width>": function(c) {
      return this["<length>"](c) || this["<percentage>"](c) || A.isLiteral(c, "auto");
    }, "<padding-width>": function(c) {
      return this["<length>"](c) || this["<percentage>"](c);
    }, "<shape>": function(c) {
      return c.type === "function" && (c.name === "rect" || c.name === "inset-rect");
    }, "<time>": function(c) {
      return c.type === "time";
    }, "<flex-grow>": function(c) {
      return this["<number>"](c);
    }, "<flex-shrink>": function(c) {
      return this["<number>"](c);
    }, "<width>": function(c) {
      return this["<margin-width>"](c);
    }, "<flex-basis>": function(c) {
      return this["<width>"](c);
    }, "<flex-direction>": function(c) {
      return A.isLiteral(c, "row | row-reverse | column | column-reverse");
    }, "<flex-wrap>": function(c) {
      return A.isLiteral(c, "nowrap | wrap | wrap-reverse");
    }, "<feature-tag-value>": function(c) {
      return c.type === "function" && /^[A-Z0-9]{4}$/i.test(c);
    } }, complex: { __proto__: null, "<bg-position>": function(c) {
      for (var h2 = false, m = "<percentage> | <length>", a = "left | right", o = "top | bottom", u = 0; c.peek(u) && c.peek(u).text !== ","; )
        u++;
      return u < 3 ? A.isAny(c, a + " | center | " + m) ? (h2 = true, A.isAny(c, o + " | center | " + m)) : A.isAny(c, o) && (h2 = true, A.isAny(c, a + " | center")) : A.isAny(c, a) ? A.isAny(c, o) ? (h2 = true, A.isAny(c, m)) : A.isAny(c, m) && (A.isAny(c, o) ? (h2 = true, A.isAny(c, m)) : A.isAny(c, "center") && (h2 = true)) : A.isAny(c, o) ? A.isAny(c, a) ? (h2 = true, A.isAny(c, m)) : A.isAny(c, m) && (A.isAny(c, a) ? (h2 = true, A.isAny(c, m)) : A.isAny(c, "center") && (h2 = true)) : A.isAny(c, "center") && A.isAny(c, a + " | " + o) && (h2 = true, A.isAny(c, m)), h2;
    }, "<bg-size>": function(c) {
      var h2 = false, m = "<percentage> | <length> | auto";
      return A.isAny(c, "cover | contain") ? h2 = true : A.isAny(c, m) && (h2 = true, A.isAny(c, m)), h2;
    }, "<repeat-style>": function(c) {
      var h2 = false, m = "repeat | space | round | no-repeat", a;
      return c.hasNext() && (a = c.next(), A.isLiteral(a, "repeat-x | repeat-y") ? h2 = true : A.isLiteral(a, m) && (h2 = true, c.hasNext() && A.isLiteral(c.peek(), m) && c.next())), h2;
    }, "<shadow>": function(c) {
      var h2 = false, m = 0, a = false, o = false;
      if (c.hasNext()) {
        for (A.isAny(c, "inset") && (a = true), A.isAny(c, "<color>") && (o = true); A.isAny(c, "<length>") && m < 4; )
          m++;
        c.hasNext() && (o || A.isAny(c, "<color>"), a || A.isAny(c, "inset")), h2 = m >= 2 && m <= 4;
      }
      return h2;
    }, "<x-one-radius>": function(c) {
      var h2 = false, m = "<length> | <percentage> | inherit";
      return A.isAny(c, m) && (h2 = true, A.isAny(c, m)), h2;
    }, "<flex>": function(c) {
      var h2, m = false;
      if (A.isAny(c, "none | inherit") ? m = true : A.isType(c, "<flex-grow>") ? c.peek() ? A.isType(c, "<flex-shrink>") ? c.peek() ? m = A.isType(c, "<flex-basis>") : m = true : A.isType(c, "<flex-basis>") && (m = c.peek() === null) : m = true : A.isType(c, "<flex-basis>") && (m = true), !m)
        throw h2 = c.peek(), new se("Expected (none | [ <flex-grow> <flex-shrink>? || <flex-basis> ]) but found '" + c.value.text + "'.", h2.line, h2.col);
      return m;
    } } };
    ct.css = { __proto__: null, Colors: f, Combinator: _, Parser: S, PropertyName: ae, PropertyValue: ce, PropertyValuePart: re, MediaFeature: y, MediaQuery: w, Selector: V, SelectorPart: ve, SelectorSubPart: U, Specificity: ie, TokenStream: p, Tokens: d, ValidationError: se };
  })();
  (function() {
    for (var e in ct)
      go[e] = ct[e];
  })();
});
var pn = O((nd, yo) => {
  var s0 = bo();
  yo.exports = yr;
  function yr(e) {
    this._element = e;
  }
  function _o(e) {
    var t = new s0.css.Parser(), r = { property: Object.create(null), priority: Object.create(null) };
    return t.addListener("property", function(n) {
      n.invalid || (r.property[n.property.text] = n.value.text, n.important && (r.priority[n.property.text] = "important"));
    }), e = ("" + e).replace(/^;/, ""), t.parseStyleAttribute(e), r;
  }
  var Qt = {};
  yr.prototype = Object.create(Object.prototype, { _parsed: { get: function() {
    if (!this._parsedStyles || this.cssText !== this._lastParsedText) {
      var e = this.cssText;
      this._parsedStyles = _o(e), this._lastParsedText = e, delete this._names;
    }
    return this._parsedStyles;
  } }, _serialize: { value: function() {
    var e = this._parsed, t = "";
    for (var r in e.property)
      t && (t += " "), t += r + ": " + e.property[r], e.priority[r] && (t += " !" + e.priority[r]), t += ";";
    this.cssText = t, this._lastParsedText = t, delete this._names;
  } }, cssText: { get: function() {
    return this._element.getAttribute("style");
  }, set: function(e) {
    this._element.setAttribute("style", e);
  } }, length: { get: function() {
    return this._names || (this._names = Object.getOwnPropertyNames(this._parsed.property)), this._names.length;
  } }, item: { value: function(e) {
    return this._names || (this._names = Object.getOwnPropertyNames(this._parsed.property)), this._names[e];
  } }, getPropertyValue: { value: function(e) {
    return e = e.toLowerCase(), this._parsed.property[e] || "";
  } }, getPropertyPriority: { value: function(e) {
    return e = e.toLowerCase(), this._parsed.priority[e] || "";
  } }, setProperty: { value: function(e, t, r) {
    if (e = e.toLowerCase(), t == null && (t = ""), r == null && (r = ""), t !== Qt && (t = "" + t), t === "") {
      this.removeProperty(e);
      return;
    }
    if (!(r !== "" && r !== Qt && !/^important$/i.test(r))) {
      var n = this._parsed;
      if (t === Qt) {
        if (!n.property[e])
          return;
        r !== "" ? n.priority[e] = "important" : delete n.priority[e];
      } else {
        if (t.indexOf(";") !== -1)
          return;
        var l = _o(e + ":" + t);
        if (Object.getOwnPropertyNames(l.property).length === 0 || Object.getOwnPropertyNames(l.priority).length !== 0)
          return;
        for (var f in l.property)
          n.property[f] = l.property[f], r !== Qt && (r !== "" ? n.priority[f] = "important" : n.priority[f] && delete n.priority[f]);
      }
      this._serialize();
    }
  } }, setPropertyValue: { value: function(e, t) {
    return this.setProperty(e, t, Qt);
  } }, setPropertyPriority: { value: function(e, t) {
    return this.setProperty(e, Qt, t);
  } }, removeProperty: { value: function(e) {
    e = e.toLowerCase();
    var t = this._parsed;
    e in t.property && (delete t.property[e], delete t.priority[e], this._serialize());
  } } });
  var Eo = { alignContent: "align-content", alignItems: "align-items", alignmentBaseline: "alignment-baseline", alignSelf: "align-self", animation: "animation", animationDelay: "animation-delay", animationDirection: "animation-direction", animationDuration: "animation-duration", animationFillMode: "animation-fill-mode", animationIterationCount: "animation-iteration-count", animationName: "animation-name", animationPlayState: "animation-play-state", animationTimingFunction: "animation-timing-function", backfaceVisibility: "backface-visibility", background: "background", backgroundAttachment: "background-attachment", backgroundClip: "background-clip", backgroundColor: "background-color", backgroundImage: "background-image", backgroundOrigin: "background-origin", backgroundPosition: "background-position", backgroundPositionX: "background-position-x", backgroundPositionY: "background-position-y", backgroundRepeat: "background-repeat", backgroundSize: "background-size", baselineShift: "baseline-shift", border: "border", borderBottom: "border-bottom", borderBottomColor: "border-bottom-color", borderBottomLeftRadius: "border-bottom-left-radius", borderBottomRightRadius: "border-bottom-right-radius", borderBottomStyle: "border-bottom-style", borderBottomWidth: "border-bottom-width", borderCollapse: "border-collapse", borderColor: "border-color", borderImage: "border-image", borderImageOutset: "border-image-outset", borderImageRepeat: "border-image-repeat", borderImageSlice: "border-image-slice", borderImageSource: "border-image-source", borderImageWidth: "border-image-width", borderLeft: "border-left", borderLeftColor: "border-left-color", borderLeftStyle: "border-left-style", borderLeftWidth: "border-left-width", borderRadius: "border-radius", borderRight: "border-right", borderRightColor: "border-right-color", borderRightStyle: "border-right-style", borderRightWidth: "border-right-width", borderSpacing: "border-spacing", borderStyle: "border-style", borderTop: "border-top", borderTopColor: "border-top-color", borderTopLeftRadius: "border-top-left-radius", borderTopRightRadius: "border-top-right-radius", borderTopStyle: "border-top-style", borderTopWidth: "border-top-width", borderWidth: "border-width", bottom: "bottom", boxShadow: "box-shadow", boxSizing: "box-sizing", breakAfter: "break-after", breakBefore: "break-before", breakInside: "break-inside", captionSide: "caption-side", clear: "clear", clip: "clip", clipPath: "clip-path", clipRule: "clip-rule", color: "color", colorInterpolationFilters: "color-interpolation-filters", columnCount: "column-count", columnFill: "column-fill", columnGap: "column-gap", columnRule: "column-rule", columnRuleColor: "column-rule-color", columnRuleStyle: "column-rule-style", columnRuleWidth: "column-rule-width", columns: "columns", columnSpan: "column-span", columnWidth: "column-width", content: "content", counterIncrement: "counter-increment", counterReset: "counter-reset", cssFloat: "float", cursor: "cursor", direction: "direction", display: "display", dominantBaseline: "dominant-baseline", emptyCells: "empty-cells", enableBackground: "enable-background", fill: "fill", fillOpacity: "fill-opacity", fillRule: "fill-rule", filter: "filter", flex: "flex", flexBasis: "flex-basis", flexDirection: "flex-direction", flexFlow: "flex-flow", flexGrow: "flex-grow", flexShrink: "flex-shrink", flexWrap: "flex-wrap", floodColor: "flood-color", floodOpacity: "flood-opacity", font: "font", fontFamily: "font-family", fontFeatureSettings: "font-feature-settings", fontSize: "font-size", fontSizeAdjust: "font-size-adjust", fontStretch: "font-stretch", fontStyle: "font-style", fontVariant: "font-variant", fontWeight: "font-weight", glyphOrientationHorizontal: "glyph-orientation-horizontal", glyphOrientationVertical: "glyph-orientation-vertical", grid: "grid", gridArea: "grid-area", gridAutoColumns: "grid-auto-columns", gridAutoFlow: "grid-auto-flow", gridAutoRows: "grid-auto-rows", gridColumn: "grid-column", gridColumnEnd: "grid-column-end", gridColumnGap: "grid-column-gap", gridColumnStart: "grid-column-start", gridGap: "grid-gap", gridRow: "grid-row", gridRowEnd: "grid-row-end", gridRowGap: "grid-row-gap", gridRowStart: "grid-row-start", gridTemplate: "grid-template", gridTemplateAreas: "grid-template-areas", gridTemplateColumns: "grid-template-columns", gridTemplateRows: "grid-template-rows", height: "height", imeMode: "ime-mode", justifyContent: "justify-content", kerning: "kerning", layoutGrid: "layout-grid", layoutGridChar: "layout-grid-char", layoutGridLine: "layout-grid-line", layoutGridMode: "layout-grid-mode", layoutGridType: "layout-grid-type", left: "left", letterSpacing: "letter-spacing", lightingColor: "lighting-color", lineBreak: "line-break", lineHeight: "line-height", listStyle: "list-style", listStyleImage: "list-style-image", listStylePosition: "list-style-position", listStyleType: "list-style-type", margin: "margin", marginBottom: "margin-bottom", marginLeft: "margin-left", marginRight: "margin-right", marginTop: "margin-top", marker: "marker", markerEnd: "marker-end", markerMid: "marker-mid", markerStart: "marker-start", mask: "mask", maxHeight: "max-height", maxWidth: "max-width", minHeight: "min-height", minWidth: "min-width", msContentZoomChaining: "-ms-content-zoom-chaining", msContentZooming: "-ms-content-zooming", msContentZoomLimit: "-ms-content-zoom-limit", msContentZoomLimitMax: "-ms-content-zoom-limit-max", msContentZoomLimitMin: "-ms-content-zoom-limit-min", msContentZoomSnap: "-ms-content-zoom-snap", msContentZoomSnapPoints: "-ms-content-zoom-snap-points", msContentZoomSnapType: "-ms-content-zoom-snap-type", msFlowFrom: "-ms-flow-from", msFlowInto: "-ms-flow-into", msFontFeatureSettings: "-ms-font-feature-settings", msGridColumn: "-ms-grid-column", msGridColumnAlign: "-ms-grid-column-align", msGridColumns: "-ms-grid-columns", msGridColumnSpan: "-ms-grid-column-span", msGridRow: "-ms-grid-row", msGridRowAlign: "-ms-grid-row-align", msGridRows: "-ms-grid-rows", msGridRowSpan: "-ms-grid-row-span", msHighContrastAdjust: "-ms-high-contrast-adjust", msHyphenateLimitChars: "-ms-hyphenate-limit-chars", msHyphenateLimitLines: "-ms-hyphenate-limit-lines", msHyphenateLimitZone: "-ms-hyphenate-limit-zone", msHyphens: "-ms-hyphens", msImeAlign: "-ms-ime-align", msOverflowStyle: "-ms-overflow-style", msScrollChaining: "-ms-scroll-chaining", msScrollLimit: "-ms-scroll-limit", msScrollLimitXMax: "-ms-scroll-limit-x-max", msScrollLimitXMin: "-ms-scroll-limit-x-min", msScrollLimitYMax: "-ms-scroll-limit-y-max", msScrollLimitYMin: "-ms-scroll-limit-y-min", msScrollRails: "-ms-scroll-rails", msScrollSnapPointsX: "-ms-scroll-snap-points-x", msScrollSnapPointsY: "-ms-scroll-snap-points-y", msScrollSnapType: "-ms-scroll-snap-type", msScrollSnapX: "-ms-scroll-snap-x", msScrollSnapY: "-ms-scroll-snap-y", msScrollTranslation: "-ms-scroll-translation", msTextCombineHorizontal: "-ms-text-combine-horizontal", msTextSizeAdjust: "-ms-text-size-adjust", msTouchAction: "-ms-touch-action", msTouchSelect: "-ms-touch-select", msUserSelect: "-ms-user-select", msWrapFlow: "-ms-wrap-flow", msWrapMargin: "-ms-wrap-margin", msWrapThrough: "-ms-wrap-through", opacity: "opacity", order: "order", orphans: "orphans", outline: "outline", outlineColor: "outline-color", outlineOffset: "outline-offset", outlineStyle: "outline-style", outlineWidth: "outline-width", overflow: "overflow", overflowX: "overflow-x", overflowY: "overflow-y", padding: "padding", paddingBottom: "padding-bottom", paddingLeft: "padding-left", paddingRight: "padding-right", paddingTop: "padding-top", page: "page", pageBreakAfter: "page-break-after", pageBreakBefore: "page-break-before", pageBreakInside: "page-break-inside", perspective: "perspective", perspectiveOrigin: "perspective-origin", pointerEvents: "pointer-events", position: "position", quotes: "quotes", right: "right", rotate: "rotate", rubyAlign: "ruby-align", rubyOverhang: "ruby-overhang", rubyPosition: "ruby-position", scale: "scale", size: "size", stopColor: "stop-color", stopOpacity: "stop-opacity", stroke: "stroke", strokeDasharray: "stroke-dasharray", strokeDashoffset: "stroke-dashoffset", strokeLinecap: "stroke-linecap", strokeLinejoin: "stroke-linejoin", strokeMiterlimit: "stroke-miterlimit", strokeOpacity: "stroke-opacity", strokeWidth: "stroke-width", tableLayout: "table-layout", textAlign: "text-align", textAlignLast: "text-align-last", textAnchor: "text-anchor", textDecoration: "text-decoration", textIndent: "text-indent", textJustify: "text-justify", textKashida: "text-kashida", textKashidaSpace: "text-kashida-space", textOverflow: "text-overflow", textShadow: "text-shadow", textTransform: "text-transform", textUnderlinePosition: "text-underline-position", top: "top", touchAction: "touch-action", transform: "transform", transformOrigin: "transform-origin", transformStyle: "transform-style", transition: "transition", transitionDelay: "transition-delay", transitionDuration: "transition-duration", transitionProperty: "transition-property", transitionTimingFunction: "transition-timing-function", translate: "translate", unicodeBidi: "unicode-bidi", verticalAlign: "vertical-align", visibility: "visibility", webkitAlignContent: "-webkit-align-content", webkitAlignItems: "-webkit-align-items", webkitAlignSelf: "-webkit-align-self", webkitAnimation: "-webkit-animation", webkitAnimationDelay: "-webkit-animation-delay", webkitAnimationDirection: "-webkit-animation-direction", webkitAnimationDuration: "-webkit-animation-duration", webkitAnimationFillMode: "-webkit-animation-fill-mode", webkitAnimationIterationCount: "-webkit-animation-iteration-count", webkitAnimationName: "-webkit-animation-name", webkitAnimationPlayState: "-webkit-animation-play-state", webkitAnimationTimingFunction: "-webkit-animation-timing-funciton", webkitAppearance: "-webkit-appearance", webkitBackfaceVisibility: "-webkit-backface-visibility", webkitBackgroundClip: "-webkit-background-clip", webkitBackgroundOrigin: "-webkit-background-origin", webkitBackgroundSize: "-webkit-background-size", webkitBorderBottomLeftRadius: "-webkit-border-bottom-left-radius", webkitBorderBottomRightRadius: "-webkit-border-bottom-right-radius", webkitBorderImage: "-webkit-border-image", webkitBorderRadius: "-webkit-border-radius", webkitBorderTopLeftRadius: "-webkit-border-top-left-radius", webkitBorderTopRightRadius: "-webkit-border-top-right-radius", webkitBoxAlign: "-webkit-box-align", webkitBoxDirection: "-webkit-box-direction", webkitBoxFlex: "-webkit-box-flex", webkitBoxOrdinalGroup: "-webkit-box-ordinal-group", webkitBoxOrient: "-webkit-box-orient", webkitBoxPack: "-webkit-box-pack", webkitBoxSizing: "-webkit-box-sizing", webkitColumnBreakAfter: "-webkit-column-break-after", webkitColumnBreakBefore: "-webkit-column-break-before", webkitColumnBreakInside: "-webkit-column-break-inside", webkitColumnCount: "-webkit-column-count", webkitColumnGap: "-webkit-column-gap", webkitColumnRule: "-webkit-column-rule", webkitColumnRuleColor: "-webkit-column-rule-color", webkitColumnRuleStyle: "-webkit-column-rule-style", webkitColumnRuleWidth: "-webkit-column-rule-width", webkitColumns: "-webkit-columns", webkitColumnSpan: "-webkit-column-span", webkitColumnWidth: "-webkit-column-width", webkitFilter: "-webkit-filter", webkitFlex: "-webkit-flex", webkitFlexBasis: "-webkit-flex-basis", webkitFlexDirection: "-webkit-flex-direction", webkitFlexFlow: "-webkit-flex-flow", webkitFlexGrow: "-webkit-flex-grow", webkitFlexShrink: "-webkit-flex-shrink", webkitFlexWrap: "-webkit-flex-wrap", webkitJustifyContent: "-webkit-justify-content", webkitOrder: "-webkit-order", webkitPerspective: "-webkit-perspective-origin", webkitPerspectiveOrigin: "-webkit-perspective-origin", webkitTapHighlightColor: "-webkit-tap-highlight-color", webkitTextFillColor: "-webkit-text-fill-color", webkitTextSizeAdjust: "-webkit-text-size-adjust", webkitTextStroke: "-webkit-text-stroke", webkitTextStrokeColor: "-webkit-text-stroke-color", webkitTextStrokeWidth: "-webkit-text-stroke-width", webkitTransform: "-webkit-transform", webkitTransformOrigin: "-webkit-transform-origin", webkitTransformStyle: "-webkit-transform-style", webkitTransition: "-webkit-transition", webkitTransitionDelay: "-webkit-transition-delay", webkitTransitionDuration: "-webkit-transition-duration", webkitTransitionProperty: "-webkit-transition-property", webkitTransitionTimingFunction: "-webkit-transition-timing-function", webkitUserModify: "-webkit-user-modify", webkitUserSelect: "-webkit-user-select", webkitWritingMode: "-webkit-writing-mode", whiteSpace: "white-space", widows: "widows", width: "width", wordBreak: "word-break", wordSpacing: "word-spacing", wordWrap: "word-wrap", writingMode: "writing-mode", zIndex: "z-index", zoom: "zoom", resize: "resize", userSelect: "user-select" };
  for (vo in Eo)
    o0(vo);
  var vo;
  function o0(e) {
    var t = Eo[e];
    Object.defineProperty(yr.prototype, e, { get: function() {
      return this.getPropertyValue(t);
    }, set: function(r) {
      this.setProperty(t, r);
    } }), yr.prototype.hasOwnProperty(t) || Object.defineProperty(yr.prototype, t, { get: function() {
      return this.getPropertyValue(t);
    }, set: function(r) {
      this.setProperty(t, r);
    } });
  }
});
var $a = O((ad, To) => {
  var Ee = xn();
  To.exports = Tr;
  function Tr() {
  }
  Tr.prototype = Object.create(Object.prototype, { _url: { get: function() {
    return new Ee(this.href);
  } }, protocol: { get: function() {
    var e = this._url;
    return e && e.scheme ? e.scheme + ":" : ":";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && (e = e.replace(/:+$/, ""), e = e.replace(/[^-+\.a-zA-Z0-9]/g, Ee.percentEncode), e.length > 0 && (r.scheme = e, t = r.toString())), this.href = t;
  } }, host: { get: function() {
    var e = this._url;
    return e.isAbsolute() && e.isAuthorityBased() ? e.host + (e.port ? ":" + e.port : "") : "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && r.isAuthorityBased() && (e = e.replace(/[^-+\._~!$&'()*,;:=a-zA-Z0-9]/g, Ee.percentEncode), e.length > 0 && (r.host = e, delete r.port, t = r.toString())), this.href = t;
  } }, hostname: { get: function() {
    var e = this._url;
    return e.isAbsolute() && e.isAuthorityBased() ? e.host : "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && r.isAuthorityBased() && (e = e.replace(/^\/+/, ""), e = e.replace(/[^-+\._~!$&'()*,;:=a-zA-Z0-9]/g, Ee.percentEncode), e.length > 0 && (r.host = e, t = r.toString())), this.href = t;
  } }, port: { get: function() {
    var e = this._url;
    return e.isAbsolute() && e.isAuthorityBased() && e.port !== void 0 ? e.port : "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && r.isAuthorityBased() && (e = "" + e, e = e.replace(/[^0-9].*$/, ""), e = e.replace(/^0+/, ""), e.length === 0 && (e = "0"), parseInt(e, 10) <= 65535 && (r.port = e, t = r.toString())), this.href = t;
  } }, pathname: { get: function() {
    var e = this._url;
    return e.isAbsolute() && e.isHierarchical() ? e.path : "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && r.isHierarchical() && (e.charAt(0) !== "/" && (e = "/" + e), e = e.replace(/[^-+\._~!$&'()*,;:=@\/a-zA-Z0-9]/g, Ee.percentEncode), r.path = e, t = r.toString()), this.href = t;
  } }, search: { get: function() {
    var e = this._url;
    return e.isAbsolute() && e.isHierarchical() && e.query !== void 0 ? "?" + e.query : "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && r.isHierarchical() && (e.charAt(0) === "?" && (e = e.substring(1)), e = e.replace(/[^-+\._~!$&'()*,;:=@\/?a-zA-Z0-9]/g, Ee.percentEncode), r.query = e, t = r.toString()), this.href = t;
  } }, hash: { get: function() {
    var e = this._url;
    return e == null || e.fragment == null || e.fragment === "" ? "" : "#" + e.fragment;
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    e.charAt(0) === "#" && (e = e.substring(1)), e = e.replace(/[^-+\._~!$&'()*,;:=@\/?a-zA-Z0-9]/g, Ee.percentEncode), r.fragment = e, t = r.toString(), this.href = t;
  } }, username: { get: function() {
    var e = this._url;
    return e.username || "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && (e = e.replace(/[\x00-\x1F\x7F-\uFFFF "#<>?`\/@\\:]/g, Ee.percentEncode), r.username = e, t = r.toString()), this.href = t;
  } }, password: { get: function() {
    var e = this._url;
    return e.password || "";
  }, set: function(e) {
    var t = this.href, r = new Ee(t);
    r.isAbsolute() && (e === "" ? r.password = null : (e = e.replace(/[\x00-\x1F\x7F-\uFFFF "#<>?`\/@\\]/g, Ee.percentEncode), r.password = e), t = r.toString()), this.href = t;
  } }, origin: { get: function() {
    var e = this._url;
    if (e == null)
      return "";
    var t = function(r) {
      var n = [e.scheme, e.host, +e.port || r];
      return n[0] + "://" + n[1] + (n[2] === r ? "" : ":" + n[2]);
    };
    switch (e.scheme) {
      case "ftp":
        return t(21);
      case "gopher":
        return t(70);
      case "http":
      case "ws":
        return t(80);
      case "https":
      case "wss":
        return t(443);
      default:
        return e.scheme + "://";
    }
  } } });
  Tr._inherit = function(e) {
    Object.getOwnPropertyNames(Tr.prototype).forEach(function(t) {
      if (!(t === "constructor" || t === "href")) {
        var r = Object.getOwnPropertyDescriptor(Tr.prototype, t);
        Object.defineProperty(e, t, r);
      }
    });
  };
});
var Ka = O((id, wo) => {
  wo.exports = { Window_run: function() {
  }, EventHandlerBuilder_build: function() {
  } };
});
var Xa = O((sd, No) => {
  var ko = pa(), c0 = Ka(), l0 = Qr().isApiWritable;
  No.exports = function(e, t, r, n) {
    var l = e.ctor;
    if (l) {
      var f = e.props || {};
      if (e.attributes)
        for (var _ in e.attributes) {
          var y = e.attributes[_];
          (typeof y != "object" || Array.isArray(y)) && (y = { type: y }), y.name || (y.name = _.toLowerCase()), f[_] = ko.property(y);
        }
      f.constructor = { value: l, writable: l0 }, l.prototype = Object.create((e.superclass || t).prototype, f), e.events && f0(l, e.events), r[e.name] = l;
    } else
      l = t;
    return (e.tags || e.tag && [e.tag] || []).forEach(function(w) {
      n[w] = l;
    }), l;
  };
  function So(e, t, r, n) {
    this.body = e, this.document = t, this.form = r, this.element = n;
  }
  So.prototype.build = c0.EventHandlerBuilder_build;
  function u0(e, t, r, n) {
    var l = e.ownerDocument || Object.create(null), f = e.form || Object.create(null);
    e[t] = new So(n, l, f, e).build();
  }
  function f0(e, t) {
    var r = e.prototype;
    t.forEach(function(n) {
      Object.defineProperty(r, "on" + n, { get: function() {
        return this._getEventHandler(n);
      }, set: function(l) {
        this._setEventHandler(n, l);
      } }), ko.registerChangeHandler(e, "on" + n, u0);
    });
  }
});
var bn = O((gn) => {
  var Qa = Te(), Co = Xt(), d0 = pn(), Ie = he(), Ao = $a(), h0 = Xa(), lt = gn.elements = {}, wr = Object.create(null);
  gn.createElement = function(e, t, r) {
    var n = wr[t] || p0;
    return new n(e, t, r);
  };
  function C(e) {
    return h0(e, M, lt, wr);
  }
  function ge(e) {
    return { get: function() {
      var t = this._getattr(e);
      if (t === null)
        return "";
      var r = this.doc._resolve(t);
      return r === null ? t : r;
    }, set: function(t) {
      this._setattr(e, t);
    } };
  }
  function mn(e) {
    return { get: function() {
      var t = this._getattr(e);
      return t === null ? null : t.toLowerCase() === "use-credentials" ? "use-credentials" : "anonymous";
    }, set: function(t) {
      t == null ? this.removeAttribute(e) : this._setattr(e, t);
    } };
  }
  var kr = { type: ["", "no-referrer", "no-referrer-when-downgrade", "same-origin", "origin", "strict-origin", "origin-when-cross-origin", "strict-origin-when-cross-origin", "unsafe-url"], missing: "" }, x0 = { A: true, LINK: true, BUTTON: true, INPUT: true, SELECT: true, TEXTAREA: true, COMMAND: true }, $e = function(e, t, r) {
    M.call(this, e, t, r), this._form = null;
  }, M = gn.HTMLElement = C({ superclass: Co, name: "HTMLElement", ctor: function(t, r, n) {
    Co.call(this, t, r, Ie.NAMESPACE.HTML, n);
  }, props: { innerHTML: { get: function() {
    return this.serialize();
  }, set: function(e) {
    var t = this.ownerDocument.implementation.mozHTMLParser(this.ownerDocument._address, this);
    t.parse(e === null ? "" : String(e), true);
    for (var r = this instanceof wr.template ? this.content : this; r.hasChildNodes(); )
      r.removeChild(r.firstChild);
    r.appendChild(t._asDocumentFragment());
  } }, style: { get: function() {
    return this._style || (this._style = new d0(this)), this._style;
  }, set: function(e) {
    e == null && (e = ""), this._setattr("style", String(e));
  } }, blur: { value: function() {
  } }, focus: { value: function() {
  } }, forceSpellCheck: { value: function() {
  } }, click: { value: function() {
    if (!this._click_in_progress) {
      this._click_in_progress = true;
      try {
        this._pre_click_activation_steps && this._pre_click_activation_steps();
        var e = this.ownerDocument.createEvent("MouseEvent");
        e.initMouseEvent("click", true, true, this.ownerDocument.defaultView, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        var t = this.dispatchEvent(e);
        t ? this._post_click_activation_steps && this._post_click_activation_steps(e) : this._cancelled_activation_steps && this._cancelled_activation_steps();
      } finally {
        this._click_in_progress = false;
      }
    }
  } }, submit: { value: Ie.nyi } }, attributes: { title: String, lang: String, dir: { type: ["ltr", "rtl", "auto"], missing: "" }, accessKey: String, hidden: Boolean, tabIndex: { type: "long", default: function() {
    return this.tagName in x0 || this.contentEditable ? 0 : -1;
  } } }, events: ["abort", "canplay", "canplaythrough", "change", "click", "contextmenu", "cuechange", "dblclick", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "input", "invalid", "keydown", "keypress", "keyup", "loadeddata", "loadedmetadata", "loadstart", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "pause", "play", "playing", "progress", "ratechange", "readystatechange", "reset", "seeked", "seeking", "select", "show", "stalled", "submit", "suspend", "timeupdate", "volumechange", "waiting", "blur", "error", "focus", "load", "scroll"] }), p0 = C({ name: "HTMLUnknownElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } }), Ke = { form: { get: function() {
    return this._form;
  } } };
  C({ tag: "a", name: "HTMLAnchorElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { _post_click_activation_steps: { value: function(e) {
    this.href && (this.ownerDocument.defaultView.location = this.href);
  } } }, attributes: { href: ge, ping: String, download: String, target: String, rel: String, media: String, hreflang: String, type: String, referrerPolicy: kr, coords: String, charset: String, name: String, rev: String, shape: String } });
  Ao._inherit(wr.a.prototype);
  C({ tag: "area", name: "HTMLAreaElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { alt: String, target: String, download: String, rel: String, media: String, href: ge, hreflang: String, type: String, shape: String, coords: String, ping: String, referrerPolicy: kr, noHref: Boolean } });
  Ao._inherit(wr.area.prototype);
  C({ tag: "br", name: "HTMLBRElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { clear: String } });
  C({ tag: "base", name: "HTMLBaseElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { target: String } });
  C({ tag: "body", name: "HTMLBodyElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, events: ["afterprint", "beforeprint", "beforeunload", "blur", "error", "focus", "hashchange", "load", "message", "offline", "online", "pagehide", "pageshow", "popstate", "resize", "scroll", "storage", "unload"], attributes: { text: { type: String, treatNullAsEmptyString: true }, link: { type: String, treatNullAsEmptyString: true }, vLink: { type: String, treatNullAsEmptyString: true }, aLink: { type: String, treatNullAsEmptyString: true }, bgColor: { type: String, treatNullAsEmptyString: true }, background: String } });
  C({ tag: "button", name: "HTMLButtonElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { name: String, value: String, disabled: Boolean, autofocus: Boolean, type: { type: ["submit", "reset", "button", "menu"], missing: "submit" }, formTarget: String, formNoValidate: Boolean, formMethod: { type: ["get", "post", "dialog"], invalid: "get", missing: "" }, formEnctype: { type: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], invalid: "application/x-www-form-urlencoded", missing: "" } } });
  C({ tag: "dl", name: "HTMLDListElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { compact: Boolean } });
  C({ tag: "data", name: "HTMLDataElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { value: String } });
  C({ tag: "datalist", name: "HTMLDataListElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } });
  C({ tag: "details", name: "HTMLDetailsElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { open: Boolean } });
  C({ tag: "div", name: "HTMLDivElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String } });
  C({ tag: "embed", name: "HTMLEmbedElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { src: ge, type: String, width: String, height: String, align: String, name: String } });
  C({ tag: "fieldset", name: "HTMLFieldSetElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { disabled: Boolean, name: String } });
  C({ tag: "form", name: "HTMLFormElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { action: String, autocomplete: { type: ["on", "off"], missing: "on" }, name: String, acceptCharset: { name: "accept-charset" }, target: String, noValidate: Boolean, method: { type: ["get", "post", "dialog"], invalid: "get", missing: "get" }, enctype: { type: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], invalid: "application/x-www-form-urlencoded", missing: "application/x-www-form-urlencoded" }, encoding: { name: "enctype", type: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], invalid: "application/x-www-form-urlencoded", missing: "application/x-www-form-urlencoded" } } });
  C({ tag: "hr", name: "HTMLHRElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String, color: String, noShade: Boolean, size: String, width: String } });
  C({ tag: "head", name: "HTMLHeadElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } });
  C({ tags: ["h1", "h2", "h3", "h4", "h5", "h6"], name: "HTMLHeadingElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String } });
  C({ tag: "html", name: "HTMLHtmlElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { version: String } });
  C({ tag: "iframe", name: "HTMLIFrameElement", ctor: function(t, r, n) {
    M.call(this, t, r, n), this._contentWindow = new Window();
  }, props: { contentWindow: { get: function() {
    return this._contentWindow;
  } }, contentDocument: { get: function() {
    return this.contentWindow.document;
  } } }, attributes: { src: ge, srcdoc: String, name: String, width: String, height: String, seamless: Boolean, allowFullscreen: Boolean, allowUserMedia: Boolean, allowPaymentRequest: Boolean, referrerPolicy: kr, align: String, scrolling: String, frameBorder: String, longDesc: ge, marginHeight: { type: String, treatNullAsEmptyString: true }, marginWidth: { type: String, treatNullAsEmptyString: true } } });
  C({ tag: "img", name: "HTMLImageElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { alt: String, src: ge, srcset: String, crossOrigin: mn, useMap: String, isMap: Boolean, height: { type: "unsigned long", default: 0 }, width: { type: "unsigned long", default: 0 }, referrerPolicy: kr, name: String, lowsrc: ge, align: String, hspace: { type: "unsigned long", default: 0 }, vspace: { type: "unsigned long", default: 0 }, longDesc: ge, border: { type: String, treatNullAsEmptyString: true } } });
  C({ tag: "input", name: "HTMLInputElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: { form: Ke.form, _post_click_activation_steps: { value: function(e) {
    if (this.type === "checkbox")
      this.checked = !this.checked;
    else if (this.type === "radio")
      for (var t = this.form.getElementsByName(this.name), r = t.length - 1; r >= 0; r--) {
        var n = t[r];
        n.checked = n === this;
      }
  } } }, attributes: { name: String, disabled: Boolean, autofocus: Boolean, accept: String, alt: String, max: String, min: String, pattern: String, placeholder: String, step: String, dirName: String, defaultValue: { name: "value" }, multiple: Boolean, required: Boolean, readOnly: Boolean, checked: Boolean, value: String, src: ge, defaultChecked: { name: "checked", type: Boolean }, size: { type: "unsigned long", default: 20, min: 1, setmin: 1 }, width: { type: "unsigned long", min: 0, setmin: 0, default: 0 }, height: { type: "unsigned long", min: 0, setmin: 0, default: 0 }, minLength: { type: "unsigned long", min: 0, setmin: 0, default: -1 }, maxLength: { type: "unsigned long", min: 0, setmin: 0, default: -1 }, autocomplete: String, type: { type: ["text", "hidden", "search", "tel", "url", "email", "password", "datetime", "date", "month", "week", "time", "datetime-local", "number", "range", "color", "checkbox", "radio", "file", "submit", "image", "reset", "button"], missing: "text" }, formTarget: String, formNoValidate: Boolean, formMethod: { type: ["get", "post"], invalid: "get", missing: "" }, formEnctype: { type: ["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"], invalid: "application/x-www-form-urlencoded", missing: "" }, inputMode: { type: ["verbatim", "latin", "latin-name", "latin-prose", "full-width-latin", "kana", "kana-name", "katakana", "numeric", "tel", "email", "url"], missing: "" }, align: String, useMap: String } });
  C({ tag: "keygen", name: "HTMLKeygenElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { name: String, disabled: Boolean, autofocus: Boolean, challenge: String, keytype: { type: ["rsa"], missing: "" } } });
  C({ tag: "li", name: "HTMLLIElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { value: { type: "long", default: 0 }, type: String } });
  C({ tag: "label", name: "HTMLLabelElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { htmlFor: { name: "for", type: String } } });
  C({ tag: "legend", name: "HTMLLegendElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String } });
  C({ tag: "link", name: "HTMLLinkElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { href: ge, rel: String, media: String, hreflang: String, type: String, crossOrigin: mn, nonce: String, integrity: String, referrerPolicy: kr, charset: String, rev: String, target: String } });
  C({ tag: "map", name: "HTMLMapElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { name: String } });
  C({ tag: "menu", name: "HTMLMenuElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { type: { type: ["context", "popup", "toolbar"], missing: "toolbar" }, label: String, compact: Boolean } });
  C({ tag: "meta", name: "HTMLMetaElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { name: String, content: String, httpEquiv: { name: "http-equiv", type: String }, scheme: String } });
  C({ tag: "meter", name: "HTMLMeterElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke });
  C({ tags: ["ins", "del"], name: "HTMLModElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { cite: ge, dateTime: String } });
  C({ tag: "ol", name: "HTMLOListElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { _numitems: { get: function() {
    var e = 0;
    return this.childNodes.forEach(function(t) {
      t.nodeType === Qa.ELEMENT_NODE && t.tagName === "LI" && e++;
    }), e;
  } } }, attributes: { type: String, reversed: Boolean, start: { type: "long", default: function() {
    return this.reversed ? this._numitems : 1;
  } }, compact: Boolean } });
  C({ tag: "object", name: "HTMLObjectElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { data: ge, type: String, name: String, useMap: String, typeMustMatch: Boolean, width: String, height: String, align: String, archive: String, code: String, declare: Boolean, hspace: { type: "unsigned long", default: 0 }, standby: String, vspace: { type: "unsigned long", default: 0 }, codeBase: ge, codeType: String, border: { type: String, treatNullAsEmptyString: true } } });
  C({ tag: "optgroup", name: "HTMLOptGroupElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { disabled: Boolean, label: String } });
  C({ tag: "option", name: "HTMLOptionElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { form: { get: function() {
    for (var e = this.parentNode; e && e.nodeType === Qa.ELEMENT_NODE; ) {
      if (e.localName === "select")
        return e.form;
      e = e.parentNode;
    }
  } }, value: { get: function() {
    return this._getattr("value") || this.text;
  }, set: function(e) {
    this._setattr("value", e);
  } }, text: { get: function() {
    return this.textContent.replace(/[ \t\n\f\r]+/g, " ").trim();
  }, set: function(e) {
    this.textContent = e;
  } } }, attributes: { disabled: Boolean, defaultSelected: { name: "selected", type: Boolean }, label: String } });
  C({ tag: "output", name: "HTMLOutputElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { name: String } });
  C({ tag: "p", name: "HTMLParagraphElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String } });
  C({ tag: "param", name: "HTMLParamElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { name: String, value: String, type: String, valueType: String } });
  C({ tags: ["pre", "listing", "xmp"], name: "HTMLPreElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { width: { type: "long", default: 0 } } });
  C({ tag: "progress", name: "HTMLProgressElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: Ke, attributes: { max: { type: Number, float: true, default: 1, min: 0 } } });
  C({ tags: ["q", "blockquote"], name: "HTMLQuoteElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { cite: ge } });
  C({ tag: "script", name: "HTMLScriptElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { text: { get: function() {
    for (var e = "", t = 0, r = this.childNodes.length; t < r; t++) {
      var n = this.childNodes[t];
      n.nodeType === Qa.TEXT_NODE && (e += n._data);
    }
    return e;
  }, set: function(e) {
    this.removeChildren(), e !== null && e !== "" && this.appendChild(this.ownerDocument.createTextNode(e));
  } } }, attributes: { src: ge, type: String, charset: String, defer: Boolean, async: Boolean, crossOrigin: mn, nonce: String, integrity: String } });
  C({ tag: "select", name: "HTMLSelectElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: { form: Ke.form, options: { get: function() {
    return this.getElementsByTagName("option");
  } } }, attributes: { autocomplete: String, name: String, disabled: Boolean, autofocus: Boolean, multiple: Boolean, required: Boolean, size: { type: "unsigned long", default: 0 } } });
  C({ tag: "source", name: "HTMLSourceElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { src: ge, type: String, media: String } });
  C({ tag: "span", name: "HTMLSpanElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } });
  C({ tag: "style", name: "HTMLStyleElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { media: String, type: String, scoped: Boolean } });
  C({ tag: "caption", name: "HTMLTableCaptionElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { align: String } });
  C({ name: "HTMLTableCellElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { colSpan: { type: "unsigned long", default: 1 }, rowSpan: { type: "unsigned long", default: 1 }, scope: { type: ["row", "col", "rowgroup", "colgroup"], missing: "" }, abbr: String, align: String, axis: String, height: String, width: String, ch: { name: "char", type: String }, chOff: { name: "charoff", type: String }, noWrap: Boolean, vAlign: String, bgColor: { type: String, treatNullAsEmptyString: true } } });
  C({ tags: ["col", "colgroup"], name: "HTMLTableColElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { span: { type: "limited unsigned long with fallback", default: 1, min: 1 }, align: String, ch: { name: "char", type: String }, chOff: { name: "charoff", type: String }, vAlign: String, width: String } });
  C({ tag: "table", name: "HTMLTableElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { rows: { get: function() {
    return this.getElementsByTagName("tr");
  } } }, attributes: { align: String, border: String, frame: String, rules: String, summary: String, width: String, bgColor: { type: String, treatNullAsEmptyString: true }, cellPadding: { type: String, treatNullAsEmptyString: true }, cellSpacing: { type: String, treatNullAsEmptyString: true } } });
  C({ tag: "template", name: "HTMLTemplateElement", ctor: function(t, r, n) {
    M.call(this, t, r, n), this._contentFragment = t._templateDoc.createDocumentFragment();
  }, props: { content: { get: function() {
    return this._contentFragment;
  } }, serialize: { value: function() {
    return this.content.serialize();
  } } } });
  C({ tag: "tr", name: "HTMLTableRowElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { cells: { get: function() {
    return this.querySelectorAll("td,th");
  } } }, attributes: { align: String, ch: { name: "char", type: String }, chOff: { name: "charoff", type: String }, vAlign: String, bgColor: { type: String, treatNullAsEmptyString: true } } });
  C({ tags: ["thead", "tfoot", "tbody"], name: "HTMLTableSectionElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { rows: { get: function() {
    return this.getElementsByTagName("tr");
  } } }, attributes: { align: String, ch: { name: "char", type: String }, chOff: { name: "charoff", type: String }, vAlign: String } });
  C({ tag: "textarea", name: "HTMLTextAreaElement", ctor: function(t, r, n) {
    $e.call(this, t, r, n);
  }, props: { form: Ke.form, type: { get: function() {
    return "textarea";
  } }, defaultValue: { get: function() {
    return this.textContent;
  }, set: function(e) {
    this.textContent = e;
  } }, value: { get: function() {
    return this.defaultValue;
  }, set: function(e) {
    this.defaultValue = e;
  } }, textLength: { get: function() {
    return this.value.length;
  } } }, attributes: { autocomplete: String, name: String, disabled: Boolean, autofocus: Boolean, placeholder: String, wrap: String, dirName: String, required: Boolean, readOnly: Boolean, rows: { type: "limited unsigned long with fallback", default: 2 }, cols: { type: "limited unsigned long with fallback", default: 20 }, maxLength: { type: "unsigned long", min: 0, setmin: 0, default: -1 }, minLength: { type: "unsigned long", min: 0, setmin: 0, default: -1 }, inputMode: { type: ["verbatim", "latin", "latin-name", "latin-prose", "full-width-latin", "kana", "kana-name", "katakana", "numeric", "tel", "email", "url"], missing: "" } } });
  C({ tag: "time", name: "HTMLTimeElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { dateTime: String, pubDate: Boolean } });
  C({ tag: "title", name: "HTMLTitleElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { text: { get: function() {
    return this.textContent;
  } } } });
  C({ tag: "ul", name: "HTMLUListElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { type: String, compact: Boolean } });
  C({ name: "HTMLMediaElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { src: ge, crossOrigin: mn, preload: { type: ["metadata", "none", "auto", { value: "", alias: "auto" }], missing: "auto" }, loop: Boolean, autoplay: Boolean, mediaGroup: String, controls: Boolean, defaultMuted: { name: "muted", type: Boolean } } });
  C({ tag: "audio", superclass: lt.HTMLMediaElement, name: "HTMLAudioElement", ctor: function(t, r, n) {
    lt.HTMLMediaElement.call(this, t, r, n);
  } });
  C({ tag: "video", superclass: lt.HTMLMediaElement, name: "HTMLVideoElement", ctor: function(t, r, n) {
    lt.HTMLMediaElement.call(this, t, r, n);
  }, attributes: { poster: ge, width: { type: "unsigned long", min: 0, default: 0 }, height: { type: "unsigned long", min: 0, default: 0 } } });
  C({ tag: "td", superclass: lt.HTMLTableCellElement, name: "HTMLTableDataCellElement", ctor: function(t, r, n) {
    lt.HTMLTableCellElement.call(this, t, r, n);
  } });
  C({ tag: "th", superclass: lt.HTMLTableCellElement, name: "HTMLTableHeaderCellElement", ctor: function(t, r, n) {
    lt.HTMLTableCellElement.call(this, t, r, n);
  } });
  C({ tag: "frameset", name: "HTMLFrameSetElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } });
  C({ tag: "frame", name: "HTMLFrameElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  } });
  C({ tag: "canvas", name: "HTMLCanvasElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { getContext: { value: Ie.nyi }, probablySupportsContext: { value: Ie.nyi }, setContext: { value: Ie.nyi }, transferControlToProxy: { value: Ie.nyi }, toDataURL: { value: Ie.nyi }, toBlob: { value: Ie.nyi } }, attributes: { width: { type: "unsigned long", default: 300 }, height: { type: "unsigned long", default: 150 } } });
  C({ tag: "dialog", name: "HTMLDialogElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { show: { value: Ie.nyi }, showModal: { value: Ie.nyi }, close: { value: Ie.nyi } }, attributes: { open: Boolean, returnValue: String } });
  C({ tag: "menuitem", name: "HTMLMenuItemElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, props: { _label: { get: function() {
    var e = this._getattr("label");
    return e !== null && e !== "" ? e : (e = this.textContent, e.replace(/[ \t\n\f\r]+/g, " ").trim());
  } }, label: { get: function() {
    var e = this._getattr("label");
    return e !== null ? e : this._label;
  }, set: function(e) {
    this._setattr("label", e);
  } } }, attributes: { type: { type: ["command", "checkbox", "radio"], missing: "command" }, icon: ge, disabled: Boolean, checked: Boolean, radiogroup: String, default: Boolean } });
  C({ tag: "source", name: "HTMLSourceElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { srcset: String, sizes: String, media: String, src: ge, type: String } });
  C({ tag: "track", name: "HTMLTrackElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { src: ge, srclang: String, label: String, default: Boolean, kind: { type: ["subtitles", "captions", "descriptions", "chapters", "metadata"], missing: "subtitles", invalid: "metadata" } }, props: { NONE: { get: function() {
    return 0;
  } }, LOADING: { get: function() {
    return 1;
  } }, LOADED: { get: function() {
    return 2;
  } }, ERROR: { get: function() {
    return 3;
  } }, readyState: { get: Ie.nyi }, track: { get: Ie.nyi } } });
  C({ tag: "font", name: "HTMLFontElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { color: { type: String, treatNullAsEmptyString: true }, face: { type: String }, size: { type: String } } });
  C({ tag: "dir", name: "HTMLDirectoryElement", ctor: function(t, r, n) {
    M.call(this, t, r, n);
  }, attributes: { compact: Boolean } });
  C({ tags: ["abbr", "address", "article", "aside", "b", "bdi", "bdo", "cite", "code", "dd", "dfn", "dt", "em", "figcaption", "figure", "footer", "header", "hgroup", "i", "kbd", "main", "mark", "nav", "noscript", "rb", "rp", "rt", "rtc", "ruby", "s", "samp", "section", "small", "strong", "sub", "summary", "sup", "u", "var", "wbr", "acronym", "basefont", "big", "center", "nobr", "noembed", "noframes", "plaintext", "strike", "tt"] });
});
var ei = O((_n) => {
  var Lo = Xt(), m0 = Xa(), g0 = he(), b0 = pn(), _0 = _n.elements = {}, Do = Object.create(null);
  _n.createElement = function(e, t, r) {
    var n = Do[t] || Ja;
    return new n(e, t, r);
  };
  function Za(e) {
    return m0(e, Ja, _0, Do);
  }
  var Ja = Za({ superclass: Lo, name: "SVGElement", ctor: function(t, r, n) {
    Lo.call(this, t, r, g0.NAMESPACE.SVG, n);
  }, props: { style: { get: function() {
    return this._style || (this._style = new b0(this)), this._style;
  } } } });
  Za({ name: "SVGSVGElement", ctor: function(t, r, n) {
    Ja.call(this, t, r, n);
  }, tag: "svg", props: { createSVGRect: { value: function() {
    return _n.createElement(this.ownerDocument, "rect", null);
  } } } });
  Za({ tags: ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateColor", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "feColorMatrix", "feComponentTransfer", "feComposite", "feConvolveMatrix", "feDiffuseLighting", "feDisplacementMap", "feDistantLight", "feFlood", "feFuncA", "feFuncB", "feFuncG", "feFuncR", "feGaussianBlur", "feImage", "feMerge", "feMergeNode", "feMorphology", "feOffset", "fePointLight", "feSpecularLighting", "feSpotLight", "feTile", "feTurbulence", "filter", "font", "font-face", "font-face-format", "font-face-name", "font-face-src", "font-face-uri", "foreignObject", "g", "glyph", "glyphRef", "hkern", "image", "line", "linearGradient", "marker", "mask", "metadata", "missing-glyph", "mpath", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "script", "set", "stop", "style", "switch", "symbol", "text", "textPath", "title", "tref", "tspan", "use", "view", "vkern"] });
});
var Ro = O((ld, Mo) => {
  Mo.exports = { VALUE: 1, ATTR: 2, REMOVE_ATTR: 3, REMOVE: 4, MOVE: 5, INSERT: 6 };
});
var vn = O((ud, zo) => {
  zo.exports = Nr;
  var Se = Te(), E0 = It(), Io = en(), wt = Xt(), v0 = Da(), y0 = Ra(), Sr = zt(), T0 = qa(), w0 = Ha(), k0 = Cr(), S0 = ao(), N0 = uo(), Oo = vr(), qo = xn(), Fo = sn(), C0 = Ya(), En = tn(), ti = bn(), A0 = ei(), K = he(), Zt = Ro(), Jt = K.NAMESPACE, ri = Qr().isApiWritable;
  function Nr(e, t) {
    Io.call(this), this.nodeType = Se.DOCUMENT_NODE, this.isHTML = e, this._address = t || "about:blank", this.readyState = "loading", this.implementation = new k0(this), this.ownerDocument = null, this._contentType = e ? "text/html" : "application/xml", this.doctype = null, this.documentElement = null, this._templateDocCache = null, this._nodeIterators = null, this._nid = 1, this._nextnid = 2, this._nodes = [null, this], this.byId = Object.create(null), this.modclock = 0;
  }
  var L0 = { event: "Event", customevent: "CustomEvent", uievent: "UIEvent", mouseevent: "MouseEvent" }, D0 = { events: "event", htmlevents: "event", mouseevents: "mouseevent", mutationevents: "mutationevent", uievents: "uievent" }, er = function(e, t, r) {
    return { get: function() {
      var n = e.call(this);
      return n ? n[t] : r;
    }, set: function(n) {
      var l = e.call(this);
      l && (l[t] = n);
    } };
  };
  function Ho(e, t) {
    var r, n, l;
    return e === "" && (e = null), En.isValidQName(t) || K.InvalidCharacterError(), r = null, n = t, l = t.indexOf(":"), l >= 0 && (r = t.substring(0, l), n = t.substring(l + 1)), r !== null && e === null && K.NamespaceError(), r === "xml" && e !== Jt.XML && K.NamespaceError(), (r === "xmlns" || t === "xmlns") && e !== Jt.XMLNS && K.NamespaceError(), e === Jt.XMLNS && !(r === "xmlns" || t === "xmlns") && K.NamespaceError(), { namespace: e, prefix: r, localName: n };
  }
  Nr.prototype = Object.create(Io.prototype, { _setMutationHandler: { value: function(e) {
    this.mutationHandler = e;
  } }, _dispatchRendererEvent: { value: function(e, t, r) {
    var n = this._nodes[e];
    !n || n._dispatchEvent(new Sr(t, r), true);
  } }, nodeName: { value: "#document" }, nodeValue: { get: function() {
    return null;
  }, set: function() {
  } }, documentURI: { get: function() {
    return this._address;
  }, set: K.nyi }, compatMode: { get: function() {
    return this._quirks ? "BackCompat" : "CSS1Compat";
  } }, createTextNode: { value: function(e) {
    return new v0(this, String(e));
  } }, createComment: { value: function(e) {
    return new y0(this, e);
  } }, createDocumentFragment: { value: function() {
    return new T0(this);
  } }, createProcessingInstruction: { value: function(e, t) {
    return (!En.isValidName(e) || t.indexOf("?>") !== -1) && K.InvalidCharacterError(), new w0(this, e, t);
  } }, createAttribute: { value: function(e) {
    return e = String(e), En.isValidName(e) || K.InvalidCharacterError(), this.isHTML && (e = K.toASCIILowerCase(e)), new wt._Attr(null, e, null, null, "");
  } }, createAttributeNS: { value: function(e, t) {
    e = e == null || e === "" ? null : String(e), t = String(t);
    var r = Ho(e, t);
    return new wt._Attr(null, r.localName, r.prefix, r.namespace, "");
  } }, createElement: { value: function(e) {
    return e = String(e), En.isValidName(e) || K.InvalidCharacterError(), this.isHTML ? (/[A-Z]/.test(e) && (e = K.toASCIILowerCase(e)), ti.createElement(this, e, null)) : this.contentType === "application/xhtml+xml" ? ti.createElement(this, e, null) : new wt(this, e, null, null);
  }, writable: ri }, createElementNS: { value: function(e, t) {
    e = e == null || e === "" ? null : String(e), t = String(t);
    var r = Ho(e, t);
    return this._createElementNS(r.localName, r.namespace, r.prefix);
  }, writable: ri }, _createElementNS: { value: function(e, t, r) {
    return t === Jt.HTML ? ti.createElement(this, e, r) : t === Jt.SVG ? A0.createElement(this, e, r) : new wt(this, e, t, r);
  } }, createEvent: { value: function(t) {
    t = t.toLowerCase();
    var r = D0[t] || t, n = C0[L0[r]];
    if (n) {
      var l = new n();
      return l._initialized = false, l;
    } else
      K.NotSupportedError();
  } }, createTreeWalker: { value: function(e, t, r) {
    if (!e)
      throw new TypeError("root argument is required");
    if (!(e instanceof Se))
      throw new TypeError("root not a node");
    return t = t === void 0 ? Oo.SHOW_ALL : +t, r = r === void 0 ? null : r, new S0(e, t, r);
  } }, createNodeIterator: { value: function(e, t, r) {
    if (!e)
      throw new TypeError("root argument is required");
    if (!(e instanceof Se))
      throw new TypeError("root not a node");
    return t = t === void 0 ? Oo.SHOW_ALL : +t, r = r === void 0 ? null : r, new N0(e, t, r);
  } }, _attachNodeIterator: { value: function(e) {
    this._nodeIterators || (this._nodeIterators = []), this._nodeIterators.push(e);
  } }, _detachNodeIterator: { value: function(e) {
    var t = this._nodeIterators.indexOf(e);
    this._nodeIterators.splice(t, 1);
  } }, _preremoveNodeIterators: { value: function(e) {
    this._nodeIterators && this._nodeIterators.forEach(function(t) {
      t._preremove(e);
    });
  } }, _updateDocTypeElement: { value: function() {
    this.doctype = this.documentElement = null;
    for (var t = this.firstChild; t !== null; t = t.nextSibling)
      t.nodeType === Se.DOCUMENT_TYPE_NODE ? this.doctype = t : t.nodeType === Se.ELEMENT_NODE && (this.documentElement = t);
  } }, insertBefore: { value: function(t, r) {
    return Se.prototype.insertBefore.call(this, t, r), this._updateDocTypeElement(), t;
  } }, replaceChild: { value: function(t, r) {
    return Se.prototype.replaceChild.call(this, t, r), this._updateDocTypeElement(), r;
  } }, removeChild: { value: function(t) {
    return Se.prototype.removeChild.call(this, t), this._updateDocTypeElement(), t;
  } }, getElementById: { value: function(e) {
    var t = this.byId[e];
    return t ? t instanceof ut ? t.getFirst() : t : null;
  } }, _hasMultipleElementsWithId: { value: function(e) {
    return this.byId[e] instanceof ut;
  } }, getElementsByName: { value: wt.prototype.getElementsByName }, getElementsByTagName: { value: wt.prototype.getElementsByTagName }, getElementsByTagNameNS: { value: wt.prototype.getElementsByTagNameNS }, getElementsByClassName: { value: wt.prototype.getElementsByClassName }, adoptNode: { value: function(t) {
    return t.nodeType === Se.DOCUMENT_NODE && K.NotSupportedError(), t.nodeType === Se.ATTRIBUTE_NODE || (t.parentNode && t.parentNode.removeChild(t), t.ownerDocument !== this && Vo(t, this)), t;
  } }, importNode: { value: function(t, r) {
    return this.adoptNode(t.cloneNode(r));
  }, writable: ri }, origin: { get: function() {
    return null;
  } }, characterSet: { get: function() {
    return "UTF-8";
  } }, contentType: { get: function() {
    return this._contentType;
  } }, URL: { get: function() {
    return this._address;
  } }, domain: { get: K.nyi, set: K.nyi }, referrer: { get: K.nyi }, cookie: { get: K.nyi, set: K.nyi }, lastModified: { get: K.nyi }, location: { get: function() {
    return this.defaultView ? this.defaultView.location : null;
  }, set: K.nyi }, _titleElement: { get: function() {
    return this.getElementsByTagName("title").item(0) || null;
  } }, title: { get: function() {
    var e = this._titleElement, t = e ? e.textContent : "";
    return t.replace(/[ \t\n\r\f]+/g, " ").replace(/(^ )|( $)/g, "");
  }, set: function(e) {
    var t = this._titleElement, r = this.head;
    !t && !r || (t || (t = this.createElement("title"), r.appendChild(t)), t.textContent = e);
  } }, dir: er(function() {
    var e = this.documentElement;
    if (e && e.tagName === "HTML")
      return e;
  }, "dir", ""), fgColor: er(function() {
    return this.body;
  }, "text", ""), linkColor: er(function() {
    return this.body;
  }, "link", ""), vlinkColor: er(function() {
    return this.body;
  }, "vLink", ""), alinkColor: er(function() {
    return this.body;
  }, "aLink", ""), bgColor: er(function() {
    return this.body;
  }, "bgColor", ""), charset: { get: function() {
    return this.characterSet;
  } }, inputEncoding: { get: function() {
    return this.characterSet;
  } }, scrollingElement: { get: function() {
    return this._quirks ? this.body : this.documentElement;
  } }, body: { get: function() {
    return Po(this.documentElement, "body");
  }, set: K.nyi }, head: { get: function() {
    return Po(this.documentElement, "head");
  } }, images: { get: K.nyi }, embeds: { get: K.nyi }, plugins: { get: K.nyi }, links: { get: K.nyi }, forms: { get: K.nyi }, scripts: { get: K.nyi }, applets: { get: function() {
    return [];
  } }, activeElement: { get: function() {
    return null;
  } }, innerHTML: { get: function() {
    return this.serialize();
  }, set: K.nyi }, outerHTML: { get: function() {
    return this.serialize();
  }, set: K.nyi }, write: { value: function(e) {
    if (this.isHTML || K.InvalidStateError(), !!this._parser) {
      !this._parser;
      var t = arguments.join("");
      this._parser.parse(t);
    }
  } }, writeln: { value: function(t) {
    this.write(Array.prototype.join.call(arguments, "") + `
`);
  } }, open: { value: function() {
    this.documentElement = null;
  } }, close: { value: function() {
    this.readyState = "interactive", this._dispatchEvent(new Sr("readystatechange"), true), this._dispatchEvent(new Sr("DOMContentLoaded"), true), this.readyState = "complete", this._dispatchEvent(new Sr("readystatechange"), true), this.defaultView && this.defaultView._dispatchEvent(new Sr("load"), true);
  } }, clone: { value: function() {
    var t = new Nr(this.isHTML, this._address);
    return t._quirks = this._quirks, t._contentType = this._contentType, t;
  } }, cloneNode: { value: function(t) {
    var r = Se.prototype.cloneNode.call(this, false);
    if (t)
      for (var n = this.firstChild; n !== null; n = n.nextSibling)
        r._appendChild(r.importNode(n, true));
    return r._updateDocTypeElement(), r;
  } }, isEqual: { value: function(t) {
    return true;
  } }, mutateValue: { value: function(e) {
    this.mutationHandler && this.mutationHandler({ type: Zt.VALUE, target: e, data: e.data });
  } }, mutateAttr: { value: function(e, t) {
    this.mutationHandler && this.mutationHandler({ type: Zt.ATTR, target: e.ownerElement, attr: e });
  } }, mutateRemoveAttr: { value: function(e) {
    this.mutationHandler && this.mutationHandler({ type: Zt.REMOVE_ATTR, target: e.ownerElement, attr: e });
  } }, mutateRemove: { value: function(e) {
    this.mutationHandler && this.mutationHandler({ type: Zt.REMOVE, target: e.parentNode, node: e }), Uo(e);
  } }, mutateInsert: { value: function(e) {
    Bo(e), this.mutationHandler && this.mutationHandler({ type: Zt.INSERT, target: e.parentNode, node: e });
  } }, mutateMove: { value: function(e) {
    this.mutationHandler && this.mutationHandler({ type: Zt.MOVE, target: e });
  } }, addId: { value: function(t, r) {
    var n = this.byId[t];
    n ? (n instanceof ut || (n = new ut(n), this.byId[t] = n), n.add(r)) : this.byId[t] = r;
  } }, delId: { value: function(t, r) {
    var n = this.byId[t];
    K.assert(n), n instanceof ut ? (n.del(r), n.length === 1 && (this.byId[t] = n.downgrade())) : this.byId[t] = void 0;
  } }, _resolve: { value: function(e) {
    return new qo(this._documentBaseURL).resolve(e);
  } }, _documentBaseURL: { get: function() {
    var e = this._address;
    e === "about:blank" && (e = "/");
    var t = this.querySelector("base[href]");
    return t ? new qo(e).resolve(t.getAttribute("href")) : e;
  } }, _templateDoc: { get: function() {
    if (!this._templateDocCache) {
      var e = new Nr(this.isHTML, this._address);
      this._templateDocCache = e._templateDocCache = e;
    }
    return this._templateDocCache;
  } }, querySelector: { value: function(e) {
    return Fo(e, this)[0];
  } }, querySelectorAll: { value: function(e) {
    var t = Fo(e, this);
    return t.item ? t : new E0(t);
  } } });
  var M0 = ["abort", "canplay", "canplaythrough", "change", "click", "contextmenu", "cuechange", "dblclick", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "input", "invalid", "keydown", "keypress", "keyup", "loadeddata", "loadedmetadata", "loadstart", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "mousewheel", "pause", "play", "playing", "progress", "ratechange", "readystatechange", "reset", "seeked", "seeking", "select", "show", "stalled", "submit", "suspend", "timeupdate", "volumechange", "waiting", "blur", "error", "focus", "load", "scroll"];
  M0.forEach(function(e) {
    Object.defineProperty(Nr.prototype, "on" + e, { get: function() {
      return this._getEventHandler(e);
    }, set: function(t) {
      this._setEventHandler(e, t);
    } });
  });
  function Po(e, t) {
    if (e && e.isHTML) {
      for (var r = e.firstChild; r !== null; r = r.nextSibling)
        if (r.nodeType === Se.ELEMENT_NODE && r.localName === t && r.namespaceURI === Jt.HTML)
          return r;
    }
    return null;
  }
  function R0(e) {
    if (e._nid = e.ownerDocument._nextnid++, e.ownerDocument._nodes[e._nid] = e, e.nodeType === Se.ELEMENT_NODE) {
      var t = e.getAttribute("id");
      t && e.ownerDocument.addId(t, e), e._roothook && e._roothook();
    }
  }
  function I0(e) {
    if (e.nodeType === Se.ELEMENT_NODE) {
      var t = e.getAttribute("id");
      t && e.ownerDocument.delId(t, e);
    }
    e.ownerDocument._nodes[e._nid] = void 0, e._nid = void 0;
  }
  function Bo(e) {
    if (R0(e), e.nodeType === Se.ELEMENT_NODE)
      for (var t = e.firstChild; t !== null; t = t.nextSibling)
        Bo(t);
  }
  function Uo(e) {
    I0(e);
    for (var t = e.firstChild; t !== null; t = t.nextSibling)
      Uo(t);
  }
  function Vo(e, t) {
    e.ownerDocument = t, e._lastModTime = void 0, Object.prototype.hasOwnProperty.call(e, "_tagName") && (e._tagName = void 0);
    for (var r = e.firstChild; r !== null; r = r.nextSibling)
      Vo(r, t);
  }
  function ut(e) {
    this.nodes = Object.create(null), this.nodes[e._nid] = e, this.length = 1, this.firstNode = void 0;
  }
  ut.prototype.add = function(e) {
    this.nodes[e._nid] || (this.nodes[e._nid] = e, this.length++, this.firstNode = void 0);
  };
  ut.prototype.del = function(e) {
    this.nodes[e._nid] && (delete this.nodes[e._nid], this.length--, this.firstNode = void 0);
  };
  ut.prototype.getFirst = function() {
    if (!this.firstNode) {
      var e;
      for (e in this.nodes)
        (this.firstNode === void 0 || this.firstNode.compareDocumentPosition(this.nodes[e]) & Se.DOCUMENT_POSITION_PRECEDING) && (this.firstNode = this.nodes[e]);
    }
    return this.firstNode;
  };
  ut.prototype.downgrade = function() {
    if (this.length === 1) {
      var e;
      for (e in this.nodes)
        return this.nodes[e];
    }
    return this;
  };
});
var Tn = O((fd, Wo) => {
  Wo.exports = yn;
  var O0 = Te(), jo = Aa(), q0 = on();
  function yn(e, t, r, n) {
    jo.call(this), this.nodeType = O0.DOCUMENT_TYPE_NODE, this.ownerDocument = e || null, this.name = t, this.publicId = r || "", this.systemId = n || "";
  }
  yn.prototype = Object.create(jo.prototype, { nodeName: { get: function() {
    return this.name;
  } }, nodeValue: { get: function() {
    return null;
  }, set: function() {
  } }, clone: { value: function() {
    return new yn(this.ownerDocument, this.name, this.publicId, this.systemId);
  } }, isEqual: { value: function(t) {
    return this.name === t.name && this.publicId === t.publicId && this.systemId === t.systemId;
  } } });
  Object.defineProperties(yn.prototype, q0);
});
var Ln = O((dd, xc) => {
  xc.exports = Y;
  var F0 = vn(), H0 = Tn(), ni = Te(), q = he().NAMESPACE, Go = bn(), ee = Go.elements, qt = Function.prototype.apply.bind(Array.prototype.push), wn = -1, tr = 1, Ne = 2, G = 3, rt = 4, P0 = 5, B0 = [], U0 = /^HTML$|^-\/\/W3O\/\/DTD W3 HTML Strict 3\.0\/\/EN\/\/$|^-\/W3C\/DTD HTML 4\.0 Transitional\/EN$|^\+\/\/Silmaril\/\/dtd html Pro v0r11 19970101\/\/|^-\/\/AdvaSoft Ltd\/\/DTD HTML 3\.0 asWedit \+ extensions\/\/|^-\/\/AS\/\/DTD HTML 3\.0 asWedit \+ extensions\/\/|^-\/\/IETF\/\/DTD HTML 2\.0 Level 1\/\/|^-\/\/IETF\/\/DTD HTML 2\.0 Level 2\/\/|^-\/\/IETF\/\/DTD HTML 2\.0 Strict Level 1\/\/|^-\/\/IETF\/\/DTD HTML 2\.0 Strict Level 2\/\/|^-\/\/IETF\/\/DTD HTML 2\.0 Strict\/\/|^-\/\/IETF\/\/DTD HTML 2\.0\/\/|^-\/\/IETF\/\/DTD HTML 2\.1E\/\/|^-\/\/IETF\/\/DTD HTML 3\.0\/\/|^-\/\/IETF\/\/DTD HTML 3\.2 Final\/\/|^-\/\/IETF\/\/DTD HTML 3\.2\/\/|^-\/\/IETF\/\/DTD HTML 3\/\/|^-\/\/IETF\/\/DTD HTML Level 0\/\/|^-\/\/IETF\/\/DTD HTML Level 1\/\/|^-\/\/IETF\/\/DTD HTML Level 2\/\/|^-\/\/IETF\/\/DTD HTML Level 3\/\/|^-\/\/IETF\/\/DTD HTML Strict Level 0\/\/|^-\/\/IETF\/\/DTD HTML Strict Level 1\/\/|^-\/\/IETF\/\/DTD HTML Strict Level 2\/\/|^-\/\/IETF\/\/DTD HTML Strict Level 3\/\/|^-\/\/IETF\/\/DTD HTML Strict\/\/|^-\/\/IETF\/\/DTD HTML\/\/|^-\/\/Metrius\/\/DTD Metrius Presentational\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 2\.0 HTML Strict\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 2\.0 HTML\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 2\.0 Tables\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 3\.0 HTML Strict\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 3\.0 HTML\/\/|^-\/\/Microsoft\/\/DTD Internet Explorer 3\.0 Tables\/\/|^-\/\/Netscape Comm\. Corp\.\/\/DTD HTML\/\/|^-\/\/Netscape Comm\. Corp\.\/\/DTD Strict HTML\/\/|^-\/\/O'Reilly and Associates\/\/DTD HTML 2\.0\/\/|^-\/\/O'Reilly and Associates\/\/DTD HTML Extended 1\.0\/\/|^-\/\/O'Reilly and Associates\/\/DTD HTML Extended Relaxed 1\.0\/\/|^-\/\/SoftQuad Software\/\/DTD HoTMetaL PRO 6\.0::19990601::extensions to HTML 4\.0\/\/|^-\/\/SoftQuad\/\/DTD HoTMetaL PRO 4\.0::19971010::extensions to HTML 4\.0\/\/|^-\/\/Spyglass\/\/DTD HTML 2\.0 Extended\/\/|^-\/\/SQ\/\/DTD HTML 2\.0 HoTMetaL \+ extensions\/\/|^-\/\/Sun Microsystems Corp\.\/\/DTD HotJava HTML\/\/|^-\/\/Sun Microsystems Corp\.\/\/DTD HotJava Strict HTML\/\/|^-\/\/W3C\/\/DTD HTML 3 1995-03-24\/\/|^-\/\/W3C\/\/DTD HTML 3\.2 Draft\/\/|^-\/\/W3C\/\/DTD HTML 3\.2 Final\/\/|^-\/\/W3C\/\/DTD HTML 3\.2\/\/|^-\/\/W3C\/\/DTD HTML 3\.2S Draft\/\/|^-\/\/W3C\/\/DTD HTML 4\.0 Frameset\/\/|^-\/\/W3C\/\/DTD HTML 4\.0 Transitional\/\/|^-\/\/W3C\/\/DTD HTML Experimental 19960712\/\/|^-\/\/W3C\/\/DTD HTML Experimental 970421\/\/|^-\/\/W3C\/\/DTD W3 HTML\/\/|^-\/\/W3O\/\/DTD W3 HTML 3\.0\/\/|^-\/\/WebTechs\/\/DTD Mozilla HTML 2\.0\/\/|^-\/\/WebTechs\/\/DTD Mozilla HTML\/\//i, V0 = "http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd", Yo = /^-\/\/W3C\/\/DTD HTML 4\.01 Frameset\/\/|^-\/\/W3C\/\/DTD HTML 4\.01 Transitional\/\//i, z0 = /^-\/\/W3C\/\/DTD XHTML 1\.0 Frameset\/\/|^-\/\/W3C\/\/DTD XHTML 1\.0 Transitional\/\//i, Ft = Object.create(null);
  Ft[q.HTML] = { __proto__: null, address: true, applet: true, area: true, article: true, aside: true, base: true, basefont: true, bgsound: true, blockquote: true, body: true, br: true, button: true, caption: true, center: true, col: true, colgroup: true, dd: true, details: true, dir: true, div: true, dl: true, dt: true, embed: true, fieldset: true, figcaption: true, figure: true, footer: true, form: true, frame: true, frameset: true, h1: true, h2: true, h3: true, h4: true, h5: true, h6: true, head: true, header: true, hgroup: true, hr: true, html: true, iframe: true, img: true, input: true, li: true, link: true, listing: true, main: true, marquee: true, menu: true, meta: true, nav: true, noembed: true, noframes: true, noscript: true, object: true, ol: true, p: true, param: true, plaintext: true, pre: true, script: true, section: true, select: true, source: true, style: true, summary: true, table: true, tbody: true, td: true, template: true, textarea: true, tfoot: true, th: true, thead: true, title: true, tr: true, track: true, ul: true, wbr: true, xmp: true };
  Ft[q.SVG] = { __proto__: null, foreignObject: true, desc: true, title: true };
  Ft[q.MATHML] = { __proto__: null, mi: true, mo: true, mn: true, ms: true, mtext: true, "annotation-xml": true };
  var ai = Object.create(null);
  ai[q.HTML] = { __proto__: null, address: true, div: true, p: true };
  var $o = Object.create(null);
  $o[q.HTML] = { __proto__: null, dd: true, dt: true };
  var rr = Object.create(null);
  rr[q.HTML] = { __proto__: null, table: true, thead: true, tbody: true, tfoot: true, tr: true };
  var Ko = Object.create(null);
  Ko[q.HTML] = { __proto__: null, dd: true, dt: true, li: true, menuitem: true, optgroup: true, option: true, p: true, rb: true, rp: true, rt: true, rtc: true };
  var Xo = Object.create(null);
  Xo[q.HTML] = { __proto__: null, caption: true, colgroup: true, dd: true, dt: true, li: true, optgroup: true, option: true, p: true, rb: true, rp: true, rt: true, rtc: true, tbody: true, td: true, tfoot: true, th: true, thead: true, tr: true };
  var kn = Object.create(null);
  kn[q.HTML] = { __proto__: null, table: true, template: true, html: true };
  var Sn = Object.create(null);
  Sn[q.HTML] = { __proto__: null, tbody: true, tfoot: true, thead: true, template: true, html: true };
  var ii = Object.create(null);
  ii[q.HTML] = { __proto__: null, tr: true, template: true, html: true };
  var Qo = Object.create(null);
  Qo[q.HTML] = { __proto__: null, button: true, fieldset: true, input: true, keygen: true, object: true, output: true, select: true, textarea: true, img: true };
  var nt = Object.create(null);
  nt[q.HTML] = { __proto__: null, applet: true, caption: true, html: true, table: true, td: true, th: true, marquee: true, object: true, template: true };
  nt[q.MATHML] = { __proto__: null, mi: true, mo: true, mn: true, ms: true, mtext: true, "annotation-xml": true };
  nt[q.SVG] = { __proto__: null, foreignObject: true, desc: true, title: true };
  var Nn = Object.create(nt);
  Nn[q.HTML] = Object.create(nt[q.HTML]);
  Nn[q.HTML].ol = true;
  Nn[q.HTML].ul = true;
  var si = Object.create(nt);
  si[q.HTML] = Object.create(nt[q.HTML]);
  si[q.HTML].button = true;
  var Zo = Object.create(null);
  Zo[q.HTML] = { __proto__: null, html: true, table: true, template: true };
  var j0 = Object.create(null);
  j0[q.HTML] = { __proto__: null, optgroup: true, option: true };
  var Jo = Object.create(null);
  Jo[q.MATHML] = { __proto__: null, mi: true, mo: true, mn: true, ms: true, mtext: true };
  var ec = Object.create(null);
  ec[q.SVG] = { __proto__: null, foreignObject: true, desc: true, title: true };
  var tc = { __proto__: null, "xlink:actuate": q.XLINK, "xlink:arcrole": q.XLINK, "xlink:href": q.XLINK, "xlink:role": q.XLINK, "xlink:show": q.XLINK, "xlink:title": q.XLINK, "xlink:type": q.XLINK, "xml:base": q.XML, "xml:lang": q.XML, "xml:space": q.XML, xmlns: q.XMLNS, "xmlns:xlink": q.XMLNS }, rc = { __proto__: null, attributename: "attributeName", attributetype: "attributeType", basefrequency: "baseFrequency", baseprofile: "baseProfile", calcmode: "calcMode", clippathunits: "clipPathUnits", diffuseconstant: "diffuseConstant", edgemode: "edgeMode", filterunits: "filterUnits", glyphref: "glyphRef", gradienttransform: "gradientTransform", gradientunits: "gradientUnits", kernelmatrix: "kernelMatrix", kernelunitlength: "kernelUnitLength", keypoints: "keyPoints", keysplines: "keySplines", keytimes: "keyTimes", lengthadjust: "lengthAdjust", limitingconeangle: "limitingConeAngle", markerheight: "markerHeight", markerunits: "markerUnits", markerwidth: "markerWidth", maskcontentunits: "maskContentUnits", maskunits: "maskUnits", numoctaves: "numOctaves", pathlength: "pathLength", patterncontentunits: "patternContentUnits", patterntransform: "patternTransform", patternunits: "patternUnits", pointsatx: "pointsAtX", pointsaty: "pointsAtY", pointsatz: "pointsAtZ", preservealpha: "preserveAlpha", preserveaspectratio: "preserveAspectRatio", primitiveunits: "primitiveUnits", refx: "refX", refy: "refY", repeatcount: "repeatCount", repeatdur: "repeatDur", requiredextensions: "requiredExtensions", requiredfeatures: "requiredFeatures", specularconstant: "specularConstant", specularexponent: "specularExponent", spreadmethod: "spreadMethod", startoffset: "startOffset", stddeviation: "stdDeviation", stitchtiles: "stitchTiles", surfacescale: "surfaceScale", systemlanguage: "systemLanguage", tablevalues: "tableValues", targetx: "targetX", targety: "targetY", textlength: "textLength", viewbox: "viewBox", viewtarget: "viewTarget", xchannelselector: "xChannelSelector", ychannelselector: "yChannelSelector", zoomandpan: "zoomAndPan" }, nc = { __proto__: null, altglyph: "altGlyph", altglyphdef: "altGlyphDef", altglyphitem: "altGlyphItem", animatecolor: "animateColor", animatemotion: "animateMotion", animatetransform: "animateTransform", clippath: "clipPath", feblend: "feBlend", fecolormatrix: "feColorMatrix", fecomponenttransfer: "feComponentTransfer", fecomposite: "feComposite", feconvolvematrix: "feConvolveMatrix", fediffuselighting: "feDiffuseLighting", fedisplacementmap: "feDisplacementMap", fedistantlight: "feDistantLight", feflood: "feFlood", fefunca: "feFuncA", fefuncb: "feFuncB", fefuncg: "feFuncG", fefuncr: "feFuncR", fegaussianblur: "feGaussianBlur", feimage: "feImage", femerge: "feMerge", femergenode: "feMergeNode", femorphology: "feMorphology", feoffset: "feOffset", fepointlight: "fePointLight", fespecularlighting: "feSpecularLighting", fespotlight: "feSpotLight", fetile: "feTile", feturbulence: "feTurbulence", foreignobject: "foreignObject", glyphref: "glyphRef", lineargradient: "linearGradient", radialgradient: "radialGradient", textpath: "textPath" }, ac = { __proto__: null, 0: 65533, 128: 8364, 130: 8218, 131: 402, 132: 8222, 133: 8230, 134: 8224, 135: 8225, 136: 710, 137: 8240, 138: 352, 139: 8249, 140: 338, 142: 381, 145: 8216, 146: 8217, 147: 8220, 148: 8221, 149: 8226, 150: 8211, 151: 8212, 152: 732, 153: 8482, 154: 353, 155: 8250, 156: 339, 158: 382, 159: 376 }, W0 = { __proto__: null, AElig: 198, "AElig;": 198, AMP: 38, "AMP;": 38, Aacute: 193, "Aacute;": 193, "Abreve;": 258, Acirc: 194, "Acirc;": 194, "Acy;": 1040, "Afr;": [55349, 56580], Agrave: 192, "Agrave;": 192, "Alpha;": 913, "Amacr;": 256, "And;": 10835, "Aogon;": 260, "Aopf;": [55349, 56632], "ApplyFunction;": 8289, Aring: 197, "Aring;": 197, "Ascr;": [55349, 56476], "Assign;": 8788, Atilde: 195, "Atilde;": 195, Auml: 196, "Auml;": 196, "Backslash;": 8726, "Barv;": 10983, "Barwed;": 8966, "Bcy;": 1041, "Because;": 8757, "Bernoullis;": 8492, "Beta;": 914, "Bfr;": [55349, 56581], "Bopf;": [55349, 56633], "Breve;": 728, "Bscr;": 8492, "Bumpeq;": 8782, "CHcy;": 1063, COPY: 169, "COPY;": 169, "Cacute;": 262, "Cap;": 8914, "CapitalDifferentialD;": 8517, "Cayleys;": 8493, "Ccaron;": 268, Ccedil: 199, "Ccedil;": 199, "Ccirc;": 264, "Cconint;": 8752, "Cdot;": 266, "Cedilla;": 184, "CenterDot;": 183, "Cfr;": 8493, "Chi;": 935, "CircleDot;": 8857, "CircleMinus;": 8854, "CirclePlus;": 8853, "CircleTimes;": 8855, "ClockwiseContourIntegral;": 8754, "CloseCurlyDoubleQuote;": 8221, "CloseCurlyQuote;": 8217, "Colon;": 8759, "Colone;": 10868, "Congruent;": 8801, "Conint;": 8751, "ContourIntegral;": 8750, "Copf;": 8450, "Coproduct;": 8720, "CounterClockwiseContourIntegral;": 8755, "Cross;": 10799, "Cscr;": [55349, 56478], "Cup;": 8915, "CupCap;": 8781, "DD;": 8517, "DDotrahd;": 10513, "DJcy;": 1026, "DScy;": 1029, "DZcy;": 1039, "Dagger;": 8225, "Darr;": 8609, "Dashv;": 10980, "Dcaron;": 270, "Dcy;": 1044, "Del;": 8711, "Delta;": 916, "Dfr;": [55349, 56583], "DiacriticalAcute;": 180, "DiacriticalDot;": 729, "DiacriticalDoubleAcute;": 733, "DiacriticalGrave;": 96, "DiacriticalTilde;": 732, "Diamond;": 8900, "DifferentialD;": 8518, "Dopf;": [55349, 56635], "Dot;": 168, "DotDot;": 8412, "DotEqual;": 8784, "DoubleContourIntegral;": 8751, "DoubleDot;": 168, "DoubleDownArrow;": 8659, "DoubleLeftArrow;": 8656, "DoubleLeftRightArrow;": 8660, "DoubleLeftTee;": 10980, "DoubleLongLeftArrow;": 10232, "DoubleLongLeftRightArrow;": 10234, "DoubleLongRightArrow;": 10233, "DoubleRightArrow;": 8658, "DoubleRightTee;": 8872, "DoubleUpArrow;": 8657, "DoubleUpDownArrow;": 8661, "DoubleVerticalBar;": 8741, "DownArrow;": 8595, "DownArrowBar;": 10515, "DownArrowUpArrow;": 8693, "DownBreve;": 785, "DownLeftRightVector;": 10576, "DownLeftTeeVector;": 10590, "DownLeftVector;": 8637, "DownLeftVectorBar;": 10582, "DownRightTeeVector;": 10591, "DownRightVector;": 8641, "DownRightVectorBar;": 10583, "DownTee;": 8868, "DownTeeArrow;": 8615, "Downarrow;": 8659, "Dscr;": [55349, 56479], "Dstrok;": 272, "ENG;": 330, ETH: 208, "ETH;": 208, Eacute: 201, "Eacute;": 201, "Ecaron;": 282, Ecirc: 202, "Ecirc;": 202, "Ecy;": 1069, "Edot;": 278, "Efr;": [55349, 56584], Egrave: 200, "Egrave;": 200, "Element;": 8712, "Emacr;": 274, "EmptySmallSquare;": 9723, "EmptyVerySmallSquare;": 9643, "Eogon;": 280, "Eopf;": [55349, 56636], "Epsilon;": 917, "Equal;": 10869, "EqualTilde;": 8770, "Equilibrium;": 8652, "Escr;": 8496, "Esim;": 10867, "Eta;": 919, Euml: 203, "Euml;": 203, "Exists;": 8707, "ExponentialE;": 8519, "Fcy;": 1060, "Ffr;": [55349, 56585], "FilledSmallSquare;": 9724, "FilledVerySmallSquare;": 9642, "Fopf;": [55349, 56637], "ForAll;": 8704, "Fouriertrf;": 8497, "Fscr;": 8497, "GJcy;": 1027, GT: 62, "GT;": 62, "Gamma;": 915, "Gammad;": 988, "Gbreve;": 286, "Gcedil;": 290, "Gcirc;": 284, "Gcy;": 1043, "Gdot;": 288, "Gfr;": [55349, 56586], "Gg;": 8921, "Gopf;": [55349, 56638], "GreaterEqual;": 8805, "GreaterEqualLess;": 8923, "GreaterFullEqual;": 8807, "GreaterGreater;": 10914, "GreaterLess;": 8823, "GreaterSlantEqual;": 10878, "GreaterTilde;": 8819, "Gscr;": [55349, 56482], "Gt;": 8811, "HARDcy;": 1066, "Hacek;": 711, "Hat;": 94, "Hcirc;": 292, "Hfr;": 8460, "HilbertSpace;": 8459, "Hopf;": 8461, "HorizontalLine;": 9472, "Hscr;": 8459, "Hstrok;": 294, "HumpDownHump;": 8782, "HumpEqual;": 8783, "IEcy;": 1045, "IJlig;": 306, "IOcy;": 1025, Iacute: 205, "Iacute;": 205, Icirc: 206, "Icirc;": 206, "Icy;": 1048, "Idot;": 304, "Ifr;": 8465, Igrave: 204, "Igrave;": 204, "Im;": 8465, "Imacr;": 298, "ImaginaryI;": 8520, "Implies;": 8658, "Int;": 8748, "Integral;": 8747, "Intersection;": 8898, "InvisibleComma;": 8291, "InvisibleTimes;": 8290, "Iogon;": 302, "Iopf;": [55349, 56640], "Iota;": 921, "Iscr;": 8464, "Itilde;": 296, "Iukcy;": 1030, Iuml: 207, "Iuml;": 207, "Jcirc;": 308, "Jcy;": 1049, "Jfr;": [55349, 56589], "Jopf;": [55349, 56641], "Jscr;": [55349, 56485], "Jsercy;": 1032, "Jukcy;": 1028, "KHcy;": 1061, "KJcy;": 1036, "Kappa;": 922, "Kcedil;": 310, "Kcy;": 1050, "Kfr;": [55349, 56590], "Kopf;": [55349, 56642], "Kscr;": [55349, 56486], "LJcy;": 1033, LT: 60, "LT;": 60, "Lacute;": 313, "Lambda;": 923, "Lang;": 10218, "Laplacetrf;": 8466, "Larr;": 8606, "Lcaron;": 317, "Lcedil;": 315, "Lcy;": 1051, "LeftAngleBracket;": 10216, "LeftArrow;": 8592, "LeftArrowBar;": 8676, "LeftArrowRightArrow;": 8646, "LeftCeiling;": 8968, "LeftDoubleBracket;": 10214, "LeftDownTeeVector;": 10593, "LeftDownVector;": 8643, "LeftDownVectorBar;": 10585, "LeftFloor;": 8970, "LeftRightArrow;": 8596, "LeftRightVector;": 10574, "LeftTee;": 8867, "LeftTeeArrow;": 8612, "LeftTeeVector;": 10586, "LeftTriangle;": 8882, "LeftTriangleBar;": 10703, "LeftTriangleEqual;": 8884, "LeftUpDownVector;": 10577, "LeftUpTeeVector;": 10592, "LeftUpVector;": 8639, "LeftUpVectorBar;": 10584, "LeftVector;": 8636, "LeftVectorBar;": 10578, "Leftarrow;": 8656, "Leftrightarrow;": 8660, "LessEqualGreater;": 8922, "LessFullEqual;": 8806, "LessGreater;": 8822, "LessLess;": 10913, "LessSlantEqual;": 10877, "LessTilde;": 8818, "Lfr;": [55349, 56591], "Ll;": 8920, "Lleftarrow;": 8666, "Lmidot;": 319, "LongLeftArrow;": 10229, "LongLeftRightArrow;": 10231, "LongRightArrow;": 10230, "Longleftarrow;": 10232, "Longleftrightarrow;": 10234, "Longrightarrow;": 10233, "Lopf;": [55349, 56643], "LowerLeftArrow;": 8601, "LowerRightArrow;": 8600, "Lscr;": 8466, "Lsh;": 8624, "Lstrok;": 321, "Lt;": 8810, "Map;": 10501, "Mcy;": 1052, "MediumSpace;": 8287, "Mellintrf;": 8499, "Mfr;": [55349, 56592], "MinusPlus;": 8723, "Mopf;": [55349, 56644], "Mscr;": 8499, "Mu;": 924, "NJcy;": 1034, "Nacute;": 323, "Ncaron;": 327, "Ncedil;": 325, "Ncy;": 1053, "NegativeMediumSpace;": 8203, "NegativeThickSpace;": 8203, "NegativeThinSpace;": 8203, "NegativeVeryThinSpace;": 8203, "NestedGreaterGreater;": 8811, "NestedLessLess;": 8810, "NewLine;": 10, "Nfr;": [55349, 56593], "NoBreak;": 8288, "NonBreakingSpace;": 160, "Nopf;": 8469, "Not;": 10988, "NotCongruent;": 8802, "NotCupCap;": 8813, "NotDoubleVerticalBar;": 8742, "NotElement;": 8713, "NotEqual;": 8800, "NotEqualTilde;": [8770, 824], "NotExists;": 8708, "NotGreater;": 8815, "NotGreaterEqual;": 8817, "NotGreaterFullEqual;": [8807, 824], "NotGreaterGreater;": [8811, 824], "NotGreaterLess;": 8825, "NotGreaterSlantEqual;": [10878, 824], "NotGreaterTilde;": 8821, "NotHumpDownHump;": [8782, 824], "NotHumpEqual;": [8783, 824], "NotLeftTriangle;": 8938, "NotLeftTriangleBar;": [10703, 824], "NotLeftTriangleEqual;": 8940, "NotLess;": 8814, "NotLessEqual;": 8816, "NotLessGreater;": 8824, "NotLessLess;": [8810, 824], "NotLessSlantEqual;": [10877, 824], "NotLessTilde;": 8820, "NotNestedGreaterGreater;": [10914, 824], "NotNestedLessLess;": [10913, 824], "NotPrecedes;": 8832, "NotPrecedesEqual;": [10927, 824], "NotPrecedesSlantEqual;": 8928, "NotReverseElement;": 8716, "NotRightTriangle;": 8939, "NotRightTriangleBar;": [10704, 824], "NotRightTriangleEqual;": 8941, "NotSquareSubset;": [8847, 824], "NotSquareSubsetEqual;": 8930, "NotSquareSuperset;": [8848, 824], "NotSquareSupersetEqual;": 8931, "NotSubset;": [8834, 8402], "NotSubsetEqual;": 8840, "NotSucceeds;": 8833, "NotSucceedsEqual;": [10928, 824], "NotSucceedsSlantEqual;": 8929, "NotSucceedsTilde;": [8831, 824], "NotSuperset;": [8835, 8402], "NotSupersetEqual;": 8841, "NotTilde;": 8769, "NotTildeEqual;": 8772, "NotTildeFullEqual;": 8775, "NotTildeTilde;": 8777, "NotVerticalBar;": 8740, "Nscr;": [55349, 56489], Ntilde: 209, "Ntilde;": 209, "Nu;": 925, "OElig;": 338, Oacute: 211, "Oacute;": 211, Ocirc: 212, "Ocirc;": 212, "Ocy;": 1054, "Odblac;": 336, "Ofr;": [55349, 56594], Ograve: 210, "Ograve;": 210, "Omacr;": 332, "Omega;": 937, "Omicron;": 927, "Oopf;": [55349, 56646], "OpenCurlyDoubleQuote;": 8220, "OpenCurlyQuote;": 8216, "Or;": 10836, "Oscr;": [55349, 56490], Oslash: 216, "Oslash;": 216, Otilde: 213, "Otilde;": 213, "Otimes;": 10807, Ouml: 214, "Ouml;": 214, "OverBar;": 8254, "OverBrace;": 9182, "OverBracket;": 9140, "OverParenthesis;": 9180, "PartialD;": 8706, "Pcy;": 1055, "Pfr;": [55349, 56595], "Phi;": 934, "Pi;": 928, "PlusMinus;": 177, "Poincareplane;": 8460, "Popf;": 8473, "Pr;": 10939, "Precedes;": 8826, "PrecedesEqual;": 10927, "PrecedesSlantEqual;": 8828, "PrecedesTilde;": 8830, "Prime;": 8243, "Product;": 8719, "Proportion;": 8759, "Proportional;": 8733, "Pscr;": [55349, 56491], "Psi;": 936, QUOT: 34, "QUOT;": 34, "Qfr;": [55349, 56596], "Qopf;": 8474, "Qscr;": [55349, 56492], "RBarr;": 10512, REG: 174, "REG;": 174, "Racute;": 340, "Rang;": 10219, "Rarr;": 8608, "Rarrtl;": 10518, "Rcaron;": 344, "Rcedil;": 342, "Rcy;": 1056, "Re;": 8476, "ReverseElement;": 8715, "ReverseEquilibrium;": 8651, "ReverseUpEquilibrium;": 10607, "Rfr;": 8476, "Rho;": 929, "RightAngleBracket;": 10217, "RightArrow;": 8594, "RightArrowBar;": 8677, "RightArrowLeftArrow;": 8644, "RightCeiling;": 8969, "RightDoubleBracket;": 10215, "RightDownTeeVector;": 10589, "RightDownVector;": 8642, "RightDownVectorBar;": 10581, "RightFloor;": 8971, "RightTee;": 8866, "RightTeeArrow;": 8614, "RightTeeVector;": 10587, "RightTriangle;": 8883, "RightTriangleBar;": 10704, "RightTriangleEqual;": 8885, "RightUpDownVector;": 10575, "RightUpTeeVector;": 10588, "RightUpVector;": 8638, "RightUpVectorBar;": 10580, "RightVector;": 8640, "RightVectorBar;": 10579, "Rightarrow;": 8658, "Ropf;": 8477, "RoundImplies;": 10608, "Rrightarrow;": 8667, "Rscr;": 8475, "Rsh;": 8625, "RuleDelayed;": 10740, "SHCHcy;": 1065, "SHcy;": 1064, "SOFTcy;": 1068, "Sacute;": 346, "Sc;": 10940, "Scaron;": 352, "Scedil;": 350, "Scirc;": 348, "Scy;": 1057, "Sfr;": [55349, 56598], "ShortDownArrow;": 8595, "ShortLeftArrow;": 8592, "ShortRightArrow;": 8594, "ShortUpArrow;": 8593, "Sigma;": 931, "SmallCircle;": 8728, "Sopf;": [55349, 56650], "Sqrt;": 8730, "Square;": 9633, "SquareIntersection;": 8851, "SquareSubset;": 8847, "SquareSubsetEqual;": 8849, "SquareSuperset;": 8848, "SquareSupersetEqual;": 8850, "SquareUnion;": 8852, "Sscr;": [55349, 56494], "Star;": 8902, "Sub;": 8912, "Subset;": 8912, "SubsetEqual;": 8838, "Succeeds;": 8827, "SucceedsEqual;": 10928, "SucceedsSlantEqual;": 8829, "SucceedsTilde;": 8831, "SuchThat;": 8715, "Sum;": 8721, "Sup;": 8913, "Superset;": 8835, "SupersetEqual;": 8839, "Supset;": 8913, THORN: 222, "THORN;": 222, "TRADE;": 8482, "TSHcy;": 1035, "TScy;": 1062, "Tab;": 9, "Tau;": 932, "Tcaron;": 356, "Tcedil;": 354, "Tcy;": 1058, "Tfr;": [55349, 56599], "Therefore;": 8756, "Theta;": 920, "ThickSpace;": [8287, 8202], "ThinSpace;": 8201, "Tilde;": 8764, "TildeEqual;": 8771, "TildeFullEqual;": 8773, "TildeTilde;": 8776, "Topf;": [55349, 56651], "TripleDot;": 8411, "Tscr;": [55349, 56495], "Tstrok;": 358, Uacute: 218, "Uacute;": 218, "Uarr;": 8607, "Uarrocir;": 10569, "Ubrcy;": 1038, "Ubreve;": 364, Ucirc: 219, "Ucirc;": 219, "Ucy;": 1059, "Udblac;": 368, "Ufr;": [55349, 56600], Ugrave: 217, "Ugrave;": 217, "Umacr;": 362, "UnderBar;": 95, "UnderBrace;": 9183, "UnderBracket;": 9141, "UnderParenthesis;": 9181, "Union;": 8899, "UnionPlus;": 8846, "Uogon;": 370, "Uopf;": [55349, 56652], "UpArrow;": 8593, "UpArrowBar;": 10514, "UpArrowDownArrow;": 8645, "UpDownArrow;": 8597, "UpEquilibrium;": 10606, "UpTee;": 8869, "UpTeeArrow;": 8613, "Uparrow;": 8657, "Updownarrow;": 8661, "UpperLeftArrow;": 8598, "UpperRightArrow;": 8599, "Upsi;": 978, "Upsilon;": 933, "Uring;": 366, "Uscr;": [55349, 56496], "Utilde;": 360, Uuml: 220, "Uuml;": 220, "VDash;": 8875, "Vbar;": 10987, "Vcy;": 1042, "Vdash;": 8873, "Vdashl;": 10982, "Vee;": 8897, "Verbar;": 8214, "Vert;": 8214, "VerticalBar;": 8739, "VerticalLine;": 124, "VerticalSeparator;": 10072, "VerticalTilde;": 8768, "VeryThinSpace;": 8202, "Vfr;": [55349, 56601], "Vopf;": [55349, 56653], "Vscr;": [55349, 56497], "Vvdash;": 8874, "Wcirc;": 372, "Wedge;": 8896, "Wfr;": [55349, 56602], "Wopf;": [55349, 56654], "Wscr;": [55349, 56498], "Xfr;": [55349, 56603], "Xi;": 926, "Xopf;": [55349, 56655], "Xscr;": [55349, 56499], "YAcy;": 1071, "YIcy;": 1031, "YUcy;": 1070, Yacute: 221, "Yacute;": 221, "Ycirc;": 374, "Ycy;": 1067, "Yfr;": [55349, 56604], "Yopf;": [55349, 56656], "Yscr;": [55349, 56500], "Yuml;": 376, "ZHcy;": 1046, "Zacute;": 377, "Zcaron;": 381, "Zcy;": 1047, "Zdot;": 379, "ZeroWidthSpace;": 8203, "Zeta;": 918, "Zfr;": 8488, "Zopf;": 8484, "Zscr;": [55349, 56501], aacute: 225, "aacute;": 225, "abreve;": 259, "ac;": 8766, "acE;": [8766, 819], "acd;": 8767, acirc: 226, "acirc;": 226, acute: 180, "acute;": 180, "acy;": 1072, aelig: 230, "aelig;": 230, "af;": 8289, "afr;": [55349, 56606], agrave: 224, "agrave;": 224, "alefsym;": 8501, "aleph;": 8501, "alpha;": 945, "amacr;": 257, "amalg;": 10815, amp: 38, "amp;": 38, "and;": 8743, "andand;": 10837, "andd;": 10844, "andslope;": 10840, "andv;": 10842, "ang;": 8736, "ange;": 10660, "angle;": 8736, "angmsd;": 8737, "angmsdaa;": 10664, "angmsdab;": 10665, "angmsdac;": 10666, "angmsdad;": 10667, "angmsdae;": 10668, "angmsdaf;": 10669, "angmsdag;": 10670, "angmsdah;": 10671, "angrt;": 8735, "angrtvb;": 8894, "angrtvbd;": 10653, "angsph;": 8738, "angst;": 197, "angzarr;": 9084, "aogon;": 261, "aopf;": [55349, 56658], "ap;": 8776, "apE;": 10864, "apacir;": 10863, "ape;": 8778, "apid;": 8779, "apos;": 39, "approx;": 8776, "approxeq;": 8778, aring: 229, "aring;": 229, "ascr;": [55349, 56502], "ast;": 42, "asymp;": 8776, "asympeq;": 8781, atilde: 227, "atilde;": 227, auml: 228, "auml;": 228, "awconint;": 8755, "awint;": 10769, "bNot;": 10989, "backcong;": 8780, "backepsilon;": 1014, "backprime;": 8245, "backsim;": 8765, "backsimeq;": 8909, "barvee;": 8893, "barwed;": 8965, "barwedge;": 8965, "bbrk;": 9141, "bbrktbrk;": 9142, "bcong;": 8780, "bcy;": 1073, "bdquo;": 8222, "becaus;": 8757, "because;": 8757, "bemptyv;": 10672, "bepsi;": 1014, "bernou;": 8492, "beta;": 946, "beth;": 8502, "between;": 8812, "bfr;": [55349, 56607], "bigcap;": 8898, "bigcirc;": 9711, "bigcup;": 8899, "bigodot;": 10752, "bigoplus;": 10753, "bigotimes;": 10754, "bigsqcup;": 10758, "bigstar;": 9733, "bigtriangledown;": 9661, "bigtriangleup;": 9651, "biguplus;": 10756, "bigvee;": 8897, "bigwedge;": 8896, "bkarow;": 10509, "blacklozenge;": 10731, "blacksquare;": 9642, "blacktriangle;": 9652, "blacktriangledown;": 9662, "blacktriangleleft;": 9666, "blacktriangleright;": 9656, "blank;": 9251, "blk12;": 9618, "blk14;": 9617, "blk34;": 9619, "block;": 9608, "bne;": [61, 8421], "bnequiv;": [8801, 8421], "bnot;": 8976, "bopf;": [55349, 56659], "bot;": 8869, "bottom;": 8869, "bowtie;": 8904, "boxDL;": 9559, "boxDR;": 9556, "boxDl;": 9558, "boxDr;": 9555, "boxH;": 9552, "boxHD;": 9574, "boxHU;": 9577, "boxHd;": 9572, "boxHu;": 9575, "boxUL;": 9565, "boxUR;": 9562, "boxUl;": 9564, "boxUr;": 9561, "boxV;": 9553, "boxVH;": 9580, "boxVL;": 9571, "boxVR;": 9568, "boxVh;": 9579, "boxVl;": 9570, "boxVr;": 9567, "boxbox;": 10697, "boxdL;": 9557, "boxdR;": 9554, "boxdl;": 9488, "boxdr;": 9484, "boxh;": 9472, "boxhD;": 9573, "boxhU;": 9576, "boxhd;": 9516, "boxhu;": 9524, "boxminus;": 8863, "boxplus;": 8862, "boxtimes;": 8864, "boxuL;": 9563, "boxuR;": 9560, "boxul;": 9496, "boxur;": 9492, "boxv;": 9474, "boxvH;": 9578, "boxvL;": 9569, "boxvR;": 9566, "boxvh;": 9532, "boxvl;": 9508, "boxvr;": 9500, "bprime;": 8245, "breve;": 728, brvbar: 166, "brvbar;": 166, "bscr;": [55349, 56503], "bsemi;": 8271, "bsim;": 8765, "bsime;": 8909, "bsol;": 92, "bsolb;": 10693, "bsolhsub;": 10184, "bull;": 8226, "bullet;": 8226, "bump;": 8782, "bumpE;": 10926, "bumpe;": 8783, "bumpeq;": 8783, "cacute;": 263, "cap;": 8745, "capand;": 10820, "capbrcup;": 10825, "capcap;": 10827, "capcup;": 10823, "capdot;": 10816, "caps;": [8745, 65024], "caret;": 8257, "caron;": 711, "ccaps;": 10829, "ccaron;": 269, ccedil: 231, "ccedil;": 231, "ccirc;": 265, "ccups;": 10828, "ccupssm;": 10832, "cdot;": 267, cedil: 184, "cedil;": 184, "cemptyv;": 10674, cent: 162, "cent;": 162, "centerdot;": 183, "cfr;": [55349, 56608], "chcy;": 1095, "check;": 10003, "checkmark;": 10003, "chi;": 967, "cir;": 9675, "cirE;": 10691, "circ;": 710, "circeq;": 8791, "circlearrowleft;": 8634, "circlearrowright;": 8635, "circledR;": 174, "circledS;": 9416, "circledast;": 8859, "circledcirc;": 8858, "circleddash;": 8861, "cire;": 8791, "cirfnint;": 10768, "cirmid;": 10991, "cirscir;": 10690, "clubs;": 9827, "clubsuit;": 9827, "colon;": 58, "colone;": 8788, "coloneq;": 8788, "comma;": 44, "commat;": 64, "comp;": 8705, "compfn;": 8728, "complement;": 8705, "complexes;": 8450, "cong;": 8773, "congdot;": 10861, "conint;": 8750, "copf;": [55349, 56660], "coprod;": 8720, copy: 169, "copy;": 169, "copysr;": 8471, "crarr;": 8629, "cross;": 10007, "cscr;": [55349, 56504], "csub;": 10959, "csube;": 10961, "csup;": 10960, "csupe;": 10962, "ctdot;": 8943, "cudarrl;": 10552, "cudarrr;": 10549, "cuepr;": 8926, "cuesc;": 8927, "cularr;": 8630, "cularrp;": 10557, "cup;": 8746, "cupbrcap;": 10824, "cupcap;": 10822, "cupcup;": 10826, "cupdot;": 8845, "cupor;": 10821, "cups;": [8746, 65024], "curarr;": 8631, "curarrm;": 10556, "curlyeqprec;": 8926, "curlyeqsucc;": 8927, "curlyvee;": 8910, "curlywedge;": 8911, curren: 164, "curren;": 164, "curvearrowleft;": 8630, "curvearrowright;": 8631, "cuvee;": 8910, "cuwed;": 8911, "cwconint;": 8754, "cwint;": 8753, "cylcty;": 9005, "dArr;": 8659, "dHar;": 10597, "dagger;": 8224, "daleth;": 8504, "darr;": 8595, "dash;": 8208, "dashv;": 8867, "dbkarow;": 10511, "dblac;": 733, "dcaron;": 271, "dcy;": 1076, "dd;": 8518, "ddagger;": 8225, "ddarr;": 8650, "ddotseq;": 10871, deg: 176, "deg;": 176, "delta;": 948, "demptyv;": 10673, "dfisht;": 10623, "dfr;": [55349, 56609], "dharl;": 8643, "dharr;": 8642, "diam;": 8900, "diamond;": 8900, "diamondsuit;": 9830, "diams;": 9830, "die;": 168, "digamma;": 989, "disin;": 8946, "div;": 247, divide: 247, "divide;": 247, "divideontimes;": 8903, "divonx;": 8903, "djcy;": 1106, "dlcorn;": 8990, "dlcrop;": 8973, "dollar;": 36, "dopf;": [55349, 56661], "dot;": 729, "doteq;": 8784, "doteqdot;": 8785, "dotminus;": 8760, "dotplus;": 8724, "dotsquare;": 8865, "doublebarwedge;": 8966, "downarrow;": 8595, "downdownarrows;": 8650, "downharpoonleft;": 8643, "downharpoonright;": 8642, "drbkarow;": 10512, "drcorn;": 8991, "drcrop;": 8972, "dscr;": [55349, 56505], "dscy;": 1109, "dsol;": 10742, "dstrok;": 273, "dtdot;": 8945, "dtri;": 9663, "dtrif;": 9662, "duarr;": 8693, "duhar;": 10607, "dwangle;": 10662, "dzcy;": 1119, "dzigrarr;": 10239, "eDDot;": 10871, "eDot;": 8785, eacute: 233, "eacute;": 233, "easter;": 10862, "ecaron;": 283, "ecir;": 8790, ecirc: 234, "ecirc;": 234, "ecolon;": 8789, "ecy;": 1101, "edot;": 279, "ee;": 8519, "efDot;": 8786, "efr;": [55349, 56610], "eg;": 10906, egrave: 232, "egrave;": 232, "egs;": 10902, "egsdot;": 10904, "el;": 10905, "elinters;": 9191, "ell;": 8467, "els;": 10901, "elsdot;": 10903, "emacr;": 275, "empty;": 8709, "emptyset;": 8709, "emptyv;": 8709, "emsp13;": 8196, "emsp14;": 8197, "emsp;": 8195, "eng;": 331, "ensp;": 8194, "eogon;": 281, "eopf;": [55349, 56662], "epar;": 8917, "eparsl;": 10723, "eplus;": 10865, "epsi;": 949, "epsilon;": 949, "epsiv;": 1013, "eqcirc;": 8790, "eqcolon;": 8789, "eqsim;": 8770, "eqslantgtr;": 10902, "eqslantless;": 10901, "equals;": 61, "equest;": 8799, "equiv;": 8801, "equivDD;": 10872, "eqvparsl;": 10725, "erDot;": 8787, "erarr;": 10609, "escr;": 8495, "esdot;": 8784, "esim;": 8770, "eta;": 951, eth: 240, "eth;": 240, euml: 235, "euml;": 235, "euro;": 8364, "excl;": 33, "exist;": 8707, "expectation;": 8496, "exponentiale;": 8519, "fallingdotseq;": 8786, "fcy;": 1092, "female;": 9792, "ffilig;": 64259, "fflig;": 64256, "ffllig;": 64260, "ffr;": [55349, 56611], "filig;": 64257, "fjlig;": [102, 106], "flat;": 9837, "fllig;": 64258, "fltns;": 9649, "fnof;": 402, "fopf;": [55349, 56663], "forall;": 8704, "fork;": 8916, "forkv;": 10969, "fpartint;": 10765, frac12: 189, "frac12;": 189, "frac13;": 8531, frac14: 188, "frac14;": 188, "frac15;": 8533, "frac16;": 8537, "frac18;": 8539, "frac23;": 8532, "frac25;": 8534, frac34: 190, "frac34;": 190, "frac35;": 8535, "frac38;": 8540, "frac45;": 8536, "frac56;": 8538, "frac58;": 8541, "frac78;": 8542, "frasl;": 8260, "frown;": 8994, "fscr;": [55349, 56507], "gE;": 8807, "gEl;": 10892, "gacute;": 501, "gamma;": 947, "gammad;": 989, "gap;": 10886, "gbreve;": 287, "gcirc;": 285, "gcy;": 1075, "gdot;": 289, "ge;": 8805, "gel;": 8923, "geq;": 8805, "geqq;": 8807, "geqslant;": 10878, "ges;": 10878, "gescc;": 10921, "gesdot;": 10880, "gesdoto;": 10882, "gesdotol;": 10884, "gesl;": [8923, 65024], "gesles;": 10900, "gfr;": [55349, 56612], "gg;": 8811, "ggg;": 8921, "gimel;": 8503, "gjcy;": 1107, "gl;": 8823, "glE;": 10898, "gla;": 10917, "glj;": 10916, "gnE;": 8809, "gnap;": 10890, "gnapprox;": 10890, "gne;": 10888, "gneq;": 10888, "gneqq;": 8809, "gnsim;": 8935, "gopf;": [55349, 56664], "grave;": 96, "gscr;": 8458, "gsim;": 8819, "gsime;": 10894, "gsiml;": 10896, gt: 62, "gt;": 62, "gtcc;": 10919, "gtcir;": 10874, "gtdot;": 8919, "gtlPar;": 10645, "gtquest;": 10876, "gtrapprox;": 10886, "gtrarr;": 10616, "gtrdot;": 8919, "gtreqless;": 8923, "gtreqqless;": 10892, "gtrless;": 8823, "gtrsim;": 8819, "gvertneqq;": [8809, 65024], "gvnE;": [8809, 65024], "hArr;": 8660, "hairsp;": 8202, "half;": 189, "hamilt;": 8459, "hardcy;": 1098, "harr;": 8596, "harrcir;": 10568, "harrw;": 8621, "hbar;": 8463, "hcirc;": 293, "hearts;": 9829, "heartsuit;": 9829, "hellip;": 8230, "hercon;": 8889, "hfr;": [55349, 56613], "hksearow;": 10533, "hkswarow;": 10534, "hoarr;": 8703, "homtht;": 8763, "hookleftarrow;": 8617, "hookrightarrow;": 8618, "hopf;": [55349, 56665], "horbar;": 8213, "hscr;": [55349, 56509], "hslash;": 8463, "hstrok;": 295, "hybull;": 8259, "hyphen;": 8208, iacute: 237, "iacute;": 237, "ic;": 8291, icirc: 238, "icirc;": 238, "icy;": 1080, "iecy;": 1077, iexcl: 161, "iexcl;": 161, "iff;": 8660, "ifr;": [55349, 56614], igrave: 236, "igrave;": 236, "ii;": 8520, "iiiint;": 10764, "iiint;": 8749, "iinfin;": 10716, "iiota;": 8489, "ijlig;": 307, "imacr;": 299, "image;": 8465, "imagline;": 8464, "imagpart;": 8465, "imath;": 305, "imof;": 8887, "imped;": 437, "in;": 8712, "incare;": 8453, "infin;": 8734, "infintie;": 10717, "inodot;": 305, "int;": 8747, "intcal;": 8890, "integers;": 8484, "intercal;": 8890, "intlarhk;": 10775, "intprod;": 10812, "iocy;": 1105, "iogon;": 303, "iopf;": [55349, 56666], "iota;": 953, "iprod;": 10812, iquest: 191, "iquest;": 191, "iscr;": [55349, 56510], "isin;": 8712, "isinE;": 8953, "isindot;": 8949, "isins;": 8948, "isinsv;": 8947, "isinv;": 8712, "it;": 8290, "itilde;": 297, "iukcy;": 1110, iuml: 239, "iuml;": 239, "jcirc;": 309, "jcy;": 1081, "jfr;": [55349, 56615], "jmath;": 567, "jopf;": [55349, 56667], "jscr;": [55349, 56511], "jsercy;": 1112, "jukcy;": 1108, "kappa;": 954, "kappav;": 1008, "kcedil;": 311, "kcy;": 1082, "kfr;": [55349, 56616], "kgreen;": 312, "khcy;": 1093, "kjcy;": 1116, "kopf;": [55349, 56668], "kscr;": [55349, 56512], "lAarr;": 8666, "lArr;": 8656, "lAtail;": 10523, "lBarr;": 10510, "lE;": 8806, "lEg;": 10891, "lHar;": 10594, "lacute;": 314, "laemptyv;": 10676, "lagran;": 8466, "lambda;": 955, "lang;": 10216, "langd;": 10641, "langle;": 10216, "lap;": 10885, laquo: 171, "laquo;": 171, "larr;": 8592, "larrb;": 8676, "larrbfs;": 10527, "larrfs;": 10525, "larrhk;": 8617, "larrlp;": 8619, "larrpl;": 10553, "larrsim;": 10611, "larrtl;": 8610, "lat;": 10923, "latail;": 10521, "late;": 10925, "lates;": [10925, 65024], "lbarr;": 10508, "lbbrk;": 10098, "lbrace;": 123, "lbrack;": 91, "lbrke;": 10635, "lbrksld;": 10639, "lbrkslu;": 10637, "lcaron;": 318, "lcedil;": 316, "lceil;": 8968, "lcub;": 123, "lcy;": 1083, "ldca;": 10550, "ldquo;": 8220, "ldquor;": 8222, "ldrdhar;": 10599, "ldrushar;": 10571, "ldsh;": 8626, "le;": 8804, "leftarrow;": 8592, "leftarrowtail;": 8610, "leftharpoondown;": 8637, "leftharpoonup;": 8636, "leftleftarrows;": 8647, "leftrightarrow;": 8596, "leftrightarrows;": 8646, "leftrightharpoons;": 8651, "leftrightsquigarrow;": 8621, "leftthreetimes;": 8907, "leg;": 8922, "leq;": 8804, "leqq;": 8806, "leqslant;": 10877, "les;": 10877, "lescc;": 10920, "lesdot;": 10879, "lesdoto;": 10881, "lesdotor;": 10883, "lesg;": [8922, 65024], "lesges;": 10899, "lessapprox;": 10885, "lessdot;": 8918, "lesseqgtr;": 8922, "lesseqqgtr;": 10891, "lessgtr;": 8822, "lesssim;": 8818, "lfisht;": 10620, "lfloor;": 8970, "lfr;": [55349, 56617], "lg;": 8822, "lgE;": 10897, "lhard;": 8637, "lharu;": 8636, "lharul;": 10602, "lhblk;": 9604, "ljcy;": 1113, "ll;": 8810, "llarr;": 8647, "llcorner;": 8990, "llhard;": 10603, "lltri;": 9722, "lmidot;": 320, "lmoust;": 9136, "lmoustache;": 9136, "lnE;": 8808, "lnap;": 10889, "lnapprox;": 10889, "lne;": 10887, "lneq;": 10887, "lneqq;": 8808, "lnsim;": 8934, "loang;": 10220, "loarr;": 8701, "lobrk;": 10214, "longleftarrow;": 10229, "longleftrightarrow;": 10231, "longmapsto;": 10236, "longrightarrow;": 10230, "looparrowleft;": 8619, "looparrowright;": 8620, "lopar;": 10629, "lopf;": [55349, 56669], "loplus;": 10797, "lotimes;": 10804, "lowast;": 8727, "lowbar;": 95, "loz;": 9674, "lozenge;": 9674, "lozf;": 10731, "lpar;": 40, "lparlt;": 10643, "lrarr;": 8646, "lrcorner;": 8991, "lrhar;": 8651, "lrhard;": 10605, "lrm;": 8206, "lrtri;": 8895, "lsaquo;": 8249, "lscr;": [55349, 56513], "lsh;": 8624, "lsim;": 8818, "lsime;": 10893, "lsimg;": 10895, "lsqb;": 91, "lsquo;": 8216, "lsquor;": 8218, "lstrok;": 322, lt: 60, "lt;": 60, "ltcc;": 10918, "ltcir;": 10873, "ltdot;": 8918, "lthree;": 8907, "ltimes;": 8905, "ltlarr;": 10614, "ltquest;": 10875, "ltrPar;": 10646, "ltri;": 9667, "ltrie;": 8884, "ltrif;": 9666, "lurdshar;": 10570, "luruhar;": 10598, "lvertneqq;": [8808, 65024], "lvnE;": [8808, 65024], "mDDot;": 8762, macr: 175, "macr;": 175, "male;": 9794, "malt;": 10016, "maltese;": 10016, "map;": 8614, "mapsto;": 8614, "mapstodown;": 8615, "mapstoleft;": 8612, "mapstoup;": 8613, "marker;": 9646, "mcomma;": 10793, "mcy;": 1084, "mdash;": 8212, "measuredangle;": 8737, "mfr;": [55349, 56618], "mho;": 8487, micro: 181, "micro;": 181, "mid;": 8739, "midast;": 42, "midcir;": 10992, middot: 183, "middot;": 183, "minus;": 8722, "minusb;": 8863, "minusd;": 8760, "minusdu;": 10794, "mlcp;": 10971, "mldr;": 8230, "mnplus;": 8723, "models;": 8871, "mopf;": [55349, 56670], "mp;": 8723, "mscr;": [55349, 56514], "mstpos;": 8766, "mu;": 956, "multimap;": 8888, "mumap;": 8888, "nGg;": [8921, 824], "nGt;": [8811, 8402], "nGtv;": [8811, 824], "nLeftarrow;": 8653, "nLeftrightarrow;": 8654, "nLl;": [8920, 824], "nLt;": [8810, 8402], "nLtv;": [8810, 824], "nRightarrow;": 8655, "nVDash;": 8879, "nVdash;": 8878, "nabla;": 8711, "nacute;": 324, "nang;": [8736, 8402], "nap;": 8777, "napE;": [10864, 824], "napid;": [8779, 824], "napos;": 329, "napprox;": 8777, "natur;": 9838, "natural;": 9838, "naturals;": 8469, nbsp: 160, "nbsp;": 160, "nbump;": [8782, 824], "nbumpe;": [8783, 824], "ncap;": 10819, "ncaron;": 328, "ncedil;": 326, "ncong;": 8775, "ncongdot;": [10861, 824], "ncup;": 10818, "ncy;": 1085, "ndash;": 8211, "ne;": 8800, "neArr;": 8663, "nearhk;": 10532, "nearr;": 8599, "nearrow;": 8599, "nedot;": [8784, 824], "nequiv;": 8802, "nesear;": 10536, "nesim;": [8770, 824], "nexist;": 8708, "nexists;": 8708, "nfr;": [55349, 56619], "ngE;": [8807, 824], "nge;": 8817, "ngeq;": 8817, "ngeqq;": [8807, 824], "ngeqslant;": [10878, 824], "nges;": [10878, 824], "ngsim;": 8821, "ngt;": 8815, "ngtr;": 8815, "nhArr;": 8654, "nharr;": 8622, "nhpar;": 10994, "ni;": 8715, "nis;": 8956, "nisd;": 8954, "niv;": 8715, "njcy;": 1114, "nlArr;": 8653, "nlE;": [8806, 824], "nlarr;": 8602, "nldr;": 8229, "nle;": 8816, "nleftarrow;": 8602, "nleftrightarrow;": 8622, "nleq;": 8816, "nleqq;": [8806, 824], "nleqslant;": [10877, 824], "nles;": [10877, 824], "nless;": 8814, "nlsim;": 8820, "nlt;": 8814, "nltri;": 8938, "nltrie;": 8940, "nmid;": 8740, "nopf;": [55349, 56671], not: 172, "not;": 172, "notin;": 8713, "notinE;": [8953, 824], "notindot;": [8949, 824], "notinva;": 8713, "notinvb;": 8951, "notinvc;": 8950, "notni;": 8716, "notniva;": 8716, "notnivb;": 8958, "notnivc;": 8957, "npar;": 8742, "nparallel;": 8742, "nparsl;": [11005, 8421], "npart;": [8706, 824], "npolint;": 10772, "npr;": 8832, "nprcue;": 8928, "npre;": [10927, 824], "nprec;": 8832, "npreceq;": [10927, 824], "nrArr;": 8655, "nrarr;": 8603, "nrarrc;": [10547, 824], "nrarrw;": [8605, 824], "nrightarrow;": 8603, "nrtri;": 8939, "nrtrie;": 8941, "nsc;": 8833, "nsccue;": 8929, "nsce;": [10928, 824], "nscr;": [55349, 56515], "nshortmid;": 8740, "nshortparallel;": 8742, "nsim;": 8769, "nsime;": 8772, "nsimeq;": 8772, "nsmid;": 8740, "nspar;": 8742, "nsqsube;": 8930, "nsqsupe;": 8931, "nsub;": 8836, "nsubE;": [10949, 824], "nsube;": 8840, "nsubset;": [8834, 8402], "nsubseteq;": 8840, "nsubseteqq;": [10949, 824], "nsucc;": 8833, "nsucceq;": [10928, 824], "nsup;": 8837, "nsupE;": [10950, 824], "nsupe;": 8841, "nsupset;": [8835, 8402], "nsupseteq;": 8841, "nsupseteqq;": [10950, 824], "ntgl;": 8825, ntilde: 241, "ntilde;": 241, "ntlg;": 8824, "ntriangleleft;": 8938, "ntrianglelefteq;": 8940, "ntriangleright;": 8939, "ntrianglerighteq;": 8941, "nu;": 957, "num;": 35, "numero;": 8470, "numsp;": 8199, "nvDash;": 8877, "nvHarr;": 10500, "nvap;": [8781, 8402], "nvdash;": 8876, "nvge;": [8805, 8402], "nvgt;": [62, 8402], "nvinfin;": 10718, "nvlArr;": 10498, "nvle;": [8804, 8402], "nvlt;": [60, 8402], "nvltrie;": [8884, 8402], "nvrArr;": 10499, "nvrtrie;": [8885, 8402], "nvsim;": [8764, 8402], "nwArr;": 8662, "nwarhk;": 10531, "nwarr;": 8598, "nwarrow;": 8598, "nwnear;": 10535, "oS;": 9416, oacute: 243, "oacute;": 243, "oast;": 8859, "ocir;": 8858, ocirc: 244, "ocirc;": 244, "ocy;": 1086, "odash;": 8861, "odblac;": 337, "odiv;": 10808, "odot;": 8857, "odsold;": 10684, "oelig;": 339, "ofcir;": 10687, "ofr;": [55349, 56620], "ogon;": 731, ograve: 242, "ograve;": 242, "ogt;": 10689, "ohbar;": 10677, "ohm;": 937, "oint;": 8750, "olarr;": 8634, "olcir;": 10686, "olcross;": 10683, "oline;": 8254, "olt;": 10688, "omacr;": 333, "omega;": 969, "omicron;": 959, "omid;": 10678, "ominus;": 8854, "oopf;": [55349, 56672], "opar;": 10679, "operp;": 10681, "oplus;": 8853, "or;": 8744, "orarr;": 8635, "ord;": 10845, "order;": 8500, "orderof;": 8500, ordf: 170, "ordf;": 170, ordm: 186, "ordm;": 186, "origof;": 8886, "oror;": 10838, "orslope;": 10839, "orv;": 10843, "oscr;": 8500, oslash: 248, "oslash;": 248, "osol;": 8856, otilde: 245, "otilde;": 245, "otimes;": 8855, "otimesas;": 10806, ouml: 246, "ouml;": 246, "ovbar;": 9021, "par;": 8741, para: 182, "para;": 182, "parallel;": 8741, "parsim;": 10995, "parsl;": 11005, "part;": 8706, "pcy;": 1087, "percnt;": 37, "period;": 46, "permil;": 8240, "perp;": 8869, "pertenk;": 8241, "pfr;": [55349, 56621], "phi;": 966, "phiv;": 981, "phmmat;": 8499, "phone;": 9742, "pi;": 960, "pitchfork;": 8916, "piv;": 982, "planck;": 8463, "planckh;": 8462, "plankv;": 8463, "plus;": 43, "plusacir;": 10787, "plusb;": 8862, "pluscir;": 10786, "plusdo;": 8724, "plusdu;": 10789, "pluse;": 10866, plusmn: 177, "plusmn;": 177, "plussim;": 10790, "plustwo;": 10791, "pm;": 177, "pointint;": 10773, "popf;": [55349, 56673], pound: 163, "pound;": 163, "pr;": 8826, "prE;": 10931, "prap;": 10935, "prcue;": 8828, "pre;": 10927, "prec;": 8826, "precapprox;": 10935, "preccurlyeq;": 8828, "preceq;": 10927, "precnapprox;": 10937, "precneqq;": 10933, "precnsim;": 8936, "precsim;": 8830, "prime;": 8242, "primes;": 8473, "prnE;": 10933, "prnap;": 10937, "prnsim;": 8936, "prod;": 8719, "profalar;": 9006, "profline;": 8978, "profsurf;": 8979, "prop;": 8733, "propto;": 8733, "prsim;": 8830, "prurel;": 8880, "pscr;": [55349, 56517], "psi;": 968, "puncsp;": 8200, "qfr;": [55349, 56622], "qint;": 10764, "qopf;": [55349, 56674], "qprime;": 8279, "qscr;": [55349, 56518], "quaternions;": 8461, "quatint;": 10774, "quest;": 63, "questeq;": 8799, quot: 34, "quot;": 34, "rAarr;": 8667, "rArr;": 8658, "rAtail;": 10524, "rBarr;": 10511, "rHar;": 10596, "race;": [8765, 817], "racute;": 341, "radic;": 8730, "raemptyv;": 10675, "rang;": 10217, "rangd;": 10642, "range;": 10661, "rangle;": 10217, raquo: 187, "raquo;": 187, "rarr;": 8594, "rarrap;": 10613, "rarrb;": 8677, "rarrbfs;": 10528, "rarrc;": 10547, "rarrfs;": 10526, "rarrhk;": 8618, "rarrlp;": 8620, "rarrpl;": 10565, "rarrsim;": 10612, "rarrtl;": 8611, "rarrw;": 8605, "ratail;": 10522, "ratio;": 8758, "rationals;": 8474, "rbarr;": 10509, "rbbrk;": 10099, "rbrace;": 125, "rbrack;": 93, "rbrke;": 10636, "rbrksld;": 10638, "rbrkslu;": 10640, "rcaron;": 345, "rcedil;": 343, "rceil;": 8969, "rcub;": 125, "rcy;": 1088, "rdca;": 10551, "rdldhar;": 10601, "rdquo;": 8221, "rdquor;": 8221, "rdsh;": 8627, "real;": 8476, "realine;": 8475, "realpart;": 8476, "reals;": 8477, "rect;": 9645, reg: 174, "reg;": 174, "rfisht;": 10621, "rfloor;": 8971, "rfr;": [55349, 56623], "rhard;": 8641, "rharu;": 8640, "rharul;": 10604, "rho;": 961, "rhov;": 1009, "rightarrow;": 8594, "rightarrowtail;": 8611, "rightharpoondown;": 8641, "rightharpoonup;": 8640, "rightleftarrows;": 8644, "rightleftharpoons;": 8652, "rightrightarrows;": 8649, "rightsquigarrow;": 8605, "rightthreetimes;": 8908, "ring;": 730, "risingdotseq;": 8787, "rlarr;": 8644, "rlhar;": 8652, "rlm;": 8207, "rmoust;": 9137, "rmoustache;": 9137, "rnmid;": 10990, "roang;": 10221, "roarr;": 8702, "robrk;": 10215, "ropar;": 10630, "ropf;": [55349, 56675], "roplus;": 10798, "rotimes;": 10805, "rpar;": 41, "rpargt;": 10644, "rppolint;": 10770, "rrarr;": 8649, "rsaquo;": 8250, "rscr;": [55349, 56519], "rsh;": 8625, "rsqb;": 93, "rsquo;": 8217, "rsquor;": 8217, "rthree;": 8908, "rtimes;": 8906, "rtri;": 9657, "rtrie;": 8885, "rtrif;": 9656, "rtriltri;": 10702, "ruluhar;": 10600, "rx;": 8478, "sacute;": 347, "sbquo;": 8218, "sc;": 8827, "scE;": 10932, "scap;": 10936, "scaron;": 353, "sccue;": 8829, "sce;": 10928, "scedil;": 351, "scirc;": 349, "scnE;": 10934, "scnap;": 10938, "scnsim;": 8937, "scpolint;": 10771, "scsim;": 8831, "scy;": 1089, "sdot;": 8901, "sdotb;": 8865, "sdote;": 10854, "seArr;": 8664, "searhk;": 10533, "searr;": 8600, "searrow;": 8600, sect: 167, "sect;": 167, "semi;": 59, "seswar;": 10537, "setminus;": 8726, "setmn;": 8726, "sext;": 10038, "sfr;": [55349, 56624], "sfrown;": 8994, "sharp;": 9839, "shchcy;": 1097, "shcy;": 1096, "shortmid;": 8739, "shortparallel;": 8741, shy: 173, "shy;": 173, "sigma;": 963, "sigmaf;": 962, "sigmav;": 962, "sim;": 8764, "simdot;": 10858, "sime;": 8771, "simeq;": 8771, "simg;": 10910, "simgE;": 10912, "siml;": 10909, "simlE;": 10911, "simne;": 8774, "simplus;": 10788, "simrarr;": 10610, "slarr;": 8592, "smallsetminus;": 8726, "smashp;": 10803, "smeparsl;": 10724, "smid;": 8739, "smile;": 8995, "smt;": 10922, "smte;": 10924, "smtes;": [10924, 65024], "softcy;": 1100, "sol;": 47, "solb;": 10692, "solbar;": 9023, "sopf;": [55349, 56676], "spades;": 9824, "spadesuit;": 9824, "spar;": 8741, "sqcap;": 8851, "sqcaps;": [8851, 65024], "sqcup;": 8852, "sqcups;": [8852, 65024], "sqsub;": 8847, "sqsube;": 8849, "sqsubset;": 8847, "sqsubseteq;": 8849, "sqsup;": 8848, "sqsupe;": 8850, "sqsupset;": 8848, "sqsupseteq;": 8850, "squ;": 9633, "square;": 9633, "squarf;": 9642, "squf;": 9642, "srarr;": 8594, "sscr;": [55349, 56520], "ssetmn;": 8726, "ssmile;": 8995, "sstarf;": 8902, "star;": 9734, "starf;": 9733, "straightepsilon;": 1013, "straightphi;": 981, "strns;": 175, "sub;": 8834, "subE;": 10949, "subdot;": 10941, "sube;": 8838, "subedot;": 10947, "submult;": 10945, "subnE;": 10955, "subne;": 8842, "subplus;": 10943, "subrarr;": 10617, "subset;": 8834, "subseteq;": 8838, "subseteqq;": 10949, "subsetneq;": 8842, "subsetneqq;": 10955, "subsim;": 10951, "subsub;": 10965, "subsup;": 10963, "succ;": 8827, "succapprox;": 10936, "succcurlyeq;": 8829, "succeq;": 10928, "succnapprox;": 10938, "succneqq;": 10934, "succnsim;": 8937, "succsim;": 8831, "sum;": 8721, "sung;": 9834, sup1: 185, "sup1;": 185, sup2: 178, "sup2;": 178, sup3: 179, "sup3;": 179, "sup;": 8835, "supE;": 10950, "supdot;": 10942, "supdsub;": 10968, "supe;": 8839, "supedot;": 10948, "suphsol;": 10185, "suphsub;": 10967, "suplarr;": 10619, "supmult;": 10946, "supnE;": 10956, "supne;": 8843, "supplus;": 10944, "supset;": 8835, "supseteq;": 8839, "supseteqq;": 10950, "supsetneq;": 8843, "supsetneqq;": 10956, "supsim;": 10952, "supsub;": 10964, "supsup;": 10966, "swArr;": 8665, "swarhk;": 10534, "swarr;": 8601, "swarrow;": 8601, "swnwar;": 10538, szlig: 223, "szlig;": 223, "target;": 8982, "tau;": 964, "tbrk;": 9140, "tcaron;": 357, "tcedil;": 355, "tcy;": 1090, "tdot;": 8411, "telrec;": 8981, "tfr;": [55349, 56625], "there4;": 8756, "therefore;": 8756, "theta;": 952, "thetasym;": 977, "thetav;": 977, "thickapprox;": 8776, "thicksim;": 8764, "thinsp;": 8201, "thkap;": 8776, "thksim;": 8764, thorn: 254, "thorn;": 254, "tilde;": 732, times: 215, "times;": 215, "timesb;": 8864, "timesbar;": 10801, "timesd;": 10800, "tint;": 8749, "toea;": 10536, "top;": 8868, "topbot;": 9014, "topcir;": 10993, "topf;": [55349, 56677], "topfork;": 10970, "tosa;": 10537, "tprime;": 8244, "trade;": 8482, "triangle;": 9653, "triangledown;": 9663, "triangleleft;": 9667, "trianglelefteq;": 8884, "triangleq;": 8796, "triangleright;": 9657, "trianglerighteq;": 8885, "tridot;": 9708, "trie;": 8796, "triminus;": 10810, "triplus;": 10809, "trisb;": 10701, "tritime;": 10811, "trpezium;": 9186, "tscr;": [55349, 56521], "tscy;": 1094, "tshcy;": 1115, "tstrok;": 359, "twixt;": 8812, "twoheadleftarrow;": 8606, "twoheadrightarrow;": 8608, "uArr;": 8657, "uHar;": 10595, uacute: 250, "uacute;": 250, "uarr;": 8593, "ubrcy;": 1118, "ubreve;": 365, ucirc: 251, "ucirc;": 251, "ucy;": 1091, "udarr;": 8645, "udblac;": 369, "udhar;": 10606, "ufisht;": 10622, "ufr;": [55349, 56626], ugrave: 249, "ugrave;": 249, "uharl;": 8639, "uharr;": 8638, "uhblk;": 9600, "ulcorn;": 8988, "ulcorner;": 8988, "ulcrop;": 8975, "ultri;": 9720, "umacr;": 363, uml: 168, "uml;": 168, "uogon;": 371, "uopf;": [55349, 56678], "uparrow;": 8593, "updownarrow;": 8597, "upharpoonleft;": 8639, "upharpoonright;": 8638, "uplus;": 8846, "upsi;": 965, "upsih;": 978, "upsilon;": 965, "upuparrows;": 8648, "urcorn;": 8989, "urcorner;": 8989, "urcrop;": 8974, "uring;": 367, "urtri;": 9721, "uscr;": [55349, 56522], "utdot;": 8944, "utilde;": 361, "utri;": 9653, "utrif;": 9652, "uuarr;": 8648, uuml: 252, "uuml;": 252, "uwangle;": 10663, "vArr;": 8661, "vBar;": 10984, "vBarv;": 10985, "vDash;": 8872, "vangrt;": 10652, "varepsilon;": 1013, "varkappa;": 1008, "varnothing;": 8709, "varphi;": 981, "varpi;": 982, "varpropto;": 8733, "varr;": 8597, "varrho;": 1009, "varsigma;": 962, "varsubsetneq;": [8842, 65024], "varsubsetneqq;": [10955, 65024], "varsupsetneq;": [8843, 65024], "varsupsetneqq;": [10956, 65024], "vartheta;": 977, "vartriangleleft;": 8882, "vartriangleright;": 8883, "vcy;": 1074, "vdash;": 8866, "vee;": 8744, "veebar;": 8891, "veeeq;": 8794, "vellip;": 8942, "verbar;": 124, "vert;": 124, "vfr;": [55349, 56627], "vltri;": 8882, "vnsub;": [8834, 8402], "vnsup;": [8835, 8402], "vopf;": [55349, 56679], "vprop;": 8733, "vrtri;": 8883, "vscr;": [55349, 56523], "vsubnE;": [10955, 65024], "vsubne;": [8842, 65024], "vsupnE;": [10956, 65024], "vsupne;": [8843, 65024], "vzigzag;": 10650, "wcirc;": 373, "wedbar;": 10847, "wedge;": 8743, "wedgeq;": 8793, "weierp;": 8472, "wfr;": [55349, 56628], "wopf;": [55349, 56680], "wp;": 8472, "wr;": 8768, "wreath;": 8768, "wscr;": [55349, 56524], "xcap;": 8898, "xcirc;": 9711, "xcup;": 8899, "xdtri;": 9661, "xfr;": [55349, 56629], "xhArr;": 10234, "xharr;": 10231, "xi;": 958, "xlArr;": 10232, "xlarr;": 10229, "xmap;": 10236, "xnis;": 8955, "xodot;": 10752, "xopf;": [55349, 56681], "xoplus;": 10753, "xotime;": 10754, "xrArr;": 10233, "xrarr;": 10230, "xscr;": [55349, 56525], "xsqcup;": 10758, "xuplus;": 10756, "xutri;": 9651, "xvee;": 8897, "xwedge;": 8896, yacute: 253, "yacute;": 253, "yacy;": 1103, "ycirc;": 375, "ycy;": 1099, yen: 165, "yen;": 165, "yfr;": [55349, 56630], "yicy;": 1111, "yopf;": [55349, 56682], "yscr;": [55349, 56526], "yucy;": 1102, yuml: 255, "yuml;": 255, "zacute;": 378, "zcaron;": 382, "zcy;": 1079, "zdot;": 380, "zeetrf;": 8488, "zeta;": 950, "zfr;": [55349, 56631], "zhcy;": 1078, "zigrarr;": 8669, "zopf;": [55349, 56683], "zscr;": [55349, 56527], "zwj;": 8205, "zwnj;": 8204 }, ic = /(A(?:Elig;?|MP;?|acute;?|breve;|c(?:irc;?|y;)|fr;|grave;?|lpha;|macr;|nd;|o(?:gon;|pf;)|pplyFunction;|ring;?|s(?:cr;|sign;)|tilde;?|uml;?)|B(?:a(?:ckslash;|r(?:v;|wed;))|cy;|e(?:cause;|rnoullis;|ta;)|fr;|opf;|reve;|scr;|umpeq;)|C(?:Hcy;|OPY;?|a(?:cute;|p(?:;|italDifferentialD;)|yleys;)|c(?:aron;|edil;?|irc;|onint;)|dot;|e(?:dilla;|nterDot;)|fr;|hi;|ircle(?:Dot;|Minus;|Plus;|Times;)|lo(?:ckwiseContourIntegral;|seCurly(?:DoubleQuote;|Quote;))|o(?:lon(?:;|e;)|n(?:gruent;|int;|tourIntegral;)|p(?:f;|roduct;)|unterClockwiseContourIntegral;)|ross;|scr;|up(?:;|Cap;))|D(?:D(?:;|otrahd;)|Jcy;|Scy;|Zcy;|a(?:gger;|rr;|shv;)|c(?:aron;|y;)|el(?:;|ta;)|fr;|i(?:a(?:critical(?:Acute;|Do(?:t;|ubleAcute;)|Grave;|Tilde;)|mond;)|fferentialD;)|o(?:pf;|t(?:;|Dot;|Equal;)|uble(?:ContourIntegral;|Do(?:t;|wnArrow;)|L(?:eft(?:Arrow;|RightArrow;|Tee;)|ong(?:Left(?:Arrow;|RightArrow;)|RightArrow;))|Right(?:Arrow;|Tee;)|Up(?:Arrow;|DownArrow;)|VerticalBar;)|wn(?:Arrow(?:;|Bar;|UpArrow;)|Breve;|Left(?:RightVector;|TeeVector;|Vector(?:;|Bar;))|Right(?:TeeVector;|Vector(?:;|Bar;))|Tee(?:;|Arrow;)|arrow;))|s(?:cr;|trok;))|E(?:NG;|TH;?|acute;?|c(?:aron;|irc;?|y;)|dot;|fr;|grave;?|lement;|m(?:acr;|pty(?:SmallSquare;|VerySmallSquare;))|o(?:gon;|pf;)|psilon;|qu(?:al(?:;|Tilde;)|ilibrium;)|s(?:cr;|im;)|ta;|uml;?|x(?:ists;|ponentialE;))|F(?:cy;|fr;|illed(?:SmallSquare;|VerySmallSquare;)|o(?:pf;|rAll;|uriertrf;)|scr;)|G(?:Jcy;|T;?|amma(?:;|d;)|breve;|c(?:edil;|irc;|y;)|dot;|fr;|g;|opf;|reater(?:Equal(?:;|Less;)|FullEqual;|Greater;|Less;|SlantEqual;|Tilde;)|scr;|t;)|H(?:ARDcy;|a(?:cek;|t;)|circ;|fr;|ilbertSpace;|o(?:pf;|rizontalLine;)|s(?:cr;|trok;)|ump(?:DownHump;|Equal;))|I(?:Ecy;|Jlig;|Ocy;|acute;?|c(?:irc;?|y;)|dot;|fr;|grave;?|m(?:;|a(?:cr;|ginaryI;)|plies;)|n(?:t(?:;|e(?:gral;|rsection;))|visible(?:Comma;|Times;))|o(?:gon;|pf;|ta;)|scr;|tilde;|u(?:kcy;|ml;?))|J(?:c(?:irc;|y;)|fr;|opf;|s(?:cr;|ercy;)|ukcy;)|K(?:Hcy;|Jcy;|appa;|c(?:edil;|y;)|fr;|opf;|scr;)|L(?:Jcy;|T;?|a(?:cute;|mbda;|ng;|placetrf;|rr;)|c(?:aron;|edil;|y;)|e(?:ft(?:A(?:ngleBracket;|rrow(?:;|Bar;|RightArrow;))|Ceiling;|Do(?:ubleBracket;|wn(?:TeeVector;|Vector(?:;|Bar;)))|Floor;|Right(?:Arrow;|Vector;)|T(?:ee(?:;|Arrow;|Vector;)|riangle(?:;|Bar;|Equal;))|Up(?:DownVector;|TeeVector;|Vector(?:;|Bar;))|Vector(?:;|Bar;)|arrow;|rightarrow;)|ss(?:EqualGreater;|FullEqual;|Greater;|Less;|SlantEqual;|Tilde;))|fr;|l(?:;|eftarrow;)|midot;|o(?:ng(?:Left(?:Arrow;|RightArrow;)|RightArrow;|left(?:arrow;|rightarrow;)|rightarrow;)|pf;|wer(?:LeftArrow;|RightArrow;))|s(?:cr;|h;|trok;)|t;)|M(?:ap;|cy;|e(?:diumSpace;|llintrf;)|fr;|inusPlus;|opf;|scr;|u;)|N(?:Jcy;|acute;|c(?:aron;|edil;|y;)|e(?:gative(?:MediumSpace;|Thi(?:ckSpace;|nSpace;)|VeryThinSpace;)|sted(?:GreaterGreater;|LessLess;)|wLine;)|fr;|o(?:Break;|nBreakingSpace;|pf;|t(?:;|C(?:ongruent;|upCap;)|DoubleVerticalBar;|E(?:lement;|qual(?:;|Tilde;)|xists;)|Greater(?:;|Equal;|FullEqual;|Greater;|Less;|SlantEqual;|Tilde;)|Hump(?:DownHump;|Equal;)|Le(?:ftTriangle(?:;|Bar;|Equal;)|ss(?:;|Equal;|Greater;|Less;|SlantEqual;|Tilde;))|Nested(?:GreaterGreater;|LessLess;)|Precedes(?:;|Equal;|SlantEqual;)|R(?:everseElement;|ightTriangle(?:;|Bar;|Equal;))|S(?:quareSu(?:bset(?:;|Equal;)|perset(?:;|Equal;))|u(?:bset(?:;|Equal;)|cceeds(?:;|Equal;|SlantEqual;|Tilde;)|perset(?:;|Equal;)))|Tilde(?:;|Equal;|FullEqual;|Tilde;)|VerticalBar;))|scr;|tilde;?|u;)|O(?:Elig;|acute;?|c(?:irc;?|y;)|dblac;|fr;|grave;?|m(?:acr;|ega;|icron;)|opf;|penCurly(?:DoubleQuote;|Quote;)|r;|s(?:cr;|lash;?)|ti(?:lde;?|mes;)|uml;?|ver(?:B(?:ar;|rac(?:e;|ket;))|Parenthesis;))|P(?:artialD;|cy;|fr;|hi;|i;|lusMinus;|o(?:incareplane;|pf;)|r(?:;|ecedes(?:;|Equal;|SlantEqual;|Tilde;)|ime;|o(?:duct;|portion(?:;|al;)))|s(?:cr;|i;))|Q(?:UOT;?|fr;|opf;|scr;)|R(?:Barr;|EG;?|a(?:cute;|ng;|rr(?:;|tl;))|c(?:aron;|edil;|y;)|e(?:;|verse(?:E(?:lement;|quilibrium;)|UpEquilibrium;))|fr;|ho;|ight(?:A(?:ngleBracket;|rrow(?:;|Bar;|LeftArrow;))|Ceiling;|Do(?:ubleBracket;|wn(?:TeeVector;|Vector(?:;|Bar;)))|Floor;|T(?:ee(?:;|Arrow;|Vector;)|riangle(?:;|Bar;|Equal;))|Up(?:DownVector;|TeeVector;|Vector(?:;|Bar;))|Vector(?:;|Bar;)|arrow;)|o(?:pf;|undImplies;)|rightarrow;|s(?:cr;|h;)|uleDelayed;)|S(?:H(?:CHcy;|cy;)|OFTcy;|acute;|c(?:;|aron;|edil;|irc;|y;)|fr;|hort(?:DownArrow;|LeftArrow;|RightArrow;|UpArrow;)|igma;|mallCircle;|opf;|q(?:rt;|uare(?:;|Intersection;|Su(?:bset(?:;|Equal;)|perset(?:;|Equal;))|Union;))|scr;|tar;|u(?:b(?:;|set(?:;|Equal;))|c(?:ceeds(?:;|Equal;|SlantEqual;|Tilde;)|hThat;)|m;|p(?:;|erset(?:;|Equal;)|set;)))|T(?:HORN;?|RADE;|S(?:Hcy;|cy;)|a(?:b;|u;)|c(?:aron;|edil;|y;)|fr;|h(?:e(?:refore;|ta;)|i(?:ckSpace;|nSpace;))|ilde(?:;|Equal;|FullEqual;|Tilde;)|opf;|ripleDot;|s(?:cr;|trok;))|U(?:a(?:cute;?|rr(?:;|ocir;))|br(?:cy;|eve;)|c(?:irc;?|y;)|dblac;|fr;|grave;?|macr;|n(?:der(?:B(?:ar;|rac(?:e;|ket;))|Parenthesis;)|ion(?:;|Plus;))|o(?:gon;|pf;)|p(?:Arrow(?:;|Bar;|DownArrow;)|DownArrow;|Equilibrium;|Tee(?:;|Arrow;)|arrow;|downarrow;|per(?:LeftArrow;|RightArrow;)|si(?:;|lon;))|ring;|scr;|tilde;|uml;?)|V(?:Dash;|bar;|cy;|dash(?:;|l;)|e(?:e;|r(?:bar;|t(?:;|ical(?:Bar;|Line;|Separator;|Tilde;))|yThinSpace;))|fr;|opf;|scr;|vdash;)|W(?:circ;|edge;|fr;|opf;|scr;)|X(?:fr;|i;|opf;|scr;)|Y(?:Acy;|Icy;|Ucy;|acute;?|c(?:irc;|y;)|fr;|opf;|scr;|uml;)|Z(?:Hcy;|acute;|c(?:aron;|y;)|dot;|e(?:roWidthSpace;|ta;)|fr;|opf;|scr;)|a(?:acute;?|breve;|c(?:;|E;|d;|irc;?|ute;?|y;)|elig;?|f(?:;|r;)|grave;?|l(?:e(?:fsym;|ph;)|pha;)|m(?:a(?:cr;|lg;)|p;?)|n(?:d(?:;|and;|d;|slope;|v;)|g(?:;|e;|le;|msd(?:;|a(?:a;|b;|c;|d;|e;|f;|g;|h;))|rt(?:;|vb(?:;|d;))|s(?:ph;|t;)|zarr;))|o(?:gon;|pf;)|p(?:;|E;|acir;|e;|id;|os;|prox(?:;|eq;))|ring;?|s(?:cr;|t;|ymp(?:;|eq;))|tilde;?|uml;?|w(?:conint;|int;))|b(?:Not;|a(?:ck(?:cong;|epsilon;|prime;|sim(?:;|eq;))|r(?:vee;|wed(?:;|ge;)))|brk(?:;|tbrk;)|c(?:ong;|y;)|dquo;|e(?:caus(?:;|e;)|mptyv;|psi;|rnou;|t(?:a;|h;|ween;))|fr;|ig(?:c(?:ap;|irc;|up;)|o(?:dot;|plus;|times;)|s(?:qcup;|tar;)|triangle(?:down;|up;)|uplus;|vee;|wedge;)|karow;|l(?:a(?:ck(?:lozenge;|square;|triangle(?:;|down;|left;|right;))|nk;)|k(?:1(?:2;|4;)|34;)|ock;)|n(?:e(?:;|quiv;)|ot;)|o(?:pf;|t(?:;|tom;)|wtie;|x(?:D(?:L;|R;|l;|r;)|H(?:;|D;|U;|d;|u;)|U(?:L;|R;|l;|r;)|V(?:;|H;|L;|R;|h;|l;|r;)|box;|d(?:L;|R;|l;|r;)|h(?:;|D;|U;|d;|u;)|minus;|plus;|times;|u(?:L;|R;|l;|r;)|v(?:;|H;|L;|R;|h;|l;|r;)))|prime;|r(?:eve;|vbar;?)|s(?:cr;|emi;|im(?:;|e;)|ol(?:;|b;|hsub;))|u(?:ll(?:;|et;)|mp(?:;|E;|e(?:;|q;))))|c(?:a(?:cute;|p(?:;|and;|brcup;|c(?:ap;|up;)|dot;|s;)|r(?:et;|on;))|c(?:a(?:ps;|ron;)|edil;?|irc;|ups(?:;|sm;))|dot;|e(?:dil;?|mptyv;|nt(?:;|erdot;|))|fr;|h(?:cy;|eck(?:;|mark;)|i;)|ir(?:;|E;|c(?:;|eq;|le(?:arrow(?:left;|right;)|d(?:R;|S;|ast;|circ;|dash;)))|e;|fnint;|mid;|scir;)|lubs(?:;|uit;)|o(?:lon(?:;|e(?:;|q;))|m(?:ma(?:;|t;)|p(?:;|fn;|le(?:ment;|xes;)))|n(?:g(?:;|dot;)|int;)|p(?:f;|rod;|y(?:;|sr;|)))|r(?:arr;|oss;)|s(?:cr;|u(?:b(?:;|e;)|p(?:;|e;)))|tdot;|u(?:darr(?:l;|r;)|e(?:pr;|sc;)|larr(?:;|p;)|p(?:;|brcap;|c(?:ap;|up;)|dot;|or;|s;)|r(?:arr(?:;|m;)|ly(?:eq(?:prec;|succ;)|vee;|wedge;)|ren;?|vearrow(?:left;|right;))|vee;|wed;)|w(?:conint;|int;)|ylcty;)|d(?:Arr;|Har;|a(?:gger;|leth;|rr;|sh(?:;|v;))|b(?:karow;|lac;)|c(?:aron;|y;)|d(?:;|a(?:gger;|rr;)|otseq;)|e(?:g;?|lta;|mptyv;)|f(?:isht;|r;)|har(?:l;|r;)|i(?:am(?:;|ond(?:;|suit;)|s;)|e;|gamma;|sin;|v(?:;|ide(?:;|ontimes;|)|onx;))|jcy;|lc(?:orn;|rop;)|o(?:llar;|pf;|t(?:;|eq(?:;|dot;)|minus;|plus;|square;)|ublebarwedge;|wn(?:arrow;|downarrows;|harpoon(?:left;|right;)))|r(?:bkarow;|c(?:orn;|rop;))|s(?:c(?:r;|y;)|ol;|trok;)|t(?:dot;|ri(?:;|f;))|u(?:arr;|har;)|wangle;|z(?:cy;|igrarr;))|e(?:D(?:Dot;|ot;)|a(?:cute;?|ster;)|c(?:aron;|ir(?:;|c;?)|olon;|y;)|dot;|e;|f(?:Dot;|r;)|g(?:;|rave;?|s(?:;|dot;))|l(?:;|inters;|l;|s(?:;|dot;))|m(?:acr;|pty(?:;|set;|v;)|sp(?:1(?:3;|4;)|;))|n(?:g;|sp;)|o(?:gon;|pf;)|p(?:ar(?:;|sl;)|lus;|si(?:;|lon;|v;))|q(?:c(?:irc;|olon;)|s(?:im;|lant(?:gtr;|less;))|u(?:als;|est;|iv(?:;|DD;))|vparsl;)|r(?:Dot;|arr;)|s(?:cr;|dot;|im;)|t(?:a;|h;?)|u(?:ml;?|ro;)|x(?:cl;|ist;|p(?:ectation;|onentiale;)))|f(?:allingdotseq;|cy;|emale;|f(?:ilig;|l(?:ig;|lig;)|r;)|ilig;|jlig;|l(?:at;|lig;|tns;)|nof;|o(?:pf;|r(?:all;|k(?:;|v;)))|partint;|r(?:a(?:c(?:1(?:2;?|3;|4;?|5;|6;|8;)|2(?:3;|5;)|3(?:4;?|5;|8;)|45;|5(?:6;|8;)|78;)|sl;)|own;)|scr;)|g(?:E(?:;|l;)|a(?:cute;|mma(?:;|d;)|p;)|breve;|c(?:irc;|y;)|dot;|e(?:;|l;|q(?:;|q;|slant;)|s(?:;|cc;|dot(?:;|o(?:;|l;))|l(?:;|es;)))|fr;|g(?:;|g;)|imel;|jcy;|l(?:;|E;|a;|j;)|n(?:E;|ap(?:;|prox;)|e(?:;|q(?:;|q;))|sim;)|opf;|rave;|s(?:cr;|im(?:;|e;|l;))|t(?:;|c(?:c;|ir;)|dot;|lPar;|quest;|r(?:a(?:pprox;|rr;)|dot;|eq(?:less;|qless;)|less;|sim;)|)|v(?:ertneqq;|nE;))|h(?:Arr;|a(?:irsp;|lf;|milt;|r(?:dcy;|r(?:;|cir;|w;)))|bar;|circ;|e(?:arts(?:;|uit;)|llip;|rcon;)|fr;|ks(?:earow;|warow;)|o(?:arr;|mtht;|ok(?:leftarrow;|rightarrow;)|pf;|rbar;)|s(?:cr;|lash;|trok;)|y(?:bull;|phen;))|i(?:acute;?|c(?:;|irc;?|y;)|e(?:cy;|xcl;?)|f(?:f;|r;)|grave;?|i(?:;|i(?:int;|nt;)|nfin;|ota;)|jlig;|m(?:a(?:cr;|g(?:e;|line;|part;)|th;)|of;|ped;)|n(?:;|care;|fin(?:;|tie;)|odot;|t(?:;|cal;|e(?:gers;|rcal;)|larhk;|prod;))|o(?:cy;|gon;|pf;|ta;)|prod;|quest;?|s(?:cr;|in(?:;|E;|dot;|s(?:;|v;)|v;))|t(?:;|ilde;)|u(?:kcy;|ml;?))|j(?:c(?:irc;|y;)|fr;|math;|opf;|s(?:cr;|ercy;)|ukcy;)|k(?:appa(?:;|v;)|c(?:edil;|y;)|fr;|green;|hcy;|jcy;|opf;|scr;)|l(?:A(?:arr;|rr;|tail;)|Barr;|E(?:;|g;)|Har;|a(?:cute;|emptyv;|gran;|mbda;|ng(?:;|d;|le;)|p;|quo;?|rr(?:;|b(?:;|fs;)|fs;|hk;|lp;|pl;|sim;|tl;)|t(?:;|ail;|e(?:;|s;)))|b(?:arr;|brk;|r(?:ac(?:e;|k;)|k(?:e;|sl(?:d;|u;))))|c(?:aron;|e(?:dil;|il;)|ub;|y;)|d(?:ca;|quo(?:;|r;)|r(?:dhar;|ushar;)|sh;)|e(?:;|ft(?:arrow(?:;|tail;)|harpoon(?:down;|up;)|leftarrows;|right(?:arrow(?:;|s;)|harpoons;|squigarrow;)|threetimes;)|g;|q(?:;|q;|slant;)|s(?:;|cc;|dot(?:;|o(?:;|r;))|g(?:;|es;)|s(?:approx;|dot;|eq(?:gtr;|qgtr;)|gtr;|sim;)))|f(?:isht;|loor;|r;)|g(?:;|E;)|h(?:ar(?:d;|u(?:;|l;))|blk;)|jcy;|l(?:;|arr;|corner;|hard;|tri;)|m(?:idot;|oust(?:;|ache;))|n(?:E;|ap(?:;|prox;)|e(?:;|q(?:;|q;))|sim;)|o(?:a(?:ng;|rr;)|brk;|ng(?:left(?:arrow;|rightarrow;)|mapsto;|rightarrow;)|oparrow(?:left;|right;)|p(?:ar;|f;|lus;)|times;|w(?:ast;|bar;)|z(?:;|enge;|f;))|par(?:;|lt;)|r(?:arr;|corner;|har(?:;|d;)|m;|tri;)|s(?:aquo;|cr;|h;|im(?:;|e;|g;)|q(?:b;|uo(?:;|r;))|trok;)|t(?:;|c(?:c;|ir;)|dot;|hree;|imes;|larr;|quest;|r(?:Par;|i(?:;|e;|f;))|)|ur(?:dshar;|uhar;)|v(?:ertneqq;|nE;))|m(?:DDot;|a(?:cr;?|l(?:e;|t(?:;|ese;))|p(?:;|sto(?:;|down;|left;|up;))|rker;)|c(?:omma;|y;)|dash;|easuredangle;|fr;|ho;|i(?:cro;?|d(?:;|ast;|cir;|dot;?)|nus(?:;|b;|d(?:;|u;)))|l(?:cp;|dr;)|nplus;|o(?:dels;|pf;)|p;|s(?:cr;|tpos;)|u(?:;|ltimap;|map;))|n(?:G(?:g;|t(?:;|v;))|L(?:eft(?:arrow;|rightarrow;)|l;|t(?:;|v;))|Rightarrow;|V(?:Dash;|dash;)|a(?:bla;|cute;|ng;|p(?:;|E;|id;|os;|prox;)|tur(?:;|al(?:;|s;)))|b(?:sp;?|ump(?:;|e;))|c(?:a(?:p;|ron;)|edil;|ong(?:;|dot;)|up;|y;)|dash;|e(?:;|Arr;|ar(?:hk;|r(?:;|ow;))|dot;|quiv;|s(?:ear;|im;)|xist(?:;|s;))|fr;|g(?:E;|e(?:;|q(?:;|q;|slant;)|s;)|sim;|t(?:;|r;))|h(?:Arr;|arr;|par;)|i(?:;|s(?:;|d;)|v;)|jcy;|l(?:Arr;|E;|arr;|dr;|e(?:;|ft(?:arrow;|rightarrow;)|q(?:;|q;|slant;)|s(?:;|s;))|sim;|t(?:;|ri(?:;|e;)))|mid;|o(?:pf;|t(?:;|in(?:;|E;|dot;|v(?:a;|b;|c;))|ni(?:;|v(?:a;|b;|c;))|))|p(?:ar(?:;|allel;|sl;|t;)|olint;|r(?:;|cue;|e(?:;|c(?:;|eq;))))|r(?:Arr;|arr(?:;|c;|w;)|ightarrow;|tri(?:;|e;))|s(?:c(?:;|cue;|e;|r;)|hort(?:mid;|parallel;)|im(?:;|e(?:;|q;))|mid;|par;|qsu(?:be;|pe;)|u(?:b(?:;|E;|e;|set(?:;|eq(?:;|q;)))|cc(?:;|eq;)|p(?:;|E;|e;|set(?:;|eq(?:;|q;)))))|t(?:gl;|ilde;?|lg;|riangle(?:left(?:;|eq;)|right(?:;|eq;)))|u(?:;|m(?:;|ero;|sp;))|v(?:Dash;|Harr;|ap;|dash;|g(?:e;|t;)|infin;|l(?:Arr;|e;|t(?:;|rie;))|r(?:Arr;|trie;)|sim;)|w(?:Arr;|ar(?:hk;|r(?:;|ow;))|near;))|o(?:S;|a(?:cute;?|st;)|c(?:ir(?:;|c;?)|y;)|d(?:ash;|blac;|iv;|ot;|sold;)|elig;|f(?:cir;|r;)|g(?:on;|rave;?|t;)|h(?:bar;|m;)|int;|l(?:arr;|c(?:ir;|ross;)|ine;|t;)|m(?:acr;|ega;|i(?:cron;|d;|nus;))|opf;|p(?:ar;|erp;|lus;)|r(?:;|arr;|d(?:;|er(?:;|of;)|f;?|m;?)|igof;|or;|slope;|v;)|s(?:cr;|lash;?|ol;)|ti(?:lde;?|mes(?:;|as;))|uml;?|vbar;)|p(?:ar(?:;|a(?:;|llel;|)|s(?:im;|l;)|t;)|cy;|er(?:cnt;|iod;|mil;|p;|tenk;)|fr;|h(?:i(?:;|v;)|mmat;|one;)|i(?:;|tchfork;|v;)|l(?:an(?:ck(?:;|h;)|kv;)|us(?:;|acir;|b;|cir;|d(?:o;|u;)|e;|mn;?|sim;|two;))|m;|o(?:intint;|pf;|und;?)|r(?:;|E;|ap;|cue;|e(?:;|c(?:;|approx;|curlyeq;|eq;|n(?:approx;|eqq;|sim;)|sim;))|ime(?:;|s;)|n(?:E;|ap;|sim;)|o(?:d;|f(?:alar;|line;|surf;)|p(?:;|to;))|sim;|urel;)|s(?:cr;|i;)|uncsp;)|q(?:fr;|int;|opf;|prime;|scr;|u(?:at(?:ernions;|int;)|est(?:;|eq;)|ot;?))|r(?:A(?:arr;|rr;|tail;)|Barr;|Har;|a(?:c(?:e;|ute;)|dic;|emptyv;|ng(?:;|d;|e;|le;)|quo;?|rr(?:;|ap;|b(?:;|fs;)|c;|fs;|hk;|lp;|pl;|sim;|tl;|w;)|t(?:ail;|io(?:;|nals;)))|b(?:arr;|brk;|r(?:ac(?:e;|k;)|k(?:e;|sl(?:d;|u;))))|c(?:aron;|e(?:dil;|il;)|ub;|y;)|d(?:ca;|ldhar;|quo(?:;|r;)|sh;)|e(?:al(?:;|ine;|part;|s;)|ct;|g;?)|f(?:isht;|loor;|r;)|h(?:ar(?:d;|u(?:;|l;))|o(?:;|v;))|i(?:ght(?:arrow(?:;|tail;)|harpoon(?:down;|up;)|left(?:arrows;|harpoons;)|rightarrows;|squigarrow;|threetimes;)|ng;|singdotseq;)|l(?:arr;|har;|m;)|moust(?:;|ache;)|nmid;|o(?:a(?:ng;|rr;)|brk;|p(?:ar;|f;|lus;)|times;)|p(?:ar(?:;|gt;)|polint;)|rarr;|s(?:aquo;|cr;|h;|q(?:b;|uo(?:;|r;)))|t(?:hree;|imes;|ri(?:;|e;|f;|ltri;))|uluhar;|x;)|s(?:acute;|bquo;|c(?:;|E;|a(?:p;|ron;)|cue;|e(?:;|dil;)|irc;|n(?:E;|ap;|sim;)|polint;|sim;|y;)|dot(?:;|b;|e;)|e(?:Arr;|ar(?:hk;|r(?:;|ow;))|ct;?|mi;|swar;|tm(?:inus;|n;)|xt;)|fr(?:;|own;)|h(?:arp;|c(?:hcy;|y;)|ort(?:mid;|parallel;)|y;?)|i(?:gma(?:;|f;|v;)|m(?:;|dot;|e(?:;|q;)|g(?:;|E;)|l(?:;|E;)|ne;|plus;|rarr;))|larr;|m(?:a(?:llsetminus;|shp;)|eparsl;|i(?:d;|le;)|t(?:;|e(?:;|s;)))|o(?:ftcy;|l(?:;|b(?:;|ar;))|pf;)|pa(?:des(?:;|uit;)|r;)|q(?:c(?:ap(?:;|s;)|up(?:;|s;))|su(?:b(?:;|e;|set(?:;|eq;))|p(?:;|e;|set(?:;|eq;)))|u(?:;|ar(?:e;|f;)|f;))|rarr;|s(?:cr;|etmn;|mile;|tarf;)|t(?:ar(?:;|f;)|r(?:aight(?:epsilon;|phi;)|ns;))|u(?:b(?:;|E;|dot;|e(?:;|dot;)|mult;|n(?:E;|e;)|plus;|rarr;|s(?:et(?:;|eq(?:;|q;)|neq(?:;|q;))|im;|u(?:b;|p;)))|cc(?:;|approx;|curlyeq;|eq;|n(?:approx;|eqq;|sim;)|sim;)|m;|ng;|p(?:1;?|2;?|3;?|;|E;|d(?:ot;|sub;)|e(?:;|dot;)|hs(?:ol;|ub;)|larr;|mult;|n(?:E;|e;)|plus;|s(?:et(?:;|eq(?:;|q;)|neq(?:;|q;))|im;|u(?:b;|p;))))|w(?:Arr;|ar(?:hk;|r(?:;|ow;))|nwar;)|zlig;?)|t(?:a(?:rget;|u;)|brk;|c(?:aron;|edil;|y;)|dot;|elrec;|fr;|h(?:e(?:re(?:4;|fore;)|ta(?:;|sym;|v;))|i(?:ck(?:approx;|sim;)|nsp;)|k(?:ap;|sim;)|orn;?)|i(?:lde;|mes(?:;|b(?:;|ar;)|d;|)|nt;)|o(?:ea;|p(?:;|bot;|cir;|f(?:;|ork;))|sa;)|prime;|r(?:ade;|i(?:angle(?:;|down;|left(?:;|eq;)|q;|right(?:;|eq;))|dot;|e;|minus;|plus;|sb;|time;)|pezium;)|s(?:c(?:r;|y;)|hcy;|trok;)|w(?:ixt;|ohead(?:leftarrow;|rightarrow;)))|u(?:Arr;|Har;|a(?:cute;?|rr;)|br(?:cy;|eve;)|c(?:irc;?|y;)|d(?:arr;|blac;|har;)|f(?:isht;|r;)|grave;?|h(?:ar(?:l;|r;)|blk;)|l(?:c(?:orn(?:;|er;)|rop;)|tri;)|m(?:acr;|l;?)|o(?:gon;|pf;)|p(?:arrow;|downarrow;|harpoon(?:left;|right;)|lus;|si(?:;|h;|lon;)|uparrows;)|r(?:c(?:orn(?:;|er;)|rop;)|ing;|tri;)|scr;|t(?:dot;|ilde;|ri(?:;|f;))|u(?:arr;|ml;?)|wangle;)|v(?:Arr;|Bar(?:;|v;)|Dash;|a(?:ngrt;|r(?:epsilon;|kappa;|nothing;|p(?:hi;|i;|ropto;)|r(?:;|ho;)|s(?:igma;|u(?:bsetneq(?:;|q;)|psetneq(?:;|q;)))|t(?:heta;|riangle(?:left;|right;))))|cy;|dash;|e(?:e(?:;|bar;|eq;)|llip;|r(?:bar;|t;))|fr;|ltri;|nsu(?:b;|p;)|opf;|prop;|rtri;|s(?:cr;|u(?:bn(?:E;|e;)|pn(?:E;|e;)))|zigzag;)|w(?:circ;|e(?:d(?:bar;|ge(?:;|q;))|ierp;)|fr;|opf;|p;|r(?:;|eath;)|scr;)|x(?:c(?:ap;|irc;|up;)|dtri;|fr;|h(?:Arr;|arr;)|i;|l(?:Arr;|arr;)|map;|nis;|o(?:dot;|p(?:f;|lus;)|time;)|r(?:Arr;|arr;)|s(?:cr;|qcup;)|u(?:plus;|tri;)|vee;|wedge;)|y(?:ac(?:ute;?|y;)|c(?:irc;|y;)|en;?|fr;|icy;|opf;|scr;|u(?:cy;|ml;?))|z(?:acute;|c(?:aron;|y;)|dot;|e(?:etrf;|ta;)|fr;|hcy;|igrarr;|opf;|scr;|w(?:j;|nj;)))|[\s\S]/g, G0 = 32, Y0 = /[^\r"&\u0000]+/g, $0 = /[^\r'&\u0000]+/g, K0 = /[^\r\t\n\f &>\u0000]+/g, X0 = /[^\r\t\n\f \/>A-Z\u0000]+/g, Q0 = /[^\r\t\n\f \/=>A-Z\u0000]+/g, Z0 = /[^\]\r\u0000\uffff]*/g, J0 = /[^&<\r\u0000\uffff]*/g, sc = /[^<\r\u0000\uffff]*/g, ef = /[^\r\u0000\uffff]*/g, oc = /(?:(\/)?([a-z]+)>)|[\s\S]/g, cc = /(?:([-a-z]+)[ \t\n\f]*=[ \t\n\f]*('[^'&\r\u0000]*'|"[^"&\r\u0000]*"|[^\t\n\r\f "&'\u0000>][^&> \t\n\r\f\u0000]*[ \t\n\f]))|[\s\S]/g, Cn = /[^\x09\x0A\x0C\x0D\x20]/, oi = /[^\x09\x0A\x0C\x0D\x20]/g, tf = /[^\x00\x09\x0A\x0C\x0D\x20]/, Ht = /^[\x09\x0A\x0C\x0D\x20]+/, An = /\x00/g;
  function Ce(e) {
    var t = 16384;
    if (e.length < t)
      return String.fromCharCode.apply(String, e);
    for (var r = "", n = 0; n < e.length; n += t)
      r += String.fromCharCode.apply(String, e.slice(n, n + t));
    return r;
  }
  function rf(e) {
    for (var t = [], r = 0; r < e.length; r++)
      t[r] = e.charCodeAt(r);
    return t;
  }
  function te(e, t) {
    if (typeof t == "string")
      return e.namespaceURI === q.HTML && e.localName === t;
    var r = t[e.namespaceURI];
    return r && r[e.localName];
  }
  function lc(e) {
    return te(e, Jo);
  }
  function uc(e) {
    if (te(e, ec))
      return true;
    if (e.namespaceURI === q.MATHML && e.localName === "annotation-xml") {
      var t = e.getAttribute("encoding");
      if (t && (t = t.toLowerCase()), t === "text/html" || t === "application/xhtml+xml")
        return true;
    }
    return false;
  }
  function nf(e) {
    return e in nc ? nc[e] : e;
  }
  function fc(e) {
    for (var t = 0, r = e.length; t < r; t++)
      e[t][0] in rc && (e[t][0] = rc[e[t][0]]);
  }
  function dc(e) {
    for (var t = 0, r = e.length; t < r; t++)
      if (e[t][0] === "definitionurl") {
        e[t][0] = "definitionURL";
        break;
      }
  }
  function ci(e) {
    for (var t = 0, r = e.length; t < r; t++)
      e[t][0] in tc && e[t].push(tc[e[t][0]]);
  }
  function hc(e, t) {
    for (var r = 0, n = e.length; r < n; r++) {
      var l = e[r][0], f = e[r][1];
      t.hasAttribute(l) || t._setAttribute(l, f);
    }
  }
  Y.ElementStack = function() {
    this.elements = [], this.top = null;
  };
  Y.ElementStack.prototype.push = function(e) {
    this.elements.push(e), this.top = e;
  };
  Y.ElementStack.prototype.pop = function(e) {
    this.elements.pop(), this.top = this.elements[this.elements.length - 1];
  };
  Y.ElementStack.prototype.popTag = function(e) {
    for (var t = this.elements.length - 1; t > 0; t--) {
      var r = this.elements[t];
      if (te(r, e))
        break;
    }
    this.elements.length = t, this.top = this.elements[t - 1];
  };
  Y.ElementStack.prototype.popElementType = function(e) {
    for (var t = this.elements.length - 1; t > 0 && !(this.elements[t] instanceof e); t--)
      ;
    this.elements.length = t, this.top = this.elements[t - 1];
  };
  Y.ElementStack.prototype.popElement = function(e) {
    for (var t = this.elements.length - 1; t > 0 && this.elements[t] !== e; t--)
      ;
    this.elements.length = t, this.top = this.elements[t - 1];
  };
  Y.ElementStack.prototype.removeElement = function(e) {
    if (this.top === e)
      this.pop();
    else {
      var t = this.elements.lastIndexOf(e);
      t !== -1 && this.elements.splice(t, 1);
    }
  };
  Y.ElementStack.prototype.clearToContext = function(e) {
    for (var t = this.elements.length - 1; t > 0 && !te(this.elements[t], e); t--)
      ;
    this.elements.length = t + 1, this.top = this.elements[t];
  };
  Y.ElementStack.prototype.contains = function(e) {
    return this.inSpecificScope(e, Object.create(null));
  };
  Y.ElementStack.prototype.inSpecificScope = function(e, t) {
    for (var r = this.elements.length - 1; r >= 0; r--) {
      var n = this.elements[r];
      if (te(n, e))
        return true;
      if (te(n, t))
        return false;
    }
    return false;
  };
  Y.ElementStack.prototype.elementInSpecificScope = function(e, t) {
    for (var r = this.elements.length - 1; r >= 0; r--) {
      var n = this.elements[r];
      if (n === e)
        return true;
      if (te(n, t))
        return false;
    }
    return false;
  };
  Y.ElementStack.prototype.elementTypeInSpecificScope = function(e, t) {
    for (var r = this.elements.length - 1; r >= 0; r--) {
      var n = this.elements[r];
      if (n instanceof e)
        return true;
      if (te(n, t))
        return false;
    }
    return false;
  };
  Y.ElementStack.prototype.inScope = function(e) {
    return this.inSpecificScope(e, nt);
  };
  Y.ElementStack.prototype.elementInScope = function(e) {
    return this.elementInSpecificScope(e, nt);
  };
  Y.ElementStack.prototype.elementTypeInScope = function(e) {
    return this.elementTypeInSpecificScope(e, nt);
  };
  Y.ElementStack.prototype.inButtonScope = function(e) {
    return this.inSpecificScope(e, si);
  };
  Y.ElementStack.prototype.inListItemScope = function(e) {
    return this.inSpecificScope(e, Nn);
  };
  Y.ElementStack.prototype.inTableScope = function(e) {
    return this.inSpecificScope(e, Zo);
  };
  Y.ElementStack.prototype.inSelectScope = function(e) {
    for (var t = this.elements.length - 1; t >= 0; t--) {
      var r = this.elements[t];
      if (r.namespaceURI !== q.HTML)
        return false;
      var n = r.localName;
      if (n === e)
        return true;
      if (n !== "optgroup" && n !== "option")
        return false;
    }
    return false;
  };
  Y.ElementStack.prototype.generateImpliedEndTags = function(e, t) {
    for (var r = t ? Xo : Ko, n = this.elements.length - 1; n >= 0; n--) {
      var l = this.elements[n];
      if (e && te(l, e) || !te(this.elements[n], r))
        break;
    }
    this.elements.length = n + 1, this.top = this.elements[n];
  };
  Y.ActiveFormattingElements = function() {
    this.list = [], this.attrs = [];
  };
  Y.ActiveFormattingElements.prototype.MARKER = { localName: "|" };
  Y.ActiveFormattingElements.prototype.insertMarker = function() {
    this.list.push(this.MARKER), this.attrs.push(this.MARKER);
  };
  Y.ActiveFormattingElements.prototype.push = function(e, t) {
    for (var r = 0, n = this.list.length - 1; n >= 0 && this.list[n] !== this.MARKER; n--)
      if (_(e, this.list[n], this.attrs[n]) && (r++, r === 3)) {
        this.list.splice(n, 1), this.attrs.splice(n, 1);
        break;
      }
    this.list.push(e);
    for (var l = [], f = 0; f < t.length; f++)
      l[f] = t[f];
    this.attrs.push(l);
    function _(y, w, S) {
      if (y.localName !== w.localName || y._numattrs !== S.length)
        return false;
      for (var D = 0, ae = S.length; D < ae; D++) {
        var ce = S[D][0], g = S[D][1];
        if (!y.hasAttribute(ce) || y.getAttribute(ce) !== g)
          return false;
      }
      return true;
    }
  };
  Y.ActiveFormattingElements.prototype.clearToMarker = function() {
    for (var e = this.list.length - 1; e >= 0 && this.list[e] !== this.MARKER; e--)
      ;
    e < 0 && (e = 0), this.list.length = e, this.attrs.length = e;
  };
  Y.ActiveFormattingElements.prototype.findElementByTag = function(e) {
    for (var t = this.list.length - 1; t >= 0; t--) {
      var r = this.list[t];
      if (r === this.MARKER)
        break;
      if (r.localName === e)
        return r;
    }
    return null;
  };
  Y.ActiveFormattingElements.prototype.indexOf = function(e) {
    return this.list.lastIndexOf(e);
  };
  Y.ActiveFormattingElements.prototype.remove = function(e) {
    var t = this.list.lastIndexOf(e);
    t !== -1 && (this.list.splice(t, 1), this.attrs.splice(t, 1));
  };
  Y.ActiveFormattingElements.prototype.replace = function(e, t, r) {
    var n = this.list.lastIndexOf(e);
    n !== -1 && (this.list[n] = t, this.attrs[n] = r);
  };
  Y.ActiveFormattingElements.prototype.insertAfter = function(e, t) {
    var r = this.list.lastIndexOf(e);
    r !== -1 && (this.list.splice(r, 0, t), this.attrs.splice(r, 0, t));
  };
  function Y(e, t, r) {
    var n = null, l = 0, f = 0, _ = false, y = false, w = 0, S = [], D = "", ae = true, ce = 0, g = j, re, $2, V = "", ve = "", U = [], ie = "", be = "", ne = [], Oe = [], qe = [], Le = [], De = [], ft = false, k = wl, Fe = null, je = [], p = new Y.ElementStack(), d = new Y.ActiveFormattingElements(), Xe = t !== void 0, se = null, A = null, c = true;
    t && (c = t.ownerDocument._scripting_enabled), r && r.scripting_enabled === false && (c = false);
    var h2 = true, m = false, a, o, u = [], b = false, T = false, I = { document: function() {
      return L;
    }, _asDocumentFragment: function() {
      for (var i = L.createDocumentFragment(), s = L.firstChild; s.hasChildNodes(); )
        i.appendChild(s.firstChild);
      return i;
    }, pause: function() {
      ce++;
    }, resume: function() {
      ce--, this.parse("");
    }, parse: function(i, s, x) {
      var E;
      return ce > 0 ? (D += i, true) : (w === 0 ? (D && (i = D + i, D = ""), s && (i += "\uFFFF", _ = true), n = i, l = i.length, f = 0, ae && (ae = false, n.charCodeAt(0) === 65279 && (f = 1)), w++, E = dt(x), D = n.substring(f, l), w--) : (w++, S.push(n, l, f), n = i, l = i.length, f = 0, dt(), E = false, D = n.substring(f, l), f = S.pop(), l = S.pop(), n = S.pop(), D && (n = D + n.substring(f), l = n.length, f = 0, D = ""), w--), E);
    } }, L = new F0(true, e);
    if (L._parser = I, L._scripting_enabled = c, t) {
      if (t.ownerDocument._quirks && (L._quirks = true), t.ownerDocument._limitedQuirks && (L._limitedQuirks = true), t.namespaceURI === q.HTML)
        switch (t.localName) {
          case "title":
          case "textarea":
            g = pt;
            break;
          case "style":
          case "xmp":
          case "iframe":
          case "noembed":
          case "noframes":
          case "script":
          case "plaintext":
            g = Or;
            break;
          case "noscript":
            c && (g = Or);
        }
      var oe = L.createElement("html");
      L._appendChild(oe), p.push(oe), t instanceof ee.HTMLTemplateElement && je.push(Gn), or();
      for (var We = t; We !== null; We = We.parentElement)
        if (We instanceof ee.HTMLFormElement) {
          A = We;
          break;
        }
    }
    function dt(i) {
      for (var s, x, E, v; f < l; ) {
        if (ce > 0 || i && i())
          return true;
        switch (typeof g.lookahead) {
          case "undefined":
            if (s = n.charCodeAt(f++), y && (y = false, s === 10)) {
              f++;
              continue;
            }
            switch (s) {
              case 13:
                f < l ? n.charCodeAt(f) === 10 && f++ : y = true, g(10);
                break;
              case 65535:
                if (_ && f === l) {
                  g(wn);
                  break;
                }
              default:
                g(s);
                break;
            }
            break;
          case "number":
            s = n.charCodeAt(f);
            var N = g.lookahead, H = true;
            if (N < 0 && (H = false, N = -N), N < l - f)
              x = H ? n.substring(f, f + N) : null, v = false;
            else if (_)
              x = H ? n.substring(f, l) : null, v = true, s === 65535 && f === l - 1 && (s = wn);
            else
              return true;
            g(s, x, v);
            break;
          case "string":
            s = n.charCodeAt(f), E = g.lookahead;
            var W = n.indexOf(E, f);
            if (W !== -1)
              x = n.substring(f, W + E.length), v = false;
            else {
              if (!_)
                return true;
              x = n.substring(f, l), s === 65535 && f === l - 1 && (s = wn), v = true;
            }
            g(s, x, v);
            break;
        }
      }
      return false;
    }
    function He(i, s) {
      for (var x = 0; x < De.length; x++)
        if (De[x][0] === i)
          return;
      s !== void 0 ? De.push([i, s]) : De.push([i]);
    }
    function kt() {
      cc.lastIndex = f - 1;
      var i = cc.exec(n);
      if (!i)
        throw new Error("should never happen");
      var s = i[1];
      if (!s)
        return false;
      var x = i[2], E = x.length;
      switch (x[0]) {
        case '"':
        case "'":
          x = x.substring(1, E - 1), f += i[0].length - 1, g = Bn;
          break;
        default:
          g = et, f += i[0].length - 1, x = x.substring(0, E - 1);
          break;
      }
      for (var v = 0; v < De.length; v++)
        if (De[v][0] === s)
          return true;
      return De.push([s, x]), true;
    }
    function Ac() {
      ft = false, V = "", De.length = 0;
    }
    function nr() {
      ft = true, V = "", De.length = 0;
    }
    function at() {
      U.length = 0;
    }
    function Rn() {
      ie = "";
    }
    function In() {
      be = "";
    }
    function hi() {
      ne.length = 0;
    }
    function Bt() {
      Oe.length = 0, qe = null, Le = null;
    }
    function Dr() {
      qe = [];
    }
    function ht() {
      Le = [];
    }
    function X() {
      m = true;
    }
    function Lc() {
      return p.top && p.top.namespaceURI !== "http://www.w3.org/1999/xhtml";
    }
    function Pe(i) {
      return ve === i;
    }
    function Ut() {
      if (u.length > 0) {
        var i = Ce(u);
        if (u.length = 0, T && (T = false, i[0] === `
` && (i = i.substring(1)), i.length === 0))
          return;
        pe(tr, i), b = false;
      }
      T = false;
    }
    function ar(i) {
      i.lastIndex = f - 1;
      var s = i.exec(n);
      if (s && s.index === f - 1)
        return s = s[0], f += s.length - 1, _ && f === l && (s = s.slice(0, -1), f--), s;
      throw new Error("should never happen");
    }
    function ir(i) {
      i.lastIndex = f - 1;
      var s = i.exec(n)[0];
      return s ? (Dc(s), f += s.length - 1, true) : false;
    }
    function Dc(i) {
      u.length > 0 && Ut(), !(T && (T = false, i[0] === `
` && (i = i.substring(1)), i.length === 0)) && pe(tr, i);
    }
    function it() {
      if (ft)
        pe(G, V);
      else {
        var i = V;
        V = "", ve = i, pe(Ne, i, De);
      }
    }
    function Mc() {
      if (f === l)
        return false;
      oc.lastIndex = f;
      var i = oc.exec(n);
      if (!i)
        throw new Error("should never happen");
      var s = i[2];
      if (!s)
        return false;
      var x = i[1];
      return x ? (f += s.length + 2, pe(G, s)) : (f += s.length + 1, ve = s, pe(Ne, s, B0)), true;
    }
    function Rc() {
      ft ? pe(G, V, null, true) : pe(Ne, V, De, true);
    }
    function Q() {
      pe(P0, Ce(Oe), qe ? Ce(qe) : void 0, Le ? Ce(Le) : void 0);
    }
    function z() {
      Ut(), k(wn), L.modclock = 1;
    }
    var pe = I.insertToken = function(s, x, E, v) {
      Ut();
      var N = p.top;
      !N || N.namespaceURI === q.HTML ? k(s, x, E, v) : s !== Ne && s !== tr ? Ai(s, x, E, v) : lc(N) && (s === tr || s === Ne && x !== "mglyph" && x !== "malignmark") || s === Ne && x === "svg" && N.namespaceURI === q.MATHML && N.localName === "annotation-xml" || uc(N) ? (o = true, k(s, x, E, v), o = false) : Ai(s, x, E, v);
    };
    function Qe(i) {
      var s = p.top;
      xt && te(s, rr) ? Rr(function(x) {
        return x.createComment(i);
      }) : (s instanceof ee.HTMLTemplateElement && (s = s.content), s._appendChild(s.ownerDocument.createComment(i)));
    }
    function Ze(i) {
      var s = p.top;
      if (xt && te(s, rr))
        Rr(function(E) {
          return E.createTextNode(i);
        });
      else {
        s instanceof ee.HTMLTemplateElement && (s = s.content);
        var x = s.lastChild;
        x && x.nodeType === ni.TEXT_NODE ? x.appendData(i) : s._appendChild(s.ownerDocument.createTextNode(i));
      }
    }
    function sr(i, s, x) {
      var E = Go.createElement(i, s, null);
      if (x)
        for (var v = 0, N = x.length; v < N; v++)
          E._setAttribute(x[v][0], x[v][1]);
      return E;
    }
    var xt = false;
    function B(i, s) {
      var x = Mr(function(E) {
        return sr(E, i, s);
      });
      return te(x, Qo) && (x._form = A), x;
    }
    function Mr(i) {
      var s;
      return xt && te(p.top, rr) ? s = Rr(i) : p.top instanceof ee.HTMLTemplateElement ? (s = i(p.top.content.ownerDocument), p.top.content._appendChild(s)) : (s = i(p.top.ownerDocument), p.top._appendChild(s)), p.push(s), s;
    }
    function On(i, s, x) {
      return Mr(function(E) {
        var v = E._createElementNS(i, x, null);
        if (s)
          for (var N = 0, H = s.length; N < H; N++) {
            var W = s[N];
            W.length === 2 ? v._setAttribute(W[0], W[1]) : v._setAttributeNS(W[2], W[0], W[1]);
          }
        return v;
      });
    }
    function xi(i) {
      for (var s = p.elements.length - 1; s >= 0; s--)
        if (p.elements[s] instanceof i)
          return s;
      return -1;
    }
    function Rr(i) {
      var s, x, E = -1, v = -1, N;
      if (E = xi(ee.HTMLTableElement), v = xi(ee.HTMLTemplateElement), v >= 0 && (E < 0 || v > E) ? s = p.elements[v] : E >= 0 && (s = p.elements[E].parentNode, s ? x = p.elements[E] : s = p.elements[E - 1]), s || (s = p.elements[0]), s instanceof ee.HTMLTemplateElement && (s = s.content), N = i(s.ownerDocument), N.nodeType === ni.TEXT_NODE) {
        var H;
        if (x ? H = x.previousSibling : H = s.lastChild, H && H.nodeType === ni.TEXT_NODE)
          return H.appendData(N.data), N;
      }
      return x ? s.insertBefore(N, x) : s._appendChild(N), N;
    }
    function or() {
      for (var i = false, s = p.elements.length - 1; s >= 0; s--) {
        var x = p.elements[s];
        if (s === 0 && (i = true, Xe && (x = t)), x.namespaceURI === q.HTML) {
          var E = x.localName;
          switch (E) {
            case "select":
              for (var v = s; v > 0; ) {
                var N = p.elements[--v];
                if (N instanceof ee.HTMLTemplateElement)
                  break;
                if (N instanceof ee.HTMLTableElement) {
                  k = Yr;
                  return;
                }
              }
              k = st;
              return;
            case "tr":
              k = fr;
              return;
            case "tbody":
            case "tfoot":
            case "thead":
              k = At;
              return;
            case "caption":
              k = Wn;
              return;
            case "colgroup":
              k = Gr;
              return;
            case "table":
              k = Be;
              return;
            case "template":
              k = je[je.length - 1];
              return;
            case "body":
              k = F;
              return;
            case "frameset":
              k = Yn;
              return;
            case "html":
              se === null ? k = jr : k = jn;
              return;
            default:
              if (!i) {
                if (E === "head") {
                  k = fe;
                  return;
                }
                if (E === "td" || E === "th") {
                  k = Vt;
                  return;
                }
              }
          }
        }
        if (i) {
          k = F;
          return;
        }
      }
    }
    function cr(i, s) {
      B(i, s), g = lr, Fe = k, k = Wr;
    }
    function Ic(i, s) {
      B(i, s), g = pt, Fe = k, k = Wr;
    }
    function qn(i, s) {
      return { elt: sr(i, d.list[s].localName, d.attrs[s]), attrs: d.attrs[s] };
    }
    function Ae() {
      if (d.list.length !== 0) {
        var i = d.list[d.list.length - 1];
        if (i !== d.MARKER && p.elements.lastIndexOf(i) === -1) {
          for (var s = d.list.length - 2; s >= 0 && (i = d.list[s], !(i === d.MARKER || p.elements.lastIndexOf(i) !== -1)); s--)
            ;
          for (s = s + 1; s < d.list.length; s++) {
            var x = Mr(function(E) {
              return qn(E, s).elt;
            });
            d.list[s] = x;
          }
        }
      }
    }
    var Ir = { localName: "BM" };
    function Oc(i) {
      if (te(p.top, i) && d.indexOf(p.top) === -1)
        return p.pop(), true;
      for (var s = 0; s < 8; ) {
        s++;
        var x = d.findElementByTag(i);
        if (!x)
          return false;
        var E = p.elements.lastIndexOf(x);
        if (E === -1)
          return d.remove(x), true;
        if (!p.elementInScope(x))
          return true;
        for (var v = null, N, H = E + 1; H < p.elements.length; H++)
          if (te(p.elements[H], Ft)) {
            v = p.elements[H], N = H;
            break;
          }
        if (v) {
          var W = p.elements[E - 1];
          d.insertAfter(x, Ir);
          for (var le = v, ye = v, Ue = N, Ge, Lt = 0; Lt++, le = p.elements[--Ue], le !== x; ) {
            if (Ge = d.indexOf(le), Lt > 3 && Ge !== -1 && (d.remove(le), Ge = -1), Ge === -1) {
              p.removeElement(le);
              continue;
            }
            var Et = qn(W.ownerDocument, Ge);
            d.replace(le, Et.elt, Et.attrs), p.elements[Ue] = Et.elt, le = Et.elt, ye === v && (d.remove(Ir), d.insertAfter(Et.elt, Ir)), le._appendChild(ye), ye = le;
          }
          xt && te(W, rr) ? Rr(function() {
            return ye;
          }) : W instanceof ee.HTMLTemplateElement ? W.content._appendChild(ye) : W._appendChild(ye);
          for (var dr = qn(v.ownerDocument, d.indexOf(x)); v.hasChildNodes(); )
            dr.elt._appendChild(v.firstChild);
          v._appendChild(dr.elt), d.remove(x), d.replace(Ir, dr.elt, dr.attrs), p.removeElement(x);
          var Al = p.elements.lastIndexOf(v);
          p.elements.splice(Al + 1, 0, dr.elt);
        } else
          return p.popElement(x), d.remove(x), true;
      }
      return true;
    }
    function qc() {
      p.pop(), k = Fe;
    }
    function St() {
      delete L._parser, p.elements.length = 0, L.defaultView && L.defaultView.dispatchEvent(new ee.Event("load", {}));
    }
    function R(i, s) {
      g = s, f--;
    }
    function j(i) {
      switch (i) {
        case 38:
          re = j, g = ur;
          break;
        case 60:
          if (Mc())
            break;
          g = Fc;
          break;
        case 0:
          u.push(i), b = true;
          break;
        case -1:
          z();
          break;
        default:
          ir(J0) || u.push(i);
          break;
      }
    }
    function pt(i) {
      switch (i) {
        case 38:
          re = pt, g = ur;
          break;
        case 60:
          g = Pc;
          break;
        case 0:
          u.push(65533), b = true;
          break;
        case -1:
          z();
          break;
        default:
          u.push(i);
          break;
      }
    }
    function lr(i) {
      switch (i) {
        case 60:
          g = Vc;
          break;
        case 0:
          u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          ir(sc) || u.push(i);
          break;
      }
    }
    function mt(i) {
      switch (i) {
        case 60:
          g = Wc;
          break;
        case 0:
          u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          ir(sc) || u.push(i);
          break;
      }
    }
    function Or(i) {
      switch (i) {
        case 0:
          u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          ir(ef) || u.push(i);
          break;
      }
    }
    function Fc(i) {
      switch (i) {
        case 33:
          g = bi;
          break;
        case 47:
          g = Hc;
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          Ac(), R(i, pi);
          break;
        case 63:
          R(i, Pr);
          break;
        default:
          u.push(60), R(i, j);
          break;
      }
    }
    function Hc(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          nr(), R(i, pi);
          break;
        case 62:
          g = j;
          break;
        case -1:
          u.push(60), u.push(47), z();
          break;
        default:
          R(i, Pr);
          break;
      }
    }
    function pi(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = et;
          break;
        case 47:
          g = bt;
          break;
        case 62:
          g = j, it();
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          V += String.fromCharCode(i + 32);
          break;
        case 0:
          V += String.fromCharCode(65533);
          break;
        case -1:
          z();
          break;
        default:
          V += ar(X0);
          break;
      }
    }
    function Pc(i) {
      i === 47 ? (at(), g = Bc) : (u.push(60), R(i, pt));
    }
    function Bc(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          nr(), R(i, Uc);
          break;
        default:
          u.push(60), u.push(47), R(i, pt);
          break;
      }
    }
    function Uc(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          if (Pe(V)) {
            g = et;
            return;
          }
          break;
        case 47:
          if (Pe(V)) {
            g = bt;
            return;
          }
          break;
        case 62:
          if (Pe(V)) {
            g = j, it();
            return;
          }
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          V += String.fromCharCode(i + 32), U.push(i);
          return;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          V += String.fromCharCode(i), U.push(i);
          return;
      }
      u.push(60), u.push(47), qt(u, U), R(i, pt);
    }
    function Vc(i) {
      i === 47 ? (at(), g = zc) : (u.push(60), R(i, lr));
    }
    function zc(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          nr(), R(i, jc);
          break;
        default:
          u.push(60), u.push(47), R(i, lr);
          break;
      }
    }
    function jc(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          if (Pe(V)) {
            g = et;
            return;
          }
          break;
        case 47:
          if (Pe(V)) {
            g = bt;
            return;
          }
          break;
        case 62:
          if (Pe(V)) {
            g = j, it();
            return;
          }
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          V += String.fromCharCode(i + 32), U.push(i);
          return;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          V += String.fromCharCode(i), U.push(i);
          return;
      }
      u.push(60), u.push(47), qt(u, U), R(i, lr);
    }
    function Wc(i) {
      switch (i) {
        case 47:
          at(), g = Gc;
          break;
        case 33:
          g = $c, u.push(60), u.push(33);
          break;
        default:
          u.push(60), R(i, mt);
          break;
      }
    }
    function Gc(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          nr(), R(i, Yc);
          break;
        default:
          u.push(60), u.push(47), R(i, mt);
          break;
      }
    }
    function Yc(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          if (Pe(V)) {
            g = et;
            return;
          }
          break;
        case 47:
          if (Pe(V)) {
            g = bt;
            return;
          }
          break;
        case 62:
          if (Pe(V)) {
            g = j, it();
            return;
          }
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          V += String.fromCharCode(i + 32), U.push(i);
          return;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          V += String.fromCharCode(i), U.push(i);
          return;
      }
      u.push(60), u.push(47), qt(u, U), R(i, mt);
    }
    function $c(i) {
      i === 45 ? (g = Kc, u.push(45)) : R(i, mt);
    }
    function Kc(i) {
      i === 45 ? (g = mi, u.push(45)) : R(i, mt);
    }
    function Je(i) {
      switch (i) {
        case 45:
          g = Xc, u.push(45);
          break;
        case 60:
          g = Fn;
          break;
        case 0:
          u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          u.push(i);
          break;
      }
    }
    function Xc(i) {
      switch (i) {
        case 45:
          g = mi, u.push(45);
          break;
        case 60:
          g = Fn;
          break;
        case 0:
          g = Je, u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          g = Je, u.push(i);
          break;
      }
    }
    function mi(i) {
      switch (i) {
        case 45:
          u.push(45);
          break;
        case 60:
          g = Fn;
          break;
        case 62:
          g = mt, u.push(62);
          break;
        case 0:
          g = Je, u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          g = Je, u.push(i);
          break;
      }
    }
    function Fn(i) {
      switch (i) {
        case 47:
          at(), g = Qc;
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          at(), u.push(60), R(i, Jc);
          break;
        default:
          u.push(60), R(i, Je);
          break;
      }
    }
    function Qc(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          nr(), R(i, Zc);
          break;
        default:
          u.push(60), u.push(47), R(i, Je);
          break;
      }
    }
    function Zc(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          if (Pe(V)) {
            g = et;
            return;
          }
          break;
        case 47:
          if (Pe(V)) {
            g = bt;
            return;
          }
          break;
        case 62:
          if (Pe(V)) {
            g = j, it();
            return;
          }
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          V += String.fromCharCode(i + 32), U.push(i);
          return;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          V += String.fromCharCode(i), U.push(i);
          return;
      }
      u.push(60), u.push(47), qt(u, U), R(i, Je);
    }
    function Jc(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
        case 47:
        case 62:
          Ce(U) === "script" ? g = gt : g = Je, u.push(i);
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          U.push(i + 32), u.push(i);
          break;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          U.push(i), u.push(i);
          break;
        default:
          R(i, Je);
          break;
      }
    }
    function gt(i) {
      switch (i) {
        case 45:
          g = el, u.push(45);
          break;
        case 60:
          g = Hn, u.push(60);
          break;
        case 0:
          u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          u.push(i);
          break;
      }
    }
    function el(i) {
      switch (i) {
        case 45:
          g = tl, u.push(45);
          break;
        case 60:
          g = Hn, u.push(60);
          break;
        case 0:
          g = gt, u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          g = gt, u.push(i);
          break;
      }
    }
    function tl(i) {
      switch (i) {
        case 45:
          u.push(45);
          break;
        case 60:
          g = Hn, u.push(60);
          break;
        case 62:
          g = mt, u.push(62);
          break;
        case 0:
          g = gt, u.push(65533);
          break;
        case -1:
          z();
          break;
        default:
          g = gt, u.push(i);
          break;
      }
    }
    function Hn(i) {
      i === 47 ? (at(), g = rl, u.push(47)) : R(i, gt);
    }
    function rl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
        case 47:
        case 62:
          Ce(U) === "script" ? g = Je : g = gt, u.push(i);
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          U.push(i + 32), u.push(i);
          break;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
        case 103:
        case 104:
        case 105:
        case 106:
        case 107:
        case 108:
        case 109:
        case 110:
        case 111:
        case 112:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 119:
        case 120:
        case 121:
        case 122:
          U.push(i), u.push(i);
          break;
        default:
          R(i, gt);
          break;
      }
    }
    function et(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 47:
          g = bt;
          break;
        case 62:
          g = j, it();
          break;
        case -1:
          z();
          break;
        case 61:
          Rn(), ie += String.fromCharCode(i), g = Pn;
          break;
        default:
          if (kt())
            break;
          Rn(), R(i, Pn);
          break;
      }
    }
    function Pn(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
        case 47:
        case 62:
        case -1:
          R(i, nl);
          break;
        case 61:
          g = gi;
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          ie += String.fromCharCode(i + 32);
          break;
        case 0:
          ie += String.fromCharCode(65533);
          break;
        case 34:
        case 39:
        case 60:
        default:
          ie += ar(Q0);
          break;
      }
    }
    function nl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 47:
          He(ie), g = bt;
          break;
        case 61:
          g = gi;
          break;
        case 62:
          g = j, He(ie), it();
          break;
        case -1:
          He(ie), z();
          break;
        default:
          He(ie), Rn(), R(i, Pn);
          break;
      }
    }
    function gi(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 34:
          In(), g = qr;
          break;
        case 39:
          In(), g = Fr;
          break;
        case 62:
        default:
          In(), R(i, Hr);
          break;
      }
    }
    function qr(i) {
      switch (i) {
        case 34:
          He(ie, be), g = Bn;
          break;
        case 38:
          re = qr, g = ur;
          break;
        case 0:
          be += String.fromCharCode(65533);
          break;
        case -1:
          z();
          break;
        case 10:
          be += String.fromCharCode(i);
          break;
        default:
          be += ar(Y0);
          break;
      }
    }
    function Fr(i) {
      switch (i) {
        case 39:
          He(ie, be), g = Bn;
          break;
        case 38:
          re = Fr, g = ur;
          break;
        case 0:
          be += String.fromCharCode(65533);
          break;
        case -1:
          z();
          break;
        case 10:
          be += String.fromCharCode(i);
          break;
        default:
          be += ar($0);
          break;
      }
    }
    function Hr(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          He(ie, be), g = et;
          break;
        case 38:
          re = Hr, g = ur;
          break;
        case 62:
          He(ie, be), g = j, it();
          break;
        case 0:
          be += String.fromCharCode(65533);
          break;
        case -1:
          f--, g = j;
          break;
        case 34:
        case 39:
        case 60:
        case 61:
        case 96:
        default:
          be += ar(K0);
          break;
      }
    }
    function Bn(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = et;
          break;
        case 47:
          g = bt;
          break;
        case 62:
          g = j, it();
          break;
        case -1:
          z();
          break;
        default:
          R(i, et);
          break;
      }
    }
    function bt(i) {
      switch (i) {
        case 62:
          g = j, Rc();
          break;
        case -1:
          z();
          break;
        default:
          R(i, et);
          break;
      }
    }
    function Pr(i, s, x) {
      var E = s.length;
      x ? f += E - 1 : f += E;
      var v = s.substring(0, E - 1);
      v = v.replace(/\u0000/g, "\uFFFD"), v = v.replace(/\u000D\u000A/g, `
`), v = v.replace(/\u000D/g, `
`), pe(rt, v), g = j;
    }
    Pr.lookahead = ">";
    function bi(i, s, x) {
      if (s[0] === "-" && s[1] === "-") {
        f += 2, hi(), g = al;
        return;
      }
      s.toUpperCase() === "DOCTYPE" ? (f += 7, g = fl) : s === "[CDATA[" && Lc() ? (f += 7, g = zn) : g = Pr;
    }
    bi.lookahead = 7;
    function al(i) {
      switch (hi(), i) {
        case 45:
          g = il;
          break;
        case 62:
          g = j, pe(rt, Ce(ne));
          break;
        default:
          R(i, Nt);
          break;
      }
    }
    function il(i) {
      switch (i) {
        case 45:
          g = Br;
          break;
        case 62:
          g = j, pe(rt, Ce(ne));
          break;
        case -1:
          pe(rt, Ce(ne)), z();
          break;
        default:
          ne.push(45), R(i, Nt);
          break;
      }
    }
    function Nt(i) {
      switch (i) {
        case 60:
          ne.push(i), g = sl;
          break;
        case 45:
          g = Un;
          break;
        case 0:
          ne.push(65533);
          break;
        case -1:
          pe(rt, Ce(ne)), z();
          break;
        default:
          ne.push(i);
          break;
      }
    }
    function sl(i) {
      switch (i) {
        case 33:
          ne.push(i), g = ol;
          break;
        case 60:
          ne.push(i);
          break;
        default:
          R(i, Nt);
          break;
      }
    }
    function ol(i) {
      switch (i) {
        case 45:
          g = cl;
          break;
        default:
          R(i, Nt);
          break;
      }
    }
    function cl(i) {
      switch (i) {
        case 45:
          g = ll;
          break;
        default:
          R(i, Un);
          break;
      }
    }
    function ll(i) {
      switch (i) {
        case 62:
        case -1:
          R(i, Br);
          break;
        default:
          R(i, Br);
          break;
      }
    }
    function Un(i) {
      switch (i) {
        case 45:
          g = Br;
          break;
        case -1:
          pe(rt, Ce(ne)), z();
          break;
        default:
          ne.push(45), R(i, Nt);
          break;
      }
    }
    function Br(i) {
      switch (i) {
        case 62:
          g = j, pe(rt, Ce(ne));
          break;
        case 33:
          g = ul;
          break;
        case 45:
          ne.push(45);
          break;
        case -1:
          pe(rt, Ce(ne)), z();
          break;
        default:
          ne.push(45), ne.push(45), R(i, Nt);
          break;
      }
    }
    function ul(i) {
      switch (i) {
        case 45:
          ne.push(45), ne.push(45), ne.push(33), g = Un;
          break;
        case 62:
          g = j, pe(rt, Ce(ne));
          break;
        case -1:
          pe(rt, Ce(ne)), z();
          break;
        default:
          ne.push(45), ne.push(45), ne.push(33), R(i, Nt);
          break;
      }
    }
    function fl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = _i;
          break;
        case -1:
          Bt(), X(), Q(), z();
          break;
        default:
          R(i, _i);
          break;
      }
    }
    function _i(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          Bt(), Oe.push(i + 32), g = Vn;
          break;
        case 0:
          Bt(), Oe.push(65533), g = Vn;
          break;
        case 62:
          Bt(), X(), g = j, Q();
          break;
        case -1:
          Bt(), X(), Q(), z();
          break;
        default:
          Bt(), Oe.push(i), g = Vn;
          break;
      }
    }
    function Vn(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = Ei;
          break;
        case 62:
          g = j, Q();
          break;
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 71:
        case 72:
        case 73:
        case 74:
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
        case 81:
        case 82:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
          Oe.push(i + 32);
          break;
        case 0:
          Oe.push(65533);
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          Oe.push(i);
          break;
      }
    }
    function Ei(i, s, x) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          f += 1;
          break;
        case 62:
          g = j, f += 1, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          s = s.toUpperCase(), s === "PUBLIC" ? (f += 6, g = dl) : s === "SYSTEM" ? (f += 6, g = pl) : (X(), g = _t);
          break;
      }
    }
    Ei.lookahead = 6;
    function dl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = hl;
          break;
        case 34:
          Dr(), g = vi;
          break;
        case 39:
          Dr(), g = yi;
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function hl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 34:
          Dr(), g = vi;
          break;
        case 39:
          Dr(), g = yi;
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function vi(i) {
      switch (i) {
        case 34:
          g = Ti;
          break;
        case 0:
          qe.push(65533);
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          qe.push(i);
          break;
      }
    }
    function yi(i) {
      switch (i) {
        case 39:
          g = Ti;
          break;
        case 0:
          qe.push(65533);
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          qe.push(i);
          break;
      }
    }
    function Ti(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = xl;
          break;
        case 62:
          g = j, Q();
          break;
        case 34:
          ht(), g = Ur;
          break;
        case 39:
          ht(), g = Vr;
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function xl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 62:
          g = j, Q();
          break;
        case 34:
          ht(), g = Ur;
          break;
        case 39:
          ht(), g = Vr;
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function pl(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          g = ml;
          break;
        case 34:
          ht(), g = Ur;
          break;
        case 39:
          ht(), g = Vr;
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function ml(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 34:
          ht(), g = Ur;
          break;
        case 39:
          ht(), g = Vr;
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          X(), g = _t;
          break;
      }
    }
    function Ur(i) {
      switch (i) {
        case 34:
          g = wi;
          break;
        case 0:
          Le.push(65533);
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          Le.push(i);
          break;
      }
    }
    function Vr(i) {
      switch (i) {
        case 39:
          g = wi;
          break;
        case 0:
          Le.push(65533);
          break;
        case 62:
          X(), g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          Le.push(i);
          break;
      }
    }
    function wi(i) {
      switch (i) {
        case 9:
        case 10:
        case 12:
        case 32:
          break;
        case 62:
          g = j, Q();
          break;
        case -1:
          X(), Q(), z();
          break;
        default:
          g = _t;
          break;
      }
    }
    function _t(i) {
      switch (i) {
        case 62:
          g = j, Q();
          break;
        case -1:
          Q(), z();
          break;
      }
    }
    function zn(i) {
      switch (i) {
        case 93:
          g = gl;
          break;
        case -1:
          z();
          break;
        case 0:
          b = true;
        default:
          ir(Z0) || u.push(i);
          break;
      }
    }
    function gl(i) {
      switch (i) {
        case 93:
          g = bl;
          break;
        default:
          u.push(93), R(i, zn);
          break;
      }
    }
    function bl(i) {
      switch (i) {
        case 93:
          u.push(93);
          break;
        case 62:
          Ut(), g = j;
          break;
        default:
          u.push(93), u.push(93), R(i, zn);
          break;
      }
    }
    function ur(i) {
      switch (at(), U.push(38), i) {
        case 9:
        case 10:
        case 12:
        case 32:
        case 60:
        case 38:
        case -1:
          R(i, Ct);
          break;
        case 35:
          U.push(i), g = _l;
          break;
        default:
          R(i, ki);
          break;
      }
    }
    function ki(i) {
      ic.lastIndex = f;
      var s = ic.exec(n);
      if (!s)
        throw new Error("should never happen");
      var x = s[1];
      if (!x) {
        g = Ct;
        return;
      }
      switch (f += x.length, qt(U, rf(x)), re) {
        case qr:
        case Fr:
        case Hr:
          if (x[x.length - 1] !== ";" && /[=A-Za-z0-9]/.test(n[f])) {
            g = Ct;
            return;
          }
          break;
      }
      at();
      var E = W0[x];
      typeof E == "number" ? U.push(E) : qt(U, E), g = Ct;
    }
    ki.lookahead = -G0;
    function _l(i) {
      switch ($2 = 0, i) {
        case 120:
        case 88:
          U.push(i), g = El;
          break;
        default:
          R(i, vl);
          break;
      }
    }
    function El(i) {
      switch (i) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
          R(i, yl);
          break;
        default:
          R(i, Ct);
          break;
      }
    }
    function vl(i) {
      switch (i) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          R(i, Tl);
          break;
        default:
          R(i, Ct);
          break;
      }
    }
    function yl(i) {
      switch (i) {
        case 65:
        case 66:
        case 67:
        case 68:
        case 69:
        case 70:
          $2 *= 16, $2 += i - 55;
          break;
        case 97:
        case 98:
        case 99:
        case 100:
        case 101:
        case 102:
          $2 *= 16, $2 += i - 87;
          break;
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          $2 *= 16, $2 += i - 48;
          break;
        case 59:
          g = zr;
          break;
        default:
          R(i, zr);
          break;
      }
    }
    function Tl(i) {
      switch (i) {
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
        case 53:
        case 54:
        case 55:
        case 56:
        case 57:
          $2 *= 10, $2 += i - 48;
          break;
        case 59:
          g = zr;
          break;
        default:
          R(i, zr);
          break;
      }
    }
    function zr(i) {
      $2 in ac ? $2 = ac[$2] : ($2 > 1114111 || $2 >= 55296 && $2 < 57344) && ($2 = 65533), at(), $2 <= 65535 ? U.push($2) : ($2 = $2 - 65536, U.push(55296 + ($2 >> 10)), U.push(56320 + ($2 & 1023))), R(i, Ct);
    }
    function Ct(i) {
      switch (re) {
        case qr:
        case Fr:
        case Hr:
          be += Ce(U);
          break;
        default:
          qt(u, U);
          break;
      }
      R(i, re);
    }
    function wl(i, s, x, E) {
      switch (i) {
        case 1:
          if (s = s.replace(Ht, ""), s.length === 0)
            return;
          break;
        case 4:
          L._appendChild(L.createComment(s));
          return;
        case 5:
          var v = s, N = x, H = E;
          L.appendChild(new H0(L, v, N, H)), m || v.toLowerCase() !== "html" || U0.test(N) || H && H.toLowerCase() === V0 || H === void 0 && Yo.test(N) ? L._quirks = true : (z0.test(N) || H !== void 0 && Yo.test(N)) && (L._limitedQuirks = true), k = Si;
          return;
      }
      L._quirks = true, k = Si, k(i, s, x, E);
    }
    function Si(i, s, x, E) {
      var v;
      switch (i) {
        case 1:
          if (s = s.replace(Ht, ""), s.length === 0)
            return;
          break;
        case 5:
          return;
        case 4:
          L._appendChild(L.createComment(s));
          return;
        case 2:
          if (s === "html") {
            v = sr(L, s, x), p.push(v), L.appendChild(v), k = jr;
            return;
          }
          break;
        case 3:
          switch (s) {
            case "html":
            case "head":
            case "body":
            case "br":
              break;
            default:
              return;
          }
      }
      v = sr(L, "html", null), p.push(v), L.appendChild(v), k = jr, k(i, s, x, E);
    }
    function jr(i, s, x, E) {
      switch (i) {
        case 1:
          if (s = s.replace(Ht, ""), s.length === 0)
            return;
          break;
        case 5:
          return;
        case 4:
          Qe(s);
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "head":
              var v = B(s, x);
              se = v, k = fe;
              return;
          }
          break;
        case 3:
          switch (s) {
            case "html":
            case "head":
            case "body":
            case "br":
              break;
            default:
              return;
          }
      }
      jr(Ne, "head", null), k(i, s, x, E);
    }
    function fe(i, s, x, E) {
      switch (i) {
        case 1:
          var v = s.match(Ht);
          if (v && (Ze(v[0]), s = s.substring(v[0].length)), s.length === 0)
            return;
          break;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "meta":
            case "base":
            case "basefont":
            case "bgsound":
            case "link":
              B(s, x), p.pop();
              return;
            case "title":
              Ic(s, x);
              return;
            case "noscript":
              if (!c) {
                B(s, x), k = Ni;
                return;
              }
            case "noframes":
            case "style":
              cr(s, x);
              return;
            case "script":
              Mr(function(N) {
                var H = sr(N, s, x);
                return H._parser_inserted = true, H._force_async = false, Xe && (H._already_started = true), Ut(), H;
              }), g = mt, Fe = k, k = Wr;
              return;
            case "template":
              B(s, x), d.insertMarker(), h2 = false, k = Gn, je.push(k);
              return;
            case "head":
              return;
          }
          break;
        case 3:
          switch (s) {
            case "head":
              p.pop(), k = jn;
              return;
            case "body":
            case "html":
            case "br":
              break;
            case "template":
              if (!p.contains("template"))
                return;
              p.generateImpliedEndTags(null, "thorough"), p.popTag("template"), d.clearToMarker(), je.pop(), or();
              return;
            default:
              return;
          }
          break;
      }
      fe(G, "head", null), k(i, s, x, E);
    }
    function Ni(i, s, x, E) {
      switch (i) {
        case 5:
          return;
        case 4:
          fe(i, s);
          return;
        case 1:
          var v = s.match(Ht);
          if (v && (fe(i, v[0]), s = s.substring(v[0].length)), s.length === 0)
            return;
          break;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "basefont":
            case "bgsound":
            case "link":
            case "meta":
            case "noframes":
            case "style":
              fe(i, s, x);
              return;
            case "head":
            case "noscript":
              return;
          }
          break;
        case 3:
          switch (s) {
            case "noscript":
              p.pop(), k = fe;
              return;
            case "br":
              break;
            default:
              return;
          }
          break;
      }
      Ni(G, "noscript", null), k(i, s, x, E);
    }
    function jn(i, s, x, E) {
      switch (i) {
        case 1:
          var v = s.match(Ht);
          if (v && (Ze(v[0]), s = s.substring(v[0].length)), s.length === 0)
            return;
          break;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "body":
              B(s, x), h2 = false, k = F;
              return;
            case "frameset":
              B(s, x), k = Yn;
              return;
            case "base":
            case "basefont":
            case "bgsound":
            case "link":
            case "meta":
            case "noframes":
            case "script":
            case "style":
            case "template":
            case "title":
              p.push(se), fe(Ne, s, x), p.removeElement(se);
              return;
            case "head":
              return;
          }
          break;
        case 3:
          switch (s) {
            case "template":
              return fe(i, s, x, E);
            case "body":
            case "html":
            case "br":
              break;
            default:
              return;
          }
          break;
      }
      jn(Ne, "body", null), h2 = true, k(i, s, x, E);
    }
    function F(i, s, x, E) {
      var v, N, H, W;
      switch (i) {
        case 1:
          if (b && (s = s.replace(An, ""), s.length === 0))
            return;
          h2 && Cn.test(s) && (h2 = false), Ae(), Ze(s);
          return;
        case 5:
          return;
        case 4:
          Qe(s);
          return;
        case -1:
          if (je.length)
            return Gn(i);
          St();
          return;
        case 2:
          switch (s) {
            case "html":
              if (p.contains("template"))
                return;
              hc(x, p.elements[0]);
              return;
            case "base":
            case "basefont":
            case "bgsound":
            case "link":
            case "meta":
            case "noframes":
            case "script":
            case "style":
            case "template":
            case "title":
              fe(Ne, s, x);
              return;
            case "body":
              if (v = p.elements[1], !v || !(v instanceof ee.HTMLBodyElement) || p.contains("template"))
                return;
              h2 = false, hc(x, v);
              return;
            case "frameset":
              if (!h2 || (v = p.elements[1], !v || !(v instanceof ee.HTMLBodyElement)))
                return;
              for (v.parentNode && v.parentNode.removeChild(v); !(p.top instanceof ee.HTMLHtmlElement); )
                p.pop();
              B(s, x), k = Yn;
              return;
            case "address":
            case "article":
            case "aside":
            case "blockquote":
            case "center":
            case "details":
            case "dialog":
            case "dir":
            case "div":
            case "dl":
            case "fieldset":
            case "figcaption":
            case "figure":
            case "footer":
            case "header":
            case "hgroup":
            case "main":
            case "nav":
            case "ol":
            case "p":
            case "section":
            case "summary":
            case "ul":
              p.inButtonScope("p") && F(G, "p"), B(s, x);
              return;
            case "menu":
              p.inButtonScope("p") && F(G, "p"), te(p.top, "menuitem") && p.pop(), B(s, x);
              return;
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
              p.inButtonScope("p") && F(G, "p"), p.top instanceof ee.HTMLHeadingElement && p.pop(), B(s, x);
              return;
            case "pre":
            case "listing":
              p.inButtonScope("p") && F(G, "p"), B(s, x), T = true, h2 = false;
              return;
            case "form":
              if (A && !p.contains("template"))
                return;
              p.inButtonScope("p") && F(G, "p"), W = B(s, x), p.contains("template") || (A = W);
              return;
            case "li":
              for (h2 = false, N = p.elements.length - 1; N >= 0; N--) {
                if (H = p.elements[N], H instanceof ee.HTMLLIElement) {
                  F(G, "li");
                  break;
                }
                if (te(H, Ft) && !te(H, ai))
                  break;
              }
              p.inButtonScope("p") && F(G, "p"), B(s, x);
              return;
            case "dd":
            case "dt":
              for (h2 = false, N = p.elements.length - 1; N >= 0; N--) {
                if (H = p.elements[N], te(H, $o)) {
                  F(G, H.localName);
                  break;
                }
                if (te(H, Ft) && !te(H, ai))
                  break;
              }
              p.inButtonScope("p") && F(G, "p"), B(s, x);
              return;
            case "plaintext":
              p.inButtonScope("p") && F(G, "p"), B(s, x), g = Or;
              return;
            case "button":
              p.inScope("button") ? (F(G, "button"), k(i, s, x, E)) : (Ae(), B(s, x), h2 = false);
              return;
            case "a":
              var le = d.findElementByTag("a");
              le && (F(G, s), d.remove(le), p.removeElement(le));
            case "b":
            case "big":
            case "code":
            case "em":
            case "font":
            case "i":
            case "s":
            case "small":
            case "strike":
            case "strong":
            case "tt":
            case "u":
              Ae(), d.push(B(s, x), x);
              return;
            case "nobr":
              Ae(), p.inScope(s) && (F(G, s), Ae()), d.push(B(s, x), x);
              return;
            case "applet":
            case "marquee":
            case "object":
              Ae(), B(s, x), d.insertMarker(), h2 = false;
              return;
            case "table":
              !L._quirks && p.inButtonScope("p") && F(G, "p"), B(s, x), h2 = false, k = Be;
              return;
            case "area":
            case "br":
            case "embed":
            case "img":
            case "keygen":
            case "wbr":
              Ae(), B(s, x), p.pop(), h2 = false;
              return;
            case "input":
              Ae(), W = B(s, x), p.pop();
              var ye = W.getAttribute("type");
              (!ye || ye.toLowerCase() !== "hidden") && (h2 = false);
              return;
            case "param":
            case "source":
            case "track":
              B(s, x), p.pop();
              return;
            case "hr":
              p.inButtonScope("p") && F(G, "p"), te(p.top, "menuitem") && p.pop(), B(s, x), p.pop(), h2 = false;
              return;
            case "image":
              F(Ne, "img", x, E);
              return;
            case "textarea":
              B(s, x), T = true, h2 = false, g = pt, Fe = k, k = Wr;
              return;
            case "xmp":
              p.inButtonScope("p") && F(G, "p"), Ae(), h2 = false, cr(s, x);
              return;
            case "iframe":
              h2 = false, cr(s, x);
              return;
            case "noembed":
              cr(s, x);
              return;
            case "noscript":
              if (c) {
                cr(s, x);
                return;
              }
              break;
            case "select":
              Ae(), B(s, x), h2 = false, k === Be || k === Wn || k === At || k === fr || k === Vt ? k = Yr : k = st;
              return;
            case "optgroup":
            case "option":
              p.top instanceof ee.HTMLOptionElement && F(G, "option"), Ae(), B(s, x);
              return;
            case "menuitem":
              te(p.top, "menuitem") && p.pop(), Ae(), B(s, x);
              return;
            case "rb":
            case "rtc":
              p.inScope("ruby") && p.generateImpliedEndTags(), B(s, x);
              return;
            case "rp":
            case "rt":
              p.inScope("ruby") && p.generateImpliedEndTags("rtc"), B(s, x);
              return;
            case "math":
              Ae(), dc(x), ci(x), On(s, x, q.MATHML), E && p.pop();
              return;
            case "svg":
              Ae(), fc(x), ci(x), On(s, x, q.SVG), E && p.pop();
              return;
            case "caption":
            case "col":
            case "colgroup":
            case "frame":
            case "head":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
              return;
          }
          Ae(), B(s, x);
          return;
        case 3:
          switch (s) {
            case "template":
              fe(G, s, x);
              return;
            case "body":
              if (!p.inScope("body"))
                return;
              k = Ci;
              return;
            case "html":
              if (!p.inScope("body"))
                return;
              k = Ci, k(i, s, x);
              return;
            case "address":
            case "article":
            case "aside":
            case "blockquote":
            case "button":
            case "center":
            case "details":
            case "dialog":
            case "dir":
            case "div":
            case "dl":
            case "fieldset":
            case "figcaption":
            case "figure":
            case "footer":
            case "header":
            case "hgroup":
            case "listing":
            case "main":
            case "menu":
            case "nav":
            case "ol":
            case "pre":
            case "section":
            case "summary":
            case "ul":
              if (!p.inScope(s))
                return;
              p.generateImpliedEndTags(), p.popTag(s);
              return;
            case "form":
              if (p.contains("template")) {
                if (!p.inScope("form"))
                  return;
                p.generateImpliedEndTags(), p.popTag("form");
              } else {
                var Ue = A;
                if (A = null, !Ue || !p.elementInScope(Ue))
                  return;
                p.generateImpliedEndTags(), p.removeElement(Ue);
              }
              return;
            case "p":
              p.inButtonScope(s) ? (p.generateImpliedEndTags(s), p.popTag(s)) : (F(Ne, s, null), k(i, s, x, E));
              return;
            case "li":
              if (!p.inListItemScope(s))
                return;
              p.generateImpliedEndTags(s), p.popTag(s);
              return;
            case "dd":
            case "dt":
              if (!p.inScope(s))
                return;
              p.generateImpliedEndTags(s), p.popTag(s);
              return;
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
              if (!p.elementTypeInScope(ee.HTMLHeadingElement))
                return;
              p.generateImpliedEndTags(), p.popElementType(ee.HTMLHeadingElement);
              return;
            case "sarcasm":
              break;
            case "a":
            case "b":
            case "big":
            case "code":
            case "em":
            case "font":
            case "i":
            case "nobr":
            case "s":
            case "small":
            case "strike":
            case "strong":
            case "tt":
            case "u":
              var Ge = Oc(s);
              if (Ge)
                return;
              break;
            case "applet":
            case "marquee":
            case "object":
              if (!p.inScope(s))
                return;
              p.generateImpliedEndTags(), p.popTag(s), d.clearToMarker();
              return;
            case "br":
              F(Ne, s, null);
              return;
          }
          for (N = p.elements.length - 1; N >= 0; N--)
            if (H = p.elements[N], te(H, s)) {
              p.generateImpliedEndTags(s), p.popElement(H);
              break;
            } else if (te(H, Ft))
              return;
          return;
      }
    }
    function Wr(i, s, x, E) {
      switch (i) {
        case 1:
          Ze(s);
          return;
        case -1:
          p.top instanceof ee.HTMLScriptElement && (p.top._already_started = true), p.pop(), k = Fe, k(i);
          return;
        case 3:
          s === "script" ? qc() : (p.pop(), k = Fe);
          return;
        default:
          return;
      }
    }
    function Be(i, s, x, E) {
      function v(H) {
        for (var W = 0, le = H.length; W < le; W++)
          if (H[W][0] === "type")
            return H[W][1].toLowerCase();
        return null;
      }
      switch (i) {
        case 1:
          if (o) {
            F(i, s, x, E);
            return;
          } else if (te(p.top, rr)) {
            a = [], Fe = k, k = kl, k(i, s, x, E);
            return;
          }
          break;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case 2:
          switch (s) {
            case "caption":
              p.clearToContext(kn), d.insertMarker(), B(s, x), k = Wn;
              return;
            case "colgroup":
              p.clearToContext(kn), B(s, x), k = Gr;
              return;
            case "col":
              Be(Ne, "colgroup", null), k(i, s, x, E);
              return;
            case "tbody":
            case "tfoot":
            case "thead":
              p.clearToContext(kn), B(s, x), k = At;
              return;
            case "td":
            case "th":
            case "tr":
              Be(Ne, "tbody", null), k(i, s, x, E);
              return;
            case "table":
              if (!p.inTableScope(s))
                return;
              Be(G, s), k(i, s, x, E);
              return;
            case "style":
            case "script":
            case "template":
              fe(i, s, x, E);
              return;
            case "input":
              var N = v(x);
              if (N !== "hidden")
                break;
              B(s, x), p.pop();
              return;
            case "form":
              if (A || p.contains("template"))
                return;
              A = B(s, x), p.popElement(A);
              return;
          }
          break;
        case 3:
          switch (s) {
            case "table":
              if (!p.inTableScope(s))
                return;
              p.popTag(s), or();
              return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
              return;
            case "template":
              fe(i, s, x, E);
              return;
          }
          break;
        case -1:
          F(i, s, x, E);
          return;
      }
      xt = true, F(i, s, x, E), xt = false;
    }
    function kl(i, s, x, E) {
      if (i === tr) {
        if (b && (s = s.replace(An, ""), s.length === 0))
          return;
        a.push(s);
      } else {
        var v = a.join("");
        a.length = 0, Cn.test(v) ? (xt = true, F(tr, v), xt = false) : Ze(v), k = Fe, k(i, s, x, E);
      }
    }
    function Wn(i, s, x, E) {
      function v() {
        return p.inTableScope("caption") ? (p.generateImpliedEndTags(), p.popTag("caption"), d.clearToMarker(), k = Be, true) : false;
      }
      switch (i) {
        case 2:
          switch (s) {
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
              v() && k(i, s, x, E);
              return;
          }
          break;
        case 3:
          switch (s) {
            case "caption":
              v();
              return;
            case "table":
              v() && k(i, s, x, E);
              return;
            case "body":
            case "col":
            case "colgroup":
            case "html":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
              return;
          }
          break;
      }
      F(i, s, x, E);
    }
    function Gr(i, s, x, E) {
      switch (i) {
        case 1:
          var v = s.match(Ht);
          if (v && (Ze(v[0]), s = s.substring(v[0].length)), s.length === 0)
            return;
          break;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "col":
              B(s, x), p.pop();
              return;
            case "template":
              fe(i, s, x, E);
              return;
          }
          break;
        case 3:
          switch (s) {
            case "colgroup":
              if (!te(p.top, "colgroup"))
                return;
              p.pop(), k = Be;
              return;
            case "col":
              return;
            case "template":
              fe(i, s, x, E);
              return;
          }
          break;
        case -1:
          F(i, s, x, E);
          return;
      }
      !te(p.top, "colgroup") || (Gr(G, "colgroup"), k(i, s, x, E));
    }
    function At(i, s, x, E) {
      function v() {
        !p.inTableScope("tbody") && !p.inTableScope("thead") && !p.inTableScope("tfoot") || (p.clearToContext(Sn), At(G, p.top.localName, null), k(i, s, x, E));
      }
      switch (i) {
        case 2:
          switch (s) {
            case "tr":
              p.clearToContext(Sn), B(s, x), k = fr;
              return;
            case "th":
            case "td":
              At(Ne, "tr", null), k(i, s, x, E);
              return;
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "tfoot":
            case "thead":
              v();
              return;
          }
          break;
        case 3:
          switch (s) {
            case "table":
              v();
              return;
            case "tbody":
            case "tfoot":
            case "thead":
              p.inTableScope(s) && (p.clearToContext(Sn), p.pop(), k = Be);
              return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
            case "td":
            case "th":
            case "tr":
              return;
          }
          break;
      }
      Be(i, s, x, E);
    }
    function fr(i, s, x, E) {
      function v() {
        return p.inTableScope("tr") ? (p.clearToContext(ii), p.pop(), k = At, true) : false;
      }
      switch (i) {
        case 2:
          switch (s) {
            case "th":
            case "td":
              p.clearToContext(ii), B(s, x), k = Vt, d.insertMarker();
              return;
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "tfoot":
            case "thead":
            case "tr":
              v() && k(i, s, x, E);
              return;
          }
          break;
        case 3:
          switch (s) {
            case "tr":
              v();
              return;
            case "table":
              v() && k(i, s, x, E);
              return;
            case "tbody":
            case "tfoot":
            case "thead":
              p.inTableScope(s) && v() && k(i, s, x, E);
              return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
            case "td":
            case "th":
              return;
          }
          break;
      }
      Be(i, s, x, E);
    }
    function Vt(i, s, x, E) {
      switch (i) {
        case 2:
          switch (s) {
            case "caption":
            case "col":
            case "colgroup":
            case "tbody":
            case "td":
            case "tfoot":
            case "th":
            case "thead":
            case "tr":
              p.inTableScope("td") ? (Vt(G, "td"), k(i, s, x, E)) : p.inTableScope("th") && (Vt(G, "th"), k(i, s, x, E));
              return;
          }
          break;
        case 3:
          switch (s) {
            case "td":
            case "th":
              if (!p.inTableScope(s))
                return;
              p.generateImpliedEndTags(), p.popTag(s), d.clearToMarker(), k = fr;
              return;
            case "body":
            case "caption":
            case "col":
            case "colgroup":
            case "html":
              return;
            case "table":
            case "tbody":
            case "tfoot":
            case "thead":
            case "tr":
              if (!p.inTableScope(s))
                return;
              Vt(G, p.inTableScope("td") ? "td" : "th"), k(i, s, x, E);
              return;
          }
          break;
      }
      F(i, s, x, E);
    }
    function st(i, s, x, E) {
      switch (i) {
        case 1:
          if (b && (s = s.replace(An, ""), s.length === 0))
            return;
          Ze(s);
          return;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case -1:
          F(i, s, x, E);
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "option":
              p.top instanceof ee.HTMLOptionElement && st(G, s), B(s, x);
              return;
            case "optgroup":
              p.top instanceof ee.HTMLOptionElement && st(G, "option"), p.top instanceof ee.HTMLOptGroupElement && st(G, s), B(s, x);
              return;
            case "select":
              st(G, s);
              return;
            case "input":
            case "keygen":
            case "textarea":
              if (!p.inSelectScope("select"))
                return;
              st(G, "select"), k(i, s, x, E);
              return;
            case "script":
            case "template":
              fe(i, s, x, E);
              return;
          }
          break;
        case 3:
          switch (s) {
            case "optgroup":
              p.top instanceof ee.HTMLOptionElement && p.elements[p.elements.length - 2] instanceof ee.HTMLOptGroupElement && st(G, "option"), p.top instanceof ee.HTMLOptGroupElement && p.pop();
              return;
            case "option":
              p.top instanceof ee.HTMLOptionElement && p.pop();
              return;
            case "select":
              if (!p.inSelectScope(s))
                return;
              p.popTag(s), or();
              return;
            case "template":
              fe(i, s, x, E);
              return;
          }
          break;
      }
    }
    function Yr(i, s, x, E) {
      switch (s) {
        case "caption":
        case "table":
        case "tbody":
        case "tfoot":
        case "thead":
        case "tr":
        case "td":
        case "th":
          switch (i) {
            case 2:
              Yr(G, "select"), k(i, s, x, E);
              return;
            case 3:
              p.inTableScope(s) && (Yr(G, "select"), k(i, s, x, E));
              return;
          }
      }
      st(i, s, x, E);
    }
    function Gn(i, s, x, E) {
      function v(N) {
        k = N, je[je.length - 1] = k, k(i, s, x, E);
      }
      switch (i) {
        case 1:
        case 4:
        case 5:
          F(i, s, x, E);
          return;
        case -1:
          p.contains("template") ? (p.popTag("template"), d.clearToMarker(), je.pop(), or(), k(i, s, x, E)) : St();
          return;
        case 2:
          switch (s) {
            case "base":
            case "basefont":
            case "bgsound":
            case "link":
            case "meta":
            case "noframes":
            case "script":
            case "style":
            case "template":
            case "title":
              fe(i, s, x, E);
              return;
            case "caption":
            case "colgroup":
            case "tbody":
            case "tfoot":
            case "thead":
              v(Be);
              return;
            case "col":
              v(Gr);
              return;
            case "tr":
              v(At);
              return;
            case "td":
            case "th":
              v(fr);
              return;
          }
          v(F);
          return;
        case 3:
          switch (s) {
            case "template":
              fe(i, s, x, E);
              return;
            default:
              return;
          }
      }
    }
    function Ci(i, s, x, E) {
      switch (i) {
        case 1:
          if (Cn.test(s))
            break;
          F(i, s);
          return;
        case 4:
          p.elements[0]._appendChild(L.createComment(s));
          return;
        case 5:
          return;
        case -1:
          St();
          return;
        case 2:
          if (s === "html") {
            F(i, s, x, E);
            return;
          }
          break;
        case 3:
          if (s === "html") {
            if (Xe)
              return;
            k = Nl;
            return;
          }
          break;
      }
      k = F, k(i, s, x, E);
    }
    function Yn(i, s, x, E) {
      switch (i) {
        case 1:
          s = s.replace(oi, ""), s.length > 0 && Ze(s);
          return;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case -1:
          St();
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "frameset":
              B(s, x);
              return;
            case "frame":
              B(s, x), p.pop();
              return;
            case "noframes":
              fe(i, s, x, E);
              return;
          }
          break;
        case 3:
          if (s === "frameset") {
            if (Xe && p.top instanceof ee.HTMLHtmlElement)
              return;
            p.pop(), !Xe && !(p.top instanceof ee.HTMLFrameSetElement) && (k = Sl);
            return;
          }
          break;
      }
    }
    function Sl(i, s, x, E) {
      switch (i) {
        case 1:
          s = s.replace(oi, ""), s.length > 0 && Ze(s);
          return;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case -1:
          St();
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "noframes":
              fe(i, s, x, E);
              return;
          }
          break;
        case 3:
          if (s === "html") {
            k = Cl;
            return;
          }
          break;
      }
    }
    function Nl(i, s, x, E) {
      switch (i) {
        case 1:
          if (Cn.test(s))
            break;
          F(i, s, x, E);
          return;
        case 4:
          L._appendChild(L.createComment(s));
          return;
        case 5:
          F(i, s, x, E);
          return;
        case -1:
          St();
          return;
        case 2:
          if (s === "html") {
            F(i, s, x, E);
            return;
          }
          break;
      }
      k = F, k(i, s, x, E);
    }
    function Cl(i, s, x, E) {
      switch (i) {
        case 1:
          s = s.replace(oi, ""), s.length > 0 && F(i, s, x, E);
          return;
        case 4:
          L._appendChild(L.createComment(s));
          return;
        case 5:
          F(i, s, x, E);
          return;
        case -1:
          St();
          return;
        case 2:
          switch (s) {
            case "html":
              F(i, s, x, E);
              return;
            case "noframes":
              fe(i, s, x, E);
              return;
          }
          break;
      }
    }
    function Ai(i, s, x, E) {
      function v(le) {
        for (var ye = 0, Ue = le.length; ye < Ue; ye++)
          switch (le[ye][0]) {
            case "color":
            case "face":
            case "size":
              return true;
          }
        return false;
      }
      var N;
      switch (i) {
        case 1:
          h2 && tf.test(s) && (h2 = false), b && (s = s.replace(An, "\uFFFD")), Ze(s);
          return;
        case 4:
          Qe(s);
          return;
        case 5:
          return;
        case 2:
          switch (s) {
            case "font":
              if (!v(x))
                break;
            case "b":
            case "big":
            case "blockquote":
            case "body":
            case "br":
            case "center":
            case "code":
            case "dd":
            case "div":
            case "dl":
            case "dt":
            case "em":
            case "embed":
            case "h1":
            case "h2":
            case "h3":
            case "h4":
            case "h5":
            case "h6":
            case "head":
            case "hr":
            case "i":
            case "img":
            case "li":
            case "listing":
            case "menu":
            case "meta":
            case "nobr":
            case "ol":
            case "p":
            case "pre":
            case "ruby":
            case "s":
            case "small":
            case "span":
            case "strong":
            case "strike":
            case "sub":
            case "sup":
            case "table":
            case "tt":
            case "u":
            case "ul":
            case "var":
              if (Xe)
                break;
              do
                p.pop(), N = p.top;
              while (N.namespaceURI !== q.HTML && !lc(N) && !uc(N));
              pe(i, s, x, E);
              return;
          }
          N = p.elements.length === 1 && Xe ? t : p.top, N.namespaceURI === q.MATHML ? dc(x) : N.namespaceURI === q.SVG && (s = nf(s), fc(x)), ci(x), On(s, x, N.namespaceURI), E && (s === "script" && N.namespaceURI === q.SVG, p.pop());
          return;
        case 3:
          if (N = p.top, s === "script" && N.namespaceURI === q.SVG && N.localName === "script")
            p.pop();
          else
            for (var H = p.elements.length - 1, W = p.elements[H]; ; ) {
              if (W.localName.toLowerCase() === s) {
                p.popElement(W);
                break;
              }
              if (W = p.elements[--H], W.namespaceURI === q.HTML) {
                k(i, s, x, E);
                break;
              }
            }
          return;
      }
    }
    return I.testTokenizer = function(i, s, x, E) {
      var v = [];
      switch (s) {
        case "PCDATA state":
          g = j;
          break;
        case "RCDATA state":
          g = pt;
          break;
        case "RAWTEXT state":
          g = lr;
          break;
        case "PLAINTEXT state":
          g = Or;
          break;
      }
      if (x && (ve = x), pe = function(H, W, le, ye) {
        switch (Ut(), H) {
          case 1:
            v.length > 0 && v[v.length - 1][0] === "Character" ? v[v.length - 1][1] += W : v.push(["Character", W]);
            break;
          case 4:
            v.push(["Comment", W]);
            break;
          case 5:
            v.push(["DOCTYPE", W, le === void 0 ? null : le, ye === void 0 ? null : ye, !m]);
            break;
          case 2:
            for (var Ue = Object.create(null), Ge = 0; Ge < le.length; Ge++) {
              var Lt = le[Ge];
              Lt.length === 1 ? Ue[Lt[0]] = "" : Ue[Lt[0]] = Lt[1];
            }
            var Et = ["StartTag", W, Ue];
            ye && Et.push(true), v.push(Et);
            break;
          case 3:
            v.push(["EndTag", W]);
            break;
        }
      }, !E)
        this.parse(i, true);
      else {
        for (var N = 0; N < i.length; N++)
          this.parse(i[N]);
        this.parse("", true);
      }
      return v;
    }, I;
  }
});
var Cr = O((hd, bc) => {
  bc.exports = gc;
  var pc = vn(), mc = Tn(), af = Ln(), Dn = he(), sf = tn();
  function gc(e) {
    this.contextObject = e;
  }
  var of = { xml: { "": true, "1.0": true, "2.0": true }, core: { "": true, "2.0": true }, html: { "": true, "1.0": true, "2.0": true }, xhtml: { "": true, "1.0": true, "2.0": true } };
  gc.prototype = { hasFeature: function(t, r) {
    var n = of[(t || "").toLowerCase()];
    return n && n[r || ""] || false;
  }, createDocumentType: function(t, r, n) {
    return sf.isValidQName(t) || Dn.InvalidCharacterError(), new mc(this.contextObject, t, r, n);
  }, createDocument: function(t, r, n) {
    var l = new pc(false, null), f;
    return r ? f = l.createElementNS(t, r) : f = null, n && l.appendChild(n), f && l.appendChild(f), t === Dn.NAMESPACE.HTML ? l._contentType = "application/xhtml+xml" : t === Dn.NAMESPACE.SVG ? l._contentType = "image/svg+xml" : l._contentType = "application/xml", l;
  }, createHTMLDocument: function(t) {
    var r = new pc(true, null);
    r.appendChild(new mc(r, "html"));
    var n = r.createElement("html");
    r.appendChild(n);
    var l = r.createElement("head");
    if (n.appendChild(l), t !== void 0) {
      var f = r.createElement("title");
      l.appendChild(f), f.appendChild(r.createTextNode(t));
    }
    return n.appendChild(r.createElement("body")), r.modclock = 1, r;
  }, mozSetOutputMutationHandler: function(e, t) {
    e.mutationHandler = t;
  }, mozGetInputMutationHandler: function(e) {
    Dn.nyi();
  }, mozHTMLParser: af };
});
var Ec = O((xd, _c) => {
  var cf = xn(), lf = $a();
  _c.exports = li;
  function li(e, t) {
    this._window = e, this._href = t;
  }
  li.prototype = Object.create(lf.prototype, { constructor: { value: li }, href: { get: function() {
    return this._href;
  }, set: function(e) {
    this.assign(e);
  } }, assign: { value: function(e) {
    var t = new cf(this._href), r = t.resolve(e);
    this._href = r;
  } }, replace: { value: function(e) {
    this.assign(e);
  } }, reload: { value: function() {
    this.assign(this.href);
  } }, toString: { value: function() {
    return this.href;
  } } });
});
var yc = O((pd, vc) => {
  var uf = Object.create(null, { appCodeName: { value: "Mozilla" }, appName: { value: "Netscape" }, appVersion: { value: "4.0" }, platform: { value: "" }, product: { value: "Gecko" }, productSub: { value: "20100101" }, userAgent: { value: "" }, vendor: { value: "" }, vendorSub: { value: "" }, taintEnabled: { value: function() {
    return false;
  } } });
  vc.exports = uf;
});
var wc = O((md, Tc) => {
  var ff = { setTimeout, clearTimeout, setInterval, clearInterval };
  Tc.exports = ff;
});
var fi = O((Ar, kc) => {
  var ui = he();
  Ar = kc.exports = { CSSStyleDeclaration: pn(), CharacterData: Er(), Comment: Ra(), DOMException: Xr(), DOMImplementation: Cr(), DOMTokenList: ga(), Document: vn(), DocumentFragment: qa(), DocumentType: Tn(), Element: Xt(), HTMLParser: Ln(), NamedNodeMap: Ta(), Node: Te(), NodeList: It(), NodeFilter: vr(), ProcessingInstruction: Ha(), Text: Da(), Window: di() };
  ui.merge(Ar, Ya());
  ui.merge(Ar, bn().elements);
  ui.merge(Ar, ei().elements);
});
var di = O((gd, Sc) => {
  var df = Cr(), hf = Jn(), xf = Ec(), pf = Ka(), Lr = he();
  Sc.exports = Mn;
  function Mn(e) {
    this.document = e || new df(null).createHTMLDocument(""), this.document._scripting_enabled = true, this.document.defaultView = this, this.location = new xf(this, this.document._address || "about:blank");
  }
  Mn.prototype = Object.create(hf.prototype, { _run: { value: pf.Window_run }, console: { value: console }, history: { value: { back: Lr.nyi, forward: Lr.nyi, go: Lr.nyi } }, navigator: { value: yc() }, window: { get: function() {
    return this;
  } }, self: { get: function() {
    return this;
  } }, frames: { get: function() {
    return this;
  } }, parent: { get: function() {
    return this;
  } }, top: { get: function() {
    return this;
  } }, length: { value: 0 }, frameElement: { value: null }, opener: { value: null }, onload: { get: function() {
    return this._getEventHandler("load");
  }, set: function(e) {
    this._setEventHandler("load", e);
  } }, getComputedStyle: { value: function(t) {
    return t.style;
  } } });
  Lr.expose(wc(), Mn);
  Lr.expose(fi(), Mn);
});
var gf = O((Pt) => {
  var Nc = Cr(), Cc = Ln(), mf = di();
  Pt.createDOMImplementation = function() {
    return new Nc(null);
  };
  Pt.createDocument = function(e, t) {
    if (e || t) {
      var r = new Cc();
      return r.parse(e || "", true), r.document();
    }
    return new Nc(null).createHTMLDocument("");
  };
  Pt.createIncrementalHTMLParser = function() {
    var e = new Cc();
    return { write: function(t) {
      t.length > 0 && e.parse(t, false, function() {
        return true;
      });
    }, end: function(t) {
      e.parse(t || "", true, function() {
        return true;
      });
    }, process: function(t) {
      return e.parse("", false, t);
    }, document: function() {
      return e.document();
    } };
  };
  Pt.createWindow = function(e, t) {
    var r = Pt.createDocument(e);
    return t !== void 0 && (r._address = t), new mf(r);
  };
  Pt.impl = fi();
});
var qwikdom_default = gf();
__toModule(require_global());
var _setImmediate = typeof setImmediate === "function" ? setImmediate : setTimeout;
var _nextTick = typeof queueMicrotask === "function" ? queueMicrotask : process.nextTick;
function createPlatform(document2, opts) {
  if (!document2 || document2.nodeType !== 9) {
    throw new Error(`Invalid Document implementation`);
  }
  let queuePromise;
  const doc = document2;
  if (opts == null ? void 0 : opts.url) {
    doc.location.href = opts.url.href;
  }
  const serverPlatform = {
    async importSymbol(element, qrl2, symbol) {
      throw new Error("IMPLEMENT: Server.importSymbol " + qrl2 + " " + symbol);
    },
    queueRender: (renderMarked2) => {
      if (!queuePromise) {
        queuePromise = new Promise((resolve, reject) => _setImmediate(() => {
          queuePromise = null;
          renderMarked2(doc).then(resolve, reject);
        }));
      }
      return queuePromise;
    },
    queueStoreFlush: (flushStore) => {
      if (!queuePromise) {
        queuePromise = new Promise((resolve, reject) => _nextTick(() => {
          queuePromise = null;
          flushStore(doc).then(resolve, reject);
        }));
      }
      return queuePromise;
    }
  };
  return serverPlatform;
}
async function setServerPlatform(document2, opts) {
  const platform = createPlatform(document2, opts);
  setPlatform(document2, platform);
}
__toModule(require_global());
function serializeDocument(doc, opts) {
  if (!doc || doc.nodeType !== 9) {
    throw new Error(`Invalid document to serialize`);
  }
  let html = "<!DOCTYPE html>" + doc.documentElement.outerHTML;
  let symbols = opts == null ? void 0 : opts.symbols;
  if (typeof symbols === "object" && symbols != null) {
    symbols = createQrlMapper(symbols);
  }
  if (typeof symbols === "function") {
    const qrlMapper = symbols;
    const extractOnAttrs = function(_, attr, eventName, value) {
      return attr + '="' + value.split("\n").map((qrl2) => qrl2.trim().replace(QRL_MATCHER, replaceQRLs)).join("\n") + '"';
    };
    const replaceQRLs = function(_, chunk, hashSymbol, symbol, scope) {
      return qrlMapper(chunk, symbol) + scope;
    };
    html = html.replace(ON_ATTR_MATCHER, extractOnAttrs);
  }
  return html;
}
function createQrlMapper(qEntryMap) {
  if (qEntryMap.version !== "1") {
    throw new Error("QRL entry map version is not 1");
  }
  if (typeof qEntryMap.mapping !== "object" || qEntryMap.mapping === null) {
    throw new Error("QRL entry mapping is not an object");
  }
  const symbolManifest = new Map();
  Object.entries(qEntryMap.mapping).forEach(([symbolName, chunkName]) => {
    symbolManifest.set(symbolName, chunkName);
  });
  const qrlMapper = (path, symbolName) => {
    path = symbolManifest.get(symbolName) || path;
    return `${path}#${symbolName}`;
  };
  return qrlMapper;
}
var ON_ATTR_MATCHER = /(on(|-window|-document):[\w\d\-$_]+)="([^"]+)+"/g;
var QRL_MATCHER = /^([^#]+)(#([\w\d$_]+))?(\[.*\])?$/g;
__toModule(require_global());
function createTimer() {
  if (typeof performance === "undefined") {
    return () => 0;
  }
  const start = performance.now();
  return () => {
    const end = performance.now();
    const delta = end - start;
    return delta / 1e6;
  };
}
function createGlobal(opts) {
  opts = opts || {};
  const doc = qwikdom_default.createDocument();
  const baseURI = opts.url === void 0 ? BASE_URI : opts.url.href;
  const loc = new URL(baseURI, BASE_URI);
  Object.defineProperty(doc, "baseURI", {
    get: () => loc.href,
    set: (url) => loc.href = url
  });
  const glb = {
    document: doc,
    location: loc,
    CustomEvent: class CustomEvent {
      constructor(type, details) {
        Object.assign(this, details);
        this.type = type;
      }
    }
  };
  glb.document.defaultView = glb;
  return glb;
}
function createDocument(opts) {
  const glb = createGlobal(opts);
  return glb.document;
}
async function renderToDocument(doc, rootNode, opts) {
  if (!doc || doc.nodeType !== 9) {
    throw new Error(`Invalid document`);
  }
  await setServerPlatform(doc, opts);
  await render$1(doc, rootNode);
  if (opts.dehydrate !== false) {
    dehydrate(doc);
  }
}
async function renderToString(rootNode, opts) {
  const createDocTimer = createTimer();
  const doc = createDocument(opts);
  const createDocTime = createDocTimer();
  const renderDocTimer = createTimer();
  await renderToDocument(doc, rootNode, opts);
  const renderDocTime = renderDocTimer();
  const docToStringTimer = createTimer();
  const result = {
    html: serializeDocument(doc, opts),
    timing: {
      createDocument: createDocTime,
      render: renderDocTime,
      toString: docToStringTimer()
    }
  };
  return result;
}
var BASE_URI = `http://document.qwik.dev/`;
__toModule(require_global());
__toModule(require_global());
__toModule(require_global());
var QWIK_LOADER_DEFAULT_MINIFIED = '!function(){const e=(t,n,o,s,r)=>(void 0===o?n?(s=n.getAttribute("q:base"),r=e(t,n.parentNode&&n.parentNode.closest("[q\\\\:base]"))):s=t.baseURI:o&&(s=o,r=e(t,n.closest("[q\\\\:base]"))),s?new URL(s,r):void 0);((t,n)=>{const o="__q_context__",s=["on:","on-window:","on-document:"],r=async(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((e=>a(e,n,o)))},a=async(n,r,a,i,d,l)=>{for(const u of s){l=n.getAttribute(u+r)||"";for(const s of l.split("\\n"))if(i=e(t,n,s)){const e=c(i,window[i.pathname]||await import((i+"").split("#")[0]));d=document[o];try{document[o]=[n,a,i],e(n,a,i)}finally{document[o]=d}}}},c=(e,t,n)=>t[n=e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default"]||(e=>{throw Error("QWIK: "+e)})(e+" does not export "+n),i=async(e,n)=>{if((n=e.target)==t)setTimeout((()=>r("-document",e.type,e)));else for(;n&&n.getAttribute;)a(n,e.type,e),n=e.bubbles?n.parentElement:null},d=e=>t.addEventListener(e,i,{capture:!0}),l=e=>{e=t.readyState,n||"interactive"!=e&&"complete"!=e||(n=1,r("","q-init",new CustomEvent("qInit")))};{const e=t.querySelector("script[events]");if(e)(e.getAttribute("events")||"").split(/[\\s,;]+/).forEach(d);else for(const e in t)0==e.indexOf("on")&&d(e.substring(2))}t.addEventListener("readystatechange",l),l()})(document)}();';
var QWIK_LOADER_DEFAULT_DEBUG = '!function() {\n    const qrlResolver = (doc, element, eventUrl, _url, _base) => {\n        if (void 0 === eventUrl) {\n            if (element) {\n                _url = element.getAttribute("q:base");\n                _base = qrlResolver(doc, element.parentNode && element.parentNode.closest("[q\\\\:base]"));\n            } else {\n                _url = doc.baseURI;\n            }\n        } else if (eventUrl) {\n            _url = eventUrl;\n            _base = qrlResolver(doc, element.closest("[q\\\\:base]"));\n        }\n        return _url ? new URL(_url, _base) : void 0;\n    };\n    ((doc, hasInitialized) => {\n        const ON_PREFIXES = [ "on:", "on-window:", "on-document:" ];\n        const broadcast = async (infix, type, event) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, type, event)));\n        };\n        const dispatch = async (element, eventName, ev, url, previousCtx, attrValue) => {\n            for (const on of ON_PREFIXES) {\n                attrValue = element.getAttribute(on + eventName) || "";\n                for (const qrl of attrValue.split("\\n")) {\n                    if (url = qrlResolver(doc, element, qrl)) {\n                        const handler = getModuleExport(url, window[url.pathname] || await import(String(url).split("#")[0]));\n                        previousCtx = document.__q_context__;\n                        try {\n                            document.__q_context__ = [ element, ev, url ];\n                            handler(element, ev, url);\n                        } finally {\n                            document.__q_context__ = previousCtx;\n                        }\n                    }\n                }\n            }\n        };\n        const getModuleExport = (url, module, exportName) => module[exportName = url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default"] || (msg => {\n            throw new Error("QWIK: " + msg);\n        })(url + " does not export " + exportName);\n        const processEvent = async (ev, element) => {\n            if ((element = ev.target) == doc) {\n                setTimeout((() => broadcast("-document", ev.type, ev)));\n            } else {\n                while (element && element.getAttribute) {\n                    dispatch(element, ev.type, ev);\n                    element = ev.bubbles ? element.parentElement : null;\n                }\n            }\n        };\n        const addEventListener = eventName => doc.addEventListener(eventName, processEvent, {\n            capture: !0\n        });\n        const processReadyStateChange = readyState => {\n            readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "q-init", new CustomEvent("qInit"));\n            }\n        };\n        {\n            const scriptTag = doc.querySelector("script[events]");\n            if (scriptTag) {\n                (scriptTag.getAttribute("events") || "").split(/[\\s,;]+/).forEach(addEventListener);\n            } else {\n                for (const key in doc) {\n                    if (0 == key.indexOf("on")) {\n                        addEventListener(key.substring(2));\n                    }\n                }\n            }\n        }\n        doc.addEventListener("readystatechange", processReadyStateChange);\n        processReadyStateChange();\n    })(document);\n}();';
var QWIK_LOADER_OPTIMIZE_MINIFIED = '!function(){const e=(t,n,o,a,r)=>(void 0===o?n?(a=n.getAttribute("q:base"),r=e(t,n.parentNode&&n.parentNode.closest("[q\\\\:base]"))):a=t.baseURI:o&&(a=o,r=e(t,n.closest("[q\\\\:base]"))),a?new URL(a,r):void 0);((t,n)=>{const o="__q_context__",a=["on:","on-window:","on-document:"],r=async(e,n,o)=>{n=n.replace(/([A-Z])/g,(e=>"-"+e.toLowerCase())),t.querySelectorAll("[on"+e+"\\\\:"+n+"]").forEach((e=>s(e,n,o)))},s=async(n,r,s,i,d,l)=>{for(const u of a){l=n.getAttribute(u+r)||"";for(const a of l.split("\\n"))if(i=e(t,n,a)){const e=c(i,window[i.pathname]||await import((i+"").split("#")[0]));d=document[o];try{document[o]=[n,s,i],e(n,s,i)}finally{document[o]=d}}}},c=(e,t,n)=>t[n=e.hash.replace(/^#?([^?[|]*).*$/,"$1")||"default"]||(e=>{throw Error("QWIK: "+e)})(e+" does not export "+n),i=async(e,n)=>{if((n=e.target)==t)setTimeout((()=>r("-document",e.type,e)));else for(;n&&n.getAttribute;)s(n,e.type,e),n=e.bubbles?n.parentElement:null},d=e=>{e=t.readyState,n||"interactive"!=e&&"complete"!=e||(n=1,r("","q-init",new CustomEvent("qInit")))};window.qEvents.forEach((e=>t.addEventListener(e,i,{capture:!0}))),t.addEventListener("readystatechange",d),d()})(document)}();';
var QWIK_LOADER_OPTIMIZE_DEBUG = '!function() {\n    const qrlResolver = (doc, element, eventUrl, _url, _base) => {\n        if (void 0 === eventUrl) {\n            if (element) {\n                _url = element.getAttribute("q:base");\n                _base = qrlResolver(doc, element.parentNode && element.parentNode.closest("[q\\\\:base]"));\n            } else {\n                _url = doc.baseURI;\n            }\n        } else if (eventUrl) {\n            _url = eventUrl;\n            _base = qrlResolver(doc, element.closest("[q\\\\:base]"));\n        }\n        return _url ? new URL(_url, _base) : void 0;\n    };\n    ((doc, hasInitialized) => {\n        const ON_PREFIXES = [ "on:", "on-window:", "on-document:" ];\n        const broadcast = async (infix, type, event) => {\n            type = type.replace(/([A-Z])/g, (a => "-" + a.toLowerCase()));\n            doc.querySelectorAll("[on" + infix + "\\\\:" + type + "]").forEach((target => dispatch(target, type, event)));\n        };\n        const dispatch = async (element, eventName, ev, url, previousCtx, attrValue) => {\n            for (const on of ON_PREFIXES) {\n                attrValue = element.getAttribute(on + eventName) || "";\n                for (const qrl of attrValue.split("\\n")) {\n                    if (url = qrlResolver(doc, element, qrl)) {\n                        const handler = getModuleExport(url, window[url.pathname] || await import(String(url).split("#")[0]));\n                        previousCtx = document.__q_context__;\n                        try {\n                            document.__q_context__ = [ element, ev, url ];\n                            handler(element, ev, url);\n                        } finally {\n                            document.__q_context__ = previousCtx;\n                        }\n                    }\n                }\n            }\n        };\n        const getModuleExport = (url, module, exportName) => module[exportName = url.hash.replace(/^#?([^?[|]*).*$/, "$1") || "default"] || (msg => {\n            throw new Error("QWIK: " + msg);\n        })(url + " does not export " + exportName);\n        const processEvent = async (ev, element) => {\n            if ((element = ev.target) == doc) {\n                setTimeout((() => broadcast("-document", ev.type, ev)));\n            } else {\n                while (element && element.getAttribute) {\n                    dispatch(element, ev.type, ev);\n                    element = ev.bubbles ? element.parentElement : null;\n                }\n            }\n        };\n        const addEventListener = eventName => doc.addEventListener(eventName, processEvent, {\n            capture: !0\n        });\n        const processReadyStateChange = readyState => {\n            readyState = doc.readyState;\n            if (!hasInitialized && ("interactive" == readyState || "complete" == readyState)) {\n                hasInitialized = 1;\n                broadcast("", "q-init", new CustomEvent("qInit"));\n            }\n        };\n        window.qEvents.forEach(addEventListener);\n        doc.addEventListener("readystatechange", processReadyStateChange);\n        processReadyStateChange();\n    })(document);\n}();';
function getQwikLoaderScript(opts = {}) {
  if (Array.isArray(opts.events) && opts.events.length > 0) {
    const loader = opts.debug ? QWIK_LOADER_OPTIMIZE_DEBUG : QWIK_LOADER_OPTIMIZE_MINIFIED;
    return loader.replace("window.qEvents", JSON.stringify(opts.events));
  }
  return opts.debug ? QWIK_LOADER_DEFAULT_DEBUG : QWIK_LOADER_DEFAULT_MINIFIED;
}
__toModule(require_global());
var QwikLoader = ({ events, debug }) => {
  return jsx("script", {
    children: [getQwikLoaderScript({ events, debug })]
  });
};
/*!
Parser-Lib
Copyright (c) 2009-2011 Nicholas C. Zakas. All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
const Root = component(qrl(() => Promise.resolve().then(function() {
  return entry_hooks;
}), "Root_component"));
function render(opts) {
  return renderToString(/* @__PURE__ */ jsx("html", {
    children: [
      /* @__PURE__ */ jsx("head", {
        children: /* @__PURE__ */ jsx("title", {
          children: "Qwik Blank App"
        })
      }),
      /* @__PURE__ */ jsx("body", {
        "q:base": "/",
        children: [
          /* @__PURE__ */ jsx(Root, {}),
          /* @__PURE__ */ jsx(QwikLoader, {
            debug: opts.debug,
            events: null
          })
        ]
      })
    ]
  }), opts);
}
var styles = '/*\n! tailwindcss v3.0.18 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: \'\';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user\'s configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user\'s configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type=\'button\'],\n[type=\'reset\'],\n[type=\'submit\'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type=\'search\'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user\'s configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput:-ms-input-placeholder, textarea:-ms-input-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role="button"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don\'t get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/*\nEnsure the default browser behavior of the `hidden` attribute.\n*/\n\n[hidden] {\n  display: none;\n}\n\n*, ::before, ::after {\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n';
const Root_component_withStyles = styles;
const Root_component_onRender_input_onkeyup = () => {
  const [state] = useLexicalScope();
  const event = useEvent();
  const input = event.target;
  state.name = input.value;
};
const Root_component_onRender = () => {
  const [state] = useLexicalScope();
  return /* @__PURE__ */ jsx(Host, {
    class: "my-app",
    children: [
      /* @__PURE__ */ jsx("p", {
        style: {
          "text-align": "center"
        },
        children: /* @__PURE__ */ jsx("a", {
          href: "https://github.com/builderio/qwik",
          children: /* @__PURE__ */ jsx("img", {
            alt: "Qwik Logo",
            width: 400,
            src: "https://cdn.builder.io/api/v1/image/assets%2FYJIGb4i01jvw0SRdL5Bt%2F667ab6c2283d4c4d878fb9083aacc10f"
          })
        })
      }),
      /* @__PURE__ */ jsx("p", {
        children: "Congratulations Qwik is working!"
      }),
      /* @__PURE__ */ jsx("p", {
        children: "Next steps:"
      }),
      /* @__PURE__ */ jsx("ol", {
        children: [
          /* @__PURE__ */ jsx("li", {
            children: "Open dev-tools network tab and notice that no JavaScript was downloaded to render this page. (Zero JavaScript no matter the size of your app.)"
          }),
          /* @__PURE__ */ jsx("li", {
            children: [
              "Try interacting with this component by changing",
              " ",
              /* @__PURE__ */ jsx("input", {
                value: state.name,
                "on:keyup": qrl(() => Promise.resolve().then(function() {
                  return entry_hooks;
                }), "Root_component_onRender_input_onkeyup", [
                  state
                ])
              }),
              "."
            ]
          }),
          /* @__PURE__ */ jsx("li", {
            children: [
              "Observe that the binding changes: ",
              /* @__PURE__ */ jsx("code", {
                children: [
                  "Hello ",
                  state.name,
                  "!"
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx("li", {
            children: "Notice that Qwik automatically lazily-loaded and hydrated the component upon interaction without the developer having to code that behavior. (Lazy hydration is what gives even large apps instant on behavior.)"
          }),
          /* @__PURE__ */ jsx("li", {
            children: [
              "Read the docs ",
              /* @__PURE__ */ jsx("a", {
                href: "https://github.com/builderio/qwik",
                children: "here"
              }),
              "."
            ]
          }),
          /* @__PURE__ */ jsx("li", {
            children: "Replace the content of this component with your code."
          }),
          /* @__PURE__ */ jsx("li", {
            children: "Build amazing web-sites with unbeatable startup performance."
          })
        ]
      }),
      /* @__PURE__ */ jsx("hr", {}),
      /* @__PURE__ */ jsx("p", {
        style: {
          "text-align": "center"
        },
        children: [
          "Made with \u2764\uFE0F by",
          " ",
          /* @__PURE__ */ jsx("a", {
            target: "_blank",
            href: "https://www.builder.io/",
            children: "Builder.io"
          })
        ]
      })
    ]
  });
};
const Root_component = () => {
  withStyles(qrl(() => Promise.resolve().then(function() {
    return entry_hooks;
  }), "Root_component_withStyles"));
  const state = createStore({
    name: "World"
  });
  return onRender(qrl(() => Promise.resolve().then(function() {
    return entry_hooks;
  }), "Root_component_onRender", [
    state
  ]));
};
var entry_hooks = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  Root_component_withStyles,
  Root_component_onRender_input_onkeyup,
  Root_component_onRender,
  Root_component
});
export { render };
