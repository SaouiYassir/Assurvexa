import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CircleAlert } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';
import { can } from '../../services/permissions';
import './profile.css';

const personalFields = [
    { name: 'first_name', label: 'First name', maxLength: 255, autoComplete: 'given-name' },
    { name: 'last_name', label: 'Last name', maxLength: 255, autoComplete: 'family-name' },
    { name: 'username', label: 'Username', maxLength: 255, autoComplete: 'username' },
    { name: 'CIN', label: 'National ID (CIN)', maxLength: 50 },
];

const contactFields = [
    { name: 'email', label: 'Email address', type: 'email', maxLength: 255, autoComplete: 'email' },
    { name: 'phone', label: 'Phone number', type: 'tel', maxLength: 20, autoComplete: 'tel' },
];

function getProfileValues(user, fields, details = {}) {
    return Object.fromEntries(fields.map(({ name }) => [name, details[name] ?? user[name] ?? '']));
}

function ProfileForm({ profile, record, endpoint, resource, onSaved }) {
    const personal = [...personalFields];
    const contact = [...contactFields];
    const details = {};
    const address = resource === 'customers' ? record : profile.customer;

    if (address) {
        contact.push({ name: 'adresse', label: 'Address', maxLength: 255, autoComplete: 'street-address', wide: true });
        details.adresse = address.adresse;
    }
    if (resource === 'agents') {
        personal.push({ name: 'date_integration', label: 'Integration date', type: 'date' });
        details.date_integration = record.date_integration?.slice(0, 10);
    }

    const fields = [...personal, ...contact];
    const [initialValues, setInitialValues] = useState(() => getProfileValues(profile, fields, details));
    const [values, setValues] = useState(initialValues);
    const [validationErrors, setValidationErrors] = useState({});
    const [feedback, setFeedback] = useState(null);
    const [saving, setSaving] = useState(false);
    const changes = Object.fromEntries(Object.entries(values).filter(([name, value]) => value !== initialValues[name]));
    const hasChanges = Object.keys(changes).length > 0;
    const groups = [
        { label: 'Personal information', fields: personal },
        { label: 'Contact information', fields: contact },
    ];

    async function save(event) {
        event.preventDefault();
        if (saving || !hasChanges) return;

        setSaving(true);
        setValidationErrors({});
        setFeedback(null);

        try {
            const { data } = resource
                ? await api.put(endpoint, changes)
                : await api.patch('/me', changes);
            const saved = data.data ?? data.user;
            const savedProfile = resource ? saved.user : saved;
            const savedDetails = {
                adresse: resource === 'customers' ? saved.adresse : savedProfile.customer?.adresse,
                date_integration: saved.date_integration?.slice(0, 10),
            };
            const savedValues = getProfileValues(savedProfile, fields, savedDetails);
            setInitialValues(savedValues);
            setValues(savedValues);
            onSaved(savedProfile, data.data);
            setFeedback({ message: 'Profile updated successfully.' });
        } catch (error) {
            setValidationErrors(error.response?.data?.errors ?? {});
            setFeedback({ error: true, message: error.response?.data?.message ?? 'Could not save the profile. Try again.' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form className="dashboard-panel profile-form" onSubmit={save}>
            <div className="profile-form__body">
                {groups.map(group => (
                    <fieldset key={group.label} disabled={saving} className="profile-form__group">
                        <legend>{group.label}</legend>
                        <div className="profile-form__fields">
                            {group.fields.map(({ name, label, type = 'text', maxLength, autoComplete, wide }) => (
                                <div key={name} className={wide ? 'profile-form__field profile-form__field--wide' : 'profile-form__field'}>
                                    <label htmlFor={`profile-${name}`}>{label}</label>
                                    <input
                                        className="form-control"
                                        id={`profile-${name}`}
                                        name={name}
                                        type={type}
                                        value={values[name]}
                                        maxLength={maxLength}
                                        autoComplete={autoComplete}
                                        required
                                        aria-invalid={Boolean(validationErrors[name])}
                                        aria-describedby={validationErrors[name] ? `profile-error-${name}` : undefined}
                                        onChange={event => {
                                            setValues({ ...values, [name]: event.target.value });
                                            setFeedback(null);
                                        }}
                                    />
                                    {validationErrors[name] && (
                                        <p id={`profile-error-${name}`} className="profile-error">{validationErrors[name][0]}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                ))}
            </div>
            <div className="profile-form__actions">
                {feedback && (
                    <p role={feedback.error ? 'alert' : 'status'} className={`profile-feedback${feedback.error ? ' profile-error' : ''}`}>
                        {feedback.error ? <CircleAlert size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}
                        {feedback.message}
                    </p>
                )}
                <button type="submit" className="btn btn-primary" disabled={saving || !hasChanges}>
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
            </div>
        </form>
    );
}

function ProfilePage({ resource, id }) {
    const { user, updateSessionProfile } = useAuth();
    const [record, setRecord] = useState(null);
    const [error, setError] = useState('');
    const endpoint = resource && can(user.role, resource, 'update')
        ? `/${resource}/${encodeURIComponent(id)}`
        : null;

    useEffect(() => {
        if (!endpoint) return;

        const controller = new AbortController();
        api.get(endpoint, { signal: controller.signal })
            .then(({ data }) => {
                if (!controller.signal.aborted) setRecord(data.data);
            })
            .catch(requestError => {
                if (!controller.signal.aborted) {
                    setError(requestError.response?.data?.message ?? 'Could not load this profile.');
                }
            });
        return () => controller.abort();
    }, [endpoint]);

    const profile = resource ? record?.user : user;
    const nameParts = [profile?.first_name, profile?.last_name].filter(Boolean);
    const profileName = nameParts.join(' ') || profile?.username;
    const initials = nameParts.map(name => Array.from(name)[0]).join('').toUpperCase();

    function syncProfile(savedProfile, savedRecord) {
        if (resource) setRecord(savedRecord);
        if (savedProfile.id !== user.id) return;

        updateSessionProfile(resource === 'customers'
            ? { ...savedProfile, customer: { ...user.customer, adresse: savedRecord.adresse } }
            : savedProfile);
    }

    return (
        <section className="dashboard-page profile-page">
            <header className="dashboard-page-header">
                <h1>{resource ? profileName || 'User profile' : 'My profile'}</h1>
                {resource && (
                    <Link className="btn btn-secondary" to={`/dashboard/${resource}`}>
                        <ArrowLeft size={16} aria-hidden="true" />
                        {resource === 'agents' ? 'Back to agents' : 'Back to customers'}
                    </Link>
                )}
            </header>
            {resource && !endpoint ? (
                <p role="alert">You do not have permission to edit this profile.</p>
            ) : error ? (
                <p role="alert">{error}</p>
            ) : profile ? (
                <>
                    {!resource && (
                        <div className="profile-identity">
                            <span className="profile-identity__avatar" aria-hidden="true">{initials || '?'}</span>
                            <div className="profile-identity__details">
                                <p className="profile-identity__name">{profileName}</p>
                                <p className="profile-identity__role">{profile.role}</p>
                            </div>
                        </div>
                    )}
                    <ProfileForm profile={profile} record={record} endpoint={endpoint} resource={resource} onSaved={syncProfile} />
                </>
            ) : (
                <p role="status">Loading profile…</p>
            )}
        </section>
    );
}

export default function Profile({ resource }) {
    const { id } = useParams();
    return <ProfilePage key={resource ? `${resource}/${id}` : 'me'} resource={resource} id={id} />;
}
