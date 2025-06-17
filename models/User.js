const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static validatePhone(phone) {
    if (!phone || phone.toString().trim() === '') return true;
    return /^\d+$/.test(phone.toString().trim()); 
  }

  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  static create(userData) {
    return new Promise(async (resolve, reject) => {
      try {
        // Validate phone number
        if (!this.validatePhone(userData.phone)) {
          return reject(new Error('Invalid phone number. Must contain numbers only.'));
        }

        // Check if user already exists
        const existingUser = await this.findByEmail(userData.email);
        if (existingUser) {
          return reject(new Error('User with that email already exists'));
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(userData.password, salt);

        // Insert new user
        const phoneValue = (!userData.phone || userData.phone.toString().trim() === '') ? null : userData.phone;

        db.run(
          `INSERT INTO users (name, email, password, phone, role) 
           VALUES (?, ?, ?, ?, ?)`,
          [userData.name, userData.email, hash, phoneValue, userData.role],
          function(err) {
            if (err) {
              return reject(err);
            }
            resolve({ id: this.lastID, ...userData, password: undefined });
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  }

  static update(id, userData) {
    return new Promise((resolve, reject) => {
      // Validate phone number if provided
      if (userData.phone && !this.validatePhone(userData.phone)) {
        return reject(new Error(' Invalid phone number. Must contain numbers only.'));
      }

      let query = 'UPDATE users SET ';
      const values = [];
      const fields = [];

      if (userData.name) {
        fields.push('name = ?');
        values.push(userData.name);
      }

      if (userData.email) {
        fields.push('email = ?');
        values.push(userData.email);
      }

      if (userData.phone) {
        fields.push('phone = ?');
        values.push(userData.phone);
      }

      if (userData.password) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(userData.password, salt);
        fields.push('password = ?');
        values.push(hash);
      }

      if (fields.length === 0) {
        return resolve(null);
      }

      query += fields.join(', ') + ' WHERE id = ?';
      values.push(id);

      db.run(query, values, function(err) {
        if (err) {
          return reject(err);
        }
        resolve({ id, ...userData, password: undefined });
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, name, email, phone, role, created_at FROM users", (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static getAllByRole(role) {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, name, email, phone, role, created_at FROM users WHERE role = ?", [role], (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = User;
