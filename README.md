Almost there!

- Install [denon](https://github.com/denosaurs/denon)
- `npm start`

This starts rollup and the deno server.

# Ways this doesn't work

### With jsxImportSource in deno.json

```
// deno.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "https://cdn.esm.sh/@builder.io/qwik@0.0.16-7",
    "lib": ["deno.ns", "deno.unstable", "dom", "dom.iterable", "dom.asynciterable"]
  }
}
```

Output:
```
denon start
[*] [main] v2.4.9
[*] [daem] watching path(s): **/*.*
[*] [daem] watching extensions: ts,tsx,js,jsx,json
[!] [#0] starting `deno run --import-map=import_map.json --allow-net --allow-read --allow-env --unstable server/mod.ts`
Check file:///Users/guilherme/Projects/qwik-app-deno-example/server/mod.ts
error: TS7026 [ERROR]: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
        <section class="todoapp">
        ~~~~~~~~~~~~~~~~~~~~~~~~~
    at file:///Users/guilherme/Projects/qwik-app-deno-example/src/components.tsx:51:9

TS7026 [ERROR]: JSX element implicitly has type 'any' because no interface 'JSX.IntrinsicElements' exists.
        </section>
        ~~~~~~~~~~
    at file:///Users/guilherme/Projects/qwik-app-deno-example/src/components.tsx:55:9
```

And other errors - 39 in total. 

Looks like `"jsxImportSource": "https://cdn.esm.sh/@builder.io/qwik@0.0.16-7",` is not finding the correct file, or not doing it's magic. (It does exist here https://cdn.esm.sh/@builder.io/qwik@0.0.16-7/jsx-runtime)


### With jsxFactory in deno.json

```
// deno.json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h",
    "jsxFragmentFactory": "Fragment",
    "lib": ["deno.ns", "deno.unstable", "dom", "dom.iterable", "dom.asynciterable"]
  }
}
```

Output: same as the above. JSX element has type any in 39 errors.