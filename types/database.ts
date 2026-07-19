export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ---------------------------------------------------------------------------
// Enums (Django TextChoices → union types)
// ---------------------------------------------------------------------------
export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'

export type TransactionStatus =
  | 'held'
  | 'released'
  | 'refunded'
  | 'cancelled'

export type QRType =
  | 'escudo'
  | 'direct'

export type LiveSessionStatus =
  | 'not_started'
  | 'live'
  | 'paused'
  | 'ended'

export type LiveProductStatus =
  | 'available'
  | 'requested'
  | 'reserved'
  | 'sold'

export type ProductInterestAction =
  | 'whatsapp'
  | 'view'
  | 'add_cart'
  | 'checkout'

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------
export interface ProfilesTable {
  Row: {
    id: string
    phone: string
    avatar: string | null
    nombre: string
    role: string
    is_verified: boolean
    email_verified: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id: string
    phone?: string
    avatar?: string | null
    nombre?: string
    role?: string
    is_verified?: boolean
    email_verified?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    phone?: string
    avatar?: string | null
    nombre?: string
    role?: string
    is_verified?: boolean
    email_verified?: boolean
    created_at?: string
    updated_at?: string
  }
}

export interface AddressesTable {
  Row: {
    id: number
    userId: string
    name: string
    phone: string
    street: string
    colony: string
    city: string
    state: string
    zipCode: string
    references: string
    isDefault: boolean
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    userId: string
    name: string
    phone: string
    street: string
    colony: string
    city: string
    state: string
    zipCode: string
    references?: string
    isDefault?: boolean
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    userId?: string
    name?: string
    phone?: string
    street?: string
    colony?: string
    city?: string
    state?: string
    zipCode?: string
    references?: string
    isDefault?: boolean
    createdAt?: string
    updatedAt?: string
  }
}

export interface CategoriesTable {
  Row: {
    id: number
    name: string
    slug: string
    description: string
    image: string | null
    icon: string
    isActive: boolean
    order: number
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    name: string
    slug: string
    description?: string
    image?: string | null
    icon?: string
    isActive?: boolean
    order?: number
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    name?: string
    slug?: string
    description?: string
    image?: string | null
    icon?: string
    isActive?: boolean
    order?: number
    createdAt?: string
    updatedAt?: string
  }
}

