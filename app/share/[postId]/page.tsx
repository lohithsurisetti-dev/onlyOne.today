import { Metadata } from 'next'
import { redirect } from 'next/navigation'

type Props = {
  params: { postId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const content = searchParams.content as string || 'My unique moment'
  const score = searchParams.score as string || '100'
  const type = searchParams.type as string || 'uniqueness'
  const scope = searchParams.scope as string || 'world'
  
  const title = `${content} - ${score}% ${type}`
  const description = `I ${content} today and it was ${score}% ${type === 'uniqueness' ? 'unique' : 'common'} in ${scope}! Discover your uniqueness on OnlyOne.Today`
  
  // Generate share preview image
  const imageUrl = `/api/share-preview?content=${encodeURIComponent(content)}&score=${score}&type=${type}&scope=${scope}`
  
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
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default function SharePostPage({ params }: Props) {
  // Redirect to response page
  redirect(`/response?postId=${params.postId}`)
}

