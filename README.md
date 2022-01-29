Three scenarios, none work.

# Run with `.mjs` import map

```
{
    "imports": {
       "@builder.io/qwik": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/core.mjs",
       "@builder.io/qwik/jsx-runtime": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/jsx-runtime.mjs",
       "@builder.io/qwik/optimizer": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/optimizer.mjs",
       "@builder.io/qwik/server": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/server/index.mjs",
       "@builder.io/qwik/testing": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/testing/index.mjs"
    }
 }
 ```

command: 

`deno run --allow-net --import-map=import_map.json server/mod.ts`

# Run with `.cjs` import map

```
{
    "imports": {
       "@builder.io/qwik": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/core.cjs",
       "@builder.io/qwik/jsx-runtime": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/jsx-runtime.cjs",
       "@builder.io/qwik/optimizer": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/optimizer.cjs",
       "@builder.io/qwik/server": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/server/index.cjs",
       "@builder.io/qwik/testing": "https://unpkg.com/browse/@builder.io/qwik@0.0.16-5/testing/index.cjs"
    }
 }
 ```

 command with compat:
 
 `deno run --allow-net --import-map=import_map.json --allow-read --unstable --compat server/mod.ts`


# Run with straight TS source: 

 ```
 {
    "imports": {
       "@builder.io/qwik": "https://raw.githubusercontent.com/BuilderIO/qwik/v0.0.16-5/src/core/index.ts",
       "@builder.io/qwik/jsx-runtime": "https://raw.githubusercontent.com/BuilderIO/qwik/v0.0.16-5/src/jsx-runtime.ts",
       "@builder.io/qwik/optimizer": "https://raw.githubusercontent.com/BuilderIO/qwik/v0.0.16-5/src/optimizer/src/index.ts",
       "@builder.io/qwik/server": "https://raw.githubusercontent.com/BuilderIO/qwik/v0.0.16-5/src/server/index.ts",
       "@builder.io/qwik/testing": "https://raw.githubusercontent.com/BuilderIO/qwik/v0.0.16-5/src/testing/index.ts"
    }
 }
 ```

command: 

 `deno run --allow-net --import-map=import_map.json server/mod.ts`