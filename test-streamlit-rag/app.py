import streamlit as st
import os
import tempfile
import json

from rag_pipeline import process_pdf_to_vector_db, generate_summary

# ==========================================
# CẤU HÌNH GIAO DIỆN STREAMLIT
# ==========================================
st.set_page_config(
    page_title="Công cụ tóm tắt văn bản học thuật y sinh",
    layout="centered"
)

st.title("🧬 Công cụ tóm tắt văn bản học thuật y sinh")

# ==========================================
# KHU VỰC 1: TẢI TÀI LIỆU (UPLOAD)
# ==========================================
st.header("1. Tải tài liệu lên")
uploaded_file = st.file_uploader("Chọn một file PDF học thuật y sinh", type=["pdf"])

# ==========================================
# KHU VỰC 2: CHỌN MỨC ĐỘ VÀ THỰC THI
# ==========================================
st.header("2. Chọn cấp độ tóm tắt")
level_choice = st.radio(
    "Bạn muốn bản tóm tắt ở mức độ nào?",
    ("Sơ lược", "Dễ hiểu", "Chuyên sâu"),
)

if st.button("Bắt đầu tóm tắt", type="primary"):
    if uploaded_file is not None:
        # Tạo một file tạm thời trên hệ thống để lưu file PDF vừa tải lên
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(uploaded_file.read())
            temp_pdf_path = temp_file.name

        try:
            with st.spinner('Đang đọc và phân tích tài liệu...'):
                # Gọi hàm xử lý PDF thành VectorDB trên RAM
                vector_db = process_pdf_to_vector_db(temp_pdf_path)
            
            with st.spinner(f'Đang tóm tắt mức độ "{level_choice}"...'):
                # Gọi hàm sinh văn bản
                raw_response = generate_summary(vector_db, level=level_choice)
                
                st.success("Hoàn tất!")
                
                # --- Xử lý hiển thị kết quả JSON ---
                st.markdown("### Kết quả tóm tắt")
                try:
                    # Vì chúng ta ép model xuất JSON, ta cần parse nó ra để hiển thị đẹp hơn
                    json_data = json.loads(raw_response)
                    
                    # Nếu model trả về lỗi (từ hàm generate_summary)
                    if "error" in json_data:
                        st.error(json_data["error"])
                    else:
                        # Hiển thị từng key-value trong JSON một cách gọn gàng
                        for key, value in json_data.items():
                            st.markdown(f"**{key.capitalize()}**")
                            # Nếu value là một list (như yêu cầu của mức Sơ lược)
                            if isinstance(value, list):
                                for item in value:
                                    st.markdown(item)
                            # Nếu value là một dict (như yêu cầu của mức Chuyên sâu)
                            elif isinstance(value, dict):
                                for sub_key, sub_val in value.items():
                                    st.markdown(f"{sub_val}")
                            # Nếu value là một đoạn text bình thường (như mức Dễ hiểu)
                            else:
                                st.markdown(value)
                            st.markdown("---")

                except json.JSONDecodeError:
                    # Đề phòng trường hợp AI "ngáo" không trả về đúng chuẩn JSON
                    st.warning("Mô hình không trả về định dạng JSON chuẩn, dưới đây là văn bản thô:")
                    st.write(raw_response)

        except Exception as e:
            st.error(f"Đã xảy ra lỗi trong quá trình xử lý: {e}")
        
        finally:
            # Dọn dẹp: Xóa file tạm sau khi đã xử lý xong để giải phóng bộ nhớ
            if os.path.exists(temp_pdf_path):
                os.remove(temp_pdf_path)
    else:
        st.warning("Vui lòng tải lên một tài liệu!")