export const permissions = {
    admin: {
        dashboard: ['view'],
        policies: ['view', 'create', 'update', 'delete'],
        agents: ['view', 'create', 'update', 'delete'],
        customers: ['view', 'update'],
        claims: ['view'],
        contracts: ['view'],
        reimbursements: ['view'],
    },

    agent: {
        dashboard: ['view'],
        policies: ['view'],
        agents: [],
        customers: ['view', 'create', 'update', 'delete'],
        claims: ['view', 'update', 'delete'],
        contracts: ['view', 'create', 'update', 'delete'],
        reimbursements: ['view', 'create', 'update', 'delete'],
    },

    customer: {
        dashboard: ['view'],
        policies: ['view'],
        agents: [],
        customers: ['view', 'update'],
        claims: ['view', 'create', 'update'],
        contracts: ['view'],
        reimbursements: ['view'],
    },
};


export const can = (role, resource, action) => {
    return permissions[role]?.[resource]?.includes(action) ?? false;
};

