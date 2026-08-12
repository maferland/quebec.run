import { describe, it, expect, vi } from 'vitest'
import { useForm } from 'react-hook-form'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { AddressPicker } from './address-picker'
import { useAddresses, type Address } from '@/lib/hooks/use-addresses'

vi.mock('@/lib/hooks/use-addresses')

function Harness({
  onAddressSelect,
}: {
  onAddressSelect: (address: string, label: string) => void
}) {
  const { register } = useForm()
  return (
    <AddressPicker
      clubId="club-1"
      onAddressSelect={onAddressSelect}
      register={register}
    />
  )
}

describe('AddressPicker', () => {
  it('passes the saved address label alongside the address', async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [
        {
          id: 'addr-1',
          label: 'Café Central',
          address: '123 Main St',
          latitude: null,
          longitude: null,
          clubId: 'club-1',
          organizationId: null,
          createdAt: new Date(),
        },
      ] as Address[],
      isLoading: false,
    } as unknown as ReturnType<typeof useAddresses>)

    const user = userEvent.setup()
    const onAddressSelect = vi.fn()

    render(<Harness onAddressSelect={onAddressSelect} />)

    await user.selectOptions(
      screen.getByLabelText(/use saved address/i),
      '123 Main St'
    )

    expect(onAddressSelect).toHaveBeenCalledWith('123 Main St', 'Café Central')
  })

  it('does not render when the club has no saved addresses', () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [] as Address[],
      isLoading: false,
    } as unknown as ReturnType<typeof useAddresses>)

    render(<Harness onAddressSelect={vi.fn()} />)

    expect(
      screen.queryByLabelText(/use saved address/i)
    ).not.toBeInTheDocument()
  })
})
