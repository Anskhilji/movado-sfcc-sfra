'use strict';
 // beam charity order
 console.log('out event');
 var beamOrder = {
    orderId: 'dev01200002626',
    caritiyId: window.localStorage.getItem('beam_nonprofit_key_pkKuIlcTqgbU.6b2fa3d6-1b5b-4839-9f22-08813dbee89a')
}

document.addEventListener("beamnonprofitselect", (evt) => {
    console.log('in event');
    const  selectedNonprofitId  = evt.detail;
    $.ajax({
        url: '/on/demandware.store/Sites-MVMTUS-Site/en_US/Beam-Order',
        method: 'POST',
        data: beamOrder,
        success: function (data) {
            if (data) {
                data;
            }
        }
    });
});
// end beam cutom code