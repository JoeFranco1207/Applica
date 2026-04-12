class AppSuccessful {
  constructor(message, statusCode = 200, data = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.status = "success";
    this.data = data;
  }
}

export default AppSuccessful