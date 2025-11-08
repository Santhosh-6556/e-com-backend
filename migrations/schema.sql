CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    dob TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'seller')),
    phone INTEGER,
    isActive INTEGER DEFAULT 1,
    otp TEXT,
    otpExpires INTEGER,
    otpLastSent INTEGER,
    otpAttempts INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_users_recordId ON users(recordId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS user_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    phone TEXT,
    email TEXT,
    line1 TEXT,
    line2 TEXT,
    addressType TEXT,
    pinCode TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    isDefaultDelivery INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (userId) REFERENCES users(recordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_userId ON user_addresses(userId);
CREATE INDEX IF NOT EXISTS idx_user_addresses_recordId ON user_addresses(recordId);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    name TEXT,
    shortDescription TEXT,
    image TEXT,
    parentCategoryRecordId TEXT,
    parentCategoryIdentifier TEXT,
    parentCategoryName TEXT,
    parentCategoryShortDescription TEXT,
    parentCategoryImage TEXT,
    displayPriority INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    creator TEXT,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_recordId ON categories(recordId);
CREATE INDEX IF NOT EXISTS idx_categories_identifier ON categories(identifier);
CREATE INDEX IF NOT EXISTS idx_categories_status ON categories(status);

CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    name TEXT,
    shortDescription TEXT,
    image TEXT,
    displayPriority INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    creator TEXT,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_recordId ON brands(recordId);
CREATE INDEX IF NOT EXISTS idx_brands_identifier ON brands(identifier);

CREATE TABLE IF NOT EXISTS taxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    rate TEXT,
    status INTEGER DEFAULT 1,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);


CREATE INDEX IF NOT EXISTS idx_taxes_recordId ON taxes(recordId);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    slug TEXT NOT NULL,
    brandRecordId TEXT,
    brandIdentifier TEXT,
    subcategoryRecordId TEXT,
    subcategoryIdentifier TEXT,
    categoryRecordId TEXT NOT NULL,
    categoryIdentifier TEXT,
    taxRecordId TEXT,
    taxIdentifier TEXT,
    price REAL NOT NULL,
    discountPrice REAL,
    offer INTEGER DEFAULT 0,
    sellingPrice REAL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    isTrending INTEGER DEFAULT 0,
    images TEXT,
    carouselImages TEXT,        
    highlights TEXT,
    description TEXT,
    productDescription TEXT,
    attributes TEXT,
    features TEXT,
    ratingsAverage REAL DEFAULT 0,
    ratingsCount INTEGER DEFAULT 0,
    reviews TEXT,
    createdBy TEXT NOT NULL,
    modifiedBy TEXT,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_products_recordId ON products(recordId);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_categoryRecordId ON products(categoryRecordId);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_isTrending ON products(isTrending);

CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    itemsCount INTEGER DEFAULT 0,
    subtotal REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_carts_userId ON carts(userId);
CREATE INDEX IF NOT EXISTS idx_carts_recordId ON carts(recordId);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cartRecordId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    basePrice REAL,
    totalPrice REAL,
    discount REAL DEFAULT 0,
    itemTax REAL DEFAULT 0,
    FOREIGN KEY (cartRecordId) REFERENCES carts(recordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cartRecordId ON cart_items(cartRecordId);

CREATE TABLE IF NOT EXISTS wishlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userRecordId TEXT UNIQUE NOT NULL,
    itemCount INTEGER DEFAULT 0,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_wishlists_userRecordId ON wishlists(userRecordId);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wishlistUserRecordId TEXT NOT NULL,
    productRecordId TEXT NOT NULL,
    addedAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (wishlistUserRecordId) REFERENCES wishlists(userRecordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_userRecordId ON wishlist_items(wishlistUserRecordId);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    orderId TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    shipping REAL DEFAULT 0,
    total REAL NOT NULL,
    orderStatus TEXT DEFAULT 'pending' CHECK(orderStatus IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    deliveryMethod TEXT DEFAULT 'standard',
    trackingNumber TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    updatedAt INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_recordId ON orders(recordId);
CREATE INDEX IF NOT EXISTS idx_orders_orderId ON orders(orderId);
CREATE INDEX IF NOT EXISTS idx_orders_userId ON orders(userId);

CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderRecordId TEXT NOT NULL,
    productId TEXT NOT NULL,
    productRecordId TEXT NOT NULL,
    name TEXT NOT NULL,
    images TEXT,
    quantity INTEGER NOT NULL,
    basePrice REAL NOT NULL,
    totalPrice REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    FOREIGN KEY (orderRecordId) REFERENCES orders(recordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_orderRecordId ON order_items(orderRecordId);

CREATE TABLE IF NOT EXISTS order_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderRecordId TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('shipping', 'billing')),
    recordId TEXT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    line1 TEXT NOT NULL,
    line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT NOT NULL,
    pinCode TEXT NOT NULL,
    FOREIGN KEY (orderRecordId) REFERENCES orders(recordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_addresses_orderRecordId ON order_addresses(orderRecordId);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    orderRecordId TEXT NOT NULL,
    paymentMethod TEXT NOT NULL CHECK(paymentMethod IN ('card', 'upi', 'cod', 'razorpay')),
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'success', 'failed', 'refunded')),
    razorpayOrderId TEXT,
    razorpayPaymentId TEXT,
    razorpaySignature TEXT,
    createdAt INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (orderRecordId) REFERENCES orders(recordId) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_orderRecordId ON transactions(orderRecordId);
CREATE INDEX IF NOT EXISTS idx_transactions_recordId ON transactions(recordId);

CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    subtitle TEXT,
    image TEXT NOT NULL,
    mobileImage TEXT,
    type TEXT NOT NULL CHECK(type IN ('home', 'category', 'product', 'promotional', 'sidebar')),
    position INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    actionType TEXT DEFAULT 'none' CHECK(actionType IN ('product', 'category', 'url', 'none')),
    targetProductRecordId TEXT,
    targetProductSlug TEXT,
    targetCategoryRecordId TEXT,
    targetCategoryIdentifier TEXT,
    customUrl TEXT,
    startDate INTEGER DEFAULT (strftime('%s', 'now')),
    endDate INTEGER,
    displayPriority INTEGER DEFAULT 1,
    textColor TEXT DEFAULT '#ffffff',
    backgroundColor TEXT DEFAULT 'transparent',
    buttonText TEXT,
    buttonColor TEXT DEFAULT '#007bff',
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    createdBy TEXT NOT NULL,
    modifiedBy TEXT,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_banners_recordId ON banners(recordId);
CREATE INDEX IF NOT EXISTS idx_banners_type_status ON banners(type, status);

CREATE TABLE IF NOT EXISTS faqs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    identifier TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_faqs_recordId ON faqs(recordId);

CREATE TABLE IF NOT EXISTS nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recordId TEXT UNIQUE NOT NULL,
    path TEXT NOT NULL,
    parentNodePath TEXT,
    parentNodeName TEXT,
    parentNodeRecordId TEXT,
    parentNodeStatus INTEGER,
    parentNodeIdentifier TEXT,
    displayPriority INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    identifier TEXT NOT NULL,
    name TEXT,
    shortDescription TEXT,
    creator TEXT NOT NULL,
    modifiedBy TEXT,
    _class TEXT DEFAULT 'com.VijayLamps.lamps.model.Node',
    creationTime INTEGER DEFAULT (strftime('%s', 'now')),
    lastModified INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_nodes_recordId ON nodes(recordId);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes(path);
CREATE INDEX IF NOT EXISTS idx_nodes_identifier ON nodes(identifier);

