import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { ProformaForm } from './proforma-form'
import { createProforma, updateProforma, getNextProformaNumber } from '@/lib/actions/proformas'
import { useRouter } from 'next/navigation'
import userEvent from '@testing-library/user-event'

// --- MOCKS ---

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

// Mock Server Actions
jest.mock('@/lib/actions/proformas', () => ({
    createProforma: jest.fn().mockResolvedValue({ error: null, data: { id: 'proforma-123' } }),
    updateProforma: jest.fn().mockResolvedValue({ error: null, data: { id: 'proforma-123' } }),
    getNextProformaNumber: jest.fn().mockResolvedValue('PF-2024-001'),
}))

const MOCK_CLIENT_ID = '123e4567-e89b-12d3-a456-426614174000'

// Mock ClientSelector because Radix UI Select is hard to start with, 
// and we want to focus on the Proforma logic here.
// Mock ClientSelector to simulate selection
jest.mock('@/components/clients/client-selector', () => ({
    ClientSelector: ({ value, onChange, error }: any) => (
        <div data-testid="client-selector">
            <button
                type="button"
                data-testid="client-select-btn"
                onClick={() => onChange(MOCK_CLIENT_ID)}
            >
                Select Client
            </button>
            <div data-testid="selected-client-value">{value}</div>
            {error && <span className="text-red-500">{error}</span>}
        </div>
    )
}))

describe('ProformaForm', () => {
    const mockRouter = {
        back: jest.fn(),
        push: jest.fn(),
        refresh: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter);
        (getNextProformaNumber as jest.Mock).mockResolvedValue(1001); // Default next number
    })

    it('renders form with default values and fetches next number', async () => {
        render(<ProformaForm />)

        // Header check - Label "Client" and Button "Select Client"
        expect(screen.getAllByText(/Client/i).length).toBeGreaterThanOrEqual(2)

        // Check if next number is fetched and displayed
        await waitFor(() => {
            expect(screen.getByText('001001')).toBeInTheDocument() // padStart(6, '0') for 1001
        })

        // Check Items table exists with 1 empty row
        expect(screen.getByText('Items')).toBeInTheDocument()
        expect(screen.getAllByRole('row')).toHaveLength(2) // Header + 1 Item
    })

    it('calculates totals correctly when item values change', async () => {
        render(<ProformaForm />)

        const user = userEvent.setup()

        // Inputs are in the table. We need to find them carefully.
        // Row 1: Qty, Unit, Desc, Cost, Gain
        const rows = screen.getAllByRole('row')
        const row1 = rows[1] // 0 is header

        // Find inputs within the row
        const inputs = within(row1).getAllByRole('spinbutton') // number inputs
        const qtyInput = inputs[0] // quantity
        const costInput = inputs[1] // cost
        const gainInput = inputs[2] // percentage_gain

        // 1. Enter Cost = 100
        await user.clear(costInput)
        await user.type(costInput, '100')

        // 2. Enter Gain = 20 (Price becomes 120)
        await user.clear(gainInput)
        await user.type(gainInput, '20')

        // 3. Enter Qty = 2 (Total becomes 240)
        await user.clear(qtyInput)
        await user.type(qtyInput, '2')

        // Wait for calculations to update (React state updates)
        // Subtotal should be 240
        await waitFor(() => {
            // It appears in the row total AND the subtotal card.
            // We can check that at least one exists, or check both.
            const prices = screen.getAllByText('$240.00')
            expect(prices.length).toBeGreaterThanOrEqual(1)
            // Optionally ensure one is in the row
            expect(within(row1).getByText('$240.00')).toBeInTheDocument()
        }, { timeout: 3000 })

        // Check IVA (default 15%) => 240 * 0.15 = 36
        expect(screen.getByText('$36.00')).toBeInTheDocument()

        // Check Total => 240 + 36 = 276
        // We look for the bold Total line
        const totalContainer = screen.getByText(/Total:/).closest('div')
        expect(within(totalContainer!).getByText('$276.00')).toBeInTheDocument()
    })

    it('allows adding and removing items', async () => {
        render(<ProformaForm />)
        const user = userEvent.setup()

        // Add Item
        await user.click(screen.getByText('Add Item'))

        // Should have 3 rows now (Header + 2 items)
        expect(screen.getAllByRole('row')).toHaveLength(3)

        // Remove the second item
        const lastRow = screen.getAllByRole('row')[2]
        const deleteButton = within(lastRow).getByRole('button')
        await user.click(deleteButton)

        // Should be back to 2 rows
        expect(screen.getAllByRole('row')).toHaveLength(2)
    })

    it('submits valid data to createProforma', async () => {
        (createProforma as jest.Mock).mockResolvedValue({ error: null })
        render(<ProformaForm />)
        const user = userEvent.setup()

        // 1. Select Client
        // Use fireEvent for the mock button to be safe regarding event propagation
        fireEvent.click(screen.getByTestId('client-select-btn'))

        // Verify it updated
        await waitFor(() => {
            expect(screen.getByTestId('selected-client-value')).toHaveTextContent(MOCK_CLIENT_ID)
        })

        // 2. Fill Item
        // Helper to get input by name
        const inputByName = (name: string) => document.querySelector(`input[name="${name}"]`) as HTMLInputElement

        const qty = inputByName('items.0.quantity')
        const desc = inputByName('items.0.description')
        const cost = inputByName('items.0.unit_cost')

        await user.clear(qty)
        await user.type(qty, '2')

        await user.type(desc, 'Test Item')

        await user.clear(cost)
        await user.type(cost, '100')

        // 3. Submit
        const form = document.querySelector('form')!
        fireEvent.submit(form)

        await waitFor(() => {
            expect(createProforma).toHaveBeenCalledWith(expect.objectContaining({
                client_id: MOCK_CLIENT_ID,
                items: expect.arrayContaining([
                    expect.objectContaining({
                        quantity: 2,
                        description: 'Test Item',
                        unit_cost: 100
                    })
                ])
            }))
        })
    })

    it('validates required fields', async () => {
        render(<ProformaForm />)

        // Simulating submit directly to avoid potential button click interference
        const form = document.querySelector('form')!
        fireEvent.submit(form)

        await waitFor(() => {
            // Client is required
            expect(screen.getByText('Please select a client')).toBeInTheDocument()
        })

        expect(createProforma).not.toHaveBeenCalled()
    })
})
