const db = require('../config/database');

class Service {
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM services WHERE id = ?", [id], (err, row) => {
        if (err) {
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM services ORDER BY name", (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  static create(serviceData) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO services (name, description, price, duration, image) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          serviceData.name,
          serviceData.description,
          serviceData.price,
          serviceData.duration,
          serviceData.image || null
        ],
        function(err) {
          if (err) {
            return reject(err);
          }
          resolve({ id: this.lastID, ...serviceData });
        }
      );
    });
  }

  static update(id, serviceData) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE services SET ';
      const values = [];
      const fields = [];

      if (serviceData.name) {
        fields.push('name = ?');
        values.push(serviceData.name);
      }

      if (serviceData.description !== undefined) {
        fields.push('description = ?');
        values.push(serviceData.description);
      }

      if (serviceData.price) {
        fields.push('price = ?');
        values.push(serviceData.price);
      }

      if (serviceData.duration) {
        fields.push('duration = ?');
        values.push(serviceData.duration);
      }

      if (serviceData.image !== undefined) {
        fields.push('image = ?');
        values.push(serviceData.image);
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
        resolve({ id, ...serviceData });
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM services WHERE id = ?", [id], function(err) {
        if (err) {
          return reject(err);
        }
        resolve(this.changes > 0);
      });
    });
  }
}

module.exports = Service;
