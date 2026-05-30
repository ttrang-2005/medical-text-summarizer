# Medical Text Summarizer (MedLM)

Ứng dụng hỗ trợ tóm tắt văn bản y khoa, giúp bác sĩ và chuyên gia y tế nhanh chóng nắm bắt nội dung từ tài liệu, hồ sơ bệnh án và bài báo khoa học theo nhiều mức độ chi tiết khác nhau thông qua sức mạnh của Trí tuệ nhân tạo (AI).

## Tổng quan

MedLM là một hệ thống toàn diện bao gồm giao diện người dùng (Frontend) hiện đại và hệ thống máy chủ (Backend) tích hợp mô hình Ngôn ngữ lớn (LLM). Dự án tập trung vào trải nghiệm người dùng tối ưu và khả năng xử lý, trích xuất thông tin y khoa có độ chính xác cao.

## Tính năng chính

- **3 Cấp độ tóm tắt:** Hỗ trợ chọn nhanh cấp độ Sơ lược, Dễ hiểu, và Chuyên sâu.
- **Tải lên tài liệu:** Hỗ trợ upload trực tiếp file văn bản (như PDF, Word) để AI đọc và phân tích nội dung.
- **Lịch sử phiên làm việc:** Thanh Sidebar quản lý các phiên tóm tắt gần đây.
- **Trải nghiệm UX mượt mà:** Giao diện chatbot hiện đại, tự động cuộn khi có tin nhắn mới, hỗ trợ phím tắt `Shift + Enter` để xuống dòng và thanh hiển thị tiến trình xử lý.

## Công nghệ sử dụng

- **Frontend:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/), JavaScript (JSX), Vanilla CSS.
- **Backend:** FastAPI (Python), Uvicorn.
- **AI/LLM:** Mô hình ngôn ngữ Qwen 2.5 (vận hành qua Jupyter Notebook/Ollama).

---

## Hướng dẫn cài đặt và khởi chạy dự án

Để chạy hệ thống hoàn chỉnh (bao gồm cả AI, Backend và Frontend) trên máy tính của bạn, vui lòng làm theo các bước dưới đây.

### Yêu cầu hệ thống
- Máy tính cần cài đặt sẵn **[Node.js](https://nodejs.org/)** (phiên bản 16.x hoặc mới hơn).
- Cài đặt **Python 3.8+** (để chạy Backend).
- Git (để tải mã nguồn).

### Các bước thực hiện

**Bước 1: Clone (Tải) mã nguồn về máy**
Mở Terminal hoặc Command Prompt và chạy lệnh:

```bash
git clone https://github.com/ttrang-2005/medical-text-summarizer.git
cd medical-text-summarizer
```

**Bước 2: Khởi chạy Mô hình AI & Lấy link API**
1. Mở file `Ollama_Qwen2_5_7B.ipynb` (chạy trên Google Colab hoặc môi trường Jupyter Notebook của bạn).
2. Bấm chạy (Run) toàn bộ các cell trong file để khởi động mô hình AI.
3. Khi cell cuối cùng chạy xong, hệ thống sẽ sinh ra một **đường link public (URL)**. Hãy copy đường link này.

**Bước 3: Cấu hình và chạy Backend (FastAPI)**
1. Mở file `.env` (nằm trong thư mục `test-streamlit-rag`) và gán đường link bạn vừa copy ở Bước 2 vào biến môi trường kết nối LLM.
2. Mở Terminal mới, di chuyển vào thư mục backend và khởi chạy server:

```bash
cd test-streamlit-rag
uvicorn main:app --reload
```
3. Đợi một lát để server Backend khởi động hoàn tất (Terminal báo dòng chữ *Application startup complete*).

**Bước 4: Cài đặt và khởi chạy Frontend (React)**
1. Mở một tab Terminal khác (đảm bảo đang đứng ở thư mục gốc `medical-text-summarizer`).
2. Cài đặt các thư viện UI cần thiết:

```bash
npm install
```
3. Khởi chạy ứng dụng Frontend:

```bash
npm run dev
```

**Bước 5: Trải nghiệm ứng dụng**
1. Mở trình duyệt web và truy cập vào đường dẫn: [http://localhost:5173](http://localhost:5173).
2. Tại giao diện Chat, nhấn biểu tượng đính kèm để **upload file PDF** bài báo hoặc hồ sơ y khoa của bạn.
3. **Chọn Level tóm tắt** (Sơ lược, Dễ hiểu hoặc Chuyên sâu).
4. Nhấn gửi và đợi AI xử lý để xem kết quả tóm tắt trực quan trên màn hình!
