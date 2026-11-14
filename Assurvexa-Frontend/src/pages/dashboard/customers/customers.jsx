import api from "../../../services/api";
import { useCallback, useEffect, useState } from "react";
import "./customers.css";

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [modal, setModal] = useState(null);

    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        CIN: '',
        adresse: ''
    });
    const [validationErrors, setValidationErrors] = useState({});

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = modal ? 'hidden' : '';

        return () => {
            document.body.style.overflow = '';
        };
    }, [modal]);

    // FETCH CUSTOMERS
    const getCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/customers');

            const data =
                response.data?.data?.data ??
                response.data?.data ??
                response.data;

            setCustomers(Array.isArray(data) ? data : []);

        } catch (err) {
            console.error('Failed to fetch customers:', err);
            setError('Could not load customers data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getCustomers();
    }, [getCustomers]);

    // CLOSE MODAL
    const closeModal = () => {
        if (submitting) return;

        setModal(null);
        setSelectedCustomer(null);
        setError('');
        setValidationErrors({});
    };

    // OPEN DELETE MODAL
    const openDeleteModal = (customer) => {
        setSelectedCustomer(customer);
        setError('');
        setSuccess('');
        setModal('delete');
    };

    // OPEN MODIFY MODAL
    const openModifyModel = (customer) => {
        setSelectedCustomer(customer);

        setEditForm({
            first_name: customer.user?.first_name || '',
            last_name: customer.user?.last_name || '',
            username: customer.user?.username || '',
            email: customer.user?.email || '',
            phone: customer.user?.phone || '',
            CIN: customer.user?.CIN || '',
            adresse: customer.adresse || customer.address || ''
        });

        setError('');
        setSuccess('');
        setValidationErrors({});

        setModal('modify');
    };

    // HANDLE EDIT FORM CHANGES
    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear the error for the modified field
        setValidationErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    // UPDATE CUSTOMER
    const updateCustomer = async (e) => {
        e.preventDefault();

        if (!selectedCustomer) return;

        try {
            setSubmitting(true);
            setError('');
            setValidationErrors({});

            await api.put(
                `/customers/${selectedCustomer.id}`,
                editForm
            );

            setModal(null);
            setSelectedCustomer(null);

            await getCustomers();

            setSuccess('Customer updated successfully.');

        } catch (err) {
            console.error('Failed to update customer:', err);

            if (err.response?.status === 422) {
                setValidationErrors(err.response.data.errors || {});
                setError('Please correct the validation errors.');
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not update customer.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    // DELETE CUSTOMER
    const deleteCustomer = async () => {
        if (!selectedCustomer) return;

        try {
            setSubmitting(true);
            setError('');

            await api.delete(`/customers/${selectedCustomer.id}`);

            setModal(null);
            setSelectedCustomer(null);

            await getCustomers();

            setSuccess('Customer deleted successfully.');

        } catch (err) {
            console.error('Failed to delete customer:', err);

            if (err.response?.status === 409) {
                setError(err.response.data.message || 'Customer deletion is not enabled.');
            } else {
                setError(
                    err.response?.data?.message ||
                    'Could not delete customer.'
                );
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className="customersSection" id="customers-section">

            {/* HEADER */}
            <div className="customers-header">
                <div>
                    <h1>Customers Management</h1>
                    <p>Manage and view your registered customers.</p>
                </div>
            </div>

            {/* FEEDBACK */}
            {!modal && error && (
                <div className="customers-alert error" role="alert">
                    {error}
                </div>
            )}

            {success && (
                <div className="customers-alert success" role="status">
                    {success}
                </div>
            )}

            {/* CUSTOMERS TABLE */}
            <div className="table-responsive">
                <table className="table-customers">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th className="text-center">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    Loading customers...
                                </td>
                            </tr>
                        ) : customers.length > 0 ? (
                            customers.map(customer => (
                                <tr key={customer.id}>
                                    <td>#{customer.id}</td>

                                    <td>
                                        {customer.user?.first_name}{' '}
                                        {customer.user?.last_name}
                                    </td>

                                    <td>
                                        {customer.user?.email || 'N/A'}
                                    </td>

                                    <td>
                                        {customer.user?.phone || 'N/A'}
                                    </td>

                                    <td className="customer-address">
                                        {customer.adresse ||
                                            customer.address ||
                                            'N/A'}
                                    </td>

                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                type="button"
                                                className="btn-icon btn-modify"
                                                onClick={() => openModifyModel(customer)}
                                            >
                                                Modify
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-icon btn-delete"
                                                onClick={() => openDeleteModal(customer)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    No customers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {modal === 'delete' && (
                <div
                    className="customer-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="customer-modal delete-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="customer-modal-header">
                            <div>
                                <h2>Delete Customer</h2>

                                <p>
                                    Are you sure you want to delete this customer?
                                    This action cannot be undone.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>

                        {selectedCustomer && (
                            <p className="delete-customer-name">
                                {selectedCustomer.user?.first_name}{' '}
                                {selectedCustomer.user?.last_name}
                            </p>
                        )}

                        {error && (
                            <div className="customers-alert error">
                                {error}
                            </div>
                        )}

                        <div className="customer-modal-actions">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={closeModal}
                                disabled={submitting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn-delete-confirm"
                                onClick={deleteCustomer}
                                disabled={submitting}
                            >
                                {submitting ? 'Deleting...' : 'Delete Customer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODIFY CUSTOMER MODAL */}
            {modal === 'modify' && (
                <div
                    className="customer-modal-overlay"
                    onClick={closeModal}
                >
                    <div
                        className="customer-modal modify-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* HEADER */}
                        <div className="customer-modal-header">
                            <div>
                                <h2>Modify Customer</h2>
                                <p>
                                    Update the customer's personal information.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="modal-close"
                                onClick={closeModal}
                                disabled={submitting}
                                aria-label="Close modal"
                            >
                                &times;
                            </button>
                        </div>

                        {/* FORM */}
                        <form onSubmit={updateCustomer}>

                            <div className="customer-form-grid">

                                {/* FIRST NAME */}
                                <div className="form-group">
                                    <label htmlFor="first_name">First Name</label>
                                    <input
                                        id="first_name"
                                        type="text"
                                        name="first_name"
                                        value={editForm.first_name}
                                        onChange={handleEditChange}
                                        required
                                    />
                                    {validationErrors.first_name && (
                                        <span className="field-error">
                                            {validationErrors.first_name[0]}
                                        </span>
                                    )}
                                </div>

                                {/* LAST NAME */}
                                <div className="form-group">
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        id="last_name"
                                        type="text"
                                        name="last_name"
                                        value={editForm.last_name}
                                        onChange={handleEditChange}
                                        required
                                    />
                                    {validationErrors.last_name && (
                                        <span className="field-error">
                                            {validationErrors.last_name[0]}
                                        </span>
                                    )}
                                </div>

                                {/* USERNAME */}
                                <div className="form-group">
                                    <label htmlFor="username">Username</label>
                                    <input
                                        id="username"
                                        type="text"
                                        name="username"
                                        value={editForm.username}
                                        onChange={handleEditChange}
                                        required
                                    />
                                    {validationErrors.username && (
                                        <span className="field-error">
                                            {validationErrors.username[0]}
                                        </span>
                                    )}
                                </div>

                                {/* EMAIL */}
                                <div className="form-group">
                                    <label htmlFor="email">Email</label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={editForm.email}
                                        onChange={handleEditChange}
                                        required
                                    />
                                    {validationErrors.email && (
                                        <span className="field-error">
                                            {validationErrors.email[0]}
                                        </span>
                                    )}
                                </div>

                                {/* PHONE */}
                                <div className="form-group">
                                    <label htmlFor="phone">Phone</label>
                                    <input
                                        id="phone"
                                        type="text"
                                        name="phone"
                                        value={editForm.phone}
                                        onChange={handleEditChange}
                                    />
                                    {validationErrors.phone && (
                                        <span className="field-error">
                                            {validationErrors.phone[0]}
                                        </span>
                                    )}
                                </div>

                                {/* CIN */}
                                <div className="form-group">
                                    <label htmlFor="CIN">CIN</label>
                                    <input
                                        id="CIN"
                                        type="text"
                                        name="CIN"
                                        value={editForm.CIN}
                                        onChange={handleEditChange}
                                    />
                                    {validationErrors.CIN && (
                                        <span className="field-error">
                                            {validationErrors.CIN[0]}
                                        </span>
                                    )}
                                </div>

                                {/* ADDRESS */}
                                <div className="form-group full-width">
                                    <label htmlFor="adresse">Address</label>
                                    <textarea
                                        id="adresse"
                                        name="adresse"
                                        rows="3"
                                        value={editForm.adresse}
                                        onChange={handleEditChange}
                                    />
                                    {validationErrors.adresse && (
                                        <span className="field-error">
                                            {validationErrors.adresse[0]}
                                        </span>
                                    )}
                                </div>

                            </div>

                            {error && (
                                <div className="customers-alert error" role="alert">
                                    {error}
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="customer-modal-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="btn-modify-confirm"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </section>
    );
}

export default Customers;
