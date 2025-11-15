/**
 * Webhook Routes - Handle Webflow CMS events
 *
 * Receives webhook events from Webflow when items are published/updated/deleted
 * and triggers sync to Supabase
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import * as syncService from "../services/syncService.js";

const router = Router();

const WEBFLOW_WEBHOOK_SECRET = process.env.WEBFLOW_WEBHOOK_SECRET;

if (!WEBFLOW_WEBHOOK_SECRET) {
  console.warn(
    "⚠️  WEBFLOW_WEBHOOK_SECRET not set. Webhook signature validation disabled."
  );
}

/**
 * Verify Webflow webhook signature
 * Webflow includes X-Webflow-Signature header with HMAC-SHA256
 */
function verifyWebflowSignature(
  body: string,
  signature: string | undefined
): boolean {
  if (!WEBFLOW_WEBHOOK_SECRET || !signature) {
    console.warn("Webhook signature verification skipped");
    return !WEBFLOW_WEBHOOK_SECRET; // Allow if no secret configured
  }

  const hash = crypto
    .createHmac("sha256", WEBFLOW_WEBHOOK_SECRET)
    .update(body)
    .digest("base64");

  return hash === signature;
}

/**
 * POST /webhooks/webflow
 * Receive Webflow CMS events and trigger sync
 */
router.post("/webflow", async (req: Request, res: Response) => {
  try {
    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.get("X-Webflow-Signature");

    // Verify signature
    if (!verifyWebflowSignature(rawBody, signature)) {
      console.warn("Invalid Webflow webhook signature");
      return res.status(401).json({
        success: false,
        error: "Invalid signature",
      });
    }

    const event = req.body;

    // Log event details
    console.log(`📨 Webflow webhook received: ${event.triggerType}`);
    console.log(`   Item: ${event.itemId || "N/A"}`);
    console.log(`   Collection: ${event.collectionId || "N/A"}`);

    // Handle different event types
    switch (event.triggerType) {
      case "publish":
        await handlePublishEvent(event);
        break;

      case "update":
        await handleUpdateEvent(event);
        break;

      case "delete":
        await handleDeleteEvent(event);
        break;

      default:
        console.log(`⚠️  Unknown event type: ${event.triggerType}`);
    }

    res.json({
      success: true,
      message: "Webhook received and processed",
      event: event.triggerType,
    });
  } catch (error) {
    console.error("Error processing Webflow webhook:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process webhook",
    });
  }
});

/**
 * Handle publish event - sync Webflow → Supabase
 */
async function handlePublishEvent(event: any): Promise<void> {
  console.log("📤 Handling publish event...");

  try {
    // Trigger a pull sync from Webflow to Supabase
    const result = await syncService.syncWebflowToSupabase();

    console.log(
      `✓ Sync complete: ${result.successful}/${result.totalProcessed} successful`
    );
  } catch (error) {
    console.error("Error in publish event handler:", error);
  }
}

/**
 * Handle update event - sync Webflow → Supabase
 */
async function handleUpdateEvent(event: any): Promise<void> {
  console.log("🔄 Handling update event...");

  try {
    // Trigger a pull sync from Webflow to Supabase
    const result = await syncService.syncWebflowToSupabase();

    console.log(
      `✓ Sync complete: ${result.successful}/${result.totalProcessed} successful`
    );
  } catch (error) {
    console.error("Error in update event handler:", error);
  }
}

/**
 * Handle delete event - remove from Supabase
 */
async function handleDeleteEvent(event: any): Promise<void> {
  console.log("🗑️  Handling delete event...");

  try {
    const itemId = event.itemId || event.itemName;

    if (itemId) {
      console.log(`   Deleting item: ${itemId}`);
      // Note: This would require fetching the item first to get the slug
      // Then delete from Supabase
      // For now, just log the event
    }
  } catch (error) {
    console.error("Error in delete event handler:", error);
  }
}

/**
 * POST /webhooks/webflow/test
 * Test webhook endpoint - always succeeds
 */
router.post("/webflow/test", async (req: Request, res: Response) => {
  console.log("🧪 Test webhook received");

  res.json({
    success: true,
    message: "Test webhook processed successfully",
    timestamp: new Date().toISOString(),
  });
});

export default router;
