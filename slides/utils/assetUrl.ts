const externalUrlPattern = /^(?:[a-z][a-z\d+\-.]*:)?\/\//i

export const resolvePublicAssetUrl = (path?: string) => {
  if (!path)
    return ''

  if (externalUrlPattern.test(path) || path.startsWith('data:') || path.startsWith('blob:'))
    return path

  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
