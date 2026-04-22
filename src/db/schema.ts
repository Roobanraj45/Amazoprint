import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  numeric,
  index,
  serial,
  uniqueIndex,
  jsonb,
  bigint,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const paymentStatusEnum = pgEnum('payment_status', [
    'created',
    'authorized',
    'captured',
    'failed',
    'refunded'
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
    'razorpay',
    'stripe',
    'paypal'
]);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20, enum: ['user', 'freelancer'] }).notNull(),
  phone: varchar('phone', { length: 20 }),
  profileImage: text('profile_image'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  
  // Freelancer specific fields
  skills: text('skills').array(),
  experienceYears: integer('experience_years'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  portfolioUrl: text('portfolio_url'),
  bio: text('bio'),
  availabilityStatus: varchar('availability_status', { length: 20, enum: ['available', 'busy', 'offline'] }),
}, (table) => {
  return {
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
    activeIdx: index('idx_users_active').on(table.isActive),
    availabilityIdx: index('idx_users_availability').on(table.availabilityStatus),
    skillsIdx: index('idx_users_skills').on(table.skills),
    hourlyRateIdx: index('idx_users_hourly_rate').on(table.hourlyRate),
    createdAtIdx: index('idx_users_created_at').on(table.createdAt),
    roleActiveIdx: index('idx_users_role_active').on(table.role, table.isActive),
  };
});

export const admins = pgTable('admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50, enum: ['super_admin', 'company_admin', 'designer', 'accounts', 'printer', 'admin'] }).notNull(),
  isActive: boolean('is_active').default(true),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    emailIdx: index('idx_admins_email').on(table.email),
    roleIdx: index('idx_admins_role').on(table.role),
    activeIdx: index('idx_admins_active').on(table.isActive),
  };
});

export const printPressUsers = pgTable('print_press_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  companyName: varchar('company_name', { length: 150 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('India'),
  isActive: boolean('is_active').default(true),
  isApproved: boolean('is_approved').default(false),
  emailVerified: boolean('email_verified').default(false),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpires: timestamp('password_reset_expires'),
  lastLogin: timestamp('last_login'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    emailIdx: index('idx_print_press_users_email').on(table.email),
    usernameIdx: index('idx_print_press_users_username').on(table.username),
    activeIdx: index('idx_print_press_users_active').on(table.isActive),
    approvedIdx: index('idx_print_press_users_approved').on(table.isApproved),
    emailVerifiedIdx: index('idx_print_press_users_email_verified').on(table.emailVerified),
  };
});


export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).default('0.00'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    slugIdx: index('idx_products_slug').on(table.slug),
    categoryIdx: index('idx_products_category').on(table.category),
    activeIdx: index('idx_products_active').on(table.isActive),
  };
});

export const subProducts = pgTable('sub_products', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 150 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique(),
  price: numeric('price', { precision: 10, scale: 2 }).default('0.00'),
  width: numeric('width', { precision: 10, scale: 2 }).notNull(),
  height: numeric('height', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  maxPages: integer('max_pages').default(1).notNull(),
  spotUvAllowed: boolean('spot_uv_allowed').default(false).notNull(),
  allowedFoils: integer('allowed_foils').array(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    productIdx: index('idx_sub_products_product').on(table.productId),
    activeSubIdx: index('idx_sub_products_active').on(table.isActive),
    skuIdx: index('idx_sub_products_sku').on(table.sku),
  };
});

