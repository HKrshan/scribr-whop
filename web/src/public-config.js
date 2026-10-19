export async function loadPublicConfig(fetcher = fetch) {
  const response = await fetcher('/assets/config.json');
  if (!response.ok) throw new Error('Website configuration could not be loaded. Please reload the page.');
  return response.json();
}
