'use strict';

$(".earn-more-btn").click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(".swell-campaign-list-container").offset().top
    }, 1000);
});

$(".get-reward-btn").click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $(".swell-redemption-list-container").offset().top
    }, 1000);
})

$(document).on("swell:initialized", () => {
        swellAPI.getActiveCampaigns().forEach(campaign => {
                $(".swell-campaign-list").append(
                    $("<li>").addClass("campaign").append(
                        $("<div>").append(
                            $("<i>").addClass(`fa ${campaign.icon}`),
                            $("<p>", {text: campaign.rewardText}),
                            $("<h5>", {text: campaign.title})
                        ).attr('id', `campaign-${campaign.id}`)
                    ).addClass("swell-campaign-link")
                    .attr(
                            {
                                "data-campaign-id": campaign.id,
                                "data-display-mode": "modal"
                            }
                        )
                );
        });
    });

$(document).on("swell:initialized", () => {
    swellAPI.getActiveRedemptionOptions().forEach(option => {
        if (option.discountType === "price_adjustment_fixed_amount") {
            $(".swell-redemption-option-list").append(
                $("<div>").addClass("swell-static-redemption-option").append(
                    $("<h2>").addClass("swell-static-redemption-option-title").text(option.name),
                    $("<p>").addClass("swell-static-redemption-option-point-value").text(option.costText)
                ).addClass("swell-redemption-link").attr("data-redemption-option-id", option.id)
            )
        }
    })
});
var onSuccess = function(redemption) {
    fillAndSubmitCouponCodeForm(redemption.couponCode);
  };
  var onError = function(err) {
    $("#error").show();
  };

  // depending on your cart/checkout markup the selectors will need to be updated
  var fillAndSubmitCouponCodeForm = function(couponCode) {
    // set the value for the coupon code input
    $("#coupon-code-input-element").val(couponCode);

    // trigger a click on the submit button
    $("#coupon-code-submit-btn").click();
  };

  $(document).on("swell:initialized", () => {
      swellAPI.getActiveRedemptionOptions().forEach(option => {
          if (option.discountType === "price_adjustment_fixed_amount") {
              $("#swell-redemption-dropdown").append(
                  $("<option>").val(option.id).text(`${option.name} = ${option.costText}`)
              )
          }
      });
      $("#swell-redemption-dropdown").change(() => {
          swellAPI.makeRedemption(
            { redemptionOptionId: $("#swell-redemption-dropdown option:selected").val() },
            onSuccess,
            onError
          );
      })
  });