export interface ProductsTable {
  Row: {
    id: number
    name: string
    slug: string
    sku: string
    categoryId: number
    price: number
    discountPrice: number | null
    stock: number
    shortDescription: string
    longDescription: string
    specifications: Json
    isActive: boolean
    isFeatured: boolean
    isNew: boolean
    rating: number
    ratingCount: number
    salesCount: number
    metaDescription: string
    metaKeywords: string
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    name: string
    slug: string
    sku: string
    categoryId: number
    price: number
    discountPrice?: number | null
    stock?: number
    shortDescription?: string
    longDescription?: string
    specifications?: Json
    isActive?: boolean
    isFeatured?: boolean
    isNew?: boolean
    rating?: number
    ratingCount?: number
    salesCount?: number
    metaDescription?: string
    metaKeywords?: string
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    name?: string
    slug?: string
    sku?: string
    categoryId?: number
    price?: number
    discountPrice?: number | null
    stock?: number
    shortDescription?: string
    longDescription?: string
    specifications?: Json
    isActive?: boolean
    isFeatured?: boolean
    isNew?: boolean
    rating?: number
    ratingCount?: number
    salesCount?: number
    metaDescription?: string
    metaKeywords?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface ProductImagesTable {
  Row: {
    id: number
    productId: number
    image: string
    altText: string
    isMain: boolean
    order: number
    createdAt: string
  }
  Insert: {
    id?: number
    productId: number
    image: string
    altText?: string
    isMain?: boolean
    order?: number
    createdAt?: string
  }
  Update: {
    id?: number
    productId?: number
    image?: string
    altText?: string
    isMain?: boolean
    order?: number
    createdAt?: string
  }
}

export interface OrdersTable {
  Row: {
    id: number
    userId: string | null
    sessionKey: string | null
    orderNumber: string
    status: OrderStatus
    subtotal: number
    shippingCost: number
    discount: number
    total: number
    shippingAddress: Json | null
    notes: string
    isPaid: boolean
    paidAt: string | null
    paymentMethod: string
    deliveryLatitude: number | null
    deliveryLongitude: number | null
    deliveryAddressText: string
    deliveryReference: string
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    userId?: string | null
    sessionKey?: string | null
    orderNumber: string
    status?: OrderStatus
    subtotal: number
    shippingCost?: number
    discount?: number
    total: number
    shippingAddress?: Json | null
    notes?: string
    isPaid?: boolean
    paidAt?: string | null
    paymentMethod?: string
    deliveryLatitude?: number | null
    deliveryLongitude?: number | null
    deliveryAddressText?: string
    deliveryReference?: string
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    userId?: string | null
    sessionKey?: string | null
    orderNumber?: string
    status?: OrderStatus
    subtotal?: number
    shippingCost?: number
    discount?: number
    total?: number
    shippingAddress?: Json | null
    notes?: string
    isPaid?: boolean
    paidAt?: string | null
    paymentMethod?: string
    deliveryLatitude?: number | null
    deliveryLongitude?: number | null
    deliveryAddressText?: string
    deliveryReference?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface OrderItemsTable {
  Row: {
    id: number
    orderId: number
    productId: number | null
    productName: string
    productSku: string
    productImage: string
    quantity: number
    price: number
    subtotal: number
    createdAt: string
  }
  Insert: {
    id?: number
    orderId: number
    productId?: number | null
    productName: string
    productSku: string
    productImage?: string
    quantity: number
    price: number
    subtotal: number
    createdAt?: string
  }
  Update: {
    id?: number
    orderId?: number
    productId?: number | null
    productName?: string
    productSku?: string
    productImage?: string
    quantity?: number
    price?: number
    subtotal?: number
    createdAt?: string
  }
}

export interface TransactionsTable {
  Row: {
    id: number
    orderId: number
    userId: string | null
    amount: number
    status: TransactionStatus
    paymentMethod: string
    transactionId: string
    heldAt: string
    releasedAt: string | null
    notes: string
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    orderId: number
    userId?: string | null
    amount: number
    status?: TransactionStatus
    paymentMethod?: string
    transactionId?: string
    heldAt?: string
    releasedAt?: string | null
    notes?: string
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    orderId?: number
    userId?: string | null
    amount?: number
    status?: TransactionStatus
    paymentMethod?: string
    transactionId?: string
    heldAt?: string
    releasedAt?: string | null
    notes?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface PaymentMethodsTable {
  Row: {
    id: number
    name: string
    code: string
    description: string
    icon: string
    isActive: boolean
    order: number
    config: Json
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    name: string
    code: string
    description?: string
    icon?: string
    isActive?: boolean
    order?: number
    config?: Json
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    name?: string
    code?: string
    description?: string
    icon?: string
    isActive?: boolean
    order?: number
    config?: Json
    createdAt?: string
    updatedAt?: string
  }
}

export interface QRPaymentsTable {
  Row: {
    id: number
    paymentMethodId: number
    qrType: QRType
    qrImage: string | null
    qrCode: string
    accountName: string
    accountNumber: string
    bankName: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    paymentMethodId: number
    qrType: QRType
    qrImage?: string | null
    qrCode?: string
    accountName?: string
    accountNumber?: string
    bankName?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    paymentMethodId?: number
    qrType?: QRType
    qrImage?: string | null
    qrCode?: string
    accountName?: string
    accountNumber?: string
    bankName?: string
    isActive?: boolean
    createdAt?: string
    updatedAt?: string
  }
}

export interface ReviewsTable {
  Row: {
    id: number
    productId: number
    userId: string | null
    sessionKey: string | null
    title: string
    content: string
    rating: number
    isVerified: boolean
    isApproved: boolean
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    productId: number
    userId?: string | null
    sessionKey?: string | null
    title?: string
    content?: string
    rating: number
    isVerified?: boolean
    isApproved?: boolean
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    productId?: number
    userId?: string | null
    sessionKey?: string | null
    title?: string
    content?: string
    rating?: number
    isVerified?: boolean
    isApproved?: boolean
    createdAt?: string
    updatedAt?: string
  }
}

export interface ReviewImagesTable {
  Row: {
    id: number
    reviewId: number
    image: string
    createdAt: string
  }
  Insert: {
    id?: number
    reviewId: number
    image: string
    createdAt?: string
  }
  Update: {
    id?: number
    reviewId?: number
    image?: string
    createdAt?: string
  }
}

export interface StoreProfilesTable {
  Row: {
    id: number
    name: string
    logo: string | null
    banner: string | null
    followers: number
    likes: number
    rating: number
    reviewsCount: number
    customersServed: number
    qrCode: string | null
    accountName: string
    accountNumber: string
    bankName: string
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    name?: string
    logo?: string | null
    banner?: string | null
    followers?: number
    likes?: number
    rating?: number
    reviewsCount?: number
    customersServed?: number
    qrCode?: string | null
    accountName?: string
    accountNumber?: string
    bankName?: string
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    name?: string
    logo?: string | null
    banner?: string | null
    followers?: number
    likes?: number
    rating?: number
    reviewsCount?: number
    customersServed?: number
    qrCode?: string | null
    accountName?: string
    accountNumber?: string
    bankName?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface LiveSessionsTable {
  Row: {
    id: number
    storeId: number | null
    title: string
    status: LiveSessionStatus
    startedAt: string | null
    endedAt: string | null
    duration: string | null
    currentProductId: number | null
    totalProductsShown: number
    totalProductsSold: number
    totalReserved: number
    totalInterested: number
    totalLikes: number
    totalFollowers: number
    notes: string
    createdAt: string
    updatedAt: string
  }
  Insert: {
    id?: number
    storeId?: number | null
    title: string
    status?: LiveSessionStatus
    startedAt?: string | null
    endedAt?: string | null
    duration?: string | null
    currentProductId?: number | null
    totalProductsShown?: number
    totalProductsSold?: number
    totalReserved?: number
    totalInterested?: number
    totalLikes?: number
    totalFollowers?: number
    notes?: string
    createdAt?: string
    updatedAt?: string
  }
  Update: {
    id?: number
    storeId?: number | null
    title?: string
    status?: LiveSessionStatus
    startedAt?: string | null
    endedAt?: string | null
    duration?: string | null
    currentProductId?: number | null
    totalProductsShown?: number
    totalProductsSold?: number
    totalReserved?: number
    totalInterested?: number
    totalLikes?: number
    totalFollowers?: number
    notes?: string
    createdAt?: string
    updatedAt?: string
  }
}

export interface LiveSessionProductsTable {
  Row: {
    liveSessionId: number
    productId: number
  }
  Insert: {
    liveSessionId: number
    productId: number
  }
  Update: {
    liveSessionId?: number
    productId?: number
  }
}

export interface LiveProductsTable {
  Row: {
    id: number
    sessionId: number
    productId: number
    status: LiveProductStatus
    order: number
    addedAt: string
    createdAt: string
  }
  Insert: {
    id?: number
    sessionId: number
    productId: number
    status?: LiveProductStatus
    order?: number
    addedAt?: string
    createdAt?: string
  }
  Update: {
    id?: number
    sessionId?: number
    productId?: number
    status?: LiveProductStatus
    order?: number
    addedAt?: string
    createdAt?: string
  }
}

export interface ProductInterestsTable {
  Row: {
    id: number
    sessionId: number
    productId: number
    action: ProductInterestAction
    createdAt: string
  }
  Insert: {
    id?: number
    sessionId: number
    productId: number
    action: ProductInterestAction
    createdAt?: string
  }
  Update: {
    id?: number
    sessionId?: number
    productId?: number
    action?: ProductInterestAction
    createdAt?: string
  }
}

// ---------------------------------------------------------------------------
// Database interface completa (estilo Supabase)
// ---------------------------------------------------------------------------
export interface Database {
  public: {
    Tables: {
      profiles: ProfilesTable
      addresses: AddressesTable
      categories: CategoriesTable
      products: ProductsTable
      product_images: ProductImagesTable
      orders: OrdersTable
      order_items: OrderItemsTable
      transactions: TransactionsTable
      payment_methods: PaymentMethodsTable
      qr_payments: QRPaymentsTable
      reviews: ReviewsTable
      review_images: ReviewImagesTable
      store_profiles: StoreProfilesTable
      live_sessions: LiveSessionsTable
      live_session_products: LiveSessionProductsTable
      live_products: LiveProductsTable
      product_interests: ProductInterestsTable
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
