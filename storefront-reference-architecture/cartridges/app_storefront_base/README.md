# Welcome to Storefront Reference Architecture (SFRA)

The Storefront Reference Architecture is fully compliant with standard JavaScript. It uses [Controllers]{@tutorial Controllers} to handle incoming requests. It provides a layer of JSON objects through the [Model-Views]{@tutorial Models}. All scripts are [Common JS modules](http://www.commonjs.org) with defined and documented exports to avoid polluting the global namespace.

This documentation is meant to serve as a reference to quickly look up supported functionality and is fully based on the comments in the code. You can continue to maintain these [JSDoc comments](http://usejsdoc.org/) to generate a similar documentation for your own project.

## request.js
- Line No: Start from 306 to 309
Added Logic to aplly coupon code on cart from URL coupon

