// lib/voterParser/headerMap.ts

export const HEADER_ALIASES: Record<string, string[]> = {
  epicNumber: [
    "card number",
    "card no",
    "voter id",
    "epic",
    "epic no",
    "कार्ड क्रमांक",
    "ओळखपत्र क्रमांक",
    "मतदाता पहचान पत्र",
    "cardnumber",
  ],
  // Removed standalone "क्र" to prevent it from matching "घर क्र"
  serialNumber: [
    "sr.no",
    "sr no",
    "serial number",
    "sl no",
    "अ.क्र.",
    "अनुक्रमांक",
    "sr. no.",
  ],
  fullName: [
    "नाव",
    "पूर्ण नाव",
    "नाम",
    "पूरा नाम",
    "name",
    "full name",
    "voter name",
  ],
  firstName: ["प्रथम नाव", "पहिले नाव", "पहला नाम", "first name", "fname"],
  middleName: [
    "मधले नाव",
    "वडीलांचे नाव",
    "पतीचे नाव",
    "मध्य नाम",
    "middle name",
    "mname",
  ],
  lastName: ["आडनाव", "उपनाम", "last name", "surname", "lname"],
  gender: ["लिंग", "स्त्री/पुरुष", "gender", "sex"],
  age: ["वय", "उम्र", "आयु", "age"],
  mobileNumber: [
    "mobile number",
    "mobile",
    "phone",
    "contact",
    "मोबाईल नंबर",
    "फोन नंबर",
    "मोबाइल नंबर",
  ],
  parlConstituency: [
    "संसदीय मतदारसंघाचे नाव क्र",
    "संसदीय मतदारसंघ",
    "लोकसभा",
    "संसदीय क्षेत्र",
    "parliamentary constituency",
    "pc",
  ],
  asmConstituency: [
    "विधानसभा मतदारसंघ नाव",
    "विधानसभा मतदारसंघ",
    "विधानसभा",
    "assembly constituency",
    "ac",
  ],
  cityVillage: ["मुख्य शहर", "शहर", "गाव", "गाँव", "city", "village", "town"],
  gramPanchayat: ["ग्रामपंचायत", "ग्राम पंचायत", "gram panchayat", "gp"],
  houseNumber: [
    "घर क्र",
    "घर क्रमांक",
    "मकान नंबर",
    "house no",
    "house number",
  ],
  ward: ["वार्ड", "प्रभाग", "वार्ड नंबर", "ward", "ward no"],
  pollingStation: [
    "मतदान केंद्र",
    "मतदान कक्ष",
    "polling station",
    "polling booth",
    "booth",
  ],
  address: ["पत्ता", "पता", "address"],
  caste: ["cast", "caste", "जात", "प्रवर्ग", "जाति"],
  otherInfo: ["other information", "other info", "इतर माहिती", "अन्य जानकारी"],
  photoUrl: ["photo", "image", "फोटो", "चित्र"],
};

/**
 * Advanced 2-Pass Header Matcher
 */
export function getDbKeyFromHeader(rawHeader: string): string | null {
  if (!rawHeader) return null;
console.log("Raw Header : ",rawHeader)
  // Clean the header: lowercase, trim, and replace multiple spaces with a single space
  const cleanHeader = rawHeader.toLowerCase().trim().replace(/\s+/g, " ");

  // --- PASS 1: EXACT MATCH (Highest Priority) ---
  // If the CSV column is exactly "प्रथम नाव", it matches firstName perfectly.
  for (const [dbKey, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => cleanHeader === alias)) {
        console.log("DB key : ",dbKey)
      return dbKey;
    }
  }

  // --- PASS 2: PARTIAL MATCH (Fallback) ---
  for (const [dbKey, aliases] of Object.entries(HEADER_ALIASES)) {
    // Sort aliases by length (longest first) so specific phrases match before single words
    const sortedAliases = [...aliases].sort((a, b) => b.length - a.length);

    for (const alias of sortedAliases) {
      if (cleanHeader.includes(alias)) {
        // SAFETY GUARD: Do not allow partial matching on highly generic words
        // This prevents "विधानसभा मतदारसंघ नाव" from partially matching "नाव"
        if (["नाव", "नाम", "name", "क्र", "no", "id"].includes(alias)) {
          continue;
        }
        console.log("DB key : ",dbKey)
        return dbKey;
      }
    }
  }

  // No match found
  return null;
}
