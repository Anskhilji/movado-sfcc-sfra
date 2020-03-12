'use strict';
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
        var type = option.discountType;
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

