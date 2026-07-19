export type DeliveryMethod = "pickup" | "domicilio"

export type PaymentMethod = "escudo_pago" | "pago_directo"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"

export type ProductStatus = "available" | "solicitado" | "reservado" | "vendido"

export type UserRole = "admin" | "customer"

// ---------------------------------------------------------------------------
// Tipos migrados desde modelos Django (importar desde database.ts para el resto)
// ---------------------------------------------------------------------------
export type {
  OrderStatus as DbOrderStatus,
  TransactionStatus,
  QRType,
  LiveSessionStatus,
  LiveProductStatus,
  ProductInterestAction,
} from './database'

export type {
  ProfilesTable,
  AddressesTable,
  CategoriesTable,
  ProductsTable,
  ProductImagesTable,
  OrdersTable,
  OrderItemsTable,
  TransactionsTable,
  PaymentMethodsTable,
  QRPaymentsTable,
  ReviewsTable,
  ReviewImagesTable,
  StoreProfilesTable,
  LiveSessionsTable,
  LiveSessionProductsTable,
  LiveProductsTable,
  ProductInterestsTable,
  Database,
} from './database'
