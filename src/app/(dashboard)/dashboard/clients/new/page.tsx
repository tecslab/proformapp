import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
    return (
        <div className="max-w-4xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Add New Client</h1>
            <ClientForm />
        </div>
    )
}
