export const APP_CONFIG = Object.freeze({
  dbKey: 'parcialCompraDB_v2',
  sessionKey: 'parcialCompraSession_v2',
  roles: Object.freeze(['Admin', 'Cliente']),
  statuses: Object.freeze(['Pendiente', 'Activo']),
  pages: Object.freeze({
    public: ['login', 'register'],
    adminOnly: ['clients', 'users', 'products']
  }),
  limits: Object.freeze({
    nameMin: 2,
    nameMax: 60,
    descriptionMin: 5,
    descriptionMax: 500,
    emailMax: 120,
    passwordMin: 8,
    passwordMax: 128,
    priceMax: 999999999,
    stockMax: 1000000,
    quantityMax: 1000000
  })
});
