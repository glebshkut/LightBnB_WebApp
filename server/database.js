const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});
/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`
      SELECT id, name, email, password
      FROM users
      WHERE email = $1;
    `, [email])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`
      SELECT id, name, email, password
      FROM users
      WHERE id = $1;
    `, [id])
    .then((result) => result.rows[0])
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const userData = [user.name, user.email, user.password];
  return pool
    .query(`
      INSERT INTO users
      (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id;
    `, userData)
    .then((result) => {
      console.log(result.rows[0].id)
    })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
      SELECT *
      FROM reservations
      WHERE guest_id = $1
    `, [guest_id])
    .then((response) => {
      return response.rows;
    })
    .catch((err) => {
      console.log(err.message);
    })
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
 const getAllProperties = (options, limit = 10) => {
  const queryParams = [];
  // quesryString
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  let previousWhere = false;
  // owner_id
  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `WHERE owner_id = $${queryParams.length} `;
    previousWhere = true;
  }
  // min_price
  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night * 100}`);
    if (previousWhere) {
      queryString += ` AND `;
    } else {
      queryString += ` WHERE `
    }
    queryString += `cost_per_night >= $${queryParams.length} `;
    previousWhere = true;
  }
  // max_price
  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night * 100}`);
    if (previousWhere) {
      queryString += ` AND `;
    } else {
      queryString += ` WHERE `
    }
    queryString += `cost_per_night <= $${queryParams.length} `;
    previousWhere = true;
  }

  // city
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    if (previousWhere) {
      queryString += ` AND `;
    } else {
      queryString += ` WHERE `
    }
    queryString += `city LIKE $${queryParams.length} `;
  }

  // limit
  queryString += `
  GROUP BY properties.id
  `
  // minimum_rating
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `HAVING avg(property_reviews.rating) >= $${queryParams.length} `;
  }
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};`

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows)
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
