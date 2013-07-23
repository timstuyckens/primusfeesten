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
    //send data to socket on click button
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
    var prices = {
        "Bier": defaultPrice,
        "Cola": defaultPrice,
        "Water": defaultPrice
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
                calcItem({ quantity: 0, price: priceForSuperBeers }, that)
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
    var viewmodel = function (hub) {
        var that = {};

        that.orders = ko.observableArray([]);
        that.newOrder = ko.observable(order({ tableId: "", items: null }));
        that.selectedOrder = ko.observable();
        that.orderCountFromServer = ko.observable();
        that.drinks = ko.observableArray(['', 'Bier', 'Cola', 'Water']);
        that.resetNewOrder = function () {
            that.newOrder().items([]);
            that.newOrder().tableId(1);
            that.newOrder().addEmptyOrderItem();
        };
        that.saveNewOrder = function () {
            var order = ko.toJS(that.newOrder());
            toaster.addBusy(hub.server.addOrder(order).done(function (orderCount) {
                that.orderCountFromServer(orderCount);
            }), "Besteld");
        };
        that.removeSelected = function () {
            var selectedOrder = that.selectedOrder();
            hub.server.removeOrder(selectedOrder.Id).done(function (orderCount) {
                that.orderCountFromServer(orderCount);
                that.orders.remove(selectedOrder);
            });
            return true;
        };
        that.calcViewModel = calcViewModel();
        return that;
    }




    $(function () {
        var orderManager = $.connection.orderManager;
        var vm = viewmodel(orderManager);

        $("#ordersGrid").delegate("a", "click", function () {
            var order = ko.dataFor(this);
            vm.selectedOrder(order);
            $("#changeStatePopup").popup("open");
            return false;
        });

        function init() {
            return orderManager.server.getNotPaidOrders();
        }

        // Add client-side hub methods that the server will call
        $.extend(orderManager.client, {
            incomingOrder: function (d) {

                vm.orders.push(d);
            }

        });

        // Start the connection
        $.connection.hub.start()
            .pipe(init)
            .done(function (orders) {

                console.log(orders);
                vm.orders(orders);

            });

        ko.applyBindings(vm);



    });
})();