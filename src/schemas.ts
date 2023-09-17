import { z } from "zod";

export const ServiceAccount = z.object({
  client_email: z.string(),
  private_key: z.string(),
});

export type ServiceAccount = z.infer<typeof ServiceAccount>;
