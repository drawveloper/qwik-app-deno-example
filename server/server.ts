import { serve } from 'https://deno.land/std@0.116.0/http/server.ts'

import { render } from './build/entry.server.js';
import symbols  from './q-symbols.json' assert {type: "json"};

const addr = ':8080'

async function renderApp(request: Request) {
    const result = await render({
      symbols,
      url: new URL(request.url),
      debug: true,
    });
    return result;
  }

async function handler (request: Request): Promise<Response> {
  if (request.url === 'http://localhost:8080/') {
    const result = await renderApp(request)
    return new Response(result.html, { headers: { 'Content-Type': 'text/html' } })
  }

  return new Response('404', { status: 404 })
}

console.log(`Listening at http://localhost:8080/`)
await serve(handler, { addr })
