import { useCallback, useEffect, useRef, useState } from 'react';
import Alert from '../components/ui/Alert.jsx';
import Button from '../components/ui/Button.jsx';
import ProfileForm from '../components/profile/ProfileForm.jsx';
import ProfileSkeleton from '../components/profile/ProfileSkeleton.jsx';
import { useAuth } from '../context/useAuth.js';
import { clearDraft, readDraft, saveDraft } from '../lib/profileDraft.js';
import { PROFILE_MESSAGES } from '../lib/validateProfile.js';
import { ApiError, isSessionExpiredError } from '../services/apiClient.js';
import { getProfile, updateProfile } from '../services/profileService.js';

const FIELD_BY_CODE = {
  INVALID_DISPLAY_NAME: 'displayName',
  INVALID_HEIGHT: 'heightCm',
  INVALID_WEIGHT: 'weightKg',
};
const PHOTO_ERROR_CODES = new Set(['INVALID_FILE_TYPE', 'FILE_TOO_LARGE']);
// PRD 5: these messages are English or technical, so the UI shows the generic text instead.
const GENERIC_ERROR_CODES = new Set([
  'INTERNAL_ERROR',
  'NOT_FOUND',
  'INVALID_JSON',
  'PAYLOAD_TOO_LARGE',
]);

/** User-facing text for an API error (PRD 5): err.message unless the code is on the generic list. */
function messageFor(err) {
  if (!(err instanceof ApiError) || !err.message || GENERIC_ERROR_CODES.has(err.code)) {
    return PROFILE_MESSAGES.INTERNAL_ERROR;
  }
  return err.message;
}

