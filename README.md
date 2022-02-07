# Server Qwik on Deno

This is a repo to help achieve Deno compatibility for the Qwik project.

A simpler, Deno example running JSX can be found here using `jsxImportSource`, for reference: https://github.com/firstdoit/nano-jsx-denon-live-reload

## How it should work

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

Then, we create a `server/server.ts` which is supposed to **replace** the original `server/index.js`.

Then, `npm install`, `npm build` to build the Qwik files, and try running deno:

- If you use `denon`, simply `denon start`
- Else, run: `deno run --import-map=import_map.json --config ./deno.json --allow-net --allow-read --allow-env --unstable --no-check server/server.ts`

Watch as it blows complaining that `render` is not exported:

```
denon start
[*] [main] v2.4.9
[*] [daem] watching path(s): **/*.*
[*] [daem] watching extensions: ts,tsx,js,jsx,json
[!] [#0] starting `deno run --import-map=import_map.json --config ./deno.json --allow-net --allow-read --allow-env --unstable --no-check server/server.ts`
error: Uncaught SyntaxError: The requested module './build/entry.server.js' does not provide an export named 'render'
import { render } from './build/entry.server.js';
         ~~~~~~
    at <anonymous> (file:///Users/guilherme/Projects/qwik-app-deno/server/server.ts:3:10)
[E] [daem] app crashed - waiting for file changes before starting ...
```

That happens because in `server/server.ts` we import `render`:

```
import { render } from './build/entry.server.js';
```

But the `./build/entry/server.js` is **not an ESModule**, which is what Deno supports importing.

(Trying to use `--compat` results in other, [even greater pains](https://github.com/denoland/deno/issues/13528).)

## What needs to be done

There should be a way to output `.mjs` ES Modules from the qwik rollup. I tried fiddling with the `optimizer` in my node_modules, to no avail. Nothing I changed resulted in the module being outputted as esm. Tried the `esbuild.platform` config too. 


## After debug session with Manu from Qwik

We found out `vite` is not allowing us to have `esm` built if we're in `ssr`: https://github.com/vitejs/vite/blob/2a9da2e3b10e3637f7ed7daa3b45cb173f40d7a3/packages/vite/src/node/build.ts#L467

Ideally, we would be able to just select `format` outright. 

After changing this in `node_modules`, we were able to run Qwik from Deno! 🥳

## Added patch script to allow CI 

> "Nothing more permanent then a temporary fix"

```
deno run --allow-read --allow-write HACK__patch_vite.ts 
```

This makes the change vite needs to output es modules. Yay? 