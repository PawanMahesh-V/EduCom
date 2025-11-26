// Script to generate join codes for existing communities without codes
const pool = require('../config/database');

function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

async function generateJoinCodesForExistingCommunities() {
    try {
        console.log('Checking for communities without join codes...');
        
        // Find communities without join codes
        const result = await pool.query(
            'SELECT id, name FROM communities WHERE join_code IS NULL'
        );

        if (result.rows.length === 0) {
            console.log('All communities already have join codes.');
            return;
        }

        console.log(`Found ${result.rows.length} communities without join codes.`);
        
        for (const community of result.rows) {
            let codeGenerated = false;
            let attempts = 0;
            
            while (!codeGenerated && attempts < 10) {
                try {
                    const joinCode = generateJoinCode();
                    await pool.query(
                        'UPDATE communities SET join_code = $1 WHERE id = $2',
                        [joinCode, community.id]
                    );
                    console.log(`✓ Generated code ${joinCode} for community: ${community.name}`);
                    codeGenerated = true;
                } catch (err) {
                    if (err.code === '23505') {
                        // Duplicate code, try again
                        attempts++;
                        console.log(`Code collision detected, retrying... (attempt ${attempts})`);
                    } else {
                        throw err;
                    }
                }
            }
            
            if (!codeGenerated) {
                console.error(`✗ Failed to generate unique code for community: ${community.name}`);
            }
        }
        
        console.log('\n✓ Join code generation complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error generating join codes:', err);
        process.exit(1);
    }
}

generateJoinCodesForExistingCommunities();
