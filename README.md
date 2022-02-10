# Server-side Qwik on Deno

This is a working example of a Qwik app with server-side rendering and static asset serving performed by Deno, deployable to Deno Deploy.

A simpler, Deno example running JSX can be found here using `jsxImportSource`, for reference: https://github.com/firstdoit/nano-jsx-denon-live-reload

## How it works

This project adds a `deno.json` which configures deno to understand Qwik's JSX rules:

```
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "https://cdn.esm.sh/@builder.io/qwik",
    "lib": ["dom", "dom.asynciterable", "deno.ns"]
  }
}
```

And an import map at `import_map.json` to help deno understand the qwik imports:

```
{
  "imports": {
    "@builder.io/qwik": "./node_modules/@builder.io/qwik/core.mjs",
    "@builder.io/qwik/jsx-runtime": "./node_modules/@builder.io/qwik/jsx-runtime.mjs",
    "@builder.io/qwik/server": "./node_modules/@builder.io/qwik/server/index.mjs",
    "@builder.io/qwik/optimizer": "./node_modules/@builder.io/qwik/optimizer.mjs"
  }
}
```

Then, we create a `server/server.ts` which is supposed to **replace** the original `server/index.js` (which is an Express server in the node example).

Then, `npm install`, `npm build` to build the Qwik files, and run deno:

- If you use `denon`, simply `denon start`
- Else, run: `deno run --import-map=import_map.json --config ./deno.json --allow-net --allow-read --allow-env --unstable --no-check server/server.ts`

And it works :) welcome to Qwik on Deno!

# Compatible with Deno Deploy

Simply select the `server/server.ts` file as an entrypoint and you've got yourself a Qwik app powered by Deno **on the edge.** 💥