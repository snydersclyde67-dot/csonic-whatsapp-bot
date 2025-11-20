/**
 * Setup Verification Script
 * Checks if everything is configured correctly
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('\n🔍 CSonic Setup Verification\n');
console.log('=' .repeat(50));

// Check database
const dbPath = path.join(__dirname, 'database', 'businesses.db');
if (fs.existsSync(dbPath)) {
    console.log('✅ Database file exists');
    
    const db = new sqlite3.Database(dbPath);
    
    // Check businesses
    db.get('SELECT COUNT(*) as count FROM businesses', (err, row) => {
        if (err) {
            console.log('❌ Error checking businesses:', err.message);
        } else {
            console.log(`✅ Businesses in database: ${row.count}`);
            if (row.count >= 3) {
                console.log('   ✓ Test data appears to be seeded');
            } else {
                console.log('   ⚠️  Run "npm run seed" to add test data');
            }
        }
        
        // Check services
        db.get('SELECT COUNT(*) as count FROM services', (err, row) => {
            if (!err) {
                console.log(`✅ Services in database: ${row.count}`);
            }
            
            // Check products
            db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
                if (!err) {
                    console.log(`✅ Products in database: ${row.count}`);
                }
                
                db.close();
                checkOtherFiles();
            });
        });
    });
} else {
    console.log('❌ Database file not found');
    console.log('   Run: npm run init-db');
    checkOtherFiles();
}

function checkOtherFiles() {
    console.log('\n📁 File Checks:');
    
    // Check node_modules
    if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
        console.log('✅ Dependencies installed (node_modules exists)');
    } else {
        console.log('❌ Dependencies missing');
        console.log('   Run: npm install');
    }
    
    // Check .env
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file exists');
    } else {
        console.log('⚠️  .env file not found');
        console.log('   Create .env file with your configuration');
        console.log('   (WhatsApp credentials can be added later)');
    }
    
    // Check key files
    const keyFiles = [
        'app.js',
        'package.json',
        'routes/whatsapp.js',
        'routes/business.js',
        'dashboard/index.html'
    ];
    
    console.log('\n📄 Key Files:');
    keyFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} missing`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📝 Next Steps:');
    console.log('1. Create .env file (if not exists)');
    console.log('2. Add WhatsApp credentials when ready (optional for testing)');
    console.log('3. Run: npm start');
    console.log('4. Open: http://localhost:3000/dashboard');
    console.log('\n✨ Setup verification complete!\n');
}


