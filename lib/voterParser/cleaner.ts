// lib/voterParser/cleaner.ts

// Standardize Gender
export function normalizeGender(
  rawVal: string | null | undefined,
): "MALE" | "FEMALE" | "OTHER" | "UNKNOWN" {
  if (!rawVal) return "UNKNOWN";

  const val = rawVal.toLowerCase().trim();

  if (["m", "male", "पुरुष", "पुरूष"].includes(val)) return "MALE";
  if (["f", "female", "स्त्री", "महिला"].includes(val)) return "FEMALE";
  if (["o", "other", "इतर", "अन्य"].includes(val)) return "OTHER";

  return "UNKNOWN";
}

// Extract valid numbers only (prevents crashing if age is "36 Yrs")
export function parseAge(rawVal: any): number | null {
  if (!rawVal) return null;
  const parsed = parseInt(String(rawVal).replace(/\D/g, ""), 10);
  return isNaN(parsed) ? null : parsed;
}

// Ensure mobile is exactly 10 digits
export function cleanMobile(rawVal: any): string | null {
  if (!rawVal) return null;
  const digits = String(rawVal).replace(/\D/g, "");
  if (digits.length >= 10) {
    // Grab the last 10 digits (in case they added +91 or 0)
    return digits.slice(-10);
  }
  return null;
}
