import help from "./helpers";
import cities from 'data/cities';
import {delivery} from 'data/product'

module.exports = class Order {
    constructor($el) {
        this.wrapper = $el;
        this._initUi();
        this.cityId = null;
        this.shoppingCart = null;
        this.steps = ['delivery', 'payment', 'confirm'];
        this.currentStep = this.ui.steps.find('.step.active:first').data('step') || this.steps[0];

        const now = new Date();
        this.number = (now.getDate() / 100).toFixed(2).slice(2) +
            (now.getMonth() + 1 / 100).toFixed(2).slice(2) +
            (now.getFullYear() / 100).toFixed(2).slice(3) +
            '-0' + Math.random().toFixed(5).slice(2, 5);

        this.ui.carousel.owlCarousel({
            items: 1,
            mouseDrag: false,
            touchDrag: false,
            dots: false,
            onInitialized: () => {
                help.refreshWaypoints();
                this.ui.processDeliveryButton.click(this.processDelivery.bind(this));
                this.ui.deliveryForm.submit(this.processDelivery.bind(this));
                this.ui.stepBackButton.click(this.stepBack.bind(this));
                this.ui.paymentForm.submit(this.processPayment.bind(this));
                this.ui.processPaymentButton.click(this.processPayment.bind(this));
                this.ui.citiesSelector.dropdown();
            },
        });
    }
    /*eslint-disable */
    ui = {
        steps: '.process-order__steps',
        carousel: '.process-order__carousel',
        deliveryForm: '.process-order__delivery-form',
        processDeliveryButton: '.process-order__delivery .process-order__button-next',
        citiesSelector: '.process-order__city',
        stepBackButton: '.process-order__button-prev',
        processPaymentButton: '.process-order__payment-form .process-order__button-next',
        paymentDescription: '.process-order__payment__description',
        paymentAmount: '.process-order__payment__amount',
        paymentForm: '.process-order__payment-form',
        paymentNumber: '.process-order__payment__number',
        confirmNumber: '.process-order__confirm-number',
        confirmDescription: '.process-order__confirm-description',
        confirmResult: '.process-order__confirm-result',
        confirmTel: '.process-order__confirm-tel',
        confirmAddress: '.process-order__confirm-addr',
        confirmName: '.process-order__confirm-name',
    };
    /*eslint-enable */

    _initUi() {
        for (let name of Object.keys(this.ui)) {
            this.ui[name] = $(this.ui[name], this.wrapper);
        }
    }

    /**
     *
     * @param {ShoppingCart} cart
     */
    setShoppingCart(cart) {
        this.shoppingCart = cart;
    }

    _getStep(s) {
        return this.ui.steps.find(`.step[data-step="${s}"]`);
    }

    stepBack() {
        if (this.steps.indexOf(this.currentStep) > 0) {
            let prevStepId = this.steps.indexOf(this.currentStep) - 1;
            this.stepTo(this.steps[prevStepId]);
        }
    }

    stepNext() {
        if (this.steps.indexOf(this.currentStep) !== this.steps.length - 1) {
            let nextStepId = this.steps.indexOf(this.currentStep) + 1;
            this.stepTo(this.steps[nextStepId]);
        }
    }

    stepTo(s) {
        if (!this.steps.includes(s)) {
            return;
        }
        let step = this._getStep(s);
        this.ui.steps.find('.step').removeClass('disabled active completed');
        step.prevAll('.step').addClass('completed');
        step.addClass('active');
        step.nextAll('.step').addClass('disabled');
        this.ui.carousel.trigger('to.owl.carousel', this.steps.indexOf(s));
        this.currentStep = s;
    }

    processDelivery() {
        let cityIndex = parseInt(this.ui.citiesSelector.val());
        if (!Number.isInteger(cityIndex)) {
            $('.process-order__city_field', this.ui.deliveryForm).addClass('error')
                .one('click', function() {
                    $(this).removeClass('error');
                });
            return false;
        }
        let product = {
            ...delivery,
            price: cities[cityIndex]['price'],
            title: delivery['title'] + ' в ' + cities[cityIndex]['name'], // todo i18n
        };
        if (cityIndex !== this.cityId) {
            this.shoppingCart.removeProduct('currentDelivery');
            this.shoppingCart.addProduct(product);
            this.cityId = cityIndex;
        }
        this.stepNext();
        return false;
    }

    processPayment(e) {
        this.ui.paymentAmount.attr('value', this.shoppingCart.getResult());
        this.ui.paymentDescription.attr('value', this.shoppingCart.getProductsDescription());
        this.ui.paymentNumber.attr('value', this.number);
        pay(this.ui.paymentForm.get(0), this.successPayment.bind(this), this.successPayment.bind(this));
        return false;
    }

    successPayment() {
        this.stepTo('confirm');
        this.ui.confirmNumber.text(help.i18N('order.number') + ': ' + this.number);
        this.ui.confirmDescription.text(help.i18N('order.description') + ': '
            + this.shoppingCart.getProductsDescription());
        this.ui.confirmResult.text(help.i18N('order.result') + ': ' + this.shoppingCart.getResult());
        this.ui.confirmTel.text(help.i18N('order.confirm.tel') + ': ');
        this.ui.confirmAddress.text(help.i18N('order.confirm.address') + ': ');
        this.ui.confirmName.text(help.i18N('order.confirm.name') + ': ');
    }
};