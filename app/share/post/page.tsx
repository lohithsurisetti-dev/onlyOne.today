import { Metadata } from 'next'
import { redirect } from 'next/navigation'

type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const content = searchParams.content as string || 'My unique moment'
  const score = searchParams.score as string || '100'
  const type = searchParams.type as string || 'uniqueness'
  const scope = searchParams.scope as string || 'world'
  const vibe = searchParams.vibe as string || '✨ Free Spirit'
  const message = searchParams.message as string || `Literally no one else did this today!`
  
  const title = `${content} - ${score}% ${type}`
  const description = `I ${content} today and it was ${score}% ${type === 'uniqueness' ? 'unique' : 'common'} in ${scope}! Discover your uniqueness on OnlyOne.Today`
  
  // Generate share image using ImageResponse API
  const imageParams = new URLSearchParams({
    content,
    score,
    type,
    scope,
    vibe: vibe || '✨ Free Spirit',
  })
  const imageUrl = `/api/share-image?${imageParams.toString()}`
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: content,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function SharePostPage({ searchParams }: Props) {
  // Redirect to homepage (or you could show a landing page)
  redirect('/')
}

