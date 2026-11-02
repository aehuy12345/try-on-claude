import { useEffect, useState } from 'react';
import Alert from '../components/ui/Alert.jsx';
import { useAuth } from '../context/useAuth.js';

// TẠM: Task 7 sẽ thay bằng trang hồ sơ thật.
export default function ProfilePlaceholderPage() {
  const { justRegistered, clearJustRegistered } = useAuth();
  // Capture the flag locally: clearing it in the context must not hide the message.
  const [showWelcome] = useState(justRegistered);

  useEffect(() => {
    if (justRegistered) clearJustRegistered();
  }, [justRegistered, clearJustRegistered]);

  return (
    <section
      aria-labelledby="profile-title"
      className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16"
    >
      {showWelcome && (
        <Alert tone="success" className="mb-8">
          Tạo tài khoản thành công. Hãy hoàn thiện hồ sơ để bắt đầu thử đồ.
        </Alert>
      )}
      <h1
        id="profile-title"
        className="font-display text-3xl font-medium tracking-tight sm:text-4xl"
      >
        Hồ sơ của bạn
      </h1>
      <p className="mt-3 text-ink-600">
        Trang hồ sơ (ảnh toàn thân, chiều cao, cân nặng) sẽ có ở bản cập nhật sau.
      </p>
    </section>
  );
}
