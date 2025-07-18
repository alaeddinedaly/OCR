# OCR Invoice Scanner

This project is an OCR (Optical Character Recognition) application designed to scan invoices using Tesseract OCR, reorganize extracted data via Gemini, and enable easy submission of the processed information through a form.

## Features

- **Invoice Scanning:** Uses [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) to extract text from invoice images.
- **Data Reorganization:** Sends raw OCR data to Gemini for structuring and cleaning.
- **Form Integration:** Allows users to submit the reorganized invoice data through a customizable form.

## How It Works

1. **Scan Invoice:** The user uploads an invoice image, and Tesseract OCR processes the image to extract text.
2. **Send to Gemini:** Extracted data is sent to Gemini, which analyzes and reorganizes the information into structured fields (e.g., invoice number, date, total).
3. **Submit Data:** The structured data is displayed and can be submitted via a form for further processing or storage.

## Technologies Used

- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- Gemini (data processing service)
- Backend & frontend technologies (specify your stack, e.g., Node.js, React, PHP, etc.)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ocr-invoice-scanner.git
