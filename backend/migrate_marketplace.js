const pool = require('./config/database');

const migrateMarketplace = async () => {
    try {
        console.log('Starting marketplace database migration...');

        // 1. Create cart_items table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS cart_items (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_id INTEGER REFERENCES marketplace_items(id) ON DELETE CASCADE,
                quantity INTEGER DEFAULT 1,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_id)
            );
        `);
        console.log('✅ cart_items table created or already exists.');

        // 2. Create wishlists table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS wishlists (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_id INTEGER REFERENCES marketplace_items(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_id)
            );
        `);
        console.log('✅ wishlists table created or already exists.');

        console.log('🎉 Marketplace migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

migrateMarketplace();
