import { createSocialImage, socialImageAlt, socialImageSize } from "@/components/seo/social-image";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return createSocialImage();
}
