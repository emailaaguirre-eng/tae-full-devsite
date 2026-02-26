import http from "node:http";

const HOST = process.env.ARTKEY_HOST ?? "artkey.theartfulexperience.com";
const PORT = Number(process.env.PORT ?? 3002);
const BASE = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;
const TOKEN = "A".repeat(32);

function head(pathname, hostHeader = HOST) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: PORT,
        path: pathname,
        method: "HEAD",
        headers: {
          Host: hostHeader,
        },
      },
      (res) => {
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  console.log(`Running routing smoke checks against ${BASE} with Host=${HOST}`);

  const upload = await head("/uploads/artkey/probe.txt");
  assert(upload.status === 200, `Expected /uploads probe status 200, got ${upload.status}`);
  assert(!upload.headers["x-middleware-rewrite"], "Unexpected x-middleware-rewrite on /uploads probe");

  const dashboard = await head("/b_d_admn_tae/dashboard");
  assert(dashboard.status !== 404, "Dashboard route returned 404");
  assert(
    !dashboard.headers["x-middleware-rewrite"],
    "Unexpected x-middleware-rewrite on dashboard route"
  );

  const tokenRoute = await head(`/${TOKEN}`);
  const rewrite = tokenRoute.headers["x-middleware-rewrite"];
  assert(!!rewrite, "Expected token route to be rewritten, but no x-middleware-rewrite header was found");
  assert(
    String(rewrite).includes(`/art-key/${TOKEN}`),
    `Expected token rewrite to include /art-key/${TOKEN}, got ${String(rewrite)}`
  );

  console.log("Routing smoke checks passed.");
}

run().catch((error) => {
  console.error("Routing smoke checks failed:", error.message);
  process.exit(1);
});
