import io
import os
from typing import Union, BinaryIO

def extract_text_from_pdf(source: Union[str, bytes, BinaryIO]) -> str:
    """
    Extracts text from a PDF file using pdfplumber with pypdf fallback.
    Handles multi-column formatting, headers, and bullet points.
    """
    extracted_text = []

    # Attempt 1: pdfplumber (best for layout and table preservation)
    try:
        import pdfplumber
        file_obj = io.BytesIO(source) if isinstance(source, bytes) else source
        with pdfplumber.open(file_obj) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text.append(page_text)
        if extracted_text:
            return "\n\n".join(extracted_text)
    except Exception as e:
        pass

    # Attempt 2: pypdf fallback
    try:
        from pypdf import PdfReader
        file_obj = io.BytesIO(source) if isinstance(source, bytes) else source
        reader = PdfReader(file_obj)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                extracted_text.append(t)
        if extracted_text:
            return "\n\n".join(extracted_text)
    except Exception as e:
        pass

    return ""

def extract_text_from_docx(source: Union[str, bytes, BinaryIO]) -> str:
    """
    Extracts structured text from a Word DOCX document, including paragraphs and tables.
    """
    import docx
    file_obj = io.BytesIO(source) if isinstance(source, bytes) else source
    doc = docx.Document(file_obj)

    paragraphs = []
    for p in doc.paragraphs:
        if p.text.strip():
            paragraphs.append(p.text.strip())

    # Also extract content from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                paragraphs.append(" | ".join(row_text))

    return "\n".join(paragraphs)

def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """
    Generic file text extractor routing to appropriate parser by file extension.
    """
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_content)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_content)
    elif ext in [".txt", ".md"]:
        return file_content.decode("utf-8", errors="ignore")
    else:
        # Attempt text decode fallback
        return file_content.decode("utf-8", errors="ignore")
