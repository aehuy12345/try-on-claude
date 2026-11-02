// Bản nháp form hồ sơ trong sessionStorage, khớp design/flows/profile.md mục "Giữ bản nháp".
// Chỉ lưu text và cờ hadPhoto (File không lưu được). sessionStorage chỉ sống trong tab.
export const PROFILE_DRAFT_KEY = 'tryon_profile_draft';

const isString = (v) => typeof v === 'string';

/** @param {{ userId: string, displayName: string, heightCm: string, weightKg: string, hadPhoto: boolean }} draft */
export function saveDraft(draft) {
  try {
    sessionStorage.setItem(PROFILE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage đầy hoặc bị chặn: mất bản nháp còn hơn làm hỏng việc lưu hồ sơ.
  }
}

/** Đọc bản nháp; JSON hỏng hoặc sai dạng thì trả về null (không throw). */
export function readDraft() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PROFILE_DRAFT_KEY));
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      isString(parsed.userId) &&
      isString(parsed.displayName) &&
      isString(parsed.heightCm) &&
      isString(parsed.weightKg) &&
      typeof parsed.hadPhoto === 'boolean'
    ) {
      return parsed;
    }
  } catch {
    // JSON hỏng hoặc storage không truy cập được.
  }
  return null;
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(PROFILE_DRAFT_KEY);
  } catch {
    // Không có gì để xoá khi storage không truy cập được.
  }
}
