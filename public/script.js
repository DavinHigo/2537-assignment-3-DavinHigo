// script.js

// Function to handle form submission
function submitForm() {
  const checkboxes = document.querySelectorAll('.pokemon-checkbox:checked');
  const selectedTypes = Array.from(checkboxes).map(cb => cb.value);

  if (selectedTypes.length === 0) {
    alert('Please select at least one type.');
    return;
  }

  if (selectedTypes.length > 2) {
    alert('Please select up to 2 types.');
    return;
  }

  // Build the URL based on selected types
  let typeUrl = '/pokemon/' + selectedTypes[0];
  if (selectedTypes.length > 1) {
    typeUrl += '/' + selectedTypes[1];
  }

  window.location.href = typeUrl;
}

// // Automatically check checkboxes based on URL parameters
// document.addEventListener('DOMContentLoaded', function() {
//   const urlParams = new URLSearchParams(window.location.search);
//   const type1 = urlParams.get('type1');
//   const type2 = urlParams.get('type2');

//   if (type1) {
//     const checkbox1 = document.getElementById(type1);
//     if (checkbox1) {
//       checkbox1.checked = true;
//     }
//   }

//   if (type2) {
//     const checkbox2 = document.getElementById(type2);
//     if (checkbox2) {
//       checkbox2.checked = true;
//     }
//   }
// });