export default function ProfilePage() {
  const { justRegistered, clearJustRegistered } = useAuth();
  // Capture the flag locally: clearing it in the context must not hide the message.
  const [showWelcome] = useState(justRegistered);
  const [status, setStatus] = useState('loading'); // loading | error | ready
  const [profile, setProfile] = useState(null);
  const [restoredDraft, setRestoredDraft] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // ProfileForm owns the form values; it fills this ref with a function returning the current draft.
  const draftSourceRef = useRef(null);
  // True once the current broken-image episode has used its one refresh (no endless loop).
  const photoRefreshUsedRef = useRef(false);
  const userIdRef = useRef(null);
  const photoUrlRef = useRef(null);
  const photoAbortRef = useRef(null);

  useEffect(() => {
    if (justRegistered) clearJustRegistered();
  }, [justRegistered, clearJustRegistered]);

  // Tải hồ sơ lúc vào trang; request bị huỷ khi rời trang hoặc chạy lại effect (StrictMode).
  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal }).then(
      (data) => {
        if (controller.signal.aborted) return;
        // Read and clear only here, after the abort check, so a StrictMode double run keeps the draft.
        const draft = readDraft();
        clearDraft();
        setRestoredDraft(
          draft && draft.userId === data.id
            ? {
                values: {
                  displayName: draft.displayName,
                  heightCm: draft.heightCm,
                  weightKg: draft.weightKg,
                },
                hadPhoto: draft.hadPhoto,
              }
            : null,
        );
        userIdRef.current = data.id;
        photoUrlRef.current = data.bodyPhotoUrl;
        photoRefreshUsedRef.current = false;
        setPhotoFailed(false);
        setProfile(data);
        setStatus('ready');
      },
      (err) => {
        if (controller.signal.aborted || err?.name === 'AbortError') return;
        // Session errors redirect to /login (AuthContext); the draft is untouched by this request.
        if (!isSessionExpiredError(err)) setStatus('error');
      },
    );
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => () => photoAbortRef.current?.abort(), []);

  const retry = () => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  };

  /**
   * Run a request from /profile with the form draft saved first (flow "Giữ bản nháp").
   * The draft is cleared when the request ends for any reason except an ended session.
   */
  const runWithDraft = useCallback(async (request) => {
    const snapshot = draftSourceRef.current?.() ?? null;
    if (snapshot) saveDraft({ userId: userIdRef.current, ...snapshot });
    try {
      const result = await request();
      if (snapshot) clearDraft();
      return result;
    } catch (err) {
      if (snapshot && !isSessionExpiredError(err)) clearDraft();
      throw err;
    }
  }, []);

  // Làm mới riêng bodyPhotoUrl (không đổ đè các ô đang sửa). Mỗi lượt hỏng chỉ làm mới một lần:
  // sau đó URL vẫn hỏng thì onError thấy cờ đã dùng và hiện ô "Không tải được ảnh".
  const refreshPhoto = useCallback(async () => {
    photoRefreshUsedRef.current = true;
    setPhotoFailed(false);
    photoAbortRef.current?.abort();
    const controller = new AbortController();
    photoAbortRef.current = controller;
    try {
      const { bodyPhotoUrl } = await runWithDraft(() => getProfile({ signal: controller.signal }));
      if (controller.signal.aborted) return;
      // Same URL again would not re-trigger the <img>, so treat it as still broken.
      if (!bodyPhotoUrl || bodyPhotoUrl === photoUrlRef.current) {
        setPhotoFailed(true);
        return;
      }
      photoUrlRef.current = bodyPhotoUrl;
      setProfile((p) => ({ ...p, bodyPhotoUrl }));
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'AbortError') return;
      setPhotoFailed(true);
    }
  }, [runWithDraft]);

  const handlePhotoImageError = () => {
    if (photoRefreshUsedRef.current) setPhotoFailed(true);
    else refreshPhoto();
  };

  const handlePhotoLoad = () => {
    photoRefreshUsedRef.current = false;
  };

  // Trả về { ok: true, profile } hoặc { ok: false, formError?, fieldErrors?, photoError? }.
  const handleSubmit = async (fields, file) => {
    try {
      const data = await runWithDraft(() => updateProfile(fields, file));
      photoUrlRef.current = data.bodyPhotoUrl;
      photoRefreshUsedRef.current = false;
      setProfile(data);
      setPhotoFailed(false);
      return { ok: true, profile: data };
    } catch (err) {
      const code = err?.code;
      const field = FIELD_BY_CODE[code];
      if (field) return { ok: false, fieldErrors: { [field]: messageFor(err) } };
      if (PHOTO_ERROR_CODES.has(code)) return { ok: false, photoError: messageFor(err) };
      return { ok: false, formError: messageFor(err) };
    }
  };

  return (
    <section
      aria-labelledby="profile-title"
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"
    >
      {showWelcome && (
        <Alert tone="success" className="mb-8">
          Tạo tài khoản thành công. Hãy hoàn thiện hồ sơ để bắt đầu thử đồ.
        </Alert>
      )}
      <div className="animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">Hồ sơ</p>
        <h1
          id="profile-title"
          className="mt-3 text-balance font-display text-3xl font-medium tracking-tight sm:text-4xl"
        >
          Hồ sơ của bạn
        </h1>
        <p className="mt-2 text-ink-600">Ảnh toàn thân và số đo giúp ghép đồ lên đúng dáng bạn.</p>
      </div>

      <div className="mt-8 rounded-card bg-white p-5 shadow-soft ring-1 ring-ink-900/5 sm:p-8">
        {status === 'loading' && <ProfileSkeleton />}
        {status === 'error' && (
          <div className="flex flex-col items-start gap-4">
            <Alert tone="danger" className="w-full">
              {PROFILE_MESSAGES.LOAD_FAILED}
            </Alert>
            <Button onClick={retry}>Thử lại</Button>
          </div>
        )}
        {status === 'ready' && (
          <ProfileForm
            profile={profile}
            restoredDraft={restoredDraft}
            onSubmit={handleSubmit}
            photoFailed={photoFailed}
            onPhotoImageError={handlePhotoImageError}
            onPhotoLoad={handlePhotoLoad}
            onRetryPhoto={refreshPhoto}
            draftSourceRef={draftSourceRef}
          />
        )}
      </div>
    </section>
  );
}
