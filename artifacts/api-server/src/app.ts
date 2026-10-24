import express, { type Express, type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { ZodError } from "zod/v4";
import { ZodError as Zod3Error } from "zod";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { HttpError } from "./lib/lifewise-store";

const app: Express = express();
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET must be configured.");
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: true }));

const rateBuckets = new Map<string, { count: number; reset: number }>();
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "POST") {
    if (req.get("sec-fetch-site") === "cross-site") {
      res.status(403).json({ error: "Cross-site requests are not allowed." }); return;
    }
    if (!req.is("application/json")) {
      res.status(415).json({ error: "Use application/json." }); return;
    }
    const key = `${req.ip}:${req.path.includes("custom") ? "ai" : "write"}`;
    const current = Date.now();
    if (rateBuckets.size > 10000) {
      for (const [k, b] of rateBuckets) if (b.reset < current) rateBuckets.delete(k);
    }
    const bucket = rateBuckets.get(key) ?? { count: 0, reset: current + 60000 };
    if (bucket.reset < current) { bucket.count = 0; bucket.reset = current + 60000; }
    bucket.count++;
    rateBuckets.set(key, bucket);
    if (bucket.count > (key.endsWith(":ai") ? 5 : 90)) {
      res.setHeader("Retry-After", "60");
      res.status(429).json({ error: "Too many requests. Please wait a minute." }); return;
    }
  }
  next();
});
app.use("/api", router);
app.use("/api", (_req, res) => { res.status(404).json({ error: "API route not found." }); });

const errors: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError || err instanceof Zod3Error) { res.status(400).json({ error: "Invalid request fields.", details: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })) }); return; }
  if (err instanceof HttpError) { res.status(err.status).json({ error: err.message }); return; }
  req.log.error({ err }, "Request failed");
  res.status(500).json({ error: "The request could not be completed. Please retry." });
};
app.use(errors);

export default app;
