import { useEffect, useId, useRef } from 'react';
import Alert from '../ui/Alert.jsx';
import Button from '../ui/Button.jsx';

const GUIDE = [
  'Ảnh toàn thân, đứng thẳng, nhìn thẳng vào máy.',
  'Chụp dọc, tỉ lệ 3:4 hoặc 9:16, chiều ngắn từ 720 px.',
  'Mặc đồ ôm gọn, nền đơn giản, đủ sáng.',
  'Định dạng JPG hoặc PNG, tối đa 5 MB.',
];

/**
 * Vùng chọn ảnh toàn thân (presentational: không gọi API, không validate; cha truyền kết quả vào).
 * Props:
 * - previewUrl: object URL của ảnh mới chọn (ưu tiên hiển thị). Cha tạo và thu hồi URL.
 * - currentUrl: signed URL ảnh đang lưu (null nếu chưa có).
 * - photoFailed: bool, ảnh hiện tại không tải được -> hiện ô "Không tải được ảnh" + Thử lại.
 * - error: chuỗi lỗi file (không nhận file). warning: cảnh báo mềm về ratio (vẫn nhận file).
 * - errorFocusSignal: số tăng mỗi khi cha muốn đưa lỗi vào màn hình (lỗi do server trả sau khi Lưu).
 *   Mỗi lần đổi, dòng lỗi được focus + cuộn tới, kể cả khi câu lỗi giống hệt lần trước.
 * - disabled: khoá khi đang lưu.
 * - onSelect(file): người dùng chọn 1 file. onClear(): bỏ ảnh mới chọn (quay lại ảnh hiện tại).
 * - onImageError(): <img> của ảnh hiện tại báo lỗi (cha thử làm mới URL tối đa một lần).
 * - onImageLoad(): <img> của ảnh hiện tại tải được (cha cho phép tự làm mới lại lần sau).
 * - onRetry(): bấm Thử lại ở ô "Không tải được ảnh".
 */
export default function BodyPhotoPicker({
  previewUrl = null,
  currentUrl = null,
  photoFailed = false,
  error = '',
  warning = '',
  errorFocusSignal = 0,
  disabled = false,
  onSelect,
  onClear,
  onImageError,
  onImageLoad,
  onRetry,
}) {
  const inputRef = useRef(null);
  const errorRef = useRef(null);
  const id = useId();
  const errorId = `${id}-error`;
  const guideId = `${id}-guide`;
  const shown = previewUrl || currentUrl;
  const hasImage = Boolean(shown) && !(photoFailed && !previewUrl);

  // Focus sau commit để dòng lỗi đã có trong DOM. Cuộn theo scroll-padding-top của <html> nên
  // không bị header cố định che; scroll-behavior smooth đã tắt khi prefers-reduced-motion.
  useEffect(() => {
    if (errorFocusSignal) errorRef.current?.focus();
  }, [errorFocusSignal]);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng một file
    if (file) onSelect?.(file);
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-ink-800">Ảnh toàn thân</p>

      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-card bg-sand ring-1 ring-ink-900/5 lg:max-w-none">
        {hasImage ? (
          <img
            key={shown}
            src={shown}
            alt={previewUrl ? 'Xem trước ảnh toàn thân mới' : 'Ảnh toàn thân hiện tại của bạn'}
            onError={previewUrl ? undefined : onImageError}
            onLoad={previewUrl ? undefined : onImageLoad}
            className="size-full object-contain"
          />
        ) : photoFailed ? (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center">
            <svg
              viewBox="0 0 24 24"
              className="size-8 text-ink-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="m3 16 5-5 4 4 3-3 6 6M9 9h.01" />
            </svg>
            <p className="text-sm font-medium text-ink-800">Không tải được ảnh</p>
            <Button variant="secondary" onClick={onRetry} disabled={disabled}>
              Thử lại
            </Button>
          </div>
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-ink-500">
            <svg
              viewBox="0 0 64 64"
              className="size-16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="32" cy="14" r="7" />
              <path d="M22 28h20l5 20h-6l-2 12h-4l-1-10h-4l-1 10h-4l-2-12h-6z" />
            </svg>
            <p className="text-sm">Chưa có ảnh toàn thân</p>
          </div>
        )}
        {previewUrl && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-700 px-3 py-1 text-xs font-medium text-canvas">
            Ảnh mới, chưa lưu
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant="secondary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          aria-describedby={`${guideId}${error ? ` ${errorId}` : ''}`}
        >
          {shown || photoFailed ? 'Chọn ảnh khác' : 'Chọn ảnh'}
        </Button>
        {previewUrl && (
          <Button variant="ghost" onClick={onClear} disabled={disabled}>
            Bỏ ảnh đã chọn
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleChange}
        />
      </div>

      {error && (
        <Alert tone="danger" className="mt-4">
          <span id={errorId} ref={errorRef} tabIndex={-1} className="outline-none">
            {error}
          </span>
        </Alert>
      )}
      {warning && !error && (
        <Alert tone="warning" className="mt-4">
          {warning}
        </Alert>
      )}

      <div id={guideId} className="mt-4 rounded-xl bg-canvas p-4 ring-1 ring-ink-900/5">
        <p className="text-sm font-medium text-ink-800">Cách chọn ảnh để thử đồ đẹp nhất</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-600">
          {GUIDE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
