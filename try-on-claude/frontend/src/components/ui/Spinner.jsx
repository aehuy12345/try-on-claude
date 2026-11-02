/** Spinner nhỏ cho nút đang gửi (trang trí, nút đã có chữ mô tả trạng thái). */
export default function Spinner({ className = 'size-4' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} animate-spin`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}
