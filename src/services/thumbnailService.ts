/**
 * Thumbnail Service - Generate module thumbnails using fal.ai
 */

const FAL_API_KEY = process.env.FAL_API_KEY;
const FAL_API_URL = "https://fal.run/fal-ai/fast-sdxl";

/**
 * Generate a thumbnail image for a module using fal.ai
 */
export async function generateThumbnail(
  title: string,
  category: string
): Promise<string | null> {
  if (!FAL_API_KEY) {
    console.warn(
      "⚠️  fal.ai API key not configured. Thumbnail generation disabled."
    );
    return null;
  }

  try {
    const prompt = buildPrompt(title, category);

    console.log(`🎨 Generating thumbnail for: ${title}`);

    const response = await fetch(FAL_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: "landscape_16_9",
        num_inference_steps: 25,
        num_images: 1,
      }),
    });

    if (!response.ok) {
      console.error(
        `fal.ai API error: ${response.status} ${response.statusText}`
      );
      return null;
    }

    const result = (await response.json()) as {
      images: Array<{ url: string }>;
    };

    if (result.images && result.images.length > 0) {
      const imageUrl = result.images[0].url;
      console.log(`✓ Thumbnail generated: ${imageUrl}`);
      return imageUrl;
    }

    return null;
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
}

/**
 * Build a prompt for thumbnail generation
 */
function buildPrompt(title: string, category: string): string {
  const basePrompt = `Create a minimalist, professional thumbnail for a knowledge module titled "${title}" in the category "${category}".`;
  const styleGuide =
    "Style: clean, modern, gradient background, centered icon or typography, 1200x630px, suitable for web display.";
  const aesthetic =
    "Use a tech-forward color palette with smooth gradients. High quality, professional, polished.";

  return `${basePrompt} ${styleGuide} ${aesthetic}`;
}

/**
 * Get a fallback thumbnail URL for a category (placeholder)
 */
export function getFallbackThumbnail(category: string): string {
  const categoryThumbnails: Record<string, string> = {
    "Claude Skills":
      "https://placehold.co/1200x630/667eea/ffffff?text=Claude+Skill",
    PRDs: "https://placehold.co/1200x630/f56565/ffffff?text=PRD",
    Research:
      "https://placehold.co/1200x630/48bb78/ffffff?text=Research+Paper",
    Guides: "https://placehold.co/1200x630/ed8936/ffffff?text=Guide",
    General: "https://placehold.co/1200x630/4299e1/ffffff?text=Module",
  };

  return (
    categoryThumbnails[category] ||
    "https://placehold.co/1200x630/718096/ffffff?text=CurrentPrompt"
  );
}
