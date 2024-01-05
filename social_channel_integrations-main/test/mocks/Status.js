module.exports = class Status {
    constructor(status) {
        this.error = status === 1;
        this.status = status;
    }
    static ERROR = 1;
    static OK = 0;
}
