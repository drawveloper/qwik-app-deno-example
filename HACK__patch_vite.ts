// Vite internals ensure ssr builds use CommonJS. Deno needs ES Modules. Here we are.
const FILE_TO_CHANGE = "./node_modules/vite/dist/node/chunks/dep-f5552faa.js"
const replaceFrom = "format: ssr ? 'cjs' : 'es',"
const replaceTo = "format: 'es',"
const depsFileContent = await Deno.readTextFile(FILE_TO_CHANGE);
Deno.writeTextFile(
  FILE_TO_CHANGE,
  depsFileContent.replace(replaceFrom, replaceTo),
)
console.log (`Finished applying vite ES module hack in ${FILE_TO_CHANGE}.`)