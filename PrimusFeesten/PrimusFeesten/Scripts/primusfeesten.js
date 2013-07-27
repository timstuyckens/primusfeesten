ko.bindingHandlers.jqmRefreshSelect = {
    update: function (element, valueAccessor) {
        ko.utils.unwrapObservable(valueAccessor()); //just to create a dependency
        try {
            if (!$(element).parent().parent().hasClass("ui-select"))
                $(element).selectmenu("refresh");
        } catch (e) {
            console.log(e);
        }
    }
      ,
    init: function (element, valueAccessor, allBindingsAccessor) {
        ko.utils.unwrapObservable(valueAccessor()); //just to create a dependency
        try {
            $(element).selectmenu();
        } catch (e) {
            console.log(e);
        }
    }
};


(function () {

    $("form").bind('submit', function () {
        return false;
    });

    var toaster = (function () {
        var that = {};
        var makeRemovableToast = function (t) {
            var that = {};
            that.remove = function () {
                t.pnotify_remove();
            };
            t.click(function () {
                that.remove();
            });
            return that;
        };
        var toast = function (toastMessage, icon) {
            var theme = "d";
            var iconHtml = '<a data-role="button" data-icon="' + icon + '" data-iconpos="notext" data-mini="true" data-inline="true" class="succesMessageIcon" data-theme="' + theme + '">Delete</a>';
            var toast = $.pnotify({
                title: iconHtml + toastMessage,
                text: "",
                addclass: 'ui-corner-all ui-bar ui-bar-' + theme,
                opacity: 0.93,
                nonblock: true,
                nonblock_opacity: 1
            });
            $(".succesMessageIcon").button();
            return makeRemovableToast(toast);
        };

        that.toastSuccess = function (toastMessage) {
            return toast(toastMessage, "check");
        };
        that.toastError = function (toastMessage) {
            return toast(toastMessage, "alert");
        };
        that.toastInfo = function (toastMessage) {
            return toast(toastMessage, "info");
        };
        //decorates Promise With Toast
        that.addBusy = function (promise, message) {
            if (!promise) return;
            var m = message || "Een ogenblik geduld";
            var toast = that.toastInfo(m);
            return promise
                    .fail(function () {
                        that.toastError("Technische fout. Probeer opnieuw");
                    })
                    .always(function () {
                        setTimeout(function () {
                            toast.remove();
                        }, 1000);

                    });
        };
        return that;
    })();

    var defaultPrice = 1.8;
    var priceForSuperBeers = 2.2;
    var hotdogPrice = 2.5;
    var superHeavy=3.6;
    var kaasSalami=4.0;
    var warmeHapjesKlein=5.0;
    var warmeHapjesGroot=9.0;
    var prices = {
        "Primus": defaultPrice,
        "Pepsi": defaultPrice,
        "Pepsi max": defaultPrice,
        "Kriek mystic": priceForSuperBeers,
        "Mystic white": priceForSuperBeers,
        "Water": defaultPrice,
        "Ice tea": defaultPrice,
        "Fruitsap looza": defaultPrice,
        "Limonade": defaultPrice,
        "Tonic": defaultPrice,
        "Bruiswater": defaultPrice,
        "Special 1900": defaultPrice,
        "Witte wijn": priceForSuperBeers,
        "Rode wijn": priceForSuperBeers,
        "Cava": superHeavy,
        "sangria": superHeavy,
        "Koffie": defaultPrice,    
        "Chips zout/paprika/pickels": defaultPrice,
        "hotdog": hotdogPrice,
        "Portie kaas salami": kaasSalami,
        "Warme hapjes klein": warmeHapjesKlein,
        "Warme hapjes groot": warmeHapjesGroot
    };
    var calcItem = function (d, parent) {
        var that = {};
        that.quantity = ko.observable(d.quantiy || 0);

        that.moreQuantity = function () {
            that.quantity(parseInt(that.quantity(), 10) + 1);
        };
        that.lessQuantity = function () {
            var oldVal = parseInt(that.quantity(), 10);
            if (oldVal > 0) {
                that.quantity(oldVal - 1);
            }
        };
        that.price = d.price;
        that.quantity.subscribe(function () { parent.calculatePrice(); });

        return that;
    }
    var calcViewModel = function () {
        var that = {};

        that.calcItems = [
                calcItem({ quantity: 0, price: defaultPrice }, that),
                calcItem({ quantity: 0, price: priceForSuperBeers }, that),
                calcItem({ quantity: 0, price: hotdogPrice }, that),
                calcItem({ quantity: 0, price: superHeavy }, that),
                calcItem({ quantity: 0, price: kaasSalami }, that),
                calcItem({ quantity: 0, price: warmeHapjesKlein }, that),
                calcItem({ quantity: 0, price: warmeHapjesGroot }, that)
        ];
        that.price = ko.observable(0);
        that.calculatePrice = function () {
            var totalPrice = 0;
            ko.utils.arrayForEach(that.calcItems, function (i) {
                var price = i.price;
                var amount = i.quantity();
                if (price)
                    totalPrice += price * amount;
            });
            that.price(Math.round(totalPrice * 100) / 100);
        }
        that.resetCalc = function () {
            ko.utils.arrayForEach(that.calcItems, function (i) {
                i.quantity(0);
            });
        }
        return that;
    };

    var orderItem = function (d, parent) {
        var that = {};
        that.name = ko.observable(d.name || "");
        that.quantity = ko.observable(d.quantity || 0);

        that.moreQuantity = function () {
            that.quantity(parseInt(that.quantity(), 10) + 1);
        };
        that.lessQuantity = function () {
            var oldVal = parseInt(that.quantity(), 10);
            if (oldVal > 0) {
                that.quantity(oldVal - 1);
            }
        };
        that.name.subscribe(function () { parent.calculatePrice(); });
        that.quantity.subscribe(function () { parent.calculatePrice(); });

        return that;
    }
    var order = function (d) {
        var that = {};

        var theItems = [orderItem({ quantity: 0, name: "" }, that)];
        if (d.items) {
            theItems = ko.utils.arrayMap(d.items, function (item) {
                return new orderItem(item, that);
            });
        }

        that.tableId = ko.observable(d.tableId || 1);
        that.id = d.id;
        that.items = ko.observableArray(theItems);
        that.addEmptyOrderItem = function () {
            that.items.push(orderItem({ quantity: 0, name: "" }, that));
        }
        that.price = ko.observable(0);
        that.calculatePrice = function () {
            var items = that.items();
            var totalPrice = 0;
            ko.utils.arrayForEach(items, function (i) {
                var price = prices[i.name()];
                var amount = i.quantity();
                if (price)
                    totalPrice += price * amount;
            });
            that.price(Math.round(totalPrice * 100) / 100);
        }
        that.items.subscribe(function () {
            that.calculatePrice();
        });
        return that;
    };
    var viewmodel = function () {
        var that = {};

        that.orders = ko.observableArray([]);
        that.newOrder = ko.observable(order({ tableId: "", items: null }));
        that.selectedOrder = ko.observable();
        
        var tempDrinks = [];
        tempDrinks.push("");
        $.each(prices, function (i, e) {
            tempDrinks.push(i);
        });

        that.drinks = ko.observableArray(tempDrinks);
        that.resetNewOrder = function () {
            that.newOrder().items([]);
            that.newOrder().tableId(1);
            that.newOrder().addEmptyOrderItem();
        };
        that.saveNewOrder = function () {
            var newOrder = that.newOrder();
            var newOrderJS = ko.toJS(that.newOrder());
            var neworderObject = order(newOrderJS);
            neworderObject.calculatedPrice = newOrder.price();
            that.orders.push(neworderObject);
            toaster.toastInfo("Besteld");
        };
        that.removeSelected = function () {
            var selectedOrder = that.selectedOrder();
            that.orders.remove(selectedOrder);
            return true;
        };
        that.orderCount = ko.computed(function () {
            return that.orders().length;
        });
        that.calcViewModel = calcViewModel();
        return that;
    }




    $(function () {
        var vm = viewmodel();

        $("#ordersGrid").delegate("a", "click", function () {
            var order = ko.dataFor(this);
            vm.selectedOrder(order);
            $("#changeStatePopup").popup("open");
            return false;
        });


        ko.applyBindings(vm);



    });
})();