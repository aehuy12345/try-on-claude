import { useEffect, useRef, useState } from 'react';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';
import Spinner from '../ui/Spinner.jsx';
import TextField from '../ui/TextField.jsx';
import BodyPhotoPicker from './BodyPhotoPicker.jsx';
import { validateBodyPhoto } from '../../lib/validateBodyPhoto.js';
import { PROFILE_MESSAGES, normalizeMeasure, validateProfile } from '../../lib/validateProfile.js';

const FIELDS = ['displayName', 'heightCm', 'weightKg'];
const EMPTY_PHOTO = { file: null, url: null, warning: '', error: '' };
const toField = (v) => (v === null || v === undefined ? '' : String(v));
const fromProfile = (p) => ({
  displayName: toField(p.displayName),
  heightCm: toField(p.heightCm),
  weightKg: toField(p.weightKg),
});

const Required = () => (
  <span aria-hidden="true" className="ml-0.5 text-danger">
    *
  </span>
);

/**
 * Form hồ sơ: email chỉ đọc, tên hiển thị, chiều cao, cân nặng, ảnh toàn thân (presentational:
 * không gọi API; cha truyền hồ sơ và hàm gửi). Validate số đo/tên theo lib/validateProfile.js,
 * validate ảnh theo lib/validateBodyPhoto.js.
 * Props:
 * - profile: { email, displayName|null, heightCm|null, weightKg|null, bodyPhotoUrl|null }.
 * - restoredDraft: null | { values: { displayName, heightCm, weightKg }, hadPhoto: bool }. Có thì
 *   điền sẵn bản nháp; nếu hadPhoto thì hiện "Đã giữ lại thông tin bạn nhập. Vui lòng chọn lại ảnh."
 * - onSubmit({ displayName, heightCm, weightKg }, file|null): Promise; số đo đã đổi "," thành ".".
 *   Trả về { ok: true, profile } hoặc { ok: false, formError?, fieldErrors?, photoError? }
 *   (fieldErrors theo khoá displayName | heightCm | weightKg).
 * - photoFailed: bool, ảnh hiện tại không tải được (cha quyết định sau khi thử làm mới URL).
 * - onPhotoImageError(): <img> ảnh hiện tại lỗi. onPhotoLoad(): <img> ảnh hiện tại tải được.
 *   onRetryPhoto(): bấm Thử lại ở ô ảnh.
 * - draftSourceRef: ref của cha; form gán vào `current` một hàm trả về bản nháp
 *   { displayName, heightCm, weightKg, hadPhoto } khi form có thay đổi, ngược lại null. Cha gọi hàm này
 *   trước mỗi request (PUT, GET làm mới ảnh) để ghi sessionStorage mà không đổ đè các ô đang sửa.
 */
export default function ProfileForm({
  profile,
  restoredDraft = null,
  onSubmit,
  photoFailed = false,
  onPhotoImageError,
  onPhotoLoad,
  onRetryPhoto,
  draftSourceRef,
}) {
  const [baseline, setBaseline] = useState(() => fromProfile(profile));
  const [values, setValues] = useState(() => restoredDraft?.values ?? fromProfile(profile));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(Boolean(restoredDraft?.hadPhoto));
  const [submitting, setSubmitting] = useState(false);
  const [photo, setPhoto] = useState(EMPTY_PHOTO);
  const [checking, setChecking] = useState(false); // đang kiểm tra file vừa chọn
  const [photoErrorSignal, setPhotoErrorSignal] = useState(0); // tăng khi lỗi ảnh từ server cần vào màn hình
  const [noticeSignal, setNoticeSignal] = useState(0); // tăng khi thông báo chung (thành công/lỗi chung) cần vào màn hình
  const noticeRef = useRef(null);
  const photoRef = useRef(EMPTY_PHOTO); // bản mới nhất của `photo`, dùng trong handler bất đồng bộ
  const [localUrl, setLocalUrl] = useState(null); // preview cục bộ khi server không trả signed URL
  const urlsRef = useRef(new Set());
  const selectToken = useRef(0);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  // Focus sau commit để thông báo đã có trong DOM. Nút Lưu bị disabled trong lúc gửi nên focus đang ở
  // BODY; đưa focus vào thông báo để cuộn tới (theo scroll-padding-top của <html>) và trình đọc màn hình đọc.
  useEffect(() => {
    if (noticeSignal) noticeRef.current?.focus();
  }, [noticeSignal]);

  const revoke = (url) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  };

  const commitPhoto = (next) => {
    photoRef.current = next;
    setPhoto(next);
  };

  const dirty = FIELDS.some((k) => values[k] !== baseline[k]) || Boolean(photo.file);
  const currentUrl = profile.bodyPhotoUrl || localUrl;

  useEffect(() => {
    if (!draftSourceRef) return undefined;
    draftSourceRef.current = () =>
      dirty
        ? {
            displayName: values.displayName,
            heightCm: values.heightCm,
            weightKg: values.weightKg,
            hadPhoto: Boolean(photo.file),
          }
        : null;
    return () => {
      draftSourceRef.current = null;
    };
  });

  const clearFeedback = () => {
    setSaved(false);
    setFormError('');
  };

  const change = (name) => (e) => {
    const value = e.target.value;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((c) => (c[name] ? { ...c, [name]: undefined } : c));
    clearFeedback();
  };

  const handleSelect = async (file) => {
    const token = ++selectToken.current;
    clearFeedback();
    setChecking(true); // chặn Lưu cho tới khi kiểm tra xong để không gửi nhầm file cũ
    const result = await validateBodyPhoto(file);
    if (token !== selectToken.current) return; // lần chọn mới hơn (hoặc Bỏ ảnh) đã thay thế
    setChecking(false);
    if (!result.ok) {
      // Không nhận file: giữ ảnh đã chọn trước đó (nếu có), chỉ báo lỗi.
      commitPhoto({ ...photoRef.current, error: result.error });
      return;
    }
    const url = URL.createObjectURL(file);
    urlsRef.current.add(url);
    revoke(photoRef.current.url);
    commitPhoto({ file, url, warning: result.warning, error: '' });
  };

  const handleClear = () => {
    selectToken.current++;
    setChecking(false);
    revoke(photoRef.current.url);
    commitPhoto(EMPTY_PHOTO);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || checking || !dirty) return;
    const form = e.currentTarget;
    const found = validateProfile(values);
    setErrors(found);
    const first = FIELDS.find((k) => found[k]);
    if (first) {
      form.elements[first]?.focus();
      return;
    }
    setSubmitting(true);
    clearFeedback();
    setShowDraftNotice(false);
    const sent = photo;
    const result = await onSubmit(
      {
        displayName: values.displayName,
        heightCm: normalizeMeasure(values.heightCm),
        weightKg: normalizeMeasure(values.weightKg),
      },
      sent.file,
    );
    setSubmitting(false);
    if (result?.ok) {
      const next = fromProfile(result.profile);
      setBaseline(next);
      setValues(next);
      setErrors({});
      if (sent.file) {
        // Giữ object URL làm preview dự phòng, chỉ dùng khi server không trả bodyPhotoUrl.
        revoke(localUrl);
        setLocalUrl(sent.url);
        commitPhoto(EMPTY_PHOTO);
      } else if (photoRef.current.error) {
        // Lỗi chọn file cũ (file bị từ chối) không còn liên quan sau khi lưu thành công.
        commitPhoto({ ...photoRef.current, error: '' });
      }
      setSaved(true);
      setNoticeSignal((n) => n + 1);
      return;
    }
    setFormError(result?.formError ?? '');
    setErrors(result?.fieldErrors ?? {});
    if (result?.photoError) commitPhoto({ ...photoRef.current, error: result.photoError });
    // Chỉ một nơi giữ focus, ưu tiên: lỗi field (sửa được ngay tại ô; PRD 4.4: hiếm khi có cả lỗi file),
    // rồi lỗi ảnh, rồi thông báo chung. Phần không được focus vẫn hiện với role của Alert.
    const firstServer = FIELDS.find((k) => result?.fieldErrors?.[k]);
    if (firstServer) form.elements[firstServer]?.focus();
    else if (result?.photoError) setPhotoErrorSignal((n) => n + 1);
    else if (result?.formError) setNoticeSignal((n) => n + 1);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={submitting}
      className="grid gap-8 lg:grid-cols-[18rem_1fr] lg:gap-10"
    >
      <BodyPhotoPicker
        previewUrl={photo.url}
        currentUrl={currentUrl}
        photoFailed={photoFailed && (Boolean(profile.bodyPhotoUrl) || !localUrl)}
        error={photo.error}
        warning={photo.warning}
        errorFocusSignal={photoErrorSignal}
        disabled={submitting}
        onSelect={handleSelect}
        onClear={handleClear}
        onImageError={onPhotoImageError}
        onImageLoad={onPhotoLoad}
        onRetry={onRetryPhoto}
      />

      <div className="space-y-5">
        {showDraftNotice && <Alert tone="warning">{PROFILE_MESSAGES.DRAFT_RESTORED}</Alert>}
        {formError && (
          <Alert tone="danger">
            <div ref={noticeRef} tabIndex={-1} className="outline-none">
              {formError}
            </div>
          </Alert>
        )}
        {saved && (
          <Alert tone="success">
            <div ref={noticeRef} tabIndex={-1} className="outline-none">
              {PROFILE_MESSAGES.SAVED}
              {!currentUrl && (
                <span className="mt-1 block font-medium">{PROFILE_MESSAGES.ADD_PHOTO}</span>
              )}
            </div>
          </Alert>
        )}

        <TextField
          name="email"
          label="Email"
          type="email"
          value={profile.email}
          readOnly
          aria-readonly="true"
          hint="Email dùng để đăng nhập nên không thể thay đổi."
          inputClassName="bg-ink-50! text-ink-600!"
        />
        <TextField
          name="displayName"
          label="Tên hiển thị (không bắt buộc)"
          autoComplete="nickname"
          value={values.displayName}
          onChange={change('displayName')}
          error={errors.displayName}
          readOnly={submitting}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="heightCm"
            label={
              <>
                Chiều cao (cm)
                <Required />
              </>
            }
            inputMode="decimal"
            autoComplete="off"
            placeholder="vd 162"
            value={values.heightCm}
            onChange={change('heightCm')}
            error={errors.heightCm}
            readOnly={submitting}
            required
            hint="Từ 100 đến 250 cm."
          />
          <TextField
            name="weightKg"
            label={
              <>
                Cân nặng (kg)
                <Required />
              </>
            }
            inputMode="decimal"
            autoComplete="off"
            placeholder="vd 50"
            value={values.weightKg}
            onChange={change('weightKg')}
            error={errors.weightKg}
            readOnly={submitting}
            required
            hint="Từ 30 đến 250 kg."
          />
        </div>
        <p className="text-sm text-ink-500">
          <span aria-hidden="true" className="text-danger">
            *
          </span>{' '}
          Bắt buộc, kể cả khi bạn chỉ muốn đổi ảnh.
        </p>

        <Button
          type="submit"
          className="w-full sm:w-auto sm:min-w-40"
          disabled={!dirty || submitting || checking}
          aria-busy={submitting}
        >
          {(submitting || checking) && <Spinner />}
          {submitting ? 'Đang lưu...' : checking ? 'Đang kiểm tra ảnh...' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
