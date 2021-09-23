"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripe = void 0;
const dotenv_1 = require("dotenv");
const stripe_1 = require("stripe");
const api_1 = require("./api");
if (process.env.NODE_ENV === "production") {
    (0, dotenv_1.config)();
}
exports.stripe = new stripe_1.Stripe(process.env.STRIPE_SECRET, {
    apiVersion: "2020-08-27",
});
const port = process.env.API_PORT || 3333;
api_1.app.listen(port, () => console.log(`API available on http://localhost:${port}`));
//# sourceMappingURL=index.js.map