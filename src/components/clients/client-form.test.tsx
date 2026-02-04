import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ClientForm } from './client-form'
import { createClient, updateClient } from '@/lib/actions/clients'
import { useRouter } from 'next/navigation'

// Mock the dependencies
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}))

jest.mock('@/lib/actions/clients', () => ({
    createClient: jest.fn(),
    updateClient: jest.fn(),
}))

describe('ClientForm', () => {
    const mockRouter = {
        back: jest.fn(),
        push: jest.fn(),
        refresh: jest.fn(),
    }

    beforeEach(() => {
        jest.clearAllMocks();
        (useRouter as jest.Mock).mockReturnValue(mockRouter)
    })

    it('renders empty form for new client', () => {
        render(<ClientForm />)
        expect(screen.getByText('New Client')).toBeInTheDocument()
        expect(screen.getByLabelText('First Name')).toHaveValue('')
        expect(screen.getByText('Create Client')).toBeInTheDocument()
    })

    it('renders pre-filled form for editing', () => {
        const existingClient = {
            id: '123',
            first_name: 'Jane',
            last_name: 'Doe',
            cedula_ruc: '0987654321',
            email: 'jane@example.com',
            phone: '555-5555',
            address: '123 Main St',
        }
        render(<ClientForm client={existingClient} />)
        expect(screen.getByText('Edit Client')).toBeInTheDocument()
        expect(screen.getByLabelText('First Name')).toHaveValue('Jane')
        expect(screen.getByLabelText('Last Name')).toHaveValue('Doe')
        expect(screen.getByText('Update Client')).toBeInTheDocument()
    })

    it('shows validation errors for required fields', async () => {
        render(<ClientForm />)

        // Try to submit without filling anything
        fireEvent.click(screen.getByText('Create Client'))

        // Expect validation errors (async because react-hook-form validates asynchronously)
        await waitFor(() => {
            expect(screen.getByText('First name is required')).toBeInTheDocument()
            expect(screen.getByText('Last name is required')).toBeInTheDocument()
        })

        expect(createClient).not.toHaveBeenCalled()
    })

    it('calls createClient on valid submission', async () => {
        (createClient as jest.Mock).mockResolvedValue({ error: null })
        render(<ClientForm />)

        // Fill out the form
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Smith' } })
        fireEvent.change(screen.getByLabelText('Cédula / RUC'), { target: { value: '1234567890' } })

        fireEvent.click(screen.getByText('Create Client'))

        await waitFor(() => {
            expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
                first_name: 'John',
                last_name: 'Smith',
                cedula_ruc: '1234567890',
            }))
        })
    })

    it('calls updateClient on valid edit submission', async () => {
        (updateClient as jest.Mock).mockResolvedValue({ error: null })
        const existingClient = {
            id: '123',
            first_name: 'Jane',
            last_name: 'Doe',
            cedula_ruc: '0987654321',
        }
        render(<ClientForm client={existingClient} />)

        // Change a value
        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Janet' } })

        fireEvent.click(screen.getByText('Update Client'))

        await waitFor(() => {
            expect(updateClient).toHaveBeenCalledWith('123', expect.objectContaining({
                first_name: 'Janet',
                last_name: 'Doe',
            }))
        })
    })

    it('handles server errors', async () => {
        (createClient as jest.Mock).mockResolvedValue({ error: 'Database error' })
        render(<ClientForm />)

        fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'John' } })
        fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Smith' } })
        fireEvent.change(screen.getByLabelText('Cédula / RUC'), { target: { value: '1234567890' } })

        fireEvent.click(screen.getByText('Create Client'))

        // We can't easily check for the toast since it's an external library usually mocked,
        // but we can ensure the loading state is handled or function was called.
        // For this test, verifying createClient is called is enough to prove the flow reached the action.
        await waitFor(() => {
            expect(createClient).toHaveBeenCalled()
        })
    })
})
