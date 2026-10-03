import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  buckets: {
    // Product photos, shop logos and transfer receipts. Public-read so photos load
    // without signed URLs; every file gets a random, unguessable name.
    uploads: { access: "public_read" },
  },
});
