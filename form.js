const form = document.getElementById('resume-form');
if (form) {
  form.reset();
}
console.log("Form script loaded");
console.log(localStorage.getItem('geminiData'));

window.addEventListener('DOMContentLoaded', () => {
  const jsonString = localStorage.getItem('geminiData');
  if (!jsonString) return;

  let data;
  try {
    data = JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse Gemini JSON from localStorage", e);
    return;
  }

  for (const key in data) {
    if (!data.hasOwnProperty(key)) continue;

    const value = data[key];
    const element = document.getElementById(key);

    if (Array.isArray(value)) {
      // If it's a list (e.g., workExperience or education), render as list
      if (element && element.tagName === 'UL') {
        element.innerHTML = ''; // Clear previous content
        value.forEach(item => {
          const li = document.createElement('li');
          li.textContent = item;
          element.appendChild(li);
        });
      } else if (element) {
        element.textContent = value.join(', ');
      }
    } else if (typeof value === 'object' && value !== null) {
      // Render object as JSON string (or handle specially if needed)
      if (element) element.textContent = JSON.stringify(value);
    } else {
      // For basic string/number values
      if (element) {
        if ('value' in element) {
          element.value = value;
        } else {
          element.textContent = value;
        }
      }
    }
  }

  // Optional: Clear localStorage afterwards
  // localStorage.removeItem('geminiData');
});
