import {
  Application,
  HttpError,
  Router,
  Status,
  httpErrors
} from "https://deno.land/x/oak/mod.ts";
import {
  bold,
  cyan,
  green,
  red,
} from "https://deno.land/std@0.122.0/fmt/colors.ts";
import { join } from "https://deno.land/std@0.123.0/path/mod.ts";

import { render } from "./build/entry.server.js";
import symbols from "./q-symbols.json" assert { type: "json" };

const PORT = parseInt(Deno.env.get("PORT") || "8080");
const __dirname = new URL(".", import.meta.url).pathname;
const distFolderPath = join(__dirname, "..", "dist");
const publicFolderPath = join(__dirname, "..", "public");

const app = new Application();

// Error handler middleware
app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      // deno-lint-ignore no-explicit-any
      context.response.status = e.status as any;
      if (e.expose) {
        context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${e.message}</h1>
              </body>
            </html>`;
      } else {
        context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>${e.status} - ${Status[e.status]}</h1>
              </body>
            </html>`;
      }
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = `<!DOCTYPE html>
            <html>
              <body>
                <h1>500 - Internal Server Error</h1>
              </body>
            </html>`;
      console.log("Unhandled Error:", red(bold(e.message)));
      console.log(e.stack);
    }
  }
});

// Logger
app.use(async (context, next) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(
    `${green(context.response.status.toString())} ${green(context.request.method)} ${cyan(context.request.url.pathname)} - ${
      bold(
        String(rt),
      )
    }`,
  );
});

// Response Time
app.use(async (context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Create an oak Router
const router = new Router();

router.get("/", async (context) => {
  console.log(
    ">>> qwik",
    context.request.url.pathname,
  );

  const start = Date.now();

  const result = await render({
    symbols,
    url: context.request.url,
    debug: false,
  });

  const ms = Date.now() - start;
  context.response.headers.set("X-Render-Time", `${ms}ms`);
  console.log(`>>> render complete in ${ms}ms`)

  context.response.body = result.html;
});

app.use(router.routes());
app.use(router.allowedMethods());

// Static content under /dist or /public
app.use(async (context) => {
  console.log(`>>> static try /dist${context.request.url.pathname}`);
  try {
    await context.send({ root: distFolderPath });
  } catch (err) {
    if (err instanceof httpErrors.NotFound) {
      console.log(`>>> static try /public${context.request.url.pathname}`)
      await context.send({ root: publicFolderPath });
    } else {
      throw err
    }
  }
});

// Log hello
app.addEventListener("listen", () => {
  console.log(`Listening on ${cyan(`http://localhost:${PORT}`)}`);
});

// Start server
await app.listen({ port: PORT });
