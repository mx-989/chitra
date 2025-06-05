document.getElementById('testBtn').addEventListener('click', async () => {
  const resultDiv = document.getElementById('apiResult');
  resultDiv.innerHTML = 'Loading...';
  
  try {
    // Test de L'API
    const response = await fetch('http://localhost:81/dogs/1');
    const data = await response.json();
    
    resultDiv.innerHTML = `<pre class="bg-light p-3 mt-3">${JSON.stringify(data, null, 2)}</pre>`;
  } catch (error) {
    resultDiv.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
  }
});