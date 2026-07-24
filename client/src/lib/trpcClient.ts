import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../../../server/routers";
import { getTrpcAuthHeaders } from "./trpcAuthHeaders";

// Vanilla (non-React-hooks) tRPC client, for imperative calls from outside
// components — e.g. the zustand vault store, which needs to call the server
// from plain actions rather than React Query hooks. Same link config as the
// React client in main.tsx.
export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: getTrpcAuthHeaders,
    }),
  ],
});
