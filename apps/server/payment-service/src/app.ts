import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { router } from "./routes.js";

async function app(instance: FastifyInstance, _: FastifyServerOptions) {
  instance.get("/", async () => {
    return { status: "alive", message: "Welcome to Payment Service Root" };
  });

  await instance.register(router, { prefix: "/" });
}

export default app;
