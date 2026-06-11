const GIPHY_API_KEY = "GlVGYHkr3VkU1NvOhGQGPbSErbAULGCA"

const cache = new Map<string, string>()

export async function getExerciseGif(exerciseName: string): Promise<string | null> {
  const cached = cache.get(exerciseName)
  if (cached) return cached

  try {
    const res = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(exerciseName + " exercise gym")}&limit=1&lang=fr`
    )
    if (!res.ok) return null
    const data = await res.json()
    const url: string | undefined = data.data?.[0]?.images?.downsized_medium?.url
    if (url) {
      cache.set(exerciseName, url)
      return url
    }
    return null
  } catch {
    return null
  }
}
