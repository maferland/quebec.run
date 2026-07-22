type Props = { params: Promise<{ id: string }> }

export default async function RunModalPage({ params }: Props) {
  await params
  return null
}
