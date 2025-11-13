"use server";

/**
 * Medusa Server Actions
 * Server actions for publishing drafts to Medusa
 */
import { createClient } from "@/lib/supabase/server";
import { publishDraft } from "@/lib/medusa/publish";
import { revalidatePath } from "next/cache";

/**
 * Publish product draft to Medusa
 */
export async function publishDraftAction(productDraftId: string): Promise<{
  success: boolean;
  medusaProductId?: string;
  medusaVariantIds?: string[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const result = await publishDraft(productDraftId);

    if (result.success) {
      revalidatePath(`/drafts/${productDraftId}`);
      revalidatePath("/drafts");
    }

    return result;
  } catch (error) {
    console.error("Publish draft action error:", error);
    throw error;
  }
}
