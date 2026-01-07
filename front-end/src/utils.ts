// scrollUtils.ts
export function scrollToTop(container?: HTMLElement | Window, smooth = true) {
  const scrollContainer = container || window;

  if (scrollContainer instanceof Window) {
    if (window.scrollY > 0) {
      window.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  } else {
    if (scrollContainer.scrollTop > 0) {
      scrollContainer.scrollTo({
        top: 0,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  }
}


const _reverseGeocodeCache: Map<string, string | null> = new Map()

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const key = `${lat.toFixed(6)},${lon.toFixed(6)}`
  if (_reverseGeocodeCache.has(key)) return _reverseGeocodeCache.get(key) || null

  try {
    // Browsers disallow setting the User-Agent header. Use the email parameter instead
    // to identify the application to the Nominatim service (replace with a real contact if needed).
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
      String(lat)
    )}&lon=${encodeURIComponent(String(lon))}&email=${encodeURIComponent('devnull@example.com')}`

    // For debugging, you can uncomment the line below to log the URL (avoid logging in production):
    // console.debug('reverseGeocode url:', url)

    const resp = await fetch(url)

    if (!resp.ok) {
      console.warn('reverseGeocode: non-ok response', resp.status, resp.statusText)
      _reverseGeocodeCache.set(key, null)
      return null
    }

    const data = await resp.json()
    const address = data?.display_name ? String(data.display_name) : null
    _reverseGeocodeCache.set(key, address)
    return address
  } catch (err) {
    console.warn('reverseGeocode failed', err)
    _reverseGeocodeCache.set(key, null)
    return null
  }
}
