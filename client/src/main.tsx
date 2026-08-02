import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import App from "./App";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider } from "./contexts/AuthContext";
import { trpc } from "./lib/trpc";
import { getTrpcAuthHeaders } from "./lib/trpcAuthHeaders";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers: getTrpcAuthHeaders,
    }),
  ],
});

// The recovery link from AuthContext.resetPassword() points at this path.
// The server's catch-all (server/_core/vite.ts) serves index.html for any
// unmatched route, so this same bundle loads there too — there's no wouter
// route registry elsewhere in the app to hook into, so we branch on
// location.pathname directly. Only needs Supabase auth, not the
// tRPC/React Query stack the rest of the app uses.
const isResetPasswordRoute = window.location.pathname === "/auth/reset";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isResetPasswordRoute ? (
      <AuthProvider>
        <ResetPassword />
      </AuthProvider>
    ) : (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </trpc.Provider>
    )}
  </React.StrictMode>
);
