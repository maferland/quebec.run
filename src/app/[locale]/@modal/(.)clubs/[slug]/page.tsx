type Props = { params: Promise<{ slug: string }> }

export default async function ClubsModalPage({ params }: Props) {
  await params
  return null
}
