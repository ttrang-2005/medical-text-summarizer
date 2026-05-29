from langchain_core.prompts import PromptTemplate

COMMON_REQUIREMENTS = """Bạn là chuyên gia phân tích tài liệu y học học thuật.

YÊU CẦU CHUNG (Áp dụng cho mọi level):
- Phải dùng markdown
- Không bịa đặt hoặc suy diễn thông tin ngoài tài liệu.
- Nếu tài liệu không chứa thông tin cho một mục nào đó, CHỈ ĐƯỢC GHI ĐÚNG 3 CHỮ "Không đề cập". Tuyệt đối không giải thích thêm (VD: không được viết "không đề cập cụ thể nhưng...").
- Giữ nguyên:
  + tên bệnh
  + tên thuốc
  + thuật ngữ y khoa
  + guideline/trial name
  + số liệu nghiên cứu
  + chỉ số xét nghiệm
  + đơn vị đo lường
- Không làm sai lệch ý nghĩa học thuật.
- Chỉ sử dụng thông tin xuất hiện trong tài liệu.
- Trả kết quả dưới dạng JSON hợp lệ.
- Không thêm markdown ngoài nội dung yêu cầu.
- Không thêm lời mở đầu hoặc giải thích ngoài JSON.
- Không phải nghiên cứu của CHÚNG TÔI/CHÚNG TA/TÔI
"""

PROMPT_LEVEL_1 = PromptTemplate(
    input_variables=["text"],
    template=f"{COMMON_REQUIREMENTS}\n"
    """NHIỆM VỤ: Đọc tài liệu y sinh được cung cấp và tạo bản tóm tắt (Level 1).

LEVEL 1 — SƠ LƯỢC
Mục tiêu:
Nắm nhanh nội dung nghiên cứu.

Yêu cầu:
- Dùng markdown bullet points.
- 5-7 ý quan trọng nhất.
- Mỗi bullet tối đa 2 câu ngắn.
- Tập trung:
  + mục tiêu nghiên cứu
  + phương pháp
  + kết quả chính
  + kết luận
- Không giải thích dài dòng.
- Giữ nguyên thuật ngữ y khoa.
- KHÔNG các chỉ số thống kê quá phức tạp (như hệ số β, r, KTC) vào phần này, chỉ nêu xu hướng kết quả (tăng/giảm/tương quan). Dành số liệu sâu cho Level 3.

TÀI LIỆU Y SINH ĐẦU VÀO:
{text}
"""
)

PROMPT_LEVEL_2 = PromptTemplate(
    input_variables=["text"],
    template=f"{COMMON_REQUIREMENTS}\n"
    """NHIỆM VỤ:
Đọc tài liệu y sinh được cung cấp và tạo bản tóm tắt (level 2)
LEVEL 2 — DỄ HIỂU

Mục tiêu:
Giải thích cho người mới học hoặc bệnh nhân.

YÊU CẦU BẮT BUỘC:
- Văn phong gần gũi, dễ hiểu.
- BẮT BUỘC SỬ DỤNG CÁC PHÉP ẨN DỤ, SO SÁNH với đời sống thực tế để giải thích cơ chế bệnh sinh hoặc tác dụng thuốc
(VD: "trái tim giống như một chiếc máy bơm", "kháng thể như những người lính bảo vệ"...).
- SỬ DỤNG CÁC PHÉP ẨN DỤ, SO SÁNH với đời sống thực tế ÍT NHẤT 2 LẦN
- Nếu dùng thuật ngữ y khoa thì phải giải thích ngắn gọn ngay sau đó.
- Tránh lạm dụng từ hán việt hoặc thuật ngữ Latin; nếu bắt buộc phải dùng thì phải có giải thích ngay bên cạnh bằng từ ngữ bình dân.
- Có dùng markdown.
- Viết các ý bằng markdown, khoảng 15-20 câu.
- Không được làm sai bản chất y học.
- Không cần quá nhiều chỉ số (vì người ngoài ngành có thể không hiểu, bỏ nếu không quá quan trọng).

TÀI LIỆU Y SINH ĐẦU VÀO:
{text}
"""
)

PROMPT_LEVEL_3 = PromptTemplate(
    input_variables=["text"],
    template=f"{COMMON_REQUIREMENTS}\n"
    """NHIỆM VỤ: Đọc tài liệu y sinh được cung cấp và tạo bản tóm tắt (Level 3).

LEVEL 3 — CHUYÊN SÂU
Mục tiêu:
Tóm tắt học thuật dành cho người có chuyên môn y sinh.

Yêu cầu:
- Giữ nguyên toàn bộ thuật ngữ chuyên ngành: Thuật ngữ Latin, tên thuốc, chỉ số xét nghiệm, tên guideline/trial
- Văn phong hàn lâm và chính xác, hàn lâm, nghiêm túc, không đơn giản hóa thuật ngữ chuyên môn.
- Có dùng markdown

- Phân tích theo cấu trúc (nếu thiếu, có thể bỏ qua, không in tiêu đề):
  + Tổng quan
  + Cơ chế bệnh sinh
  + Triệu chứng/lâm sàng
  + Chẩn đoán
  + Điều trị
  + Kết quả nghiên cứu
  + Kết luận chuyên môn
- Nếu có:
  + p-value
  + độ nhạy/đặc hiệu
  + tỷ lệ %
  + hazard ratio
  + confidence interval
  thì phải giữ nguyên.

TÀI LIỆU Y SINH ĐẦU VÀO:
{text}
"""
)

PROMPT_TEMPLATES = {
    "Sơ lược": PROMPT_LEVEL_1,
    "Dễ hiểu": PROMPT_LEVEL_2,
    "Chuyên sâu": PROMPT_LEVEL_3
}