export const subProductPricing = pgTable('sub_product_pricing', {
    id: serial('id').primaryKey(),
    subProductId: integer('sub_product_id').notNull().references(() => subProducts.id, { onDelete: 'cascade' }),
    minQuantity: integer('min_quantity').default(1),
    maxQuantity: integer('max_quantity'),
    unitPrice: numeric('unit_price', { precision: 10, scale: 2 }),
    minParticipants: integer('min_participants'),
    maxParticipants: integer('max_participants'),
    contestPrice: numeric('contest_price', { precision: 10, scale: 2 }),
    discountType: varchar('discount_type', { length: 20 }),
    discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0.00'),
    designVerificationFee: numeric('design_verification_fee', { precision: 10, scale: 2 }).default('0.00'),
    isContest: boolean('is_contest').default(false),
    isVerification: boolean('is_verification').default(false),
    isDiscount: boolean('is_discount').default(false),
    isActive: boolean('is_active').default(true),
    // Add-on fields
    addonPriceAmount: numeric('addon_price_amount', { precision: 10, scale: 2 }).default('0.00'),
    addonName: text('addon_name'),
    isAddon: boolean('is_addon').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    subProductIdx: index('idx_spp_sub_product').on(table.subProductId),
    subProductActiveIdx: index('idx_spp_sub_product_active').on(table.subProductId, table.isActive),
    quantityRangeIdx: index('idx_spp_quantity_range').on(table.subProductId, table.minQuantity, table.maxQuantity),
    contestRangeIdx: index('idx_spp_contest_range').on(table.subProductId, table.minParticipants, table.maxParticipants),
}));


export const contests = pgTable('contests', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id),
  productName: varchar('product_name', { length: 150 }).notNull(),
  subProductId: integer('sub_product_id').notNull().references(() => subProducts.id),
  subProductName: varchar('sub_product_name', { length: 150 }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  prizeAmount: numeric('prize_amount', { precision: 12, scale: 2 }).notNull(),
  maxFreelancers: integer('max_freelancers').notNull(),
  entryFee: numeric('entry_fee', { precision: 10, scale: 2 }).default('0.00'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  status: varchar('status', { length: 50, enum: ['active', 'completed', 'cancelled'] }).default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        userIdx: index('idx_contests_user').on(table.userId),
        productIdx: index('idx_contests_product').on(table.productId),
        subProductIdx: index('idx_contests_sub_product').on(table.subProductId),
        statusIdx: index('idx_contests_status').on(table.status),
    }
});

export const contestParticipants = pgTable('contest_participants', {
    id: serial('id').primaryKey(),
    contestId: integer('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
    freelancerId: uuid('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow(),
    templateUploadId: integer('template_upload_id'),
    status: varchar('status', { length: 50, enum: ['active', 'submitted', 'selected', 'rejected'] }).default('active'),
}, (table) => {
    return {
        contestIdx: index('idx_cp_contest').on(table.contestId),
        freelancerIdx: index('idx_cp_freelancer').on(table.freelancerId),
        statusIdx: index('idx_cp_status').on(table.status),
        uniqueParticipant: uniqueIndex('idx_cp_unique_participant').on(table.contestId, table.freelancerId),
    }
});

export const designs = pgTable('designs', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    productSlug: varchar('product_slug', { length: 255 }).notNull(),
    thumbnailUrl: text('thumbnail_url'),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    quantity: integer('quantity').default(100).notNull(),
    elements: jsonb('elements').notNull(),
    background: jsonb('background').notNull(),
    guides: jsonb('guides'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        userIdx: index('idx_designs_user_id').on(table.userId),
    };
});

export const contestMessages = pgTable('contest_messages', {
  id: serial('id').primaryKey(),
  contestId: integer('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  receiverId: uuid('receiver_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  freelancerId: uuid('freelancer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  attachmentUrl: text('attachment_url'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    contestIdx: index('idx_cm_contest').on(table.contestId),
    senderIdx: index('idx_cm_sender').on(table.senderId),
    receiverIdx: index('idx_cm_receiver').on(table.receiverId),
    freelancerIdx: index('idx_cm_freelancer').on(table.freelancerId),
    createdAtIdx: index('idx_cm_created_at').on(table.createdAt),
  };
});

export const contestWinners = pgTable('contest_winners', {
    id: serial('id').primaryKey(),
    contestId: integer('contest_id').notNull().references(() => contests.id, { onDelete: 'cascade' }),
    freelancerId: uuid('freelancer_id').notNull().references(() => users.id),
    prizeAmount: numeric('prize_amount', { precision: 12, scale: 2 }).notNull(),
    rank: integer('rank').default(1),
    templateUploadId: integer('template_upload_id').references(() => designs.id),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
    return {
        contestIdx: index('idx_winners_contest').on(table.contestId),
        freelancerIdx: index('idx_winners_freelancer').on(table.freelancerId),
    };
});

export const foilTypes = pgTable('foil_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  allowedSubProductIds: integer('allowed_sub_product_ids').array(),
  colorCode: varchar('color_code', { length: 20 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    slugIdx: index('idx_foil_types_slug').on(table.slug),
    allowedSubProductsIdx: index('idx_foil_types_allowed_sub_products').using('gin', table.allowedSubProductIds),
  };
});

export const designUploads = pgTable('design_uploads', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  filePath: text('file_path').notNull(),
  originalFilename: varchar('original_filename', { length: 255 }).notNull(),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  width: integer('width'),
  height: integer('height'),
  thumbnailPath: text('thumbnail_path'),
  productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
  subProductId: integer('sub_product_id').references(() => subProducts.id, { onDelete: 'set null' }),
  contestId: integer('contest_id').references(() => contests.id, { onDelete: 'cascade' }),
  designId: integer('design_id').references(() => designs.id, { onDelete: 'set null' }),
  uploadStatus: varchar('upload_status', { length: 50, enum: ['pending', 'processing', 'completed', 'failed'] }).default('pending'),
  isPublic: boolean('is_public').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        userIdx: index('idx_design_uploads_user_id').on(table.userId),
        contestIdx: index('idx_design_uploads_contest_id').on(table.contestId),
        statusIdx: index('idx_design_uploads_status').on(table.uploadStatus),
        createdAtIdx: index('idx_design_uploads_created_at').on(table.createdAt),
        productIdx: index('idx_design_uploads_product_id').on(table.productId),
    }
});

