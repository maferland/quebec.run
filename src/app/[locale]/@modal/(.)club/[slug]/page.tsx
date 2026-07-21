type Props = { params: Promise<{ slug: string }> }

export default async function ClubModalPage({ params }: Props) {
  await params
  return null
}
