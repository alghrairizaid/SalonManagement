const crypto = require('crypto');
const db = require('../data/database');

class Auth {
    static async hashPassword(password) {
        // استخدام SHA-256 كبديل بسيط للتشفير
        return crypto.createHash('sha256').update(password).digest('hex');
    }

    static async verifyPassword(password, hashedPassword) {
        const hashedInput = await this.hashPassword(password);
        return hashedInput === hashedPassword;
    }

    static async login(email, password) {
        try {
            const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);           
            
            if (!user) {
                return { success: false, message: 'Email not registered' };
            }

            const isValid = await this.verifyPassword(password, user.password);
            if (!isValid) {
                return { success: false, message: 'Incorrect password' };
            }

            return { 
                success: true, 
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred while logging in.' };
        }
    }

    static async register(userData) {
        try {
            const hashedPassword = await this.hashPassword(userData.password);
            const result = await db.runAsync(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [userData.name, userData.email, hashedPassword, userData.role]
            );
            return { success: true, userId: result.lastID };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'An error occurred while logging in.' };
        }
    }

    static async findByEmail(email) {
        try {
            const user = await db.getAsync("SELECT * FROM users WHERE email = ?", [email]);
            return user;
        } catch (err) {
            throw err;
        }
    }

    static async findById(id) {
        try {
            const user = await db.getAsync("SELECT * FROM users WHERE id = ?", [id]);
            if (user) {
                delete user.password;
            }
            return user;
        } catch (err) {
            throw err;
        }
    }

    static async updateProfile(userId, updateData) {
        try {
            const updates = [];
            const values = [];

            if (updateData.name) {
                updates.push('name = ?');
                values.push(updateData.name);
            }

            if (updateData.phone) {
                updates.push('phone = ?');
                values.push(updateData.phone);
            }

            if (updateData.password) {
                const hashedPassword = await this.hashPassword(updateData.password);
                updates.push('password = ?');
                values.push(hashedPassword);
            }

            if (updates.length === 0) {
                return null;
            }

            values.push(userId);
            const query = `UPDATE users SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?`;

            await db.runAsync(query, values);
            return { id: userId, ...updateData, password: undefined };
        } catch (error) {
            throw new Error('There was an error updating the profile.');
        }
    }

    // New methods for admin functionality
    static async getAllUsers() {
        try {
            const users = await db.allAsync("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
            return users;
        } catch (err) {
            throw err;
        }
    }

    static async updateRole(userId, role) {
        try {
            await db.runAsync(
                "UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?",
                [role, userId]
            );
            return true;
        } catch (err) {
            throw err;
        }
    }

    static async deleteUser(userId) {
        try {
            await db.runAsync("DELETE FROM users WHERE id = ?", [userId]);
            return true;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = Auth; 