export const designVerifications = pgTable('design_verifications', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    designId: integer('design_id').references(() => designs.id, { onDelete: 'set null' }),
    uploadId: integer('upload_id').references(() => designUploads.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 255 }).notNull(),
    clientNotes: text('client_notes'),
    verificationFee: numeric('verification_fee', { precision: 10, scale: 2 }).notNull(),
    status: varchar('status', { length: 50, enum: ['pending', 'assigned', 'completed', 'cancelled'] }).default('pending').notNull(),
    freelancerId: uuid('freelancer_id').references(() => users.id, { onDelete: 'set null' }),
    freelancerFeedback: text('freelancer_feedback'),
    assignedAt: timestamp('assigned_at'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
    return {
        userIdx: index('idx_dv_user_id').on(table.userId),
        designIdx: index('idx_dv_design_id').on(table.designId),
        uploadIdx: index('idx_dv_upload_id').on(table.uploadId),
        statusIdx: index('idx_dv_status').on(table.status),
        freelancerIdx: index('idx_dv_freelancer_id').on(table.freelancerId),
    };
});

export const verificationMessages = pgTable('verification_messages', {
  id: serial('id').primaryKey(),
  verificationId: integer('verification_id').notNull().references(() => designVerifications.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  attachmentUrl: text('attachment_url'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    verificationIdx: index('idx_vm_verification').on(table.verificationId),
    senderIdx: index('idx_vm_sender').on(table.senderId),
  };
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').references(() => products.id),
  subProductId: integer('sub_product_id').references(() => subProducts.id),
  designId: integer('design_id').references(() => designs.id, { onDelete: 'set null' }),
  designUploadId: integer('design_upload_id').references(() => designUploads.id, { onDelete: 'set null' }),
  directSellingProductId: integer('direct_selling_product_id').references(() => directSellingProducts.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  shippingAddress: jsonb('shipping_address').notNull(),
  billingAddress: jsonb('billing_address'),
  orderStatus: varchar('order_status', { length: 50, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] }).default('pending'),
  paymentStatus: varchar('payment_status', { length: 50, enum: ['pending', 'paid', 'failed', 'refunded'] }).default('pending'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  trackingNumber: varchar('tracking_number', { length: 100 }),
  notes: text('notes'),
  specialInstructions: text('special_instructions'),
  estimatedDeliveryDate: date('estimated_delivery_date'),
  actualDeliveryDate: date('actual_delivery_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  paymentId: integer('payment_id').references(() => payments.id, { onDelete: 'set null' }),
}, (table) => {
    return {
        userIdx: index('idx_orders_user_id').on(table.userId),
        productIdx: index('idx_orders_product_id').on(table.productId),
        subProductIdx: index('idx_orders_sub_product_id').on(table.subProductId),
        statusIdx: index('idx_orders_status').on(table.orderStatus),
        paymentStatusIdx: index('idx_orders_payment_status').on(table.paymentStatus),
        createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
        directSellingProductIdIdx: index('idx_orders_direct_selling_product_id').on(table.directSellingProductId),
        paymentIdIdx: index('idx_orders_payment_id').on(table.paymentId),
    };
});

export const directSellingProducts = pgTable('direct_selling_products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 150 }).notNull().unique(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).default('0.00'),
  costPrice: numeric('cost_price', { precision: 10, scale: 2 }).default('0.00'),
  sellingPrice: numeric('selling_price', { precision: 10, scale: 2 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique(),
  stockQuantity: integer('stock_quantity').default(0),
  minStockLevel: integer('min_stock_level').default(5),
  weight: numeric('weight', { precision: 8, scale: 2 }),
  dimensions: jsonb('dimensions'),
  imageUrls: text('image_urls').array(),
  tags: text('tags').array(),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  supplierInfo: jsonb('supplier_info'),
  shippingInfo: jsonb('shipping_info'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: index('idx_dsp_slug').on(table.slug),
  skuIdx: index('idx_dsp_sku').on(table.sku),
  categoryIdx: index('idx_dsp_category').on(table.category),
}));

export const payments = pgTable('payments', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('INR'),
    status: paymentStatusEnum('status').notNull().default('created'),
    provider: paymentProviderEnum('provider').notNull().default('razorpay'),
    providerOrderId: varchar('provider_order_id', { length: 255 }).unique(),
    providerPaymentId: varchar('provider_payment_id', { length: 255 }).unique(),
    providerSignature: text('provider_signature'),
    attemptCount: integer('attempt_count').default(0),
    contestId: integer('contest_id').references(() => contests.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    userIdx: index('idx_payments_user_id').on(table.userId),
    statusIdx: index('idx_payments_status').on(table.status),
    providerPaymentIdIdx: index('idx_payments_provider_payment_id').on(table.providerPaymentId),
    createdAtIdx: index('idx_payments_created_at').on(table.createdAt),
}));

export const usersRelations = relations(users, ({ many }) => ({
  createdContests: many(contests),
  contestParticipations: many(contestParticipants),
  designs: many(designs),
  uploads: many(designUploads),
  messagesSent: many(contestMessages, { relationName: 'sender' }),
  messagesReceived: many(contestMessages, { relationName: 'receiver' }),
  contestWins: many(contestWinners),
  verificationRequests: many(designVerifications, { relationName: 'client' }),
  assignedVerifications: many(designVerifications, { relationName: 'freelancer' }),
  orders: many(orders),
}));

export const productsRelations = relations(products, ({ many }) => ({
  subProducts: many(subProducts),
}));

export const subProductsRelations = relations(subProducts, ({ one, many }) => ({
  product: one(products, {
    fields: [subProducts.productId],
    references: [products.id],
  }),
  pricingRules: many(subProductPricing),
}));

export const subProductPricingRelations = relations(subProductPricing, ({ one }) => ({
    subProduct: one(subProducts, {
        fields: [subProductPricing.subProductId],
        references: [subProducts.id],
    }),
}));

export const contestsRelations = relations(contests, ({ one, many }) => ({
  user: one(users, {
    fields: [contests.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [contests.productId],
    references: [products.id],
  }),
  subProduct: one(subProducts, {
    fields: [contests.subProductId],
    references: [subProducts.id],
  }),
  participants: many(contestParticipants),
  messages: many(contestMessages),
  winners: many(contestWinners),
  payments: many(payments),
}));

export const contestParticipantsRelations = relations(contestParticipants, ({ one }) => ({
  contest: one(contests, {
    fields: [contestParticipants.contestId],
    references: [contests.id],
  }),
  freelancer: one(users, {
    fields: [contestParticipants.freelancerId],
    references: [users.id],
  }),
  submission: one(designs, {
    fields: [contestParticipants.templateUploadId],
    references: [designs.id]
  })
}));

export const designsRelations = relations(designs, ({ one }) => ({
  user: one(users, {
    fields: [designs.userId],
    references: [users.id],
  }),
}));

export const contestMessagesRelations = relations(contestMessages, ({ one }) => ({
  contest: one(contests, {
    fields: [contestMessages.contestId],
    references: [contests.id],
  }),
  sender: one(users, {
    fields: [contestMessages.senderId],
    references: [users.id],
    relationName: 'sender',
  }),
  receiver: one(users, {
    fields: [contestMessages.receiverId],
    references: [users.id],
    relationName: 'receiver',
  }),
}));

export const contestWinnersRelations = relations(contestWinners, ({ one }) => ({
  contest: one(contests, {
    fields: [contestWinners.contestId],
    references: [contests.id],
  }),
  freelancer: one(users, {
    fields: [contestWinners.freelancerId],
    references: [users.id],
  }),
  submission: one(designs, {
    fields: [contestWinners.templateUploadId],
    references: [designs.id]
  })
}));

export const designUploadsRelations = relations(designUploads, ({ one }) => ({
  user: one(users, {
    fields: [designUploads.userId],
    references: [users.id],
  }),
  contest: one(contests, {
    fields: [designUploads.contestId],
    references: [contests.id],
  }),
  design: one(designs, {
    fields: [designUploads.designId],
    references: [designs.id],
  }),
  product: one(products, {
      fields: [designUploads.productId],
      references: [products.id],
  }),
  subProduct: one(subProducts, {
      fields: [designUploads.subProductId],
      references: [subProducts.id],
  }),
}));

export const designVerificationsRelations = relations(designVerifications, ({ one, many }) => ({
    user: one(users, {
        fields: [designVerifications.userId],
        references: [users.id],
        relationName: 'client'
    }),
    freelancer: one(users, {
        fields: [designVerifications.freelancerId],
        references: [users.id],
        relationName: 'freelancer'
    }),
    design: one(designs, {
        fields: [designVerifications.designId],
        references: [designs.id]
    }),
    upload: one(designUploads, {
        fields: [designVerifications.uploadId],
        references: [designUploads.id]
    }),
    messages: many(verificationMessages),
}));

export const verificationMessagesRelations = relations(verificationMessages, ({ one }) => ({
    verification: one(designVerifications, {
        fields: [verificationMessages.verificationId],
        references: [designVerifications.id],
    }),
    sender: one(users, {
        fields: [verificationMessages.senderId],
        references: [users.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [orders.productId],
        references: [products.id],
    }),
    subProduct: one(subProducts, {
        fields: [orders.subProductId],
        references: [subProducts.id],
    }),
    design: one(designs, {
        fields: [orders.designId],
        references: [designs.id],
    }),
    designUpload: one(designUploads, {
        fields: [orders.designUploadId],
        references: [designUploads.id],
    }),
    directSellingProduct: one(directSellingProducts, {
        fields: [orders.directSellingProductId],
        references: [directSellingProducts.id],
    }),
    payment: one(payments, {
        fields: [orders.paymentId],
        references: [payments.id],
    }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
    user: one(users, {
        fields: [payments.userId],
        references: [users.id],
    }),
    contest: one(contests, {
        fields: [payments.contestId],
        references: [contests.id],
    }),
    orders: many(orders),
}));
