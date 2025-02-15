'use client'

interface PDFViewerProps {
  url: string
}

function getGoogleDriveEmbedUrl(url: string) {
  const fileId = url.match(/\/d\/([^/]+)/)?.[1]
  if (!fileId) {
    console.error('Invalid Google Drive URL format')
    return ''
  }
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export function PDFViewer({ url }: PDFViewerProps) {
  const embedUrl = getGoogleDriveEmbedUrl(url)
  
  if (!embedUrl) {
    return <div className="text-red-500">Invalid PDF URL</div>
  }

  return (
    <div className="relative w-full" style={{ paddingTop: '100%' }}>
      <iframe
        src={embedUrl}
        className="absolute top-0 left-0 w-full h-full rounded-lg"
        allowFullScreen
      />
    </div>
  )
}
