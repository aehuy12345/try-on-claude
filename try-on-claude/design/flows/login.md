# Flow: Đăng nhập và phát hành JWT

US-01. API: [PRD 4.2](../PRD.md#42-post-apiauthlogin). Quyết định: D2, D3, D4, D6, D8.

```mermaid
flowchart TD
    subgraph U["Người dùng"]
        U1(["Mở /login, trực tiếp hoặc bị chuyển từ route bảo vệ"])
        U2["Nhập email, mật khẩu rồi bấm Đăng nhập"]
        U3(["Vào route trước đó, mặc định /profile"])
    end

    subgraph F["Frontend"]
        F0{"Đã có token?"}
        F0R["Chuyển from hoặc /profile (replace)"]
        F1{"Hết phiên? (state.reason)"}
        F1B["Hiện banner cố định: Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại."]
        F2{"Email đúng định dạng, mật khẩu không rỗng?"}
        F3["Hiện lỗi dưới ô, giữ dữ liệu"]
        F4["Vô hiệu nút, gửi POST /api/auth/login"]
        F5{"Kết quả?"}
        F6["Lưu token vào localStorage, cập nhật AuthContext"]
        F7["GuestRoute chuyển tới state.from hoặc /profile (replace)"]
        F8["Hiện thông báo trên form, xoá ô mật khẩu, KHÔNG redirect"]
    end

    subgraph B["Backend (Express)"]
        B1{"email, password là chuỗi không rỗng?"}
        B2["400: VALIDATION_ERROR"]
        B3["Chuẩn hoá email (trim, lowercase), mật khẩu (NFC)"]
        B4{"Tìm thấy tài khoản?"}
        B5["bcrypt.compare với hash giả"]
        B6{"Mật khẩu ≤ 72 byte?"}
        B6A["bcrypt.compare với hash giả"]
        B7["bcrypt.compare với password_hash"]
        B8{"Khớp?"}
        B9["401: INVALID_CREDENTIALS"]
        B10["signToken({ sub: id, role }), hạn JWT_EXPIRES_IN"]
        B11["200: { token, user }"]
    end

    subgraph S["Supabase (PostgreSQL)"]
        S1[("SELECT id, email, password_hash, role theo email")]
    end

    U1 --> F0
    F0 -->|"Có"| F0R
    F0 -->|"Không"| F1
    F1 -->|"Có"| F1B
    F1 -->|"Không"| U2
    F1B --> U2
    U2 --> F2
    F2 -->|"Không"| F3
    F3 --> U2
    F2 -->|"Có"| F4
    F4 --> B1
    B1 -->|"Không"| B2
    B1 -->|"Có"| B3
    B3 --> S1
    S1 --> B4
    B4 -->|"Không"| B5
    B5 --> B9
    B4 -->|"Có"| B6
    B6 -->|"Không"| B6A
    B6A --> B9
    B6 -->|"Có"| B7
    B7 --> B8
    B8 -->|"Không"| B9
    B8 -->|"Có"| B10
    B10 --> B11
    B2 --> F5
    B9 --> F5
    B11 --> F5
    F4 -.->|"Lỗi mạng"| F5
    F5 -->|"200"| F6
    F6 --> F7
    F7 --> U3
    F5 -->|"Lỗi"| F8
    F8 --> U2
```

## Nhánh lỗi

| Điều kiện | HTTP | Thông báo cho người dùng | Hành vi UI |
|-----------|------|--------------------------|------------|
| Email sai định dạng | Client chặn; nếu tới server: `401 INVALID_CREDENTIALS` | Client: Email không hợp lệ. | Lỗi dưới ô email, không gửi request |
| Thiếu email hoặc mật khẩu | Client chặn; server `400 VALIDATION_ERROR` | Vui lòng nhập email và mật khẩu. | Lỗi dưới ô tương ứng |
| Email không tồn tại hoặc mật khẩu sai | `401 INVALID_CREDENTIALS` | Email hoặc mật khẩu không đúng. | Thông báo trên form (không gắn với ô nào), giữ email, xoá mật khẩu, không redirect |
| Lỗi server | `500 INTERNAL_ERROR` | Đã có lỗi xảy ra. Vui lòng thử lại. | Thông báo trên form, giữ email |
| Lỗi mạng | Không có | Không thể kết nối tới máy chủ. Vui lòng thử lại. | Thông báo trên form, giữ email |

## Ghi chú bảo mật

- **Chống dò tài khoản:** cùng status, `code`, `message` cho sai email và sai mật khẩu; mọi nhánh 401 đều chạy đúng một lần `bcrypt.compare`. Hash giả là bcrypt cost 10, tạo một lần khi khởi động server.
- **72 byte:** mật khẩu dài hơn không thể là mật khẩu thật (đăng ký đã chặn), coi như sai thay vì để bcrypt cắt bớt rồi khớp.
- **Token:** lưu `localStorage` key `tryon_token` qua `tokenStorage` đã có. Không log token. Hạn và hệ quả: [flow logout](logout-protected-routes.md#hệ-quả-của-jwt-stateless).
- **Không có rate limit ở Sprint 1:** xem [PRD mục 7](../PRD.md#7-rủi-ro-đã-chấp-nhận-và-đề-xuất-backlog). Sơ đồ này không có bước đó.
- **Banner hết phiên:** text cố định "Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại." cho cả `AUTH_REQUIRED`, `TOKEN_EXPIRED`, `TOKEN_INVALID` ([chi tiết](logout-protected-routes.md#hành-vi-frontend)).
- `from` lấy từ `location.state`, không lấy từ URL, nên không thể bị lợi dụng để chuyển hướng ra ngoài.
