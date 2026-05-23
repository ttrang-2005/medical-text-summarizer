# Medical Text Summarizer (MedLM)

Ứng dụng giao diện người dùng hỗ trợ tóm tắt văn bản y khoa, giúp bác sĩ và chuyên gia y tế nhanh chóng nắm bắt nội dung từ tài liệu, hồ sơ bệnh án và bài báo khoa học theo nhiều mức độ chi tiết khác nhau.

# Tổng quan

MedLM là một ứng dụng frontend xây dựng bằng React, mô phỏng hệ thống tóm tắt văn bản sử dụng AI. Dự án tập trung vào trải nghiệm người dùng, giao diện chat hiện đại và khả năng mở rộng tích hợp backend AI trong tương lai.

## Tính năng chính

- **3 Cấp độ tóm tắt:** Hỗ trợ chọn nhanh cấp độ Sơ lược, Dễ hiểu, và Chuyên sâu.
- **Tải lên tài liệu:** UI hỗ trợ đính kèm file (PDF, Word) với thẻ hiển thị (Chip) trực quan.
- **Lịch sử phiên làm việc:** Thanh Sidebar quản lý các phiên tóm tắt gần đây.
- **Phản hồi giả lập (Mocking):** Tích hợp sẵn hiệu ứng gõ chữ (typing indicator) và luồng tin nhắn (Chatbot UI).
- **Trải nghiệm UX mượt mà:** Tự động cuộn khi có tin nhắn mới, hỗ trợ phím tắt `Shift + Enter` để xuống dòng.

## Công nghệ sử dụng

- **Khung dự án:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Ngôn ngữ:** JavaScript (JSX)
- **CSS:** Vanilla CSS (CSS thuần, không sử dụng Framework để dễ dàng tùy chỉnh)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## Hướng dẫn cài đặt và chạy dự án

Để chạy dự án này trên máy tính của bạn, vui lòng làm theo các bước dưới đây.

### Yêu cầu hệ thống
- Máy tính cần cài đặt sẵn **[Node.js](https://nodejs.org/)** (phiên bản 16.x hoặc mới hơn).
- Git (để tải mã nguồn).

### Các bước thực hiện

**Bước 1: Clone (Tải) mã nguồn về máy**
Mở terminal hoặc Command Prompt và chạy lệnh:
```bash
git clone https://github.com/ttrang-2005/medical-text-summarizer.git
```

**Bước 2: Di chuyển vào thư mục dự án**
```bash
cd medical-text-summarizer
```

**Bước 3: Cài đặt các thư viện cần thiết**
```bash
npm install
```

**Bước 4: Khởi chạy ứng dụng**
```bash
npm run dev
```

**Bước 5: Trải nghiệm**
Sau khi chạy lệnh trên, terminal sẽ hiển thị một đường link (thường là `http://localhost:5173`). Bạn hãy giữ phím `Ctrl` (hoặc `Cmd` trên Mac) và click vào link đó để mở ứng dụng trên trình duyệt.

---

## Lưu ý cho nhà phát triển (Developers)

- **Kết nối Backend:** Hiện tại logic xử lý AI và upload file đang được giả lập ở giao diện (Frontend). Để dự án hoạt động thực tế, bạn cần thay thế hàm `setTimeout` trong file `MedicalSummarizer.jsx` bằng các lời gọi API (ví dụ: dùng `axios` hoặc `fetch`) để kết nối với hệ thống Backend/LLM của bạn.
- **Xử lý File:** Khi gọi API, cần sử dụng `FormData` để đóng gói cả `inputText` và `selectedFile` gửi lên server.

