/**
 * Create Parameters Object for cancel order
 *
 * @arg {string} `id` - [required] The unique identifier of the order to cancel.
 * @arg {String} `cancel_reason` - [required] A reason for cancelling or fully refunding the order
 * @arg {DateTime} `cancelled_at` - [required] The date and time when the order was cancelled
 */

function create(orderNo, cancelReason, cancelledAt) {
    return {
        id            : orderNo,
        cancel_reason : cancelReason,
        cancelled_at  : cancelledAt
    };
}

exports.create = create;
