import { createFileRoute, redirect } from "@tanstack/react-router";

/** Legacy standalone standings route; tables now live inside each liga page. */
export const Route = createFileRoute("/table")({
  beforeLoad: () => {
    throw redirect({
      to: "/liga/$slug",
      params: { slug: "women" },
      search: { view: "table" },
      replace: true,
    });
  },
});
