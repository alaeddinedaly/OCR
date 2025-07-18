const GEMINI_API_KEY = "AIzaSyA8lpvyoYqU0pqxB4ICt7fTWro-H3aIQQ8"; // Google Gemini API key

const scanBtn = document.getElementById('scan-btn');
const sendFormBtn = document.getElementById('send-form-btn');
const downloadBtn = document.getElementById('download-btn');
const fileInput = document.getElementById('file');
const ocrResult = document.getElementById('ocr-result');
const fileSelected = document.getElementById('file-selected');

// Show selected file name
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileSelected.textContent = `Selected: ${fileInput.files[0].name}`;
  } else {
    fileSelected.textContent = '';
  }
});

function stripCodeFence(text) {
  // Remove ```json and ``` fences if present
  return text.replace(/^```(json)?\s*/, '').replace(/```$/, '').trim();
}

function extractJsonBetweenMarkers(text) {
  const startMarker = "BEGIN_JSON";
  const endMarker = "END_JSON";
  
  const startIndex = text.indexOf(startMarker);
  const endIndex = text.indexOf(endMarker);
  
  if (startIndex === -1 || endIndex === -1) {

    return text;
  }
  
  // Extract substring between markers, excluding markers themselves
  return text.substring(startIndex + startMarker.length, endIndex).trim();
}


function fillFormWithData(jsonString) {
  // Clean the JSON string first
  const cleanedString = stripCodeFence(jsonString);
  console.log("Cleaned JSON string:", cleanedString);

  let data;
  try {
    data = JSON.parse(cleanedString);
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    Swal.fire({
      icon: 'error',
      title: 'Invalid Format',
      text: 'The scanned document could not be properly formatted. Please try another document.',
      confirmButtonColor: '#6d6fd3'
    });
    return;
  }

  // Flatten nested objects
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const prefixedKey = prefix ? `${prefix}_${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(acc, flattenObject(obj[key], prefixedKey));
      } else {
        acc[prefixedKey] = obj[key];
      }
      return acc;
    }, {});
  };

  const flatData = flattenObject(data);
  console.log("Flattened data:", flatData);

  // Fill form fields
  let filledFields = 0;
  for (const key in flatData) {
    if (flatData.hasOwnProperty(key)) {
      const input = document.getElementById(key);
      if (input) {
        if (Array.isArray(flatData[key])) {
          input.value = flatData[key].join(", ");
        } else if (typeof flatData[key] === 'object') {
          input.value = JSON.stringify(flatData[key]);
        } else {
          input.value = flatData[key];
        }
        filledFields++;
      }
    }
  }

  if (filledFields === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'No Matching Fields',
      text: 'Data was extracted but no matching form fields were found.',
      confirmButtonColor: '#6d6fd3'
    });
  }
}

async function callGemini(rawText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const promptText = `
      You are a data extraction assistant. Extract structured invoice information from the following OCR text.
      
      Return a valid, flat JSON object with the following keys:
      - invoice_number (string)
      - reference_externe (string)
      - montant (string or number, include currency if present)
      - date (string, use ISO format if possible)
      - fournisseur (string)
      - conditions_generales (string, may be multiline)
      - infos_client (string, may be multiline)
      - objet (string)
      - date_echeance (string, use ISO format if possible)
      - status (string, one of: "Payé", "En attente", "Retard")
      
      Formatting rules:
      - Use field names that match HTML input IDs (e.g., "invoice_number", "date_echeance")
      - Flatten all data (no nested objects)
      - Arrays are not required unless a field has multiple entries (like conditions)
      - Ensure the entire response is **only valid JSON**, with no explanation or markdown
      
      OCR TEXT:
      ${rawText}
      
      Respond with the extracted data **only**, and wrap the output in:
      BEGIN_JSON
      <your valid JSON here>
      END_JSON
   `;



  const body = {
    contents: [{
      parts: [{
        text: promptText.trim()
      }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    const generatedText = responseData?.candidates?.[0]?.content?.parts?.[0]?.text || "No data received";

    const jsonOnly = extractJsonBetweenMarkers(generatedText);
    const cleanJson = stripCodeFence(jsonOnly);

    localStorage.setItem('geminiData', cleanJson);

    return cleanJson  ;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    Swal.fire({
      icon: 'error',
      title: 'API Error',
      text: 'Failed to process document with Gemini API.',
      confirmButtonColor: '#6d6fd3'
    });
    return "Error occurred while formatting data.";
  }
}

// Scan and fetch OCR result using Tesseract.js
scanBtn.addEventListener('click', async () => {
  const file = fileInput.files[0];
  if (!file) {
    Swal.fire({
      icon: 'warning',
      title: 'No image selected',
      text: 'Please select an image to scan.',
      confirmButtonColor: '#6d6fd3'
    });
    return;
  }

  ocrResult.value = "Scanning...";
  try {
    const dataURL = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const { data: { text: rawText } } = await Tesseract.recognize(dataURL, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          ocrResult.value = `Scanning... ${Math.round(m.progress * 100)}%`;
        }
      }
    });

    console.log("Raw OCR text:", rawText);
    if (!rawText) {
      Swal.fire({
        icon: 'warning',
        title: 'No text found',
        text: 'The selected image does not contain any recognizable text.',
        confirmButtonColor: '#6d6fd3'
      });
      return;
    }

    ocrResult.value = "Formatting data...";
    const formattedText = await callGemini(rawText);
    console.log(localStorage.getItem('geminiData'));
    ocrResult.value = formattedText;

    // Re-trigger animation
    ocrResult.classList.remove('fade-in');
    void ocrResult.offsetWidth;
    ocrResult.classList.add('fade-in');

  } catch (err) {
    console.error(err);
    ocrResult.value = "Error occurred during OCR processing.";
    Swal.fire({
      icon: 'error',
      title: 'Processing Error',
      text: 'An error occurred while processing the document.',
      confirmButtonColor: '#6d6fd3'
    });
  }
});

// Download Gemini formatted result as PDF
downloadBtn.addEventListener('click', () => {
  const text = ocrResult.value.trim();
  if (!text) {
    Swal.fire({
      icon: 'warning',
      title: 'No content to download',
      text: 'Please scan an image first to download the formatted result.',
      confirmButtonColor: '#6d6fd3'
    });
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const splitText = doc.splitTextToSize(text, 180);
  doc.text(splitText, 10, 10);
  doc.save('formatted-resume.pdf');
});


sendFormBtn.addEventListener('click', async () => {
  window.open('FactureForm.html', '_blank');
});