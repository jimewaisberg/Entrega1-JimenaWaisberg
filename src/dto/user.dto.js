/**
 * User DTO - Data Transfer Object
 * Filtra información sensible del usuario
 * Solo expone datos necesarios y no sensibles
 */
class UserDTO {
  constructor(user) {
    this.id = user._id || user.id;
    this.first_name = user.first_name;
    this.last_name = user.last_name;
    this.email = user.email;
    this.age = user.age;
    this.role = user.role;
    this.cart = user.cart;
    // NO incluye: password, __v, createdAt, updatedAt
  }

  // Nombre completo (utilidad)
  get fullName() {
    return `${this.first_name} ${this.last_name}`;
  }
}

module.exports = UserDTO;

