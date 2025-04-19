const apiUrl = import.meta.env.backendUrl;

// Example function to fetch data from your backend
export async function getData() {
  const response = await fetch(`${apiUrl}/`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}
