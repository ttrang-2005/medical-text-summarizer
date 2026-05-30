import os
os.environ['HF_HOME'] = 'D:/nlp/huggingface_cache'
import re
from dotenv import load_dotenv
import pymupdf4llm
import uuid  # Thư viện sinh mã ngẫu nhiên

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from ollama import Client 
from prompt import PROMPT_TEMPLATES

# Load link API ngrok từ file .env
load_dotenv()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

# ==========================================
# 1. TIỀN XỬ LÝ VÀ CHIA NHỎ VĂN BẢN
# ==========================================
def clean_medical_text(text):
    text = text.replace('~~', '')
    text = re.sub(r'\*\*==>.*?<==\*\*(?:<br>)?', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\*\*----- Start of picture text -----.*?End of picture text -----\*\*(?:<br>)?', '', text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'TẠP CHÍ NGHIÊN CỨU Y HỌC|TẠP CHÍ NGH IÊN CỨU Y HỌC', '', text, flags=re.IGNORECASE)
    text = re.sub(r'_Tác giả liên hệ:.*?Ngày được chấp nhận: \d{2}/\d{2}/\d{4}_', '', text, flags=re.DOTALL)
    text = re.sub(r'(?m)^\s*[_*]*TCNCYH.*$', '', text)
    text = re.sub(r'(?m)^\s*[_*]*\d+[_*]*\s*$', '', text)
    text = re.sub(r'\[\s*\d+(?:\s*,\s*\d+)*\s*,?\s*\]', '', text)
    text = re.sub(r'\[?\uf02a\]?', '', text)
    
    match_tail = re.search(r'(TÀI LIỆU THAM KHẢO|REFERENCES|LỜI CẢM ƠN|ACKNOWLEDGEMENTS?)', text, re.IGNORECASE)
    if match_tail:
        text = text[:match_tail.start()]
        
    text = re.sub(r'[ \t]+\n', '\n', text)
    text = re.sub(r'\n[ \t]+', '\n', text)
    text = re.sub(r'(?<![.!?:;>|])\n+(?=[a-zà-ỹA-ZÀ-Ỹ0-9])', ' ', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def process_text_to_vector_db(raw_text):
    """Nhận raw text từ Excel, cắt chunk và nạp thẳng vào RAM."""
    clean_text = clean_medical_text(raw_text)
    
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""]
    )
    raw_chunks = splitter.split_text(clean_text)
    
    documents = [
        Document(page_content=chunk, metadata={'chunk_id': i})
        for i, chunk in enumerate(raw_chunks)
    ]
    
    embedding_model = HuggingFaceEmbeddings(
        model_name='keepitreal/vietnamese-sbert',
        model_kwargs={'device': 'cpu'},
        encode_kwargs={'normalize_embeddings': True}
    )
    # Tạo rổ lưu trữ vector khác nhau (để nếu có tải thêm bài thì vector k bị ck lên nhau)
    unique_collection_name = f"pdf_collection_{uuid.uuid4().hex}"
    
    vector_db = Chroma.from_documents(
        documents=documents, 
        embedding=embedding_model,
        collection_name=unique_collection_name 
    )
    return vector_db

def process_pdf_to_vector_db(pdf_file_path):
    raw_md = pymupdf4llm.to_markdown(pdf_file_path, write_images=False)
    return process_text_to_vector_db(raw_md)

# ==========================================
# 2. TRUY VẤN VÀ TÓM TẮT QUA LLM
# ==========================================
def retrieve_context(vector_db, query="Mục tiêu nghiên cứu, phương pháp, kết quả và kết luận", top_k=5):
    results = vector_db.similarity_search(query, k=top_k)
    filtered_context = [doc.page_content for doc in results]
    return "\n\n".join(filtered_context)

def generate_summary(vector_db, level):
    context = retrieve_context(vector_db)
    
    if not context:
        return '{"error": "Không tìm thấy thông tin phù hợp trong tài liệu để tóm tắt."}'

    if level not in PROMPT_TEMPLATES:
        return '{"error": "Level không hợp lệ."}'
        
    formatted_prompt = PROMPT_TEMPLATES[level].format(text=context)

    # Sử dụng Client của thư viện ollama gốc để ép Header xuyên qua Ngrok
    try:
        client = Client(
            host=OLLAMA_BASE_URL,
            headers={"ngrok-skip-browser-warning": "true"}
        )
        
        response = client.chat(
            model="qwen2.5:7b",
            messages=[{'role': 'user', 'content': formatted_prompt}],
            options={"temperature": 0.1},
            format="json"
        )
        return response['message']['content']
        
    except Exception as e:
        return f'{{"error": "Lỗi kết nối API Ollama: {str(e)}"}}'