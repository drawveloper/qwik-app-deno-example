# Server-side Qwik on Deno (& Tailwind)

This is a working example of a Qwik app with server-side rendering and static asset serving performed by Deno, deployable to Deno Deploy.

If you want a simpler JSX-on-Deno stack, you should try `nano-jsx`: https://github.com/FutureDrivenDev/nano-jsx-denon-live-reload

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

Then, we create a `server/server.ts` which is supposed to **replace** the original `server/index.js` (an Express server in the node example).

Then, `npm install`, `npm build` to build the Qwik files, and finally run `deno`:

- If you use `denon`, simply `denon start`
- Else, run: `deno run --import-map=import_map.json --config ./deno.json --allow-net --allow-read --allow-env --unstable --no-check server/server.ts`

And it works :) welcome to Qwik on Deno!

# Compatible with Deno Deploy

Simply select the `server/server.ts` file as an entrypoint and you've got yourself a Qwik app powered by Deno **on the edge.** 💥

PS: You have to build and commit the dist files so Deno Deploy can use them. Qwik build is so tiny, it makes little difference